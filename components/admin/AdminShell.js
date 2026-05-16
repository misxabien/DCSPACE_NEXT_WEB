"use client";

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
    [breakpoint]
  );
  const getSnapshot = useCallback(
    () => window.innerWidth <= breakpoint,
    [breakpoint]
  );
  return useSyncExternalStore(subscribe, getSnapshot, () => false);
}

function AdminChrome({ children }) {
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
      if (!e.target.closest("#topRight")) closeMenus();
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
        "app",
        !isNarrow && desktopSidebarCollapsed ? "sidebar-closed" : "",
      ]
        .filter(Boolean)
        .join(" ")}
      id="app"
    >
      <header className="topbar">
        <div className="top-left">
          <button
            className="icon-btn"
            id="menuBtn"
            type="button"
            aria-label="Toggle sidebar"
            aria-expanded={menuAriaExpanded}
            aria-controls="sidebar"
            onClick={onMenuClick}
          >
            ☰
          </button>
          <div className="hello">
            <strong>Hello, Admin!</strong>
            <span>Admin</span>
          </div>
        </div>
        <div className="top-right" id="topRight">
          <button
            className="icon-btn"
            type="button"
            aria-label="Notifications"
            onClick={(e) => {
              e.stopPropagation();
              setProfileOpen(false);
              setNotifOpen((v) => !v);
            }}
          >
            🔔
          </button>
          <button
            className="avatar"
            type="button"
            aria-label="Profile"
            onClick={(e) => {
              e.stopPropagation();
              setNotifOpen(false);
              setProfileOpen((v) => !v);
            }}
          >
            AD
          </button>

          <div className={`menu-pop${notifOpen ? " open" : ""}`} id="notifMenu">
            <button type="button">2 new registrations waiting approval</button>
            <button type="button">Event conflict detected on April 25</button>
            <button type="button">Certificate batch export finished</button>
          </div>

          <div
            className={`menu-pop${profileOpen ? " open" : ""}`}
            id="profileMenu"
            style={{ right: 0 }}
          >
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

      <div className="body">
        <aside
          className={["sidebar", isNarrow && mobileSidebarOpen ? "open" : ""]
            .filter(Boolean)
            .join(" ")}
          id="sidebar"
        >
          <AdminSidebar
            onNavigate={(label) => {
              showStatus(`${label} opened`);
              if (isNarrow) closeSidebar();
            }}
          />
        </aside>

        <main className="main">{children}</main>
      </div>

      <div
        className={`backdrop${backdropShow ? " show" : ""}`}
        id="backdrop"
        onClick={closeSidebar}
        aria-hidden="true"
      />
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
