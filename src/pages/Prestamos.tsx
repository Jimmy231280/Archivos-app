import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus } from "lucide-react";
import Layout from "../components/Layout";
import Badge from "../components/Badge";
import { supabase } from "../lib/supabase";
import { clasificarPrestamo, type Prestamo } from "../types";

export default function Prestamos() {
  const [prestamos, setPrestamos] = useState<Prestamo[]>([]);
  const navigate = useNavigate();

  const cargar = async () => {
    const { data } = await supabase.from("prestamos").select("*, documentos(*)").order("created_at", { ascending: false });
    setPrestamos((data as Prestamo[]) || []);
  };
  useEffect(() => { cargar(); }, []);

  return (
    <Layout title="Préstamos" subtitle="Registro y seguimiento">
      <div className="p-6 space-y-4">
        <div className="flex justify-between items-center">
          <p className="text-sm text-[#6B7386]">Historial completo de préstamos registrados.</p>
          <button onClick={() => navigate("/prestamos/nuevo")} className="flex items-center gap-1.5 text-white rounded px-3.5 py-2 text-sm font-medium" style={{ background: "#1E4D8C" }}>
            <Plus size={15} /> Nuevo préstamo
          </button>
        </div>
        <div className="bg-white border border-[#E3E6EC] rounded-md overflow-x-auto">
          <table className="w-full text-sm min-w-[700px]">
            <thead><tr className="text-left text-[#8D97AE] border-b border-[#EDEFF3]"><th className="px-5 py-2 font-normal">Documento</th><th className="px-5 py-2 font-normal">Solicitante</th><th className="px-5 py-2 font-normal">Préstamo</th><th className="px-5 py-2 font-normal">Fecha límite</th><th className="px-5 py-2 font-normal">Estado</th></tr></thead>
            <tbody>
              {prestamos.map((p) => {
                const c = clasificarPrestamo(p);
                return (
                  <tr key={p.id} className="border-b border-[#F2F3F6] last:border-0">
                    <td className="px-5 py-2.5 text-[#172033]">{p.documentos?.codigo_documento}</td>
                    <td className="px-5 py-2.5 text-[#3A4256]">{p.solicitante_nombre}</td>
                    <td className="px-5 py-2.5 text-[#6B7386]">{new Date(p.fecha_prestamo).toLocaleString("es-BO")}</td>
                    <td className="px-5 py-2.5 text-[#6B7386]">{new Date(p.fecha_limite).toLocaleString("es-BO")}</td>
                    <td className="px-5 py-2.5"><Badge status={c.estado} /></td>
                  </tr>
                );
              })}
              {prestamos.length === 0 && <tr><td colSpan={5} className="px-5 py-8 text-center text-[#8D97AE]">Aún no hay préstamos registrados.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </Layout>
  );
}
