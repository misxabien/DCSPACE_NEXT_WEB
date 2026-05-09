"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { canOrganizeEvents } from "@/lib/dc-events";
import { NAV_ITEMS } from "@/lib/nav";

const AVATAR =
  "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=128&h=128&fit=crop&crop=faces";

export function Sidebar() {
  const pathname = usePathname();
  const [canCreateEvents, setCanCreateEvents] = useState(false);

  useEffect(() => {
    const refreshAccess = () => setCanCreateEvents(canOrganizeEvents());

    refreshAccess();
    window.addEventListener("pageshow", refreshAccess);
    window.addEventListener("storage", refreshAccess);

    return () => {
      window.removeEventListener("pageshow", refreshAccess);
      window.removeEventListener("storage", refreshAccess);
    };
  }, []);

  return (
    <header className="topbar" aria-label="Primary navigation">
      <Link className="topbar__brand" href="/dashboard" aria-label="DC Space dashboard">
        <span className="topbar__logo" aria-hidden="true">
          Logo
        </span>
        <span className="topbar__brand-name">DC Space</span>
      </Link>

      <nav className="topbar__nav" aria-label="Main navigation">
        <ul className="topbar__links">
          {NAV_ITEMS.map((item) => {
            const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
            const isCreate = "kind" in item && item.kind === "create";

            if (isCreate && !canCreateEvents) {
              return null;
            }

            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={`${isCreate ? "topbar__add" : "topbar__link"}${active ? " is-active" : ""}`}
                  aria-current={active ? "page" : undefined}
                  aria-label={isCreate ? "Organize an event" : undefined}
                >
                  {isCreate ? "+" : item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="topbar__right">
        <button className="topbar__icon-button" type="button" aria-label="Notifications">
          <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path
              d="M18 9.75C18 6.436 15.314 3.75 12 3.75S6 6.436 6 9.75v3.12l-1.35 2.7A.75.75 0 0 0 5.32 16.65h13.36a.75.75 0 0 0 .67-1.08L18 12.87V9.75Z"
              stroke="currentColor"
              strokeWidth="1.7"
              strokeLinejoin="round"
            />
            <path d="M9.75 18.25a2.25 2.25 0 0 0 4.5 0" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
            <path d="M18.9 4.35h.01" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
          </svg>
        </button>
        <button className="topbar__icon-button" type="button" aria-label="Help">
          <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <circle cx="12" cy="12" r="8" stroke="currentColor" strokeWidth="1.7" />
            <path d="M9.9 9.55a2.15 2.15 0 1 1 3.53 1.65c-.88.7-1.43 1.17-1.43 2.05" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
            <path d="M12 16.55h.01" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
          </svg>
        </button>
        <Link className="topbar__account" href="/my-profile">
          Account
        </Link>
        <Link className="topbar__avatar-link" href="/my-profile" aria-label="Open profile">
          <Image className="topbar__avatar" src={AVATAR} width={44} height={44} alt="Profile" />
        </Link>
      </div>
    </header>
  );
}
