import type { FrontendEvent } from "@/lib/dc-events";
import {
  formatEventDate,
  getCertificateStatus,
  getEventStatus,
  getRegisteredEventId,
  type AttendanceRecord,
  type RegisteredEvent,
} from "@/lib/attendance";
import { fetchUserNotifications, readAuthSession } from "@/lib/user-api";
import {
  loadAttendanceRecords,
  loadOrganizedEventsForUser,
  loadRegisteredEvents,
  userCanOrganize,
} from "@/lib/user-data";

export const NOTIFICATION_READ_KEY = "dcspaceReadNotificationIds";
export const NOTIFICATIONS_UPDATED_EVENT = "dcspace-notifications-updated";

export type NotificationCategory = "updates" | "reminders";
export type NotificationIcon = "archive" | "calendar-week" | "calendar-check-fill" | "patch-check-fill";

export type DcNotification = {
  id: string;
  category: NotificationCategory;
  title: string;
  subtitle: string;
  eventName: string;
  notifiedAt: string;
  actionAt: string;
  icon: NotificationIcon;
  isRead: boolean;
};

function readJson<T>(key: string, fallback: T): T {
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function getReadIds() {
  return new Set(readJson<string[]>(NOTIFICATION_READ_KEY, []));
}

function parseEventDate(event: { month?: string; day?: string; year?: string }) {
  const date = new Date(`${event.month || ""} ${event.day || ""}, ${event.year || ""}`);
  return Number.isNaN(date.getTime()) ? new Date() : date;
}

function getRelativeTime(dateValue: string) {
  const date = new Date(dateValue);
  const diff = Date.now() - date.getTime();
  const seconds = Math.max(1, Math.floor(diff / 1000));

  if (seconds < 60) return `${seconds} sec${seconds === 1 ? "" : "s"} ago`;

  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} minute${minutes === 1 ? "" : "s"} ago`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? "" : "s"} ago`;

  const days = Math.floor(hours / 24);
  if (days < 31) return `${days} day${days === 1 ? "" : "s"} ago`;

  const months = Math.floor(days / 30);
  return `${months} month${months === 1 ? "" : "s"} ago`;
}

