import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  adminDashboardPrisma?: PrismaClient;
};

const prisma = globalForPrisma.adminDashboardPrisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.adminDashboardPrisma = prisma;
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

function toDateLabel(value: Date | string | null | undefined) {
  if (!value) {
    return "";
  }

  const date = value instanceof Date ? value : new Date(value);
  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

function toTimeLabel(
  startValue: Date | string | null | undefined,
  endValue: Date | string | null | undefined,
) {
  if (!startValue) {
    return "";
  }

  const start = startValue instanceof Date ? startValue : new Date(startValue);
  const end = endValue ? (endValue instanceof Date ? endValue : new Date(endValue)) : null;
  const formatter = new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });

  if (!end) {
    return formatter.format(start);
  }

  return `${formatter.format(start)} - ${formatter.format(end)}`;
}

function extractOrganizationName(event: any) {
  return (
    event?.organization?.name ??
    event?.school?.name ??
    event?.school ??
    event?.organizationName ??
    "N/A"
  );
}

function extractParticipants(event: any) {
  if (Array.isArray(event?.participants) && event.participants.length > 0) {
    return event.participants
      .map((participant: any) => participant.name ?? participant.program ?? participant.course)
      .filter(Boolean)
      .join(", ");
  }

  return event?.participantGroup ?? event?.program ?? event?.course ?? "N/A";
}

function startOfWeek(date: Date) {
  const copy = new Date(date);
  const day = copy.getDay();
  const diff = copy.getDate() - day + (day === 0 ? -6 : 1);
  copy.setDate(diff);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

/**
 * Returns the aggregate stat cards used by the admin dashboard.
 */
export async function getDashboardStats() {
  const eventModel = getModel<any>("event", "events");
  const attendanceModel = getModel<any>("attendance", "attendanceLog", "attendanceLogs");
  const certificateModel = getModel<any>(
    "certificate",
    "certificates",
    "certificateRequest",
    "certificateRequests",
  );

  const now = new Date();
  const weekStart = startOfWeek(now);

  const totalEventsDone = eventModel
    ? await eventModel.count({
        where: {
          OR: [{ status: "DONE" }, { status: "COMPLETED" }, { endDate: { lt: now } }],
        },
      })
    : 0;

  const completedThisWeek = eventModel
    ? await eventModel.count({
        where: {
          OR: [{ status: "DONE" }, { status: "COMPLETED" }],
          updatedAt: { gte: weekStart },
        },
      })
    : 0;

  const pendingApprovalItems = eventModel
    ? await eventModel.findMany({
        where: {
          status: { in: ["PENDING", "PENDING_APPROVAL"] },
        },
        include: {
          organization: true,
          school: true,
        },
      })
    : [];

  const pendingApprovals = pendingApprovalItems.length;
  const pendingByOrganization = pendingApprovalItems.reduce<Record<string, number>>((acc, item) => {
    const name = extractOrganizationName(item);
    acc[name] = (acc[name] ?? 0) + 1;
    return acc;
  }, {});
  const topPendingOrganization = Object.entries(pendingByOrganization).sort(
    (left, right) => right[1] - left[1],
  )[0];

  const attendanceRows = attendanceModel
    ? await attendanceModel.findMany({
        select: {
          id: true,
          eventId: true,
        },
      })
    : [];

  const totalAttendees = attendanceRows.length;
  const attendedEvents = new Set(
    attendanceRows.map((row: any) => row.eventId).filter((eventId: unknown) => eventId != null),
  ).size;

  const certificatesIssued = certificateModel
    ? await certificateModel.count({
        where: {
          OR: [{ status: "ISSUED" }, { issuedAt: { not: null } }],
        },
      })
    : 0;

  return {
    totalEventsDone,
    totalEventsDoneNote: `+${completedThisWeek} this week`,
    pendingApprovals,
    pendingApprovalsNote: topPendingOrganization
      ? `${topPendingOrganization[1]} events from ${topPendingOrganization[0]}`
      : "No pending approvals",
    totalAttendees,
    totalAttendeesNote: `Across ${attendedEvents} Events`,
    certificatesIssued,
  };
}

/**
 * Returns the certificate generation queue shown on the dashboard.
 */
export async function getCertificateQueue() {
  const certificateModel = getModel<any>(
    "certificate",
    "certificates",
    "certificateRequest",
    "certificateRequests",
  );

  if (!certificateModel) {
    return [];
  }

  const queueItems = await certificateModel.findMany({
    where: {
      OR: [{ status: "READY" }, { status: "INELIGIBLE" }, { readyForIssuance: true }],
    },
    orderBy: [{ updatedAt: "desc" }],
    take: 10,
    include: {
      user: true,
      attendee: true,
      event: true,
    },
  });

  return queueItems.map((item: any) => ({
    name:
      item.user?.name ??
      item.attendee?.name ??
      item.studentName ??
      item.recipientName ??
      "Unknown attendee",
    event: item.event?.title ?? item.eventName ?? "Untitled event",
    attendancePercent: Number(
      item.attendancePercent ?? item.attendanceRate ?? item.attendanceScore ?? 0,
    ),
    status:
      String(item.status ?? (item.readyForIssuance ? "READY" : "INELIGIBLE")).toUpperCase() ===
      "READY"
        ? "Ready"
        : "Ineligible",
  }));
}

/**
 * Returns the upcoming active events shown on the dashboard.
 */
export async function getUpcomingEvents() {
  const eventModel = getModel<any>("event", "events");

  if (!eventModel) {
    return [];
  }

  const now = new Date();
  const events = await eventModel.findMany({
    where: {
      OR: [{ startDate: { gte: now } }, { eventDate: { gte: now } }],
      status: { in: ["ACTIVE", "APPROVED", "PUBLISHED", "UPCOMING"] },
    },
    orderBy: [{ startDate: "asc" }, { eventDate: "asc" }],
    take: 3,
    include: {
      organization: true,
      school: true,
      participants: true,
    },
  });

  return events.map((event: any) => {
    const start = event.startDate ?? event.eventDate ?? null;
    const end = event.endDate ?? event.eventEndDate ?? null;

    return {
      title: event.title ?? event.name ?? "Untitled event",
      date: toDateLabel(start),
      time: toTimeLabel(start, end),
      school: extractOrganizationName(event),
      participants: extractParticipants(event),
      venue: event.venue ?? event.location ?? "TBA",
    };
  });
}
