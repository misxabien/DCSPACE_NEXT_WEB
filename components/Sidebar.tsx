'use client';

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { canOrganizeEvents } from "@/lib/dc-events";
import { NAV_ITEMS } from "@/lib/nav";
import {
  type DcNotification,
  NOTIFICATIONS_UPDATED_EVENT,
  formatNotificationTimeAgo,
  markNotificationsAsRead,
  readNotifications,
} from "@/lib/notifications";

const AVATAR =
  'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=128&h=128&fit=crop&crop=faces';

export function Sidebar() {
  const pathname = usePathname();
  const [canCreateEvents, setCanCreateEvents] = useState(false);
  const [notifications, setNotifications] = useState<DcNotification[]>([]);

  useEffect(() => {
    const refreshAccess = () => setCanCreateEvents(canOrganizeEvents());
    const refreshNotifications = () => setNotifications(readNotifications());

    refreshAccess();
    refreshNotifications();
    window.addEventListener("pageshow", refreshAccess);
    window.addEventListener("pageshow", refreshNotifications);
    window.addEventListener("storage", refreshAccess);
    window.addEventListener("storage", refreshNotifications);
    window.addEventListener(NOTIFICATIONS_UPDATED_EVENT, refreshNotifications);

    return () => {
      window.removeEventListener("pageshow", refreshAccess);
      window.removeEventListener("pageshow", refreshNotifications);
      window.removeEventListener("storage", refreshAccess);
      window.removeEventListener("storage", refreshNotifications);
      window.removeEventListener(NOTIFICATIONS_UPDATED_EVENT, refreshNotifications);
    };
  }, []);

  const hasUnreadNotifications = notifications.some((notification) => !notification.isRead);
  const previewNotifications = notifications.slice(0, 3);

  return (
    <header className="topbar" aria-label="Primary navigation">
      <Link className="topbar__brand" href="/dashboard" aria-label="DC Space dashboard">
        <span className="topbar__logo" aria-hidden="true">
          <Image src="/dcspace-logo-circle.png" width={54} height={54} alt="" priority />
        </span>
        <span className="topbar__brand-name">DC Space</span>
      </Link>

      <nav className="topbar__nav" aria-label="Main navigation">
        <ul className="topbar__links">
          {NAV_ITEMS.map((item) => {
            const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
            const isCreate = 'kind' in item && item.kind === 'create';

            if (isCreate && !canCreateEvents) {
              return null;
            }

            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={`${isCreate ? 'topbar__add' : 'topbar__link'}${active ? ' is-active' : ''}`}
                  aria-current={active ? 'page' : undefined}
                  aria-label={isCreate ? 'Organize an event' : undefined}
                >
                  {isCreate ? '+' : item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="topbar__right">
        <div className="topbar__notification-wrap">
          <Link
            className={`topbar__icon-button topbar__notification-button${pathname === "/notifications" ? " is-active" : ""}`}
            href="/notifications"
            aria-label="Notifications"
          >
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
            {hasUnreadNotifications && <span className="topbar__notification-dot" aria-hidden="true" />}
          </Link>

          <section className="notification-popover" aria-label="Notifications preview">
            <div className="notification-popover__header">
              <h2>Notifications</h2>
              <button type="button" onClick={() => markNotificationsAsRead(notifications.map((notification) => notification.id))}>
                Mark all as read
              </button>
              <span aria-hidden="true">×</span>
            </div>

            {previewNotifications.length > 0 ? (
              <div className="notification-popover__list">
                {previewNotifications.map((notification) => (
                  <div className="notification-popover__item" key={notification.id}>
                    <span className={`notification-popover__icon notification-popover__icon--${notification.icon}`} aria-hidden="true" />
                    <div>
                      <h3>
                        {notification.title} <small>{formatNotificationTimeAgo(notification.notifiedAt)}</small>
                      </h3>
                      <p>{notification.eventName}</p>
                    </div>
                    {!notification.isRead && <span className="notification-popover__dot" aria-hidden="true" />}
                  </div>
                ))}
              </div>
            ) : (
              <div className="notification-popover__empty">
                <span className="notification-popover__icon notification-popover__icon--archive" aria-hidden="true" />
                <p>No notifications yet. Check back later for updates.</p>
              </div>
            )}
          </section>
        </div>
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
