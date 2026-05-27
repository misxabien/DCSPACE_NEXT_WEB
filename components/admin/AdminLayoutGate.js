"use client";

import { usePathname } from "next/navigation";
import { AdminShell } from "./AdminShell";

const BARE_ADMIN_PATHS = ["/admin/login"];

function isBareAdminPath(pathname) {
  if (!pathname) return false;
  return BARE_ADMIN_PATHS.some((path) => pathname === path || pathname.startsWith(`${path}/`));
}

export function AdminLayoutGate({ children }) {
  const pathname = usePathname();

  if (isBareAdminPath(pathname)) {
    return children;
  }

  return <AdminShell>{children}</AdminShell>;
}
