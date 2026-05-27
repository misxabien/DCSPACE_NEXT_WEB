"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useState, useSyncExternalStore } from "react";
import { AdminSidebar } from "./AdminSidebar";
import { ShowStatusProvider, useShowStatus } from "@/contexts/ShowStatusContext";

function useIsNarrow(breakpoint = 960) {
  const subscribe = useCallback(
    (onChange) => {
      window.addEventListener("resize", onChange);
      const mq = window.matchMedia(`(max-width: ${breakpoint}px)`);
      mq.addEventListener("change", onChange);
      return () => {
        window.removeEventListener("resize", onChange);
        mq.removeEventListener("change", onChange);
      };
    },
    [breakpoint],
  );
  const getSnapshot = useCallback(() => window.innerWidth <= breakpoint, [breakpoint]);
  return useSyncExternalStore(subscribe, getSnapshot, () => false);
}

function AdminChrome({ children }) {
  const pathname = usePathname();
  const isTapKiosk = pathname === "/admin/tap" || pathname?.startsWith("/admin/tap/");
  const showStatus = useShowStatus();
  const isNarrow = useIsNarrow();
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [desktopSidebarCollapsed, setDesktopSidebarCollapsed] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const notifications = [
    {
      id: "reg-approval",
      text: "New event registration approval",
      isNew: true,
      time: "3 min ago",
    },
    {
      id: "event-conflict",
      text: "New event registration approval",
      isNew: true,
      time: "5 min ago",
    },
    {
      id: "batch-export",
      text: "Certificates ready to export",
      isNew: false,
      time: "Yesterday",
    },
  ];

  const closeSidebar = useCallback(() => {
    setMobileSidebarOpen(false);
  }, []);

  const closeMenus = useCallback(() => {
    setNotifOpen(false);
  }, []);

  useEffect(() => {
    function onKey(e) {
      if (e.key !== "Escape") return;
      closeMenus();
      closeSidebar();
      if (!isNarrow && desktopSidebarCollapsed) {
        setDesktopSidebarCollapsed(false);
      }
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [closeMenus, closeSidebar, desktopSidebarCollapsed, isNarrow]);

  useEffect(() => {
    function onDocClick(e) {
      if (!e.target.closest("#adminTopRight")) closeMenus();
    }
    document.addEventListener("click", onDocClick);
    return () => document.removeEventListener("click", onDocClick);
  }, [closeMenus]);

  function onMenuClick() {
    if (isNarrow) {
      setMobileSidebarOpen((o) => !o);
    } else {
      setDesktopSidebarCollapsed((c) => !c);
    }
  }

  const menuAriaExpanded = isNarrow ? mobileSidebarOpen : !desktopSidebarCollapsed;
  const backdropShow = isNarrow && mobileSidebarOpen;

  return (
    <div
      className={[
        "admin-app",
        isTapKiosk ? "admin-app--tap-mode" : "",
        !isNarrow && desktopSidebarCollapsed ? "sidebar-closed" : "",
      ]
        .filter(Boolean)
        .join(" ")}
      id="adminApp"
    >
      {!isTapKiosk && (
      <aside
        className={["admin-sidebar", isNarrow && mobileSidebarOpen ? "open" : ""]
          .filter(Boolean)
          .join(" ")}
        id="adminSidebar"
      >
        <div className="admin-brand">
          <span className="admin-brand__logo" aria-hidden="true">
            <Image src="/dcspace-logo-circle.png" width={40} height={40} alt="" />
          </span>
          <div className="admin-brand__text">
            <strong>DC Space</strong>
            <span>Admin Console</span>
          </div>
        </div>
        <AdminSidebar
          onNavigate={(label) => {
            showStatus(`${label} opened`);
            if (isNarrow) closeSidebar();
          }}
        />
      </aside>
      )}

      <div className="admin-shell">
        {!isTapKiosk && (
        <header className="admin-topbar">
          <div className="admin-topbar__left">
            <button
              className="admin-icon-btn"
              id="menuBtn"
              type="button"
              aria-label="Toggle sidebar"
              aria-expanded={menuAriaExpanded}
              aria-controls="adminSidebar"
              onClick={onMenuClick}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="M4 7h16M4 12h16M4 17h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </button>
            <div className="admin-hello">
              <strong>Hello, Admin</strong>
              <span>Overview &amp; management</span>
            </div>
          </div>

          <div className="admin-topbar__right" id="adminTopRight">
            <button
              className="admin-icon-btn"
              type="button"
              aria-label="Notifications"
              onClick={(e) => {
                e.stopPropagation();
                setNotifOpen((v) => !v);
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path
                  d="M18 9.75A6 6 0 0 0 6 9.75v3.12l-1.35 2.7a.75.75 0 0 0 .67 1.08h13.36a.75.75 0 0 0 .67-1.08L18 12.87V9.75Z"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
            <Link
              href="/admin/profile"
              className="admin-avatar"
              aria-label="My profile"
              onClick={() => setNotifOpen(false)}
            >
              AD
            </Link>

            <div className={`admin-menu-pop admin-menu-pop--notif${notifOpen ? " open" : ""}`} id="notifMenu">
              <div className="notif-menu__head">
                <strong>Notifications</strong>
              </div>
              <div className="notif-menu__list">
                {notifications.map((item) => (
                  <button key={item.id} className="notif-item" type="button">
                    <span
                      className={`notif-dot${item.isNew ? " is-new" : " is-old"}`}
                      aria-label={item.isNew ? "New notification" : "Yesterday notification"}
                    />
                    <span className="notif-item__text">{item.text}</span>
                    <span className="notif-item__status">{item.isNew ? "New" : "Yesterday"}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </header>
        )}

        <main className="admin-main">{children}</main>
      </div>

      {!isTapKiosk && (
      <div
        className={`admin-backdrop${backdropShow ? " show" : ""}`}
        id="backdrop"
        onClick={closeSidebar}
        aria-hidden="true"
      />
      )}
    </div>
  );
}

export function AdminShell({ children }) {
  return (
    <ShowStatusProvider>
      <AdminChrome>{children}</AdminChrome>
    </ShowStatusProvider>
  );
}
