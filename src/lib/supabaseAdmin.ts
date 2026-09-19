import { createClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL as string;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

/**
 * Segundo cliente, EXCLUSIVO para que un administrador cree usuarios nuevos.
 * persistSession: false evita que el signUp() de un nuevo usuario
 * reemplace la sesión del administrador que está creándolo.
 * Usa la misma URL y la misma anon key — no se necesita ninguna llave secreta.
 */
export const supabaseAdmin = createClient(url, anonKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});
