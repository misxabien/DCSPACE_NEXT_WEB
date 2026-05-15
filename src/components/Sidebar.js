"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV = [
  { href: "/", label: "Dashboard", icon: "⌂" },
  { href: "/users", label: "Users Management", icon: "👥" },
  { href: "/events", label: "Events", icon: "🗓" },
  { href: "/ecert", label: "E-Certificate & Attendance", icon: "🎓" },
  { href: "/feedback", label: "Feedback", icon: "💬" },
];

export function Sidebar({ onNavigate }) {
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
