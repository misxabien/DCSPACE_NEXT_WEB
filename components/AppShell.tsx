"use client";

import { useState } from "react";
import { Sidebar } from "@/components/Sidebar";

interface AppShellProps {
  children: React.ReactNode;
}

export function AppShell({ children }: Readonly<AppShellProps>) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className={`app${collapsed ? " is-sidebar-collapsed" : ""}`}>
      <Sidebar collapsed={collapsed} onToggleSidebar={() => setCollapsed((c) => !c)} />
      <main className="main">{children}</main>
    </div>
  );
}
