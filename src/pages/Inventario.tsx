import React, { useEffect, useMemo, useState } from "react";
import { Search, Filter, Send, X, Paperclip, ChevronRight } from "lucide-react";
import Layout from "../components/Layout";
import Badge from "../components/Badge";
import { useAuth } from "../context/AuthContext";
import { supabase } from "../lib/supabase";
import type { Documento, Archivo } from "../types";

export default function Inventario() {
  const { profile, session } = useAuth();
  const [documentos, setDocumentos] = useState<Documento[]>([]);
  const [q, setQ] = useState("");
  const [estado, setEstado] = useState("todos");
  const [detalle, setDetalle] = useState<Documento | null>(null);
  const [archivos, setArchivos] = useState<Archivo[]>([]);
  const [solicitarDoc, setSolicitarDoc] = useState<Documento | null>(null);
  const [motivo, setMotivo] = useState("");
  const [toast, setToast] = useState("");

  const cargar = async () => {
    const { data } = await supabase.from("documentos").select("*, auditorias(*)").order("codigo_documento");
    setDocumentos((data as Documento[]) || []);
  };
  useEffect(() => { cargar(); }, []);

  const rows = useMemo(() => documentos.filter((d) => {
    const hay = `${d.codigo_documento} ${d.nombre_documento} ${d.tipo_documento ?? ""} ${d.auditorias?.codigo_auditoria ?? ""} ${d.auditorias?.nombre_auditoria ?? ""}`.toLowerCase();
    return hay.includes(q.toLowerCase()) && (estado === "todos" || d.estado === estado);
  }), [documentos, q, estado]);

  const abrirDetalle = async (d: Documento) => {
    setDetalle(d);
    const { data } = await supabase.from("archivos").select("*").eq("documento_id", d.id);
    setArchivos((data as Archivo[]) || []);
  };

  const enviarSolicitud = async () => {
    if (!solicitarDoc || !session?.user) return;
    const { error } = await supabase.from("solicitudes").insert({
      documento_id: solicitarDoc.id,
      solicitante_id: session.user.id,
      motivo,
    });
    if (!error) {
      setToast(`Solicitud enviada al encargado de archivos para ${solicitarDoc.codigo_documento}.`);
      setTimeout(() => setToast(""), 3200);
    }
    setSolicitarDoc(null);
    setMotivo("");
  };

  return (
    <Layout title="Inventario" subtitle="Auditorías y documentos">
      <div className="p-6 space-y-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8D97AE]" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar por código, auditoría o documento…" className="w-full border border-[#D8DCE4] rounded pl-9 pr-3 py-2 text-sm bg-white" />
          </div>
          <div className="relative">
            <Filter size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8D97AE]" />
            <select value={estado} onChange={(e) => setEstado(e.target.value)} className="border border-[#D8DCE4] rounded pl-8 pr-3 py-2 text-sm bg-white appearance-none">
              <option value="todos">Todos los estados</option>
              <option value="disponible">Disponible</option>
              <option value="prestado">Prestado</option>
            </select>
          </div>
        </div>

        <div className="bg-white border border-[#E3E6EC] rounded-md overflow-x-auto">
          <table className="w-full text-sm min-w-[700px]">
            <thead>
              <tr className="text-left text-[#8D97AE] border-b border-[#EDEFF3]">
                <th className="px-5 py-2 font-normal">Código doc.</th>
                <th className="px-5 py-2 font-normal">Documento</th>
                <th className="px-5 py-2 font-normal">Auditoría</th>
                <th className="px-5 py-2 font-normal">Estado</th>
                <th className="px-5 py-2 font-normal"></th>
              </tr>
            </thead>
            <tbody>
              {rows.map((d) => (
                <tr key={d.id} className="border-b border-[#F2F3F6] last:border-0 hover:bg-[#F8F9FB]">
                  <td className="px-5 py-2.5 text-[#172033] font-medium cursor-pointer" onClick={() => abrirDetalle(d)}>{d.codigo_documento}</td>
                  <td className="px-5 py-2.5 text-[#3A4256] cursor-pointer" onClick={() => abrirDetalle(d)}>{d.nombre_documento}</td>
                  <td className="px-5 py-2.5 text-[#6B7386]">{d.auditorias?.codigo_auditoria}</td>
                  <td className="px-5 py-2.5"><Badge status={d.estado} /></td>
                  <td className="px-5 py-2.5">
                    {d.estado === "disponible" && profile?.role === "consulta" ? (
                      <button onClick={() => setSolicitarDoc(d)} className="flex items-center gap-1 text-xs font-medium" style={{ color: "#1E4D8C" }}><Send size={13} /> Solicitar</button>
                    ) : (
                      <button onClick={() => abrirDetalle(d)} className="text-[#8D97AE]"><ChevronRight size={15} /></button>
                    )}
                  </td>
                </tr>
              ))}
              {rows.length === 0 && <tr><td colSpan={5} className="px-5 py-8 text-center text-[#8D97AE] text-sm">Sin resultados. Verifica que ya se haya cargado el inventario en Supabase.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      {detalle && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-20 p-4">
          <div className="bg-white rounded-md w-full max-w-md border border-[#E3E6EC]">
            <div className="flex items-center justify-between px-5 py-4 border-b border-[#E3E6EC]"><div className="font-serif text-lg text-[#172033]">{detalle.codigo_documento}</div><button onClick={() => setDetalle(null)} className="text-[#8D97AE]"><X size={18} /></button></div>
            <div className="px-5 py-4 space-y-3 text-sm">
              <div><div className="text-[#8D97AE]">Documento</div><div className="text-[#172033]">{detalle.nombre_documento}</div></div>
              <div><div className="text-[#8D97AE]">Auditoría</div><div className="text-[#172033]">{detalle.auditorias?.codigo_auditoria} — {detalle.auditorias?.nombre_auditoria}</div></div>
              <div><div className="text-[#8D97AE]">Estado</div><Badge status={detalle.estado} /></div>
              <div>
                <div className="text-[#8D97AE] mb-1">Archivos digitales</div>
                {archivos.length > 0 ? archivos.map((a) => (
                  <div key={a.id} className="flex items-center gap-2 text-[#3A4256]"><Paperclip size={13} /> {a.nombre_archivo}</div>
                )) : <div className="text-[#8D97AE]">No hay archivos adjuntos.</div>}
              </div>
            </div>
            {detalle.estado === "disponible" && profile?.role === "consulta" && (
              <div className="px-5 py-4 border-t border-[#E3E6EC]">
                <button onClick={() => { setSolicitarDoc(detalle); setDetalle(null); }} className="w-full flex items-center justify-center gap-2 text-white rounded py-2.5 text-sm font-medium" style={{ background: "#1E4D8C" }}><Send size={14} /> Solicitar al encargado de archivos</button>
              </div>
            )}
          </div>
        </div>
      )}

      {solicitarDoc && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-20 p-4">
          <div className="bg-white rounded-md w-full max-w-md border border-[#E3E6EC]">
            <div className="flex items-center justify-between px-5 py-4 border-b border-[#E3E6EC]"><div className="font-serif text-lg text-[#172033]">Solicitar documento</div><button onClick={() => setSolicitarDoc(null)} className="text-[#8D97AE]"><X size={18} /></button></div>
            <div className="px-5 py-4 space-y-3 text-sm">
              <div className="bg-[#F5F6F8] rounded px-3 py-2 text-[#3A4256]">{solicitarDoc.codigo_documento} — {solicitarDoc.nombre_documento}</div>
              <div><label className="block text-[#3A4256] mb-1">Motivo de la solicitud</label><textarea value={motivo} onChange={(e) => setMotivo(e.target.value)} rows={3} className="w-full border border-[#D8DCE4] rounded px-3 py-2" placeholder="Ej. Revisión de hallazgo, respaldo de informe…" /></div>
            </div>
            <div className="flex justify-end gap-2 px-5 py-4 border-t border-[#E3E6EC]">
              <button onClick={() => setSolicitarDoc(null)} className="text-sm text-[#6B7386]">Cancelar</button>
              <button onClick={enviarSolicitud} className="flex items-center gap-1.5 text-white rounded px-4 py-2 text-sm font-medium" style={{ background: "#1E4D8C" }}><Send size={14} /> Enviar solicitud</button>
            </div>
          </div>
        </div>
      )}

      {toast && <div className="fixed bottom-8 left-1/2 -translate-x-1/2 text-white text-sm px-4 py-2.5 rounded shadow-lg z-30" style={{ background: "#2F7D5E" }}>{toast}</div>}
    </Layout>
  );
}
