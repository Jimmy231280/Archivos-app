alter table public.archivos enable row level security;
-- ============================================================================
-- UAI · Inventario y Préstamo de Documentos
-- Script único de base de datos. Copia y pega TODO este archivo en:
-- Supabase → SQL Editor → New query → pegar → Run
-- Se ejecuta una sola vez, de arriba hacia abajo. No requiere Edge Functions
-- ni Service Role Key: solo Supabase Auth + PostgreSQL + RLS + Storage.
-- ============================================================================

-- 1) EXTENSIONES ------------------------------------------------------------
create extension if not exists pgcrypto;

-- 2) TIPOS ENUM ---------------------------------------------------------------
do $$ begin
  create type public.user_role as enum ('admin', 'consulta');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.documento_estado as enum ('disponible', 'prestado');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.prestamo_estado as enum ('prestado', 'devuelto');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.solicitud_estado as enum ('pendiente', 'atendida', 'rechazada');
exception when duplicate_object then null; end $$;

-- 3) TABLAS -------------------------------------------------------------------

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  nombres text,
  apellidos text,
  usuario text unique,
  cedula text,
  phone text,
  role public.user_role not null default 'consulta',
  is_active boolean not null default true,
  debe_cambiar_password boolean not null default true,
  password_actualizada timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.auditorias (
  id uuid primary key default gen_random_uuid(),
  codigo_auditoria text not null unique,
  nombre_auditoria text not null,
  gestion text,
  unidad text,
  descripcion text,
  created_at timestamptz not null default now()
);

create table if not exists public.documentos (
  id uuid primary key default gen_random_uuid(),
  auditoria_id uuid not null references public.auditorias(id) on delete cascade,
  codigo_documento text not null unique,
  tipo_documento text,
  nombre_documento text not null,
  descripcion text,
  ubicacion text,
  estado public.documento_estado not null default 'disponible',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.prestamos (
  id uuid primary key default gen_random_uuid(),
  documento_id uuid not null references public.documentos(id),
  solicitante_nombre text not null,
  solicitante_cargo text,
  solicitante_unidad text,
  solicitante_telefono text,
  fecha_prestamo timestamptz not null default now(),
  fecha_limite timestamptz,
  estado public.prestamo_estado not null default 'prestado',
  observaciones text,
  registrado_por uuid references public.profiles(id),
  created_at timestamptz not null default now()
);

create table if not exists public.devoluciones (
  id uuid primary key default gen_random_uuid(),
  prestamo_id uuid not null references public.prestamos(id),
  fecha_devolucion timestamptz not null default now(),
  recibido_por text,
  estado_documento text,
  observaciones text,
  created_at timestamptz not null default now()
);

create table if not exists public.archivos (
  id uuid primary key default gen_random_uuid(),
  documento_id uuid not null references public.documentos(id) on delete cascade,
  nombre_archivo text not null,
  ruta_storage text not null,
  tipo_archivo text,
  tamano bigint,
  created_at timestamptz not null default now(),
  subido_por uuid references public.profiles(id)
);

-- Solicitudes: un Auditor pide un documento disponible al encargado de archivos
create table if not exists public.solicitudes (
  id uuid primary key default gen_random_uuid(),
  documento_id uuid not null references public.documentos(id),
  solicitante_id uuid not null references public.profiles(id),
  motivo text,
  estado public.solicitud_estado not null default 'pendiente',
  created_at timestamptz not null default now()
);

-- 4) ÍNDICES --------------------------------------------------------------------
create index if not exists idx_documentos_auditoria on public.documentos(auditoria_id);
create index if not exists idx_prestamos_documento on public.prestamos(documento_id);
create index if not exists idx_prestamos_estado on public.prestamos(estado);
create index if not exists idx_archivos_documento on public.archivos(documento_id);
create index if not exists idx_solicitudes_estado on public.solicitudes(estado);

-- 5) FUNCIONES Y TRIGGERS DE NEGOCIO ---------------------------------------

