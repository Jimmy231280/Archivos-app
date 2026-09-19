import React from "react";
import { NavLink } from "react-router-dom";
import {
  Home, LayoutDashboard, Archive, ClipboardList, Undo2, AlarmClock, BarChart3, Users, LogOut, X,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";

const NAV = [
  { to: "/inicio", label: "Inicio", icon: Home, roles: ["admin", "consulta"] },
  { to: "/dashboard", label: "Tablero", icon: LayoutDashboard, roles: ["admin", "consulta"] },
  { to: "/inventario", label: "Inventario", icon: Archive, roles: ["admin", "consulta"] },
  { to: "/prestamos", label: "Préstamos", icon: ClipboardList, roles: ["admin"] },
  { to: "/devoluciones", label: "Devoluciones", icon: Undo2, roles: ["admin"] },
  { to: "/vencimientos", label: "Vencimientos", icon: AlarmClock, roles: ["admin"] },
  { to: "/reportes", label: "Reportes", icon: BarChart3, roles: ["admin"] },
  { to: "/usuarios", label: "Usuarios", icon: Users, roles: ["admin"] },
];

export default function Sidebar({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { profile, signOut } = useAuth();
  const role = profile?.role || "consulta";
  const items = NAV.filter((n) => n.roles.includes(role));

  return (
    <>
      {open && <div className="fixed inset-0 bg-black/30 z-30 md:hidden" onClick={onClose} />}
      <aside
        className={`fixed md:static inset-y-0 left-0 z-40 w-64 flex flex-col text-[#CBD3E1] transform transition-transform duration-200
        ${open ? "translate-x-0" : "-translate-x-full"} md:translate-x-0`}
        style={{ background: "linear-gradient(190deg, #1E4D8C 0%, #16233B 45%, #172033 100%)" }}
      >
        <div className="px-5 py-6 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-full bg-white p-0.5 flex items-center justify-center shrink-0">
              <div
                className="w-full h-full rounded-full flex items-center justify-center"
                style={{ background: "linear-gradient(160deg, #A30D0A 0%, #6E0A08 100%)" }}
              >
                <span className="text-white font-bold text-[10px] tracking-tight">UAGRM</span>
              </div>
            </div>
            <div className="font-serif text-sm leading-tight text-white">
              Unidad de<br />Auditoría Interna
            </div>
          </div>
          <button className="md:hidden text-white/70" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <nav className="flex-1 py-3 overflow-y-auto">
          {items.map((n) => {
            const Icon = n.icon;
            return (
              <NavLink
                key={n.to}
                to={n.to}
                onClick={onClose}
                className={({ isActive }) =>
                  `w-full flex items-center gap-3 px-5 py-2.5 text-sm transition-colors border-l-2 ${
                    isActive ? "bg-white/15 text-white border-white" : "border-transparent text-[#CBD3E1] hover:bg-white/10 hover:text-white"
                  }`
                }
              >
                <Icon size={16} strokeWidth={1.8} />
                {n.label}
              </NavLink>
            );
          })}
        </nav>

        <div className="px-5 py-4 border-t border-white/10">
          <button onClick={signOut} className="flex items-center gap-2 text-sm text-[#B9C3D6] hover:text-white">
            <LogOut size={15} /> Cerrar sesión
          </button>
        </div>
      </aside>
    </>
  );
}
