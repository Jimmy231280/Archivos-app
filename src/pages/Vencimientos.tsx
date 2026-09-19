import React, { useEffect, useState } from "react";
import { Clock3, AlertTriangle, MessageCircle, X } from "lucide-react";
import Layout from "../components/Layout";
import Badge from "../components/Badge";
import { supabase } from "../lib/supabase";
import { clasificarPrestamo, type Prestamo } from "../types";

function buildMensaje(p: Prestamo, estadoLabel: string) {
  return `Estimado/a ${p.solicitante_nombre}, le recordamos que el documento ${p.documentos?.codigo_documento} (${p.documentos?.nombre_documento}) fue prestado el ${new Date(p.fecha_prestamo).toLocaleString("es-BO")} con fecha límite de devolución ${new Date(p.fecha_limite).toLocaleString("es-BO")}. Estado actual: ${estadoLabel}. Agradecemos coordinar su devolución a la brevedad. — UAI`;
}

const LABELS: Record<string, string> = { vigente: "Vigente", proximo: "Próximo a vencer", vencido: "Vencido", devuelto: "Devuelto" };

export default function Vencimientos() {
  const [prestamos, setPrestamos] = useState<Prestamo[]>([]);
  const [wa, setWa] = useState<Prestamo | null>(null);
  const [mensaje, setMensaje] = useState("");

  useEffect(() => {
    supabase.from("prestamos").select("*, documentos(*)").eq("estado", "prestado").order("fecha_limite").then(({ data }) => setPrestamos((data as Prestamo[]) || []));
  }, []);

  const clasificados = prestamos.map((p) => ({ p, c: clasificarPrestamo(p) })).filter((x) => x.c.estado === "proximo" || x.c.estado === "vencido");
  const abrirWa = (p: Prestamo, estado: string) => { setWa(p); setMensaje(buildMensaje(p, LABELS[estado])); };

  return (
    <Layout title="Vencimientos" subtitle="Próximos a vencer y vencidos">
      <div className="p-6 space-y-4">
        <div className="flex gap-3 text-sm">
          <div className="flex items-center gap-1.5" style={{ color: "#B8791F" }}><Clock3 size={14} /> Próximos: {clasificados.filter((x) => x.c.estado === "proximo").length}</div>
          <div className="flex items-center gap-1.5" style={{ color: "#A30D0A" }}><AlertTriangle size={14} /> Vencidos: {clasificados.filter((x) => x.c.estado === "vencido").length}</div>
        </div>
        <div className="bg-white border border-[#E3E6EC] rounded-md overflow-x-auto">
          <table className="w-full text-sm min-w-[700px]">
            <thead><tr className="text-left text-[#8D97AE] border-b border-[#EDEFF3]"><th className="px-5 py-2 font-normal">Documento</th><th className="px-5 py-2 font-normal">Solicitante</th><th className="px-5 py-2 font-normal">Fecha límite</th><th className="px-5 py-2 font-normal">Días</th><th className="px-5 py-2 font-normal">Estado</th><th className="px-5 py-2 font-normal"></th></tr></thead>
            <tbody>
              {clasificados.map(({ p, c }) => (
                <tr key={p.id} className="border-b border-[#F2F3F6] last:border-0">
                  <td className="px-5 py-2.5 text-[#172033]">{p.documentos?.codigo_documento}</td>
                  <td className="px-5 py-2.5 text-[#3A4256]">{p.solicitante_nombre}</td>
                  <td className="px-5 py-2.5 text-[#6B7386]">{new Date(p.fecha_limite).toLocaleString("es-BO")}</td>
                  <td className="px-5 py-2.5 text-[#6B7386]">{c.diasRestantes < 0 ? `${Math.abs(c.diasRestantes)} días vencido` : `${c.diasRestantes} días restantes`}</td>
                  <td className="px-5 py-2.5"><Badge status={c.estado} /></td>
                  <td className="px-5 py-2.5"><button onClick={() => abrirWa(p, c.estado)} className="flex items-center gap-1 font-medium hover:underline" style={{ color: "#2F7D5E" }}><MessageCircle size={14} /> Avisar</button></td>
                </tr>
              ))}
              {clasificados.length === 0 && <tr><td colSpan={6} className="px-5 py-8 text-center text-[#8D97AE]">No hay préstamos próximos a vencer ni vencidos.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      {wa && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-20 p-4">
          <div className="bg-white rounded-md w-full max-w-md border border-[#E3E6EC]">
            <div className="flex items-center justify-between px-5 py-4 border-b border-[#E3E6EC]"><div className="font-serif text-lg text-[#172033]">Revisar mensaje de WhatsApp</div><button onClick={() => setWa(null)} className="text-[#8D97AE]"><X size={18} /></button></div>
            <div className="px-5 py-4 space-y-3 text-sm">
              <div className="text-[#8D97AE]">Para: {wa.solicitante_nombre} · {wa.solicitante_telefono}</div>
              <textarea value={mensaje} onChange={(e) => setMensaje(e.target.value)} rows={6} className="w-full border border-[#D8DCE4] rounded px-3 py-2 text-sm" />
            </div>
            <div className="flex justify-end gap-2 px-5 py-4 border-t border-[#E3E6EC]">
              <button onClick={() => setWa(null)} className="text-sm text-[#6B7386]">Cancelar</button>
              <a href={`https://wa.me/${(wa.solicitante_telefono || "").replace(/\D/g, "")}?text=${encodeURIComponent(mensaje)}`} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 text-white rounded px-4 py-2 text-sm font-medium" style={{ background: "#2F7D5E" }}><MessageCircle size={14} /> Abrir WhatsApp</a>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}
