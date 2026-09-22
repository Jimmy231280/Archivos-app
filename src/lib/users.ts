/** Utilidades para generar usuario y contraseña temporal de un nuevo empleado */

export function slug(s: string): string {
  return (s || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z]/g, "");
}

/** usuario = primer nombre + "." + primer apellido, ej: "luis.fernandez" */
export function generarUsuario(nombres: string, apellidos: string): string {
  const n = slug((nombres || "").trim().split(/\s+/)[0] || "");
  const a = slug((apellidos || "").trim().split(/\s+/)[0] || "");
  if (!n || !a) return "";
  return `${n}.${a}`;
}

/** Supabase Auth necesita un correo. Se construye uno interno a partir del usuario. */
export function usuarioAEmail(usuario: string): string {
  return `${usuario}@example.com`;
}

/** La contraseña temporal inicial es la cédula de identidad, tal como se definió. */
export function passwordTemporal(cedula: string): string {
  return (cedula || "").trim();
}

export function passwordVencida(fecha: string | null): boolean {
  if (!fecha) return false;
  const meses = (Date.now() - new Date(fecha).getTime()) / (1000 * 60 * 60 * 24 * 30.4);
  return meses >= 6;
}
