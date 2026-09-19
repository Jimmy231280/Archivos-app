import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Archive, ClipboardList, AlarmClock, LayoutDashboard, BarChart3, Users, ChevronRight } from "lucide-react";
import Layout from "../components/Layout";
import { useAuth } from "../context/AuthContext";
import { supabase } from "../lib/supabase";

const CARDS: Record<string, { title: string; desc: string; icon: any; color: string; roles: string[] }> = {
  inventario: { title: "Inventario", desc: "Busca auditorías y documentos, y consulta su disponibilidad.", icon: Archive, color: "#1E4D8C", roles: ["admin", "consulta"] },
  prestamos: { title: "Préstamos", desc: "Registra un nuevo préstamo de documento.", icon: ClipboardList, color: "#2F7D5E", roles: ["admin"] },
  vencimientos: { title: "Vencimientos", desc: "Revisa préstamos próximos a vencer o vencidos.", icon: AlarmClock, color: "#B8791F", roles: ["admin"] },
  dashboard: { title: "Tablero", desc: "Panorama general del inventario y préstamos.", icon: LayoutDashboard, color: "#A30D0A", roles: ["admin", "consulta"] },
  reportes: { title: "Reportes", desc: "Consolidados históricos e informes.", icon: BarChart3, color: "#5B4B8A", roles: ["admin"] },
  usuarios: { title: "Usuarios", desc: "Administra accesos y roles del sistema.", icon: Users, color: "#3A4256", roles: ["admin"] },
};

export default function Inicio() {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [disponibles, setDisponibles] = useState(0);
  const [activos, setActivos] = useState(0);

  useEffect(() => {
    (async () => {
      const { count: cDisp } = await supabase.from("documentos").select("*", { count: "exact", head: true }).eq("estado", "disponible");
      setDisponibles(cDisp || 0);
      const { count: cAct } = await supabase.from("prestamos").select("*", { count: "exact", head: true }).eq("estado", "prestado");
      setActivos(cAct || 0);
    })();
  }, []);

  const role = profile?.role || "consulta";
  const cardKeys = Object.keys(CARDS).filter((k) => CARDS[k].roles.includes(role));
  const nombre = profile?.nombres || "";

  return (
    <Layout title="Inicio">
      <div className="px-6 md:px-8 py-10 flex items-center gap-6 flex-wrap" style={{ background: "linear-gradient(120deg, #1E4D8C 0%, #2C6BB5 55%, #A30D0A 130%)" }}>
        <div>
          <p className="text-sm text-white/80 mb-1">Unidad de Auditoría Interna</p>
          <h1 className="font-serif text-3xl text-white leading-tight">Hola, {nombre || "bienvenido"} 👋</h1>
          <p className="text-sm text-white/85 mt-2 max-w-md">
            {role === "admin"
              ? "Gestiona el inventario, los préstamos y los vencimientos de documentos de auditoría desde un solo lugar."
              : "Consulta el inventario y solicita los documentos que necesites al encargado de archivos de la UAI."}
          </p>
          <div className="flex gap-6 mt-6 text-white">
            <div><div className="font-serif text-2xl">{disponibles}</div><div className="text-xs text-white/75">Documentos disponibles</div></div>
            <div><div className="font-serif text-2xl">{activos}</div><div className="text-xs text-white/75">Préstamos activos</div></div>
          </div>
        </div>
      </div>
      <div className="p-6">
        <div className="text-sm text-[#6B7386] mb-3">¿Qué necesitas hacer hoy?</div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {cardKeys.map((key) => {
            const c = CARDS[key];
            const Icon = c.icon;
            return (
              <button key={key} onClick={() => navigate(`/${key}`)} className="text-left bg-white border border-[#E3E6EC] rounded-lg p-5 hover:shadow-md hover:-translate-y-0.5 transition-all">
                <div className="w-10 h-10 rounded-md flex items-center justify-center mb-3" style={{ background: `${c.color}1A` }}>
                  <Icon size={19} style={{ color: c.color }} />
                </div>
                <div className="flex items-center justify-between">
                  <div className="font-serif text-base text-[#172033]">{c.title}</div>
                  <ChevronRight size={16} className="text-[#8D97AE]" />
                </div>
                <div className="text-xs text-[#6B7386] mt-1">{c.desc}</div>
              </button>
            );
          })}
        </div>
      </div>
    </Layout>
  );
}