-- 5.1 Crear automáticamente el perfil cuando se registra un usuario en Authentication
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, role, debe_cambiar_password)
  values (new.id, 'consulta', true)
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- 5.2 Saber si el usuario que hace la petición es administrador activo
create or replace function public.is_admin()
returns boolean
language sql stable
security definer set search_path = public
as $$
  select exists (
    select 1 from public.profiles where id = auth.uid() and role = 'admin' and is_active = true
  );
$$;
grant execute on function public.is_admin() to authenticated;

-- 5.3 Traducir "usuario" a correo para poder iniciar sesión (Supabase Auth usa correo)
create or replace function public.email_by_usuario(p_usuario text)
returns text
language sql stable
security definer set search_path = public
as $$
  select u.email::text
  from public.profiles p
  join auth.users u on u.id = p.id
  where p.usuario = lower(p_usuario)
  limit 1;
$$;
grant execute on function public.email_by_usuario(text) to anon, authenticated;

-- 5.4 Impedir que alguien que no es admin se cambie su propio rol o estado activo
create or replace function public.prevent_role_escalation()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  if not public.is_admin() then
    new.role := old.role;
    new.is_active := old.is_active;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_prevent_role_escalation on public.profiles;
create trigger trg_prevent_role_escalation
  before update on public.profiles
  for each row execute function public.prevent_role_escalation();

-- 5.5 Calcular automáticamente la fecha límite = fecha de préstamo + 2 meses
create or replace function public.set_fecha_limite()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  new.fecha_limite := new.fecha_prestamo + interval '2 months';
  return new;
end;
$$;

drop trigger if exists trg_set_fecha_limite on public.prestamos;
create trigger trg_set_fecha_limite
  before insert on public.prestamos
  for each row execute function public.set_fecha_limite();

-- 5.6 Al registrar un préstamo, marcar el documento como "prestado"
create or replace function public.on_prestamo_insert_mark_documento()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  update public.documentos set estado = 'prestado', updated_at = now() where id = new.documento_id;
  return new;
end;
$$;

drop trigger if exists trg_prestamo_insert on public.prestamos;
create trigger trg_prestamo_insert
  after insert on public.prestamos
  for each row execute function public.on_prestamo_insert_mark_documento();

-- 5.7 Al registrar una devolución, marcar préstamo "devuelto" y documento "disponible"
create or replace function public.on_devolucion_insert_mark_documento()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  update public.prestamos set estado = 'devuelto' where id = new.prestamo_id;
  update public.documentos d set estado = 'disponible', updated_at = now()
    from public.prestamos p where p.id = new.prestamo_id and d.id = p.documento_id;
  return new;
end;
$$;

drop trigger if exists trg_devolucion_insert on public.devoluciones;
create trigger trg_devolucion_insert
  after insert on public.devoluciones
  for each row execute function public.on_devolucion_insert_mark_documento();

-- 6) ROW LEVEL SECURITY (RLS) ------------------------------------------------
alter table public.profiles enable row level security;
alter table public.auditorias enable row level security;
alter table public.documentos enable row level security;
alter table public.prestamos enable row level security;
alter table public.devoluciones enable row level security;
alter table public.solicitudes enable row level security;

-- profiles: cada quien ve su propio perfil; el admin ve y edita todos.
drop policy if exists profiles_select on public.profiles;
create policy profiles_select on public.profiles for select
  using (auth.uid() = id or public.is_admin());

drop policy if exists profiles_update on public.profiles;
create policy profiles_update on public.profiles for update
  using (auth.uid() = id or public.is_admin())
  with check (auth.uid() = id or public.is_admin());

drop policy if exists profiles_insert_admin on public.profiles;
create policy profiles_insert_admin on public.profiles for insert
  with check (public.is_admin());

drop policy if exists profiles_delete_admin on public.profiles;
create policy profiles_delete_admin on public.profiles for delete
  using (public.is_admin());

