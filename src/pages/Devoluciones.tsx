import React, { useEffect, useState } from "react";
import { X } from "lucide-react";
import Layout from "../components/Layout";
import Badge from "../components/Badge";
import { supabase } from "../lib/supabase";
import { clasificarPrestamo, type Prestamo } from "../types";

export default function Devoluciones() {
  const [prestamos, setPrestamos] = useState<Prestamo[]>([]);
  const [selected, setSelected] = useState<Prestamo | null>(null);
  const [recibidoPor, setRecibidoPor] = useState("");
  const [estadoDoc, setEstadoDoc] = useState("Buen estado");
  const [obs, setObs] = useState("");
  const [toast, setToast] = useState("");

  const cargar = async () => {
    const { data } = await supabase.from("prestamos").select("*, documentos(*)").eq("estado", "prestado").order("fecha_limite");
    setPrestamos((data as Prestamo[]) || []);
  };
  useEffect(() => { cargar(); }, []);

  const abrir = (p: Prestamo) => { setSelected(p); setRecibidoPor(""); setEstadoDoc("Buen estado"); setObs(""); };

  const confirmar = async () => {
    if (!selected || !recibidoPor) return;
    // Un solo insert: los triggers de la base de datos marcan el préstamo como
    // "devuelto" y el documento como "disponible" automáticamente.
    const { error } = await supabase.from("devoluciones").insert({
      prestamo_id: selected.id,
      recibido_por: recibidoPor,
      estado_documento: estadoDoc,
      observaciones: obs || null,
    });
    if (!error) {
      setToast("Devolución registrada. El documento vuelve a estar disponible.");
      setTimeout(() => setToast(""), 3200);
      setSelected(null);
      cargar();
    }
  };

  return (
    <Layout title="Devoluciones" subtitle="Cierre de préstamos activos">
      <div className="p-6 space-y-4">
        <p className="text-sm text-[#6B7386]">Selecciona un préstamo activo para registrar su devolución.</p>
        <div className="bg-white border border-[#E3E6EC] rounded-md overflow-x-auto">
          <table className="w-full text-sm min-w-[600px]">
            <thead><tr className="text-left text-[#8D97AE] border-b border-[#EDEFF3]"><th className="px-5 py-2 font-normal">Documento</th><th className="px-5 py-2 font-normal">Solicitante</th><th className="px-5 py-2 font-normal">Fecha límite</th><th className="px-5 py-2 font-normal">Estado</th><th className="px-5 py-2 font-normal"></th></tr></thead>
            <tbody>
              {prestamos.map((p) => {
                const c = clasificarPrestamo(p);
                return (
                  <tr key={p.id} className="border-b border-[#F2F3F6] last:border-0">
                    <td className="px-5 py-2.5 text-[#172033]">{p.documentos?.codigo_documento}</td>
                    <td className="px-5 py-2.5 text-[#3A4256]">{p.solicitante_nombre}</td>
                    <td className="px-5 py-2.5 text-[#6B7386]">{new Date(p.fecha_limite).toLocaleString("es-BO")}</td>
                    <td className="px-5 py-2.5"><Badge status={c.estado} /></td>
                    <td className="px-5 py-2.5"><button onClick={() => abrir(p)} className="font-medium hover:underline" style={{ color: "#1E4D8C" }}>Registrar devolución</button></td>
                  </tr>
                );
              })}
              {prestamos.length === 0 && <tr><td colSpan={5} className="px-5 py-8 text-center text-[#8D97AE]">No hay préstamos activos.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      {selected && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-20 p-4">
          <div className="bg-white rounded-md w-full max-w-md border border-[#E3E6EC]">
            <div className="flex items-center justify-between px-5 py-4 border-b border-[#E3E6EC]"><div className="font-serif text-lg text-[#172033]">Registrar devolución</div><button onClick={() => setSelected(null)} className="text-[#8D97AE]"><X size={18} /></button></div>
            <div className="px-5 py-4 space-y-3 text-sm">
              <div className="text-[#3A4256]">{selected.documentos?.codigo_documento}</div>
              <div><label className="block text-[#3A4256] mb-1">Recibido por</label><input value={recibidoPor} onChange={(e) => setRecibidoPor(e.target.value)} className="w-full border border-[#D8DCE4] rounded px-3 py-2" /></div>
              <div><label className="block text-[#3A4256] mb-1">Estado del documento</label><select value={estadoDoc} onChange={(e) => setEstadoDoc(e.target.value)} className="w-full border border-[#D8DCE4] rounded px-3 py-2"><option>Buen estado</option><option>Con observaciones</option></select></div>
              <div><label className="block text-[#3A4256] mb-1">Observaciones</label><textarea value={obs} onChange={(e) => setObs(e.target.value)} rows={2} className="w-full border border-[#D8DCE4] rounded px-3 py-2" /></div>
            </div>
            <div className="flex justify-end gap-2 px-5 py-4 border-t border-[#E3E6EC]">
              <button onClick={() => setSelected(null)} className="text-sm text-[#6B7386]">Cancelar</button>
              <button disabled={!recibidoPor} onClick={confirmar} className="text-white rounded px-4 py-2 text-sm font-medium disabled:opacity-40" style={{ background: "#1E4D8C" }}>Confirmar devolución</button>
            </div>
          </div>
        </div>
      )}
      {toast && <div className="fixed bottom-8 left-1/2 -translate-x-1/2 text-white text-sm px-4 py-2.5 rounded shadow-lg z-30" style={{ background: "#2F7D5E" }}>{toast}</div>}
    </Layout>
  );
}
