"use client";

import { useState } from "react";
import { Sidebar } from "@/components/Sidebar";

export function AppShell({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className={`app${collapsed ? " is-sidebar-collapsed" : ""}`}>
      <Sidebar collapsed={collapsed} onToggleSidebar={() => setCollapsed((c) => !c)} />
      <main className="main">{children}</main>
    </div>
  );
}