-- auditorias: cualquier usuario autenticado puede ver; solo admin escribe.
drop policy if exists auditorias_select on public.auditorias;
create policy auditorias_select on public.auditorias for select using (auth.uid() is not null);
drop policy if exists auditorias_insert on public.auditorias;
create policy auditorias_insert on public.auditorias for insert with check (public.is_admin());
drop policy if exists auditorias_update on public.auditorias;
create policy auditorias_update on public.auditorias for update using (public.is_admin());
drop policy if exists auditorias_delete on public.auditorias;
create policy auditorias_delete on public.auditorias for delete using (public.is_admin());

-- documentos: igual que auditorias
drop policy if exists documentos_select on public.documentos;
create policy documentos_select on public.documentos for select using (auth.uid() is not null);
drop policy if exists documentos_insert on public.documentos;
create policy documentos_insert on public.documentos for insert with check (public.is_admin());
drop policy if exists documentos_update on public.documentos;
create policy documentos_update on public.documentos for update using (public.is_admin());
drop policy if exists documentos_delete on public.documentos;
create policy documentos_delete on public.documentos for delete using (public.is_admin());

-- prestamos: gestión exclusiva del administrador (Préstamos es una pantalla de admin)
drop policy if exists prestamos_select on public.prestamos;
create policy prestamos_select on public.prestamos for select using (public.is_admin());
drop policy if exists prestamos_insert on public.prestamos;
create policy prestamos_insert on public.prestamos for insert with check (public.is_admin());
drop policy if exists prestamos_update on public.prestamos;
create policy prestamos_update on public.prestamos for update using (public.is_admin());

-- devoluciones: exclusivo del administrador
drop policy if exists devoluciones_all on public.devoluciones;
create policy devoluciones_all on public.devoluciones for all
  using (public.is_admin()) with check (public.is_admin());

-- archivos: cualquier usuario autenticado puede ver; solo admin sube/elimina
drop policy if exists archivos_select on public.archivos;
create policy archivos_select on public.archivos for select using (auth.uid() is not null);
drop policy if exists archivos_insert on public.archivos;
create policy archivos_insert on public.archivos for insert with check (public.is_admin());
drop policy if exists archivos_delete on public.archivos;
create policy archivos_delete on public.archivos for delete using (public.is_admin());

-- solicitudes: un Auditor crea y ve las suyas; el admin ve y atiende todas
drop policy if exists solicitudes_select on public.solicitudes;
create policy solicitudes_select on public.solicitudes for select
  using (solicitante_id = auth.uid() or public.is_admin());
drop policy if exists solicitudes_insert on public.solicitudes;
create policy solicitudes_insert on public.solicitudes for insert
  with check (solicitante_id = auth.uid());
drop policy if exists solicitudes_update on public.solicitudes;
create policy solicitudes_update on public.solicitudes for update
  using (public.is_admin());

-- 7) PERMISOS BÁSICOS ---------------------------------------------------------
grant usage on schema public to anon, authenticated;
grant select, insert, update, delete on
  public.profiles, public.auditorias, public.documentos,
  public.prestamos, public.devoluciones, public.archivos, public.solicitudes
  to authenticated;

-- 8) POLÍTICAS DE STORAGE (para el bucket "documentos-uai" que crearás en el panel)
drop policy if exists storage_select_documentos_uai on storage.objects;
create policy storage_select_documentos_uai on storage.objects for select
  using (bucket_id = 'documentos-uai' and auth.uid() is not null);

drop policy if exists storage_insert_documentos_uai on storage.objects;
create policy storage_insert_documentos_uai on storage.objects for insert
  with check (bucket_id = 'documentos-uai' and public.is_admin());

drop policy if exists storage_delete_documentos_uai on storage.objects;
create policy storage_delete_documentos_uai on storage.objects for delete
  using (bucket_id = 'documentos-uai' and public.is_admin());

-- ============================================================================
-- FIN DEL SCRIPT.
-- Siguiente paso: crea tu primer usuario administrador desde
-- Authentication → Add user, y luego ejecuta la actualización indicada
-- en las instrucciones para convertirlo en "admin".
-- ============================================================================
