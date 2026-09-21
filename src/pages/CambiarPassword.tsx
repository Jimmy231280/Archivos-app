import React, { useState } from "react";
import { Navigate } from "react-router-dom";
import { Lock } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { supabase } from "../lib/supabase";

export default function CambiarPassword() {
  const { session, debeCambiarPassword, recuperandoPassword, motivoCambio, marcarPasswordActualizada } = useAuth();
  const [p1, setP1] = useState("");
  const [p2, setP2] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [actualizado, setActualizado] = useState(false);

  if (!session) return <Navigate to="/login" replace />;
 
  if (!debeCambiarPassword && !recuperandoPassword) {
    return <Navigate to="/inicio" replace />;
  }
  const valido = p1.length >= 6 && p1 === p2;

  const handleSubmit = async (e: React.FormEvent) => {
   e.preventDefault();
   if (!valido) return;

   setSubmitting(true);
   setError(null);

  const { error } = await supabase.auth.updateUser({
    password: p1,
  });

  if (error) {
    setError("No se pudo actualizar la contraseña: " + error.message);
    setSubmitting(false);
    return;
  }

  await marcarPasswordActualizada();
  setSubmitting(false);
  setActualizado(true);

  setTimeout(() => {
    window.location.href = "/inicio";
  }, 3000);
};

  return (
    <div className="min-h-screen w-full flex flex-col bg-white">
      <div style={{ height: 6, background: "#1E4D8C" }} />
      <div className="flex-1 flex items-center justify-center px-4 py-10">
        <div className="w-full max-w-sm text-center">
          <div className="mx-auto w-14 h-14 rounded-full flex items-center justify-center mb-5" style={{ background: "#A30D0A15" }}>
            <Lock size={24} style={{ color: "#A30D0A" }} />
          </div>
          <h1 className="font-serif text-xl text-[#172033]">Actualiza tu contraseña</h1>
          <p className="text-sm text-[#6786] mt-2 mb-6">
            {recuperandoPassword
             ? "Has solicitado recuperar el acceso a tu cuenta. Por seguridad, crea una nueva contraseña antes de continuar."
             : motivoCambio === "vencida"
             ? "Tu contraseña tiene más de 6 meses de antigüedad. Por seguridad, crea una contraseña nueva antes de continuar."
             : "Este es tu primer ingreso con la contraseña temporal (tu número de cédula). Por seguridad, crea una contraseña nueva antes de continuar."}
          </p>
          {actualizado && (
           <div className="mb-6 rounded-lg border border-green-200 bg-green-50 px-4 py-4 text-center">
            <p className="text-base font-semibold text-green-700">
              ✅ Contraseña actualizada correctamente.
            </p>
            <p className="mt-1 text-sm text-green-600">
              Serás redirigido al inicio...
            </p>
           </div>
         )}

          <form onSubmit={handleSubmit} className="text-left space-y-3">
            <div>
              <label className="block text-xs text-[#3A4256] mb-1">Nueva contraseña</label>
              <input type="password" value={p1} onChange={(e) => setP1(e.target.value)} className="w-full border border-[#D8DCE4] rounded px-3 py-2 text-sm" placeholder="Mínimo 6 caracteres" />
            </div>
            <div>
              <label className="block text-xs text-[#3A4256] mb-1">Confirmar nueva contraseña</label>
              <input type="password" value={p2} onChange={(e) => setP2(e.target.value)} className="w-full border border-[#D8DCE4] rounded px-3 py-2 text-sm" />
            </div>
            {error && <p className="text-xs text-[#A30D0A]">{error}</p>}
            <button disabled={!valido || submitting} type="submit" className="w-full text-white rounded py-2.5 text-sm font-medium disabled:opacity-40 mt-2" style={{ background: "#1E4D8C" }}>
              {submitting ? "Guardando…" : "Guardar y continuar"}
            </button>
            <p className="text-[11px] text-[#8D97AE] text-center">El sistema volverá a pedirte este cambio cada 6 meses.</p>
          </form>
        </div>
      </div>
      <div style={{ height: 6, background: "#A30D0A" }} />
    </div>
  );
}