export function formatNotificationDate(dateValue: string) {
  return new Date(dateValue).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

export function formatNotificationTimeAgo(dateValue: string) {
  return getRelativeTime(dateValue);
}

function buildNotifications(
  organizedEvents: FrontendEvent[],
  registeredEvents: RegisteredEvent[],
  records: Record<string, AttendanceRecord>,
): DcNotification[] {
  const readIds = getReadIds();
  const now = new Date().toISOString();
  const notifications = new Map<string, Omit<DcNotification, "isRead">>();

  organizedEvents.forEach((event) => {
    const eventDate = parseEventDate(event).toISOString();
    const status = event.status?.toLowerCase() || "";

    if (status.includes("approve") || status.includes("accept")) {
      notifications.set(`approved-${event.id}`, {
        id: `approved-${event.id}`,
        category: "updates",
        title: "Event Approved",
        subtitle: event.dateTime || formatEventDate(event),
        eventName: event.name || "Event",
        notifiedAt: eventDate,
        actionAt: eventDate,
        icon: "calendar-week",
      });
    } else if (status.includes("reject")) {
      notifications.set(`rejected-${event.id}`, {
        id: `rejected-${event.id}`,
        category: "updates",
        title: "Event Rejected",
        subtitle: event.adminChangeRequest || event.dateTime || formatEventDate(event),
        eventName: event.name || "Event",
        notifiedAt: now,
        actionAt: now,
        icon: "archive",
      });
    } else if (status.includes("change")) {
      notifications.set(`changes-${event.id}`, {
        id: `changes-${event.id}`,
        category: "updates",
        title: "Changes Requested",
        subtitle: event.adminChangeRequest || event.dateTime || formatEventDate(event),
        eventName: event.name || "Event",
        notifiedAt: now,
        actionAt: now,
        icon: "archive",
      });
    } else if (status.includes("pending")) {
      notifications.set(`pending-${event.id}`, {
        id: `pending-${event.id}`,
        category: "updates",
        title: "Event Pending Approval",
        subtitle: event.dateTime || formatEventDate(event),
        eventName: event.name || "Event",
        notifiedAt: now,
        actionAt: eventDate,
        icon: "archive",
      });
    }
  });

  registeredEvents.forEach((event) => {
    const eventStatus = getEventStatus(event);
    const eventDate = parseEventDate(event).toISOString();
    const eventId = getRegisteredEventId(event);
    const record = records[eventId];

    if (eventStatus === "Upcoming") {
      notifications.set(`upcoming-${eventId}`, {
        id: `upcoming-${eventId}`,
        category: "reminders",
        title: "Upcoming Event Reminder",
        subtitle: event.dateTime || formatEventDate(event),
        eventName: event.name || "Event",
        notifiedAt: now,
        actionAt: eventDate,
        icon: "calendar-check-fill",
      });
    }

    if (getCertificateStatus(record, event) === "Download") {
      notifications.set(`certificate-${eventId}`, {
        id: `certificate-${eventId}`,
        category: "updates",
        title: "Certificate Ready",
        subtitle: "Your certificate is ready to download",
        eventName: event.name || "Event",
        notifiedAt: record?.updatedAt || now,
        actionAt: record?.updatedAt || now,
        icon: "patch-check-fill",
      });
    }
  });

  return Array.from(notifications.values())
    .map((notification) => ({
      ...notification,
      isRead: readIds.has(notification.id),
    }))
    .sort((first, second) => new Date(second.notifiedAt).getTime() - new Date(first.notifiedAt).getTime());
}

function mapStoredNotification(record: {
  id: string;
  title: string;
  message: string;
  eventTitle: string;
  createdAt: string;
  type: string;
}): Omit<DcNotification, "isRead"> {
  return {
    id: `stored-${record.id}`,
    category: "updates",
    title: record.title,
    subtitle: record.message || record.eventTitle,
    eventName: record.eventTitle,
    notifiedAt: record.createdAt,
    actionAt: record.createdAt,
    icon:
      record.type === "event_approved"
        ? "calendar-week"
        : record.type === "certificate_ready"
          ? "patch-check-fill"
          : record.type === "event_rejected"
            ? "archive"
            : "archive",
  };
}

export async function loadNotifications(): Promise<DcNotification[]> {
  const [registeredEvents, records] = await Promise.all([
    loadRegisteredEvents(),
    loadAttendanceRecords(),
  ]);

  const organizedEvents = userCanOrganize() ? await loadOrganizedEventsForUser() : [];
  const built = buildNotifications(organizedEvents, registeredEvents, records);
  const notificationMap = new Map(built.map((item) => [item.id, item]));

  const session = readAuthSession();
  if (session?.token) {
    try {
      const { notifications } = await fetchUserNotifications(session.token);
      notifications.forEach((record) => {
        const mapped = mapStoredNotification(record);
        notificationMap.set(mapped.id, {
          ...mapped,
          isRead: record.read,
        });
      });
    } catch {
      // Fall back to event-derived notifications only.
    }
  }

  return Array.from(notificationMap.values()).sort(
    (first, second) => new Date(second.notifiedAt).getTime() - new Date(first.notifiedAt).getTime(),
  );
}

/** @deprecated Use loadNotifications() for API-backed data */
export function readNotifications(): DcNotification[] {
  return [];
}

export function markNotificationsAsRead(ids: string[]) {
  const readIds = getReadIds();

  ids.forEach((id) => readIds.add(id));
  window.localStorage.setItem(NOTIFICATION_READ_KEY, JSON.stringify(Array.from(readIds)));
  window.dispatchEvent(new CustomEvent(NOTIFICATIONS_UPDATED_EVENT));
}
