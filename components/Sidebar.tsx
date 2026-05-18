'use client';

import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { canOrganizeEvents } from '@/lib/dc-events';
import {
  type DcNotification,
  NOTIFICATIONS_UPDATED_EVENT,
  readNotifications,
} from '@/lib/notifications';

const AVATAR =
  'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=128&h=128&fit=crop&crop=faces';

export function Sidebar() {
  const pathname = usePathname();
  const [canCreateEvents, setCanCreateEvents] = useState(false);
  const [notifications, setNotifications] = useState<DcNotification[]>([]);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [userName, setUserName] = useState('User Name');

  useEffect(() => {
    const refreshAccess = () => setCanCreateEvents(canOrganizeEvents());
    const refreshNotifications = () => setNotifications(readNotifications());
    const refreshUserName = () => {
      const firstName = window.localStorage.getItem('dcspaceFirstName')?.trim();
      const lastName = window.localStorage.getItem('dcspaceLastName')?.trim();
      const fullName = [firstName, lastName].filter(Boolean).join(' ');

      setUserName(fullName || 'User Name');
    };

    refreshAccess();
    refreshNotifications();
    refreshUserName();
    window.addEventListener('pageshow', refreshAccess);
    window.addEventListener('pageshow', refreshNotifications);
    window.addEventListener('pageshow', refreshUserName);
    window.addEventListener('storage', refreshAccess);
    window.addEventListener('storage', refreshNotifications);
    window.addEventListener('storage', refreshUserName);
    window.addEventListener(NOTIFICATIONS_UPDATED_EVENT, refreshNotifications);

    return () => {
      window.removeEventListener('pageshow', refreshAccess);
      window.removeEventListener('pageshow', refreshNotifications);
      window.removeEventListener('pageshow', refreshUserName);
      window.removeEventListener('storage', refreshAccess);
      window.removeEventListener('storage', refreshNotifications);
      window.removeEventListener('storage', refreshUserName);
      window.removeEventListener(NOTIFICATIONS_UPDATED_EVENT, refreshNotifications);
    };
  }, []);

  const hasUnreadNotifications = notifications.some((notification) => !notification.isRead);
  const pageTitle =
    pathname === '/home'
      ? 'Home'
      : pathname === '/dashboard'
        ? 'Dashboard'
        : pathname.includes('/events-organized') || pathname.includes('/organize') || pathname.includes('/organized-event')
          ? 'Events Organized'
          : pathname.includes('/attendance')
            ? 'Attendance'
            : pathname.includes('/certificates')
              ? 'Certificates'
              : pathname.includes('/events')
                ? 'My Saved Events'
                : pathname.includes('/notifications')
                  ? 'Notifications'
                  : pathname.includes('/my-profile')
                    ? 'Profile'
                    : 'Home';
  const navItems = [
    { href: '/home', label: 'Home', icon: '/svg icons navbar/Home.svg' },
    { href: '/dashboard', label: 'Dashboard', icon: '/svg icons navbar/Layout.svg' },
    ...(canCreateEvents
      ? [{ href: '/events-organized', label: 'Events Organized', icon: '/svg icons navbar/list-stars.svg' }]
      : []),
    { href: '/events', label: 'Saved Events', icon: '/svg icons navbar/Bookmark.svg' },
    { href: '/attendance', label: 'Attendance', icon: '/svg icons navbar/Users.svg' },
    { href: '/certificates', label: 'Certificates', icon: '/svg icons navbar/certficate-icon.svg' },
  ];

  return (
    <>
      <aside className={`sidebar${isCollapsed ? ' sidebar--collapsed' : ''}`} aria-label="Primary navigation">
        <div className="sidebar__brand">
          <button
            className="sidebar__logo-button"
            type="button"
            aria-label={isCollapsed ? 'Open sidebar' : 'DC Space'}
            onClick={() => isCollapsed && setIsCollapsed(false)}
          >
            <Image className="sidebar__logo" src="/dcspace-logo-circle.png" width={58} height={58} alt="" priority />
            <Image className="sidebar__open-icon" src="/svg icons navbar/open-sidebar-icon.svg" width={18} height={18} alt="" />
          </button>
          <strong className="sidebar__brand-name">DC SPACE</strong>
          <button className="sidebar__toggle" type="button" aria-label="Close sidebar" onClick={() => setIsCollapsed(true)}>
            <Image src="/svg icons navbar/close-sidebar-icon.svg" width={16} height={16} alt="" />
          </button>
        </div>

        <nav className="sidebar__nav">
          {navItems.map((item) => {
            const active = pathname === item.href || pathname.startsWith(`${item.href}/`);

            return (
              <Link className={`sidebar__link${active ? ' is-active' : ''}`} href={item.href} aria-current={active ? 'page' : undefined} key={item.label}>
                <Image className="sidebar__icon" src={item.icon} width={22} height={22} alt="" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <Link className="sidebar__logout" href="/login">
          <Image src="/svg icons navbar/logout-icon.svg" width={18} height={18} alt="" />
          <span>Log out</span>
        </Link>
      </aside>

      <header className="topbar" aria-label="Page header">
        <h1>{pageTitle}</h1>
        <div className="topbar__right">
          <Link className="topbar__account" href="/my-profile">
            {userName}
          </Link>
          <Link className="topbar__avatar-link" href="/my-profile" aria-label="Open profile">
            <Image className="topbar__avatar" src={AVATAR} width={44} height={44} alt="Profile" />
          </Link>
          <Link
            className={`topbar__icon-button topbar__notification-button${pathname === '/notifications' ? ' is-active' : ''}`}
            href="/notifications"
            aria-label="Notifications"
          >
            <Image src="/assets/notif-icon.svg" width={24} height={24} alt="" />
            {hasUnreadNotifications && <span className="topbar__notification-dot" aria-hidden="true" />}
          </Link>
          <button className="topbar__help" type="button" aria-label="Help">
            ?
          </button>
        </div>
      </header>
    </>
  );
}
