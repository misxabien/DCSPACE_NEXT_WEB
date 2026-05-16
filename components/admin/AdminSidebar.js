"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV = [
  { href: "/admin", label: "Dashboard", icon: "⌂" },
  { href: "/admin/users", label: "Users Management", icon: "👥" },
  { href: "/admin/events", label: "Events", icon: "🗓" },
  { href: "/admin/ecert", label: "E-Certificate & Attendance", icon: "🎓" },
  { href: "/admin/feedback", label: "Feedback", icon: "💬" },
];

export function AdminSidebar({ onNavigate }) {
  const pathname = usePathname();

  return (
    <nav className="side-links" id="sideLinks">
      {NAV.map((item) => {
        const active = pathname === item.href;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`side-link${active ? " active" : ""}`}
            aria-current={active ? "page" : undefined}
            data-label={item.label}
            onClick={() => onNavigate?.(item.label)}
          >
            <span className="nav-icon" aria-hidden="true">
              {item.icon}
            </span>
            <span className="nav-text">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
