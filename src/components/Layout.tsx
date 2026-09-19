import React, { useState } from "react";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";

export default function Layout({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div className="w-full min-h-screen flex flex-col bg-[#F5F6F8]">
      <div style={{ height: 6, background: "#1E4D8C" }} />
      <div className="flex-1 flex min-h-0">
        <Sidebar open={open} onClose={() => setOpen(false)} />
        <div className="flex-1 flex flex-col min-w-0">
          <Topbar title={title} subtitle={subtitle} onMenu={() => setOpen(true)} />
          <div className="flex-1 overflow-auto">{children}</div>
        </div>
      </div>
      <div style={{ height: 6, background: "#A30D0A" }} />
    </div>
  );
}
