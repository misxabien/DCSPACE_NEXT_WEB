import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  adminNotificationsPrisma?: PrismaClient;
};

const prisma = globalForPrisma.adminNotificationsPrisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.adminNotificationsPrisma = prisma;
}

function getModel<T = any>(...names: string[]): T | null {
  const prismaRecord = prisma as unknown as Record<string, T | undefined>;

  for (const name of names) {
    if (prismaRecord[name]) {
      return prismaRecord[name] as T;
    }
  }

  return null;
}

function getSchoolLabel(record: any) {
  return (
    record?.organization?.school?.name ??
    record?.school?.name ??
    record?.school ??
    record?.organization?.name ??
    "N/A"
  );
}

/**
 * Returns the merged event and report notification feed for the admin panel.
 */
export async function getNotifications() {
  const eventModel = getModel<any>("event", "events", "notification", "notifications");
  const reportModel = getModel<any>("report", "reports");

  const [eventItems, reportItems] = await Promise.all([
    eventModel
      ? eventModel.findMany({
          where: {
            OR: [
              { status: "PENDING" },
              { status: "PENDING_APPROVAL" },
              { notificationType: "EVENT" },
            ],
          },
          include: {
            organizer: true,
            organization: {
              include: {
                school: true,
              },
            },
            school: true,
          },
          orderBy: [{ createdAt: "desc" }],
          take: 25,
        })
      : [],
    reportModel
      ? reportModel.findMany({
          include: {
            event: true,
            reporter: true,
            organizer: true,
          },
          orderBy: [{ createdAt: "desc" }],
          take: 25,
        })
      : [],
  ]);

  const feed = [
    ...eventItems.map((item: any) => ({
      type: "event" as const,
      title: item.title ?? item.name ?? "Untitled event",
      organizer:
        item.organizer?.name ?? item.organizerName ?? item.createdByName ?? "Unknown organizer",
      organization: item.organization?.name ?? item.organizationName ?? "N/A",
      school: getSchoolLabel(item),
      createdAt: new Date(item.createdAt ?? Date.now()),
    })),
    ...reportItems.map((item: any) => ({
      type: "report" as const,
      reportType: item.reportType ?? item.type ?? "General Report",
      event: item.event?.title ?? item.eventName ?? "Untitled event",
      reporter: item.reporter?.name ?? item.reporterName ?? "Unknown reporter",
      organizer: item.organizer?.name ?? item.organizerName ?? "Unknown organizer",
      createdAt: new Date(item.createdAt ?? Date.now()),
    })),
  ]
    .sort((left, right) => right.createdAt.getTime() - left.createdAt.getTime())
    .map(({ createdAt, ...item }) => item);

  return { feed };
}
