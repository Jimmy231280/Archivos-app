import React from "react";

const STYLES: Record<string, { bg: string; fg: string; label: string }> = {
  vigente: { bg: "#EAF4EE", fg: "#2F7D5E", label: "Vigente" },
  proximo: { bg: "#FBF1E1", fg: "#B8791F", label: "Próximo a vencer" },
  vencido: { bg: "#FBEAE6", fg: "#B8412F", label: "Vencido" },
  devuelto: { bg: "#EEF0F3", fg: "#667085", label: "Devuelto" },
  disponible: { bg: "#EAF4EE", fg: "#2F7D5E", label: "Disponible" },
  prestado: { bg: "#FBF1E1", fg: "#B8791F", label: "Prestado" },
  pendiente: { bg: "#E9EFF8", fg: "#1E4D8C", label: "Pendiente" },
};

export default function Badge({ status }: { status: string }) {
  const s = STYLES[status] || STYLES.devuelto;
  return (
    <span
      style={{ background: s.bg, color: s.fg }}
      className="inline-flex items-center rounded px-2 py-0.5 text-xs font-medium"
    >
      {s.label}
    </span>
  );
}
