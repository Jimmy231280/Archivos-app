import React, { createContext, useContext, useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "../lib/supabase";
import { usuarioAEmail, passwordVencida } from "../lib/users";
import type { Profile } from "../types";

interface AuthContextValue {
  session: Session | null;
  profile: Profile | null;
  loading: boolean;
  debeCambiarPassword: boolean;
  recuperandoPassword: boolean;
  motivoCambio: "primer_ingreso" | "vencida" | null;
  signInWithUsuario: (usuario: string, password: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  marcarPasswordActualizada: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [recuperandoPassword, setRecuperandoPassword] = useState(false);

  const loadProfile = async (userId: string) => {
    const { data } = await supabase.from("profiles").select("*").eq("id", userId).single();
    setProfile((data as Profile) || null);
  };

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data }) => {
      setSession(data.session);
      if (data.session?.user) await loadProfile(data.session.user.id);
      setLoading(false);
    });

    const { data: sub } = supabase.auth.onAuthStateChange(async (event, newSession) => {
      setSession(newSession);
      if (event === "PASSWORD_RECOVERY") {
       setRecuperandoPassword(true);
      }
      if (newSession?.user) await loadProfile(newSession.user.id);
      else setProfile(null);
    });

    return () => sub.subscription.unsubscribe();
  }, []);

  const signInWithUsuario = async (usuario: string, password: string) => {
    // Supabase Auth funciona por correo. Traducimos "usuario" -> correo
    // mediante una función SQL (email_by_usuario) que consulta profiles.
    const usuarioLimpio = usuario.trim().toLowerCase();
    const { data: email, error: rpcError } = await supabase.rpc("email_by_usuario", {
      p_usuario: usuarioLimpio,
    });

    // Si la función no encuentra el usuario, probamos igual con el patrón
    // usuario@uai.local por si la BD aún no tiene ese registro sincronizado.
    const correoFinal = (email as string) || usuarioAEmail(usuarioLimpio);
    if (rpcError) {
      console.warn("No se pudo resolver el usuario, se intenta con el correo generado.", rpcError);
    }

    const { error } = await supabase.auth.signInWithPassword({
      email: correoFinal,
      password,
    });
    if (error) return { error: "Usuario o contraseña incorrectos." };
    return { error: null };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setProfile(null);
  };

  const refreshProfile = async () => {
    if (session?.user) await loadProfile(session.user.id);
  };

  const marcarPasswordActualizada = async () => {
    if (!session?.user) return;
    await supabase
      .from("profiles")
      .update({ debe_cambiar_password: false, password_actualizada: new Date().toISOString() })
      .eq("id", session.user.id);
    await refreshProfile();
  };

  const debeCambiarPassword = !!profile?.debe_cambiar_password || passwordVencida(profile?.password_actualizada ?? null);
  const motivoCambio: "primer_ingreso" | "vencida" | null = profile?.debe_cambiar_password
    ? "primer_ingreso"
    : passwordVencida(profile?.password_actualizada ?? null)
    ? "vencida"
    : null;

  return (
    <AuthContext.Provider
      value={{
        session,
        profile,
        loading,
        debeCambiarPassword,
        recuperandoPassword,
        motivoCambio,
        signInWithUsuario,
        signOut,
        refreshProfile,
        marcarPasswordActualizada,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth debe usarse dentro de <AuthProvider>");
  return ctx;
}
