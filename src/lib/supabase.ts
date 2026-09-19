import { createClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL as string;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

if (!url || !anonKey) {
  console.error(
    "Faltan las variables VITE_SUPABASE_URL o VITE_SUPABASE_ANON_KEY. Revisa tu archivo .env"
  );
}

/**
 * Cliente principal: se usa para todo (login, lectura y escritura de datos).
 * Mantiene la sesión guardada en el navegador (persistSession: true).
 */
export const supabase = createClient(url, anonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
});
