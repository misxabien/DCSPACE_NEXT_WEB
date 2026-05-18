"use client";

import Image from "next/image";
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
  const [profileOpen, setProfileOpen] = useState(false);

  const closeSidebar = useCallback(() => {
    setMobileSidebarOpen(false);
  }, []);

  const closeMenus = useCallback(() => {
    setNotifOpen(false);
    setProfileOpen(false);
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

          <label className="admin-search" aria-label="Search admin">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2" />
              <path d="M20 20l-3-3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
            <input type="search" placeholder="Search users, events, certificates…" />
          </label>

          <div className="admin-topbar__right" id="adminTopRight">
            <button
              className="admin-icon-btn"
              type="button"
              aria-label="Notifications"
              onClick={(e) => {
                e.stopPropagation();
                setProfileOpen(false);
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
            <button
              className="admin-avatar"
              type="button"
              aria-label="Profile menu"
              onClick={(e) => {
                e.stopPropagation();
                setNotifOpen(false);
                setProfileOpen((v) => !v);
              }}
            >
              AD
            </button>

            <div className={`admin-menu-pop${notifOpen ? " open" : ""}`} id="notifMenu">
              <button type="button">2 new registrations waiting approval</button>
              <button type="button">Event conflict detected on April 25</button>
              <button type="button">Certificate batch export finished</button>
            </div>

            <div className={`admin-menu-pop${profileOpen ? " open" : ""}`} id="profileMenu">
              <a href="#">My Profile</a>
              <a href="#">Account Settings</a>
              <button
                type="button"
                id="logoutBtn"
                onClick={() => {
                  showStatus("Logged out");
                  closeMenus();
                }}
              >
                Log Out
              </button>
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
