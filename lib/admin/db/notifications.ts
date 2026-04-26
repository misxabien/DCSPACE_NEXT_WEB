/* eslint-disable @typescript-eslint/no-explicit-any */
import { getAdminCollection } from "./mongo";
/**
 * Returns the merged event and report notification feed for the admin panel.
 */
export async function getNotifications() {
  const [events, reports] = await Promise.all([
    getAdminCollection<any>("events"),
    getAdminCollection<any>("reports"),
  ]);

  const [eventItems, reportItems] = await Promise.all([
    events
      .find({ status: { $in: ["pending", "pending_approval", "PENDING", "PENDING_APPROVAL"] } })
      .sort({ createdAt: -1 })
      .limit(25)
      .toArray(),
    reports.find({}).sort({ createdAt: -1 }).limit(25).toArray(),
  ]);

  const feed = [
    ...eventItems.map((item) => ({
      id: String(item._id),
      type: "event" as const,
      title: item.title ?? item.name ?? "Untitled event",
      organizer: item.organizerName ?? item.organizer?.name ?? "Unknown organizer",
      organization: item.organizationName ?? item.organization?.name ?? "N/A",
      school: item.schoolName ?? item.school?.name ?? "N/A",
      viewTarget: `/admin/events/${String(item._id)}`,
      createdAt: new Date(item.createdAt ?? Date.now()),
    })),
    ...reportItems.map((item) => ({
      id: String(item._id),
      type: "report" as const,
      reportType: item.reportType ?? item.type ?? "General Report",
      event: item.eventName ?? item.event?.title ?? "Untitled event",
      reporter: item.reporterName ?? item.reporter?.name ?? "Unknown reporter",
      organizer: item.organizerName ?? item.organizer?.name ?? "Unknown organizer",
      viewTarget:
        item.eventId
          ? `/admin/events/${String(item.eventId)}`
          : item.event?._id
            ? `/admin/events/${String(item.event._id)}`
            : null,
      createdAt: new Date(item.createdAt ?? Date.now()),
    })),
  ]
    .sort((left, right) => right.createdAt.getTime() - left.createdAt.getTime())
    .map((item) => {
      const nextItem = { ...item } as Record<string, unknown>;
      delete nextItem.createdAt;
      return nextItem;
    });

  return {
    feed,
    total: feed.length,
  };
}






