import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { CheckCircle2, ClipboardList, Clock3, AlertTriangle, Inbox, Info } from "lucide-react";
import Layout from "../components/Layout";
import Badge from "../components/Badge";
import { useAuth } from "../context/AuthContext";
import { supabase } from "../lib/supabase";
import { clasificarPrestamo, type Documento, type Prestamo, type Solicitud } from "../types";

function StatTile({ label, value, color, icon: Icon }: { label: string; value: number; color: string; icon: any }) {
  return (
    <div className="rounded-lg p-4 text-white flex items-center justify-between" style={{ background: color }}>
      <div><div className="text-xs opacity-85">{label}</div><div className="font-serif text-2xl leading-tight">{value}</div></div>
      <Icon size={26} className="opacity-80" />
    </div>
  );
}

export default function Dashboard() {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [documentos, setDocumentos] = useState<Documento[]>([]);
  const [prestamos, setPrestamos] = useState<Prestamo[]>([]);
  const [solicitudes, setSolicitudes] = useState<Solicitud[]>([]);
  const [filtro, setFiltro] = useState("todos");

  const cargar = async () => {
    const { data: docs } = await supabase.from("documentos").select("*");
    setDocumentos((docs as Documento[]) || []);
    const { data: prest } = await supabase.from("prestamos").select("*, documentos(*)").order("created_at", { ascending: false });
    setPrestamos((prest as Prestamo[]) || []);
    if (profile?.role === "admin") {
      const { data: sol } = await supabase
        .from("solicitudes")
        .select("*, documentos(*), profiles(*)")
        .eq("estado", "pendiente")
        .order("created_at", { ascending: false });
      setSolicitudes((sol as Solicitud[]) || []);
    }
  };

  useEffect(() => {
    cargar();
  }, [profile?.role]);

  const disponibles = documentos.filter((d) => d.estado === "disponible").length;
  const prestados = documentos.filter((d) => d.estado === "prestado").length;
  const clasificados = prestamos.map((p) => ({ p, c: clasificarPrestamo(p) }));
  const vencidos = clasificados.filter((x) => x.c.estado === "vencido").length;
  const proximos = clasificados.filter((x) => x.c.estado === "proximo").length;

  const filtros = [
    { key: "todos", label: "Todos" }, { key: "vigente", label: "Vigentes" },
    { key: "proximo", label: "Próximos" }, { key: "vencido", label: "Vencidos" }, { key: "devuelto", label: "Devueltos" },
  ];
  const lista = clasificados.filter((x) => filtro === "todos" || x.c.estado === filtro);

  const irARegistrar = (s: Solicitud) => {
    navigate("/prestamos/nuevo", { state: { documentoId: s.documento_id, nombre: s.profiles ? `${s.profiles.nombres ?? ""} ${s.profiles.apellidos ?? ""}`.trim() : "", telefono: s.profiles?.phone || "", solicitudId: s.id } });
  };

  return (
    <Layout title="Tablero" subtitle="Resumen general del sistema">
      <div className="p-6 space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <StatTile label="Disponibles" value={disponibles} color="#2F7D5E" icon={CheckCircle2} />
          <StatTile label="Prestados" value={prestados} color="#1E4D8C" icon={ClipboardList} />
          <StatTile label="Próximos a vencer" value={proximos} color="#B8791F" icon={Clock3} />
          <StatTile label="Vencidos" value={vencidos} color="#A30D0A" icon={AlertTriangle} />
        </div>

        {profile?.role === "admin" && solicitudes.length > 0 && (
          <div className="bg-white border border-[#E3E6EC] rounded-lg">
            <div className="px-5 py-3 border-b border-[#E3E6EC] flex items-center gap-2 font-serif text-base text-[#172033]">
              <Inbox size={16} style={{ color: "#1E4D8C" }} /> Solicitudes de documentos
            </div>
            <div className="px-5 pt-3 text-xs text-[#8D97AE] flex items-start gap-1.5">
              <Info size={13} className="mt-0.5 shrink-0" /> "Registrar préstamo" abre el formulario con el documento y el solicitante ya cargados.
            </div>
            <div className="divide-y divide-[#F2F3F6] mt-2">
              {solicitudes.map((s) => (
                <div key={s.id} className="px-5 py-3 flex items-center justify-between text-sm flex-wrap gap-2">
                  <div>
                    <div className="text-[#172033] font-medium">{s.documentos?.codigo_documento} — {s.documentos?.nombre_documento}</div>
                    <div className="text-xs text-[#8D97AE]">Solicitado por {s.profiles ? `${s.profiles.nombres ?? ""} ${s.profiles.apellidos ?? ""}`.trim() : "—"}</div>
                  </div>
                  <button onClick={() => irARegistrar(s)} className="text-xs font-medium px-3 py-1.5 rounded text-white" style={{ background: "#1E4D8C" }}>
                    Registrar préstamo
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="bg-white border border-[#E3E6EC] rounded-lg">
          <div className="px-5 py-3 border-b border-[#E3E6EC] flex items-center justify-between flex-wrap gap-2">
            <div className="font-serif text-base text-[#172033]">Seguimiento de préstamos</div>
            <div className="flex gap-1.5 flex-wrap">
              {filtros.map((f) => (
                <button key={f.key} onClick={() => setFiltro(f.key)} className="text-xs px-2.5 py-1 rounded-full border"
                  style={filtro === f.key ? { background: "#1E4D8C", color: "white", borderColor: "#1E4D8C" } : { borderColor: "#D8DCE4", color: "#6B7386" }}>
                  {f.label}
                </button>
              ))}
            </div>
          </div>
          <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-3">
            {lista.map(({ p, c }) => (
              <div key={p.id} className="bg-white border border-[#E3E6EC] rounded-lg p-4">
                <div className="flex items-start justify-between">
                  <div className="text-sm">
                    <div className="font-medium text-[#172033]">{p.documentos?.codigo_documento} — {p.documentos?.nombre_documento}</div>
                    <div className="text-xs text-[#8D97AE]">{p.solicitante_nombre} · {p.solicitante_unidad}</div>
                  </div>
                  <Badge status={c.estado} />
                </div>
                <div className="text-xs text-[#8D97AE] mt-2">
                  {c.estado === "devuelto" ? "Devuelto" : c.diasRestantes < 0 ? `${Math.abs(c.diasRestantes)} días vencido` : `Vence en ${c.diasRestantes} días`}
                </div>
              </div>
            ))}
            {lista.length === 0 && <div className="text-sm text-[#8D97AE] py-6 text-center col-span-2">No hay préstamos en este filtro.</div>}
          </div>
        </div>
      </div>
    </Layout>
  );
}
