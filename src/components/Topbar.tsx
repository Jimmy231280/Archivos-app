import React from "react";
import { Menu, UserCircle2 } from "lucide-react";
import { useAuth } from "../context/AuthContext";

const ROLE_LABELS: Record<string, string> = { admin: "Administrador", consulta: "Auditor" };

export default function Topbar({ title, subtitle, onMenu }: { title: string; subtitle?: string; onMenu: () => void }) {
  const { profile } = useAuth();
  return (
    <div className="flex items-center justify-between border-b border-[#E3E6EC] bg-white px-4 md:px-6 py-4">
      <div className="flex items-center gap-3">
        <button className="md:hidden text-[#3A4256]" onClick={onMenu}>
          <Menu size={22} />
        </button>
        <div>
          <h1 className="font-serif text-xl md:text-2xl text-[#172033] leading-tight">{title}</h1>
          {subtitle && <p className="text-xs md:text-sm text-[#6B7386] mt-0.5">{subtitle}</p>}
        </div>
      </div>
      <div className="flex items-center gap-2 text-sm text-[#3A4256]">
        <UserCircle2 size={22} strokeWidth={1.5} className="text-[#5B8FC7]" />
        <div className="text-right leading-tight hidden sm:block">
          <div className="font-medium">{profile ? `${profile.nombres ?? ""} ${profile.apellidos ?? ""}`.trim() : ""}</div>
          <div className="text-xs text-[#8D97AE]">{profile ? ROLE_LABELS[profile.role] : ""}</div>
        </div>
      </div>
    </div>
  );
}
