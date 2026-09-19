import React, { useState } from "react";
import { X } from "lucide-react";
import Layout from "../components/Layout";

const ITEMS = ["Préstamos", "Vencidos", "Devoluciones", "Inventario", "Historial por documento", "Historial por solicitante"];

export default function Reportes() {
  const [preview, setPreview] = useState<string | null>(null);
  return (
    <Layout title="Reportes" subtitle="Consolidados e historial">
      <div className="p-6 space-y-4">
        <p className="text-sm text-[#6B7386]">Filtra por fecha, auditoría, documento, solicitante o estado, y exporta el resultado.</p>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {ITEMS.map((r) => (
            <button key={r} onClick={() => setPreview(r)} className="text-left bg-white border border-[#E3E6EC] rounded-md p-4 hover:shadow-sm transition-all">
              <div className="text-sm text-[#172033] font-medium">{r}</div>
              <div className="text-xs text-[#8D97AE] mt-1">Ver y exportar</div>
            </button>
          ))}
        </div>
      </div>
      {preview && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-20 p-4">
          <div className="bg-white rounded-md w-full max-w-sm border border-[#E3E6EC]">
            <div className="flex items-center justify-between px-5 py-4 border-b border-[#E3E6EC]"><div className="font-serif text-lg text-[#172033]">Reporte de {preview}</div><button onClick={() => setPreview(null)} className="text-[#8D97AE]"><X size={18} /></button></div>
            <div className="px-5 py-4 text-sm text-[#3A4256] space-y-2">
              <p>Esta es la primera versión funcional. Los filtros por fecha, auditoría, documento, solicitante y estado, junto con la exportación a PDF/Excel, se agregan sobre esta misma base consultando las tablas de Supabase.</p>
            </div>
            <div className="flex justify-end px-5 py-4 border-t border-[#E3E6EC]"><button onClick={() => setPreview(null)} className="text-white rounded px-4 py-2 text-sm font-medium" style={{ background: "#1E4D8C" }}>Entendido</button></div>
          </div>
        </div>
      )}
    </Layout>
  );
}
