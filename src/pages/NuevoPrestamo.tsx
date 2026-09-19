import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Send } from "lucide-react";
import Layout from "../components/Layout";
import { useAuth } from "../context/AuthContext";
import { supabase } from "../lib/supabase";
import type { Documento } from "../types";

export default function NuevoPrestamo() {
  const location = useLocation() as { state?: { documentoId?: string; nombre?: string; telefono?: string; solicitudId?: string } };
  const navigate = useNavigate();
  const { session } = useAuth();
  const preset = location.state;

  const [documentos, setDocumentos] = useState<Documento[]>([]);
  const [docId, setDocId] = useState(preset?.documentoId || "");
  const [nombre, setNombre] = useState(preset?.nombre || "");
  const [cargo, setCargo] = useState("");
  const [unidad, setUnidad] = useState("");
  const [telefono, setTelefono] = useState(preset?.telefono || "");
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    supabase.from("documentos").select("*").eq("estado", "disponible").then(({ data }) => setDocumentos((data as Documento[]) || []));
  }, []);

  const guardar = async () => {
    if (!docId || !nombre || !telefono) return;
    setGuardando(true);
    setError(null);
    const { error } = await supabase.from("prestamos").insert({
      documento_id: docId,
      solicitante_nombre: nombre,
      solicitante_cargo: cargo || null,
      solicitante_unidad: unidad || null,
      solicitante_telefono: telefono,
      registrado_por: session?.user.id,
    });
    if (error) {
      setError("No se pudo registrar el préstamo: " + error.message);
      setGuardando(false);
      return;
    }
    if (preset?.solicitudId) {
      await supabase.from("solicitudes").update({ estado: "atendida" }).eq("id", preset.solicitudId);
    }
    navigate("/prestamos");
  };

  return (
    <Layout title="Nuevo préstamo" subtitle="Registro y seguimiento">
      <div className="p-6 max-w-lg">
        <div className="bg-white border border-[#E3E6EC] rounded-md p-5 space-y-4 text-sm">
          <div>
            <label className="block text-[#3A4256] mb-1">Documento disponible</label>
            <select value={docId} onChange={(e) => setDocId(e.target.value)} className="w-full border border-[#D8DCE4] rounded px-3 py-2">
              <option value="">Seleccione un documento…</option>
              {documentos.map((d) => <option key={d.id} value={d.id}>{d.codigo_documento} — {d.nombre_documento}</option>)}
            </select>
          </div>
          <div><label className="block text-[#3A4256] mb-1">Nombre del solicitante</label><input value={nombre} onChange={(e) => setNombre(e.target.value)} className="w-full border border-[#D8DCE4] rounded px-3 py-2" /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="block text-[#3A4256] mb-1">Cargo</label><input value={cargo} onChange={(e) => setCargo(e.target.value)} className="w-full border border-[#D8DCE4] rounded px-3 py-2" /></div>
            <div><label className="block text-[#3A4256] mb-1">Unidad</label><input value={unidad} onChange={(e) => setUnidad(e.target.value)} className="w-full border border-[#D8DCE4] rounded px-3 py-2" /></div>
          </div>
          <div><label className="block text-[#3A4256] mb-1">WhatsApp del solicitante</label><input value={telefono} onChange={(e) => setTelefono(e.target.value)} className="w-full border border-[#D8DCE4] rounded px-3 py-2" placeholder="591 7XXXXXXX" /></div>
          <p className="text-xs text-[#8D97AE]">La fecha y hora del préstamo, y la fecha límite (+2 meses), se calculan automáticamente al guardar.</p>
          {error && <p className="text-xs text-[#A30D0A]">{error}</p>}
          <div className="flex justify-end gap-2 pt-2">
            <button onClick={() => navigate("/prestamos")} className="text-sm text-[#6B7386]">Cancelar</button>
            <button disabled={!docId || !nombre || !telefono || guardando} onClick={guardar} className="flex items-center gap-1.5 text-white rounded px-4 py-2 text-sm font-medium disabled:opacity-40" style={{ background: "#1E4D8C" }}>
              <Send size={14} /> {guardando ? "Guardando…" : "Guardar préstamo"}
            </button>
          </div>
        </div>
      </div>
    </Layout>
  );
}
