import React, { useEffect, useRef, useState } from "react";
import { Plus, Pencil, Trash2, KeyRound, X, CheckCircle2 } from "lucide-react";
import Layout from "../components/Layout";
import { supabase } from "../lib/supabase";
import { supabaseAdmin } from "../lib/supabaseAdmin";
import { generarUsuario, usuarioAEmail, passwordTemporal, passwordVencida } from "../lib/users";
import type { Profile, Role } from "../types";

const ROLE_LABELS: Record<string, string> = { admin: "Administrador", consulta: "Auditor" };

function fmtDate(d: string | null) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("es-BO", { day: "2-digit", month: "2-digit", year: "numeric" });
}

export default function Usuarios() {
  const [users, setUsers] = useState<Profile[]>([]);
  const [editing, setEditing] = useState<Profile | "new" | null>(null);
  const [deleting, setDeleting] = useState<Profile | null>(null);
  const [toast, setToast] = useState("");

  const cargar = async () => {
    const { data } = await supabase.from("profiles").select("*").order("created_at");
    setUsers((data as Profile[]) || []);
  };
  useEffect(() => { cargar(); }, []);

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(""), 3500); };

  const toggleActivo = async (u: Profile) => {
    await supabase.from("profiles").update({ is_active: !u.is_active }).eq("id", u.id);
    cargar();
  };

  const resetPassword = async (u: Profile) => {
    // Solo se puede resetear la contraseña real desde el propio usuario o con
    // llaves de servicio. Como este proyecto NO usa service_role, marcamos
    // "debe_cambiar_password" para forzar que el usuario la reconfigure la
    // próxima vez, y le indicamos al administrador que le informe su cédula
    // como contraseña temporal si necesita volver a entrar.
    await supabase.from("profiles").update({ debe_cambiar_password: true, password_actualizada: null }).eq("id", u.id);
    showToast(`Se marcó a ${u.nombres} para que cambie su contraseña en su próximo ingreso. Indícale que use su cédula (${u.cedula}) como contraseña temporal si ya no la recuerda; solo funcionará si aún no la había cambiado.`);
    cargar();
  };

  const handleDelete = async () => {
    if (!deleting) return;
    // Sin service_role no se puede borrar el usuario de Authentication desde el
    // cliente. Se desactiva su acceso y se elimina su perfil de datos.
    await supabase.from("profiles").delete().eq("id", deleting.id);
    showToast(`Perfil de ${deleting.nombres} eliminado. Si además quieres borrar su acceso por completo, hazlo una sola vez desde Supabase → Authentication → Users.`);
    setDeleting(null);
    cargar();
  };

  return (
    <Layout title="Usuarios" subtitle="Administración de accesos">
      <div className="p-6 space-y-4">
        <div className="flex justify-between items-center flex-wrap gap-2">
          <p className="text-sm text-[#6B7386]">Gestión de usuarios y roles del sistema.</p>
          <button onClick={() => setEditing("new")} className="flex items-center gap-1.5 text-white rounded px-3.5 py-2 text-sm font-medium" style={{ background: "#1E4D8C" }}><Plus size={15} /> Crear usuario</button>
        </div>
        <div className="bg-white border border-[#E3E6EC] rounded-md overflow-x-auto">
          <table className="w-full text-sm min-w-[700px]">
            <thead><tr className="text-left text-[#8D97AE] border-b border-[#EDEFF3]"><th className="px-5 py-2 font-normal">Nombre</th><th className="px-5 py-2 font-normal">Usuario</th><th className="px-5 py-2 font-normal">Rol</th><th className="px-5 py-2 font-normal">Contraseña</th><th className="px-5 py-2 font-normal">Estado</th><th className="px-5 py-2 font-normal"></th></tr></thead>
            <tbody>
              {users.map((u) => {
                const vencida = passwordVencida(u.password_actualizada);
                return (
                  <tr key={u.id} className="border-b border-[#F2F3F6] last:border-0">
                    <td className="px-5 py-2.5 text-[#172033]">{u.nombres} {u.apellidos}</td>
                    <td className="px-5 py-2.5 text-[#6B7386]">{u.usuario}</td>
                    <td className="px-5 py-2.5 text-[#3A4256]">{ROLE_LABELS[u.role]}</td>
                    <td className="px-5 py-2.5">
                      {u.debe_cambiar_password ? <span className="text-xs" style={{ color: "#A30D0A" }}>Pendiente de definir</span>
                        : vencida ? <span className="text-xs" style={{ color: "#B8791F" }}>Vencida (&gt;6 meses)</span>
                        : <span className="text-xs text-[#8D97AE]">Actualizada {fmtDate(u.password_actualizada)}</span>}
                    </td>
                    <td className="px-5 py-2.5">{u.is_active ? <span className="inline-flex items-center gap-1 text-xs" style={{ color: "#2F7D5E" }}><CheckCircle2 size={13} /> Activo</span> : <span className="text-[#8D97AE] text-xs">Inactivo</span>}</td>
                    <td className="px-5 py-2.5">
                      <div className="flex items-center gap-3">
                        <button onClick={() => toggleActivo(u)} className="font-medium hover:underline" style={{ color: "#1E4D8C" }}>{u.is_active ? "Desactivar" : "Activar"}</button>
                        <button onClick={() => resetPassword(u)} title="Forzar cambio de contraseña" className="text-[#6B7386] hover:text-[#172033]"><KeyRound size={14} /></button>
                        <button onClick={() => setEditing(u)} title="Editar" className="text-[#6B7386] hover:text-[#172033]"><Pencil size={14} /></button>
                        <button onClick={() => setDeleting(u)} title="Eliminar" style={{ color: "#A30D0A" }}><Trash2 size={14} /></button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <p className="text-xs text-[#8D97AE]">El usuario se genera como nombre + primer apellido, y la contraseña temporal es la cédula de identidad. El sistema exige cambiarla en el primer ingreso y renovarla cada 6 meses.</p>
      </div>

      {editing && (
        <UsuarioFormModal
          initial={editing === "new" ? null : editing}
          onClose={() => setEditing(null)}
          onSaved={(msg) => { setEditing(null); showToast(msg); cargar(); }}
        />
      )}

      {deleting && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-20 p-4">
          <div className="bg-white rounded-md w-full max-w-sm border border-[#E3E6EC]">
            <div className="px-5 py-4 border-b border-[#E3E6EC] font-serif text-lg text-[#172033]">Eliminar usuario</div>
            <div className="px-5 py-4 text-sm text-[#3A4256]">¿Confirmas eliminar a <span className="font-medium">{deleting.nombres} {deleting.apellidos}</span>?</div>
            <div className="flex justify-end gap-2 px-5 py-4 border-t border-[#E3E6EC]">
              <button onClick={() => setDeleting(null)} className="text-sm text-[#6B7386]">Cancelar</button>
              <button onClick={handleDelete} className="text-white rounded px-4 py-2 text-sm font-medium" style={{ background: "#A30D0A" }}>Eliminar</button>
            </div>
          </div>
        </div>
      )}

      {toast && <div className="fixed bottom-8 left-1/2 -translate-x-1/2 text-white text-sm px-4 py-2.5 rounded shadow-lg z-30 text-center max-w-sm" style={{ background: "#2F7D5E" }}>{toast}</div>}
    </Layout>
  );
}

function UsuarioFormModal({ initial, onClose, onSaved }: { initial: Profile | null; onClose: () => void; onSaved: (msg: string) => void }) {
  const [nombres, setNombres] = useState(initial?.nombres || "");
  const nombresRef = useRef<HTMLInputElement>(null);
  const [mostrarErrorDuplicado, setMostrarErrorDuplicado] = useState(false);
  const [apellidos, setApellidos] = useState(initial?.apellidos || "");
  const [cedula, setCedula] = useState(initial?.cedula || "");
  const [telefono, setTelefono] = useState(initial?.phone || "");
  const [rol, setRol] = useState<Role>((initial?.role as Role) || "consulta");
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isEdit = !!initial;
  const usuarioGenerado = generarUsuario(nombres, apellidos);
  const puedeGuardar = nombres && apellidos && cedula && telefono && usuarioGenerado;

  const guardar = async () => {
    if (!puedeGuardar) return;
    setGuardando(true);
    setError(null);

    if (isEdit && initial) {
      const { error } = await supabase
        .from("profiles")
        .update({ nombres, apellidos, cedula, phone: telefono, role: rol })
        .eq("id", initial.id);
      setGuardando(false);
      if (error) { setError(error.message); return; }
      onSaved("Usuario actualizado.");
      return;
    }

    // Crear usuario nuevo: se usa el segundo cliente de Supabase (persistSession: false)
    // para que el signUp() NO reemplace la sesión del administrador.
    const email = usuarioAEmail(usuarioGenerado);
    const password = passwordTemporal(cedula);
    const { data, error: signUpError } = await supabaseAdmin.auth.signUp({ email, password });
    if (signUpError || !data.user) {
  setGuardando(false);

  if (signUpError?.message?.toLowerCase().includes("already registered")) {
    setMostrarErrorDuplicado(true);
  } else {
    setError(signUpError?.message || "No se pudo crear el usuario");
  }

  return;
}

    // El trigger de la base de datos ya creó una fila en "profiles" con datos
    // mínimos. Ahora, con la sesión del ADMINISTRADOR (no la del usuario nuevo),
    // completamos esa fila con nombre, cédula, usuario y rol.
    const { error: updateError } = await supabase
      .from("profiles")
      .update({ nombres, apellidos, usuario: usuarioGenerado, cedula, phone: telefono, role: rol, debe_cambiar_password: true })
      .eq("id", data.user.id);

    setGuardando(false);
    if (updateError) { setError(updateError.message); return; }
    onSaved(`Usuario "${usuarioGenerado}" creado con contraseña temporal (su cédula). Deberá cambiarla en su primer ingreso.`);
  };

  return (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-20 p-4">
      <div className="bg-white rounded-md w-full max-w-sm border border-[#E3E6EC]">
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#E3E6EC]"><div className="font-serif text-lg text-[#172033]">{isEdit ? "Editar usuario" : "Crear usuario"}</div><button onClick={onClose} className="text-[#8D97AE]"><X size={18} /></button></div>
        <div className="px-5 py-4 space-y-3 text-sm max-h-[70vh] overflow-y-auto">
          <div className="grid grid-cols-2 gap-2">
            <div><label className="block text-[#3A4256] mb-1">Nombres</label><input ref={nombresRef} value={nombres} onChange={(e) => setNombres(e.target.value)} className="w-full border border-[#D8DCE4] rounded px-3 py-2" placeholder="Luis" /></div>
            <div><label className="block text-[#3A4256] mb-1">Apellidos</label><input value={apellidos} onChange={(e) => setApellidos(e.target.value)} className="w-full border border-[#D8DCE4] rounded px-3 py-2" placeholder="Fernández Rojas" /></div>
          </div>
          <div><label className="block text-[#3A4256] mb-1">Cédula de identidad</label><input value={cedula} onChange={(e) => setCedula(e.target.value.replace(/[^0-9A-Za-z]/g, ""))} disabled={isEdit} className="w-full border border-[#D8DCE4] rounded px-3 py-2 disabled:bg-[#F5F6F8]" placeholder="8523147" /></div>
          <div><label className="block text-[#3A4256] mb-1">WhatsApp</label><input value={telefono} onChange={(e) => setTelefono(e.target.value)} className="w-full border border-[#D8DCE4] rounded px-3 py-2" /></div>
          <div><label className="block text-[#3A4256] mb-1">Rol</label><select value={rol} onChange={(e) => setRol(e.target.value as Role)} className="w-full border border-[#D8DCE4] rounded px-3 py-2"><option value="admin">Administrador</option><option value="consulta">Auditor</option></select></div>

          {!isEdit && (
            <div className="bg-[#F5F6F8] rounded px-3 py-2.5 space-y-1.5">
              <div className="flex items-center gap-1.5 text-[#3A4256] font-medium"><KeyRound size={13} /> Credenciales generadas</div>
              <div className="text-[#172033]">Usuario: <span className="font-medium">{usuarioGenerado || "—"}</span></div>
              <div className="text-[#172033]">Contraseña temporal: <span className="font-medium">{cedula || "—"}</span> (cédula)</div>
              <p className="text-[11px] text-[#8D97AE]">Deberá crear una contraseña nueva en su primer ingreso.</p>
            </div>
          )}
          {error && <p className="text-xs text-[#A30D0A]">{error}</p>}
        </div>
        <div className="flex justify-end gap-2 px-5 py-4 border-t border-[#E3E6EC]">
          <button onClick={onClose} className="text-sm text-[#6B7386]">Cancelar</button>
          <button disabled={!puedeGuardar || guardando} onClick={guardar} className="text-white rounded px-4 py-2 text-sm font-medium disabled:opacity-40" style={{ background: "#1E4D8C" }}>
            {guardando ? "Guardando…" : isEdit ? "Guardar cambios" : "Crear usuario"}
          </button>
        </div>
      </div>
      {mostrarErrorDuplicado && (
  <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 p-4">
    <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-2xl">
      <div className="text-center">
        <div className="mb-3 text-4xl">⚠️</div>

        <h3 className="text-lg font-semibold text-[#172033]">
          Usuario ya registrado
        </h3>

        <p className="mt-2 text-sm text-[#5B6472]">
          El usuario ya existe. Verifica los datos ingresados.
        </p>

        <button
          type="button"
          onClick={() => {
            setMostrarErrorDuplicado(false);
            setError(null);

            setTimeout(() => {
              nombresRef.current?.focus();
              nombresRef.current?.select();
            }, 0);
          }}
          className="mt-5 rounded-md bg-[#1F4E8C] px-6 py-2 text-sm font-medium text-white hover:bg-[#173D70]"
        >
          Aceptar
        </button>
      </div>
    </div>
  </div>
)}
    </div>
  );
}
