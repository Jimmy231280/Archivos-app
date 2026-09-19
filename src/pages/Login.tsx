import React, { useState } from "react";
import { Navigate } from "react-router-dom";
import { ShieldCheck, UserCircle2 } from "lucide-react";
import { useAuth } from "../context/AuthContext";

export default function Login() {
  const { session, recuperandoPassword, signInWithUsuario, loading } = useAuth();
  const [usuario, setUsuario] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  if (!loading && recuperandoPassword) {
   return <Navigate to="/cambiar-password" replace />;
  }

  if (!loading && session) {
   return <Navigate to="/inicio" replace />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    const { error } = await signInWithUsuario(usuario, password);
    setSubmitting(false);
    if (error) setError(error);
  };

  return (
    <div className="min-h-screen w-full flex flex-col bg-white">
      <div style={{ height: 6, background: "#1E4D8C" }} />
      <div className="flex-1 flex items-center justify-center px-4 py-10">
        <div className="w-full max-w-md text-center">
          <div className="mx-auto w-20 h-20 rounded-full bg-white border border-[#E3E6EC] flex items-center justify-center p-2 mb-5">
            <div
              className="w-full h-full rounded-full flex items-center justify-center"
              style={{ background: "linear-gradient(160deg, #A30D0A 0%, #6E0A08 100%)" }}
            >
              <span className="text-white font-bold text-sm tracking-tight">UAGRM</span>
            </div>
          </div>
          <h1 className="font-serif text-2xl text-[#172033]">Unidad de Auditoría Interna</h1>
          <p className="text-sm text-[#6B7386] mt-1 mb-8">Ingresa con tu usuario y contraseña</p>

          <div className="grid grid-cols-2 gap-4 mb-6 text-left">
            <div className="rounded-lg border border-[#E3E6EC] p-4 flex flex-col items-center text-center gap-1">
              <ShieldCheck size={22} className="text-[#8D97AE]" />
              <div className="text-xs font-medium text-[#172033]">Administrador</div>
            </div>
            <div className="rounded-lg border border-[#E3E6EC] p-4 flex flex-col items-center text-center gap-1">
              <UserCircle2 size={22} className="text-[#8D97AE]" />
              <div className="text-xs font-medium text-[#172033]">Auditor</div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="text-left">
            <label className="block text-xs text-[#3A4256] mb-1">Usuario</label>
            <input
              value={usuario}
              onChange={(e) => setUsuario(e.target.value)}
              className="w-full border border-[#D8DCE4] rounded px-3 py-2 text-sm mb-3"
              placeholder="ej. luis.fernandez"
              autoComplete="username"
            />
            <label className="block text-xs text-[#3A4256] mb-1">Contraseña</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full border border-[#D8DCE4] rounded px-3 py-2 text-sm mb-4"
              autoComplete="current-password"
            />
            {error && <p className="text-xs text-[#A30D0A] mb-3">{error}</p>}
            <button
              type="submit"
              disabled={submitting || !usuario || !password}
              className="w-full text-white rounded py-2.5 text-sm font-medium disabled:opacity-40"
              style={{ background: "#A30D0A" }}
            >
              {submitting ? "Ingresando…" : "Ingresar"}
            </button>
          </form>
        </div>
      </div>
      <div style={{ height: 6, background: "#A30D0A" }} />
    </div>
  );
}
