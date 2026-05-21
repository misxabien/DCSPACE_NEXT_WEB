'use client';

import { type CSSProperties, useEffect, useMemo, useState } from 'react';
import {
  type DcNotification,
  type NotificationCategory,
  NOTIFICATIONS_UPDATED_EVENT,
  formatNotificationDate,
  formatNotificationTimeAgo,
  markNotificationsAsRead,
  readNotifications,
} from '@/lib/notifications';

const categories: Array<{ key: 'all' | NotificationCategory; label: string }> = [
  { key: 'all', label: 'All' },
  { key: 'updates', label: 'Updates' },
  { key: 'reminders', label: 'Reminders' },
];

function NotificationAssetIcon({ icon }: { icon: DcNotification['icon'] | 'archive' }) {
  return <span className={`notification-asset notification-asset--${icon}`} aria-hidden="true" />;
}

export function NotificationsPageContent() {
  const [activeCategory, setActiveCategory] = useState<'all' | NotificationCategory>('all');
  const [notifications, setNotifications] = useState<DcNotification[]>([]);
  const activeCategoryIndex = categories.findIndex((category) => category.key === activeCategory);

  useEffect(() => {
    const refreshNotifications = () => setNotifications(readNotifications());

    refreshNotifications();
    window.addEventListener('pageshow', refreshNotifications);
    window.addEventListener('storage', refreshNotifications);
    window.addEventListener(NOTIFICATIONS_UPDATED_EVENT, refreshNotifications);

    return () => {
      window.removeEventListener('pageshow', refreshNotifications);
      window.removeEventListener('storage', refreshNotifications);
      window.removeEventListener(NOTIFICATIONS_UPDATED_EVENT, refreshNotifications);
    };
  }, []);

  const filteredNotifications = useMemo(() => {
    if (activeCategory === 'all') return notifications;
    return notifications.filter((notification) => notification.category === activeCategory);
  }, [activeCategory, notifications]);

  const counts = useMemo(() => {
    return {
      all: notifications.length,
      updates: notifications.filter((notification) => notification.category === 'updates').length,
      reminders: notifications.filter((notification) => notification.category === 'reminders').length,
    };
  }, [notifications]);

  const handleNotificationClick = (notificationId: string) => {
    markNotificationsAsRead([notificationId]);
    setNotifications(readNotifications());
  };

  return (
    <main className="notifications-page">
      <header className="notifications-header">
        <h1>Notifications</h1>
        <div
          className="notifications-categories"
          role="tablist"
          aria-label="Notification categories"
          style={{ '--active-category-index': activeCategoryIndex } as CSSProperties}
        >
          {categories.map((category) => (
            <button
              type="button"
              className={activeCategory === category.key ? 'is-active' : ''}
              aria-selected={activeCategory === category.key}
              role="tab"
              key={category.key}
              onClick={() => setActiveCategory(category.key)}
            >
              {category.label} ({counts[category.key]})
            </button>
          ))}
        </div>
      </header>

      {filteredNotifications.length > 0 ? (
        <section className="notifications-list" aria-label="Notifications list">
          {filteredNotifications.map((notification) => (
            <button
              type="button"
              className={`notification-row${notification.isRead ? ' is-read' : ' is-unread'}`}
              key={notification.id}
              onClick={() => handleNotificationClick(notification.id)}
            >
              <div className="notification-row__time">
                <span>{formatNotificationDate(notification.actionAt)}</span>
                <small>{formatNotificationTimeAgo(notification.notifiedAt)}</small>
              </div>
              <div className="notification-row__copy">
                <h2>{notification.title}</h2>
                <p>{notification.subtitle}</p>
                <p>{notification.eventName}</p>
              </div>
              <div className="notification-row__icon-wrap">
                <NotificationAssetIcon icon={notification.icon} />
                {!notification.isRead && <span className="notification-row__dot" aria-label="Unread notification" />}
                <span className="notification-row__status">{notification.isRead ? 'Read' : 'Unread'}</span>
              </div>
            </button>
          ))}
        </section>
      ) : (
        <section className="notifications-empty" aria-label="No notifications">
          <NotificationAssetIcon icon="archive" />
          <p>No notifications yet. Check back later for updates.</p>
        </section>
      )}
    </main>
  );
}
