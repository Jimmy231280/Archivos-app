export type Role = "admin" | "consulta";

export interface Profile {
  id: string;
  nombres: string | null;
  apellidos: string | null;
  usuario: string | null;
  cedula: string | null;
  phone: string | null;
  role: Role;
  is_active: boolean;
  debe_cambiar_password: boolean;
  password_actualizada: string | null;
  created_at: string;
}

export interface Auditoria {
  id: string;
  codigo_auditoria: string;
  nombre_auditoria: string;
  gestion: string | null;
  unidad: string | null;
  descripcion: string | null;
  created_at: string;
}

export type DocumentoEstado = "disponible" | "prestado";

export interface Documento {
  id: string;
  auditoria_id: string;
  codigo_documento: string;
  tipo_documento: string | null;
  nombre_documento: string;
  descripcion: string | null;
  ubicacion: string | null;
  estado: DocumentoEstado;
  created_at: string;
  updated_at: string;
  auditorias?: Auditoria;
}

export type PrestamoEstadoDB = "prestado" | "devuelto";

export interface Prestamo {
  id: string;
  documento_id: string;
  solicitante_nombre: string;
  solicitante_cargo: string | null;
  solicitante_unidad: string | null;
  solicitante_telefono: string | null;
  fecha_prestamo: string;
  fecha_limite: string;
  estado: PrestamoEstadoDB;
  observaciones: string | null;
  registrado_por: string | null;
  created_at: string;
  documentos?: Documento;
}

export interface Devolucion {
  id: string;
  prestamo_id: string;
  fecha_devolucion: string;
  recibido_por: string | null;
  estado_documento: string | null;
  observaciones: string | null;
  created_at: string;
}

export interface Archivo {
  id: string;
  documento_id: string;
  nombre_archivo: string;
  ruta_storage: string;
  tipo_archivo: string | null;
  tamano: number | null;
  created_at: string;
  subido_por: string | null;
}

export type SolicitudEstado = "pendiente" | "atendida" | "rechazada";

export interface Solicitud {
  id: string;
  documento_id: string;
  solicitante_id: string;
  motivo: string | null;
  estado: SolicitudEstado;
  created_at: string;
  documentos?: Documento;
  profiles?: Profile;
}

/** Estado visual derivado (no se guarda en la base de datos) */
export type EstadoVisual = "vigente" | "proximo" | "vencido" | "devuelto";

export function clasificarPrestamo(p: Prestamo): { estado: EstadoVisual; diasRestantes: number } {
  if (p.estado === "devuelto") return { estado: "devuelto", diasRestantes: 0 };
  const limite = new Date(p.fecha_limite).getTime();
  const ahora = Date.now();
  const dias = Math.ceil((limite - ahora) / (1000 * 60 * 60 * 24));
  if (dias < 0) return { estado: "vencido", diasRestantes: dias };
  if (dias <= 7) return { estado: "proximo", diasRestantes: dias };
  return { estado: "vigente", diasRestantes: dias };
}
