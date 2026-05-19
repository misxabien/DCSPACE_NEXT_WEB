'use client';

import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { type CSSProperties, useEffect, useState } from 'react';
import { canOrganizeEvents } from '@/lib/dc-events';
import {
  type DcNotification,
  NOTIFICATIONS_UPDATED_EVENT,
  formatNotificationTimeAgo,
  markNotificationsAsRead,
  readNotifications,
} from '@/lib/notifications';

const AVATAR =
  'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=128&h=128&fit=crop&crop=faces';

export function Sidebar() {
  const pathname = usePathname();
  const [canCreateEvents, setCanCreateEvents] = useState(false);
  const [notifications, setNotifications] = useState<DcNotification[]>([]);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [, setTimeTick] = useState(0);
  const [userName, setUserName] = useState('User Name');
  const [profilePhotoImage, setProfilePhotoImage] = useState('');
  const [profilePhotoFit, setProfilePhotoFit] = useState({ zoom: 1, x: 0, y: 0 });

  useEffect(() => {
    const refreshAccess = () => setCanCreateEvents(canOrganizeEvents());
    const refreshNotifications = () => setNotifications(readNotifications());
    const refreshUserName = () => {
      const firstName = window.localStorage.getItem('dcspaceFirstName')?.trim();
      const lastName = window.localStorage.getItem('dcspaceLastName')?.trim();
      const fullName = [firstName, lastName].filter(Boolean).join(' ');
      const savedFit = window.localStorage.getItem('dcspaceProfilePhotoFit');

      setUserName(fullName || 'User Name');
      setProfilePhotoImage(window.localStorage.getItem('dcspaceProfilePhotoImage') || '');

      if (savedFit) {
        try {
          const parsed = JSON.parse(savedFit) as Partial<{ zoom: number; x: number; y: number }>;

          setProfilePhotoFit({
            zoom: typeof parsed.zoom === 'number' ? parsed.zoom : 1,
            x: typeof parsed.x === 'number' ? parsed.x : 0,
            y: typeof parsed.y === 'number' ? parsed.y : 0,
          });
        } catch {
          setProfilePhotoFit({ zoom: 1, x: 0, y: 0 });
        }
      } else {
        setProfilePhotoFit({ zoom: 1, x: 0, y: 0 });
      }
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
    window.addEventListener('dcspace-profile-updated', refreshUserName);

    return () => {
      window.removeEventListener('pageshow', refreshAccess);
      window.removeEventListener('pageshow', refreshNotifications);
      window.removeEventListener('pageshow', refreshUserName);
      window.removeEventListener('storage', refreshAccess);
      window.removeEventListener('storage', refreshNotifications);
      window.removeEventListener('storage', refreshUserName);
      window.removeEventListener(NOTIFICATIONS_UPDATED_EVENT, refreshNotifications);
      window.removeEventListener('dcspace-profile-updated', refreshUserName);
    };
  }, []);

  useEffect(() => {
    const timer = window.setInterval(() => setTimeTick((tick) => tick + 1), 60_000);

    return () => window.clearInterval(timer);
  }, []);

  const handleMarkAllNotificationsRead = () => {
    markNotificationsAsRead(notifications.map((notification) => notification.id));
    setNotifications(readNotifications());
  };

  const handleNotificationClick = (notificationId: string) => {
    markNotificationsAsRead([notificationId]);
    setNotifications(readNotifications());
  };

  const hasUnreadNotifications = notifications.some((notification) => !notification.isRead);
  const profilePhotoStyle = {
    transform: `translate(${profilePhotoFit.x}%, ${profilePhotoFit.y}%) scale(${profilePhotoFit.zoom})`,
  } as CSSProperties;
  const pageTitle =
    pathname === '/home'
      ? 'Home'
      : pathname === '/dashboard'
        ? 'Dashboard'
        : pathname.includes('/events-organized') || pathname.includes('/organize') || pathname.includes('/organized-event')
          ? 'My Organized Events'
          : pathname.includes('/attendance')
            ? 'Attendance'
            : pathname.includes('/certificates')
              ? 'Certificates'
              : pathname.includes('/events')
                ? 'My Saved Events'
                : pathname.includes('/notifications')
                  ? 'Notifications'
                  : pathname.includes('/my-profile')
                    ? 'My Profile'
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
          <Link
            className={`topbar__profile-pill${pathname.includes('/my-profile') ? ' is-active' : ''}`}
            href="/my-profile"
            aria-label="Open profile"
          >
            <span>{userName}</span>
            <span className="topbar__avatar-link">
              <Image
                className="topbar__avatar"
                src={profilePhotoImage || AVATAR}
                width={44}
                height={44}
                alt="Profile"
                style={profilePhotoImage ? profilePhotoStyle : undefined}
                unoptimized={Boolean(profilePhotoImage)}
              />
            </span>
          </Link>
          <button
            className={`topbar__icon-button topbar__notification-button${pathname === '/notifications' || isNotificationsOpen ? ' is-active' : ''}`}
            type="button"
            aria-label="Notifications"
            aria-expanded={isNotificationsOpen}
            onClick={() => setIsNotificationsOpen((isOpen) => !isOpen)}
          >
            <Image
              src={hasUnreadNotifications ? '/svg icons navbar/one-notif-icon.svg' : '/svg icons navbar/normal-notif-icon.svg'}
              width={24}
              height={24}
              alt=""
            />
          </button>
          <button className="topbar__help" type="button" aria-label="Help">
            ?
          </button>
        </div>
      </header>

      <aside className={`notifications-drawer${isNotificationsOpen ? ' is-open' : ''}`} aria-hidden={!isNotificationsOpen}>
        <header className="notifications-drawer__header">
          <h2>Notifications</h2>
          <button type="button" onClick={handleMarkAllNotificationsRead}>
            Mark as Read
          </button>
        </header>
        <div className="notifications-drawer__list">
          {notifications.length ? (
            notifications.map((notification) => (
              <button
                className={`notifications-drawer__item${notification.isRead ? '' : ' is-unread'}`}
                type="button"
                key={notification.id}
                onClick={() => handleNotificationClick(notification.id)}
              >
                <span className="notifications-drawer__circle" aria-hidden="true" />
                <span className="notifications-drawer__copy">
                  <strong>{notification.title}</strong>
                  <small>{notification.eventName}</small>
                </span>
                <time>{formatNotificationTimeAgo(notification.notifiedAt)}</time>
              </button>
            ))
          ) : (
            <p className="notifications-drawer__empty">No notifications yet.</p>
          )}
        </div>
      </aside>
    </>
  );
}
