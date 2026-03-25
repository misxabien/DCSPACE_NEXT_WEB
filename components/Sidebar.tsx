"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { NAV_ITEMS } from "@/lib/nav";

const AVATAR =
  "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=128&h=128&fit=crop&crop=faces";

export function Sidebar({
  collapsed,
  onToggleSidebar,
}: {
  collapsed: boolean;
  onToggleSidebar: () => void;
}) {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const userRootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (userRootRef.current && !userRootRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setMenuOpen(false);
    }
    document.addEventListener("click", onDocClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("click", onDocClick);
      document.removeEventListener("keydown", onKey);
    };
  }, []);

  return (
    <aside className="sidebar" aria-label="Primary">
      <div className="sidebar__top">
        <div
          className={`sidebar__user${menuOpen ? " is-open" : ""}`}
          ref={userRootRef}
        >
          <button
            type="button"
            className="sidebar__user-trigger"
            aria-expanded={menuOpen}
            aria-haspopup="true"
            aria-controls="sidebar-user-menu"
            onClick={(e) => {
              e.stopPropagation();
              setMenuOpen((o) => !o);
            }}
          >
            <Image
              className="sidebar__avatar"
              src={AVATAR}
              width={44}
              height={44}
              alt="Misxa profile photo"
            />
            <span className="sidebar__user-text">
              <span className="sidebar__hello">Hello, Misxa!</span>
              <span className="sidebar__role">Faculty</span>
            </span>
            <span className="sidebar__user-chevron" aria-hidden="true">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.25" strokeLinecap="round" strokeLinejoin="round">
                <path d="M6 9l6 6 6-6" />
              </svg>
            </span>
          </button>
          <div
            id="sidebar-user-menu"
            className="sidebar__user-panel"
            role="menu"
            hidden={!menuOpen}
          >
            <Link className="sidebar__user-link" role="menuitem" href="/my-profile" onClick={() => setMenuOpen(false)}>
              <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d="M12 12c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm0 2c-3.33 0-10 1.67-10 5v2h20v-2c0-3.33-6.67-5-10-5z" />
              </svg>
              My Profile
            </Link>
            <Link className="sidebar__user-link" role="menuitem" href="/login" onClick={() => setMenuOpen(false)}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M15 3h4a2 2 0 012 2v14a2 2 0 01-2 2h-4M10 17l5-5-5-5M4 12h11" />
              </svg>
              Log out
            </Link>
          </div>
        </div>
        <button
          type="button"
          className="sidebar__menu-btn"
          aria-label="Toggle navigation"
          aria-expanded={!collapsed}
          aria-controls="left-navigation"
          onClick={() => {
            setMenuOpen(false);
            onToggleSidebar();
          }}
        >
          <svg width="24" height="18" viewBox="0 0 24 18" fill="none" aria-hidden="true">
            <line x1="2" y1="2" x2="22" y2="2" />
            <line x1="2" y1="9" x2="22" y2="9" />
            <line x1="2" y1="16" x2="22" y2="16" />
          </svg>
        </button>
      </div>

      <nav id="left-navigation" aria-label="Main navigation">
        <ul className="nav">
          {NAV_ITEMS.map((item) => {
            const active =
              pathname === item.href ||
              (item.href !== "/dashboard" && pathname.startsWith(item.href));
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={active ? "is-active" : undefined}
                  aria-current={active ? "page" : undefined}
                >
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="sidebar__spacer" />

      <div className="sidebar__brand">
        <div className="sidebar__brand-mark" aria-hidden="true">
          <Image src="/assets/logo-dc-space.png" alt="" width={58} height={58} />
        </div>
        <span className="sidebar__brand-text">DC Space</span>
      </div>
    </aside>
  );
}
