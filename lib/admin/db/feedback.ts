/* eslint-disable @typescript-eslint/no-explicit-any */
import { ObjectId } from "mongodb";
import { getAdminCollection } from "./mongo";

function createAppError(name: string, message: string, status: number) {
  const error = new Error(message) as Error & { status: number };
  error.name = name;
  error.status = status;
  return error;
}

async function getFeedbackCollection() {
  return getAdminCollection<any>("feedback");
}

async function getUsersCollection() {
  return getAdminCollection<any>("users");
}

async function getEventsCollection() {
  return getAdminCollection<any>("events");
}

function toObjectId(id: string) {
  if (!ObjectId.isValid(id)) {
    throw createAppError("ValidationError", "Invalid identifier", 400);
  }

  return new ObjectId(id);
}

function toNumericRating(value: unknown) {
  const numericValue = Number(value);
  return Number.isFinite(numericValue) ? numericValue : null;
}

function roundAverage(value: number) {
  return Number(value.toFixed(2));
}

function formatTimeLabel(value: Date | string | null | undefined) {
  if (!value) {
    return "-";
  }

  const date = value instanceof Date ? value : new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "-";
  }

  return new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

function normalizeRegistrationType(record: any) {
  const rawType = (
    record.registrationType ??
    record.feedbackType ??
    record.scope ??
    record.category ??
    "event"
  )
    .toString()
    .trim()
    .toLowerCase();

  return rawType.includes("system") ? "System" : "Event";
}

function normalizeAttendanceStatus(value: unknown) {
  const normalized = (value ?? "pending").toString().trim().toLowerCase();

  if (["completed", "complete", "present", "attended"].includes(normalized)) {
    return "Completed";
  }

  return "Pending";
}

function normalizeCertificateStatus(value: unknown) {
  if (typeof value === "boolean") {
    return value ? "issued" : "-";
  }

  const normalized = (value ?? "").toString().trim().toLowerCase();

  if (!normalized || normalized === "pending" || normalized === "-" || normalized === "none") {
    return "-";
  }

  if (normalized.includes("issued")) {
    return "issued";
  }

  return value?.toString() ?? "-";
}

function normalizeStatus(value: unknown) {
  const normalized = (value ?? "New").toString().trim();

  if (["New", "Actioned", "Reviewed"].includes(normalized)) {
    return normalized as "New" | "Actioned" | "Reviewed";
  }

  return "New";
}

function getEventRating(record: any) {
  return toNumericRating(record.eventRating ?? record.rating ?? record.score);
}

function getSystemRating(record: any) {
  return toNumericRating(record.systemEaseOfUse ?? record.systemRating ?? record.usabilityRating ?? record.rating ?? record.score);
}

function getAverage(values: number[]) {
  if (values.length === 0) {
    return 0;
  }

  const total = values.reduce((sum, value) => sum + value, 0);
  return roundAverage(total / values.length);
}

/* ------------------------------------------------------------------ */
/*  V1 feedback row (backward compat)                                 */
/* ------------------------------------------------------------------ */

function mapFeedbackRow(record: any) {
  const registrationType = normalizeRegistrationType(record);
  const rating = registrationType === "System" ? getSystemRating(record) : getEventRating(record);

  return {
    rating: rating ?? 0,
    ratingOutOf: Number(record.ratingOutOf ?? record.outOf ?? 5),
    registrationType,
    tapIn: formatTimeLabel(record.tapIn ?? record.attendance?.tapIn ?? null),
    tapOut: formatTimeLabel(record.tapOut ?? record.attendance?.tapOut ?? null),
    attendanceStatus: normalizeAttendanceStatus(record.attendanceStatus ?? record.attendance?.status),
    eCertificate: normalizeCertificateStatus(
      record.eCertificate ?? record.certificateStatus ?? record.attendance?.certificateStatus,
    ),
  };
}

/* ------------------------------------------------------------------ */
/*  V2 feedback list item                                             */
/* ------------------------------------------------------------------ */

function mapFeedbackListItem(record: any) {
  const category = normalizeRegistrationType(record);
  const rating = category === "System" ? getSystemRating(record) : getEventRating(record);

  return {
    id: String(record._id),
    rating: rating ?? 0,
    category,
    user: {
      name: record.userName ?? record.user?.name ?? record.submitterName ?? "Unknown",
      email: record.userEmail ?? record.user?.email ?? record.submitterEmail ?? "",
      avatarUrl: record.userAvatar ?? record.user?.avatarUrl ?? null,
    },
    event: record.eventName ?? record.event?.title ?? record.eventTitle ?? "N/A",
    facility: record.facility ?? record.venue ?? record.location ?? "N/A",
    status: normalizeStatus(record.status),
  };
}

/* ------------------------------------------------------------------ */
/*  Public API                                                        */
/* ------------------------------------------------------------------ */

/**
 * Returns the feedback overview stats and table rows for the admin feedback screen.
 */
export async function getFeedbackOverview() {
  const feedback = await getFeedbackCollection();
  const records = await feedback.find({}).sort({ createdAt: -1, updatedAt: -1 }).limit(500).toArray();

  const eventRatings: number[] = [];
  const systemRatings: number[] = [];

  for (const record of records) {
    const registrationType = normalizeRegistrationType(record);

    if (registrationType === "System") {
      const systemRating = getSystemRating(record);

      if (systemRating !== null) {
        systemRatings.push(systemRating);
      }

      continue;
    }

    const eventRating = getEventRating(record);

    if (eventRating !== null) {
      eventRatings.push(eventRating);
    }
  }

  return {
    summary: {
      averageEventRating: getAverage(eventRatings),
      eventRatingMax: 5,
      eventRatingCount: eventRatings.length,
      averageSystemRating: getAverage(systemRatings),
      systemRatingMax: 5,
      systemRatingCount: systemRatings.length,
    },
    feedbacks: records.map(mapFeedbackListItem),
    /* Backward-compat fields */
    averageEventRating: getAverage(eventRatings),
    averageEventRatingOutOf: 5,
    averageEventRatingCount: eventRatings.length,
    systemEaseOfUse: getAverage(systemRatings),
    systemEaseOfUseOutOf: 5,
    systemEaseOfUseCount: systemRatings.length,
    feedbackList: records.map(mapFeedbackRow),
  };
}

/**
 * Returns the full feedback detail including user info and event details.
 */
export async function getFeedbackById(id: string) {
  const feedback = await getFeedbackCollection();
  const objectId = toObjectId(id);
  const record = await feedback.findOne({ _id: objectId });

  if (!record) {
    throw createAppError("NotFoundError", "Feedback not found", 404);
  }

  /* Try to enrich with user and event data. */
  let userDetail: any = null;
  let eventDetail: any = null;

  if (record.userId || record.user?._id || record.submitterId) {
    const users = await getUsersCollection();
    const userId = record.userId ?? record.user?._id ?? record.submitterId;

    if (userId && ObjectId.isValid(String(userId))) {
      userDetail = await users.findOne({ _id: new ObjectId(String(userId)) });
    }
  }

  if (record.eventId || record.event?._id) {
    const events = await getEventsCollection();
    const eventId = record.eventId ?? record.event?._id;

    if (eventId && ObjectId.isValid(String(eventId))) {
      eventDetail = await events.findOne({ _id: new ObjectId(String(eventId)) });
    }
  }

  const category = normalizeRegistrationType(record);
  const rating = category === "System" ? getSystemRating(record) : getEventRating(record);

  return {
    feedback: {
      id: String(record._id),
      submittedAt: record.createdAt ?? record.submittedAt ?? null,
      rating: rating ?? 0,
      comment: record.comment ?? record.message ?? record.feedback ?? "",
      category,
      status: normalizeStatus(record.status),
      adminNote: record.adminNote ?? null,
      user: {
        name: userDetail?.name ?? record.userName ?? record.user?.name ?? "Unknown",
        email: userDetail?.email ?? record.userEmail ?? record.user?.email ?? "",
        avatarUrl: userDetail?.avatarUrl ?? record.userAvatar ?? null,
        studentNumber: String(userDetail?.studentId ?? userDetail?.idNumber ?? record.studentNumber ?? "N/A"),
        course: userDetail?.course ?? record.course ?? "N/A",
        yearAndSection: userDetail?.yearAndSection ?? record.yearAndSection ?? "N/A",
        organization: userDetail?.organizationName ?? userDetail?.organization?.name ?? record.organization ?? "N/A",
        role: userDetail?.role?.toUpperCase() ?? "STUDENT",
      },
      eventDetails: {
        category: eventDetail?.type ?? eventDetail?.eventType ?? category,
        eventName: eventDetail?.title ?? eventDetail?.name ?? record.eventName ?? "N/A",
        location: eventDetail?.venue ?? eventDetail?.location ?? record.venue ?? "N/A",
        date: eventDetail?.startTime ?? eventDetail?.eventDate ?? record.eventDate ?? "N/A",
      },
      certificateUrl: record.certificateUrl ?? null,
    },
  };
}

/**
 * Updates the status and/or admin note of a feedback record.
 */
export async function updateFeedback(
  id: string,
  input: { status?: string; adminNote?: string },
) {
  const feedback = await getFeedbackCollection();
  const objectId = toObjectId(id);
  const existing = await feedback.findOne({ _id: objectId });

  if (!existing) {
    throw createAppError("NotFoundError", "Feedback not found", 404);
  }

  const updates: Record<string, unknown> = {
    updatedAt: new Date(),
  };

  if (input.status !== undefined) {
    const validStatuses = ["New", "Actioned", "Reviewed"];

    if (!validStatuses.includes(input.status)) {
      throw createAppError("ValidationError", `status must be one of: ${validStatuses.join(", ")}`, 400);
    }

    updates.status = input.status;
  }

  if (input.adminNote !== undefined) {
    updates.adminNote = input.adminNote;
  }

  await feedback.updateOne({ _id: objectId }, { $set: updates });

  return {
    success: true,
    feedback: {
      id,
      status: (updates.status ?? existing.status ?? "New") as string,
      adminNote: (updates.adminNote ?? existing.adminNote ?? null) as string | null,
    },
  };
}

/**
 * Stubbed email handler for follow-up emails to feedback submitters.
 * Logs the intent and returns success — wire to a real provider later.
 */
export async function sendFeedbackEmail(id: string, message?: string) {
  const feedback = await getFeedbackCollection();
  const objectId = toObjectId(id);
  const record = await feedback.findOne({ _id: objectId });

  if (!record) {
    throw createAppError("NotFoundError", "Feedback not found", 404);
  }

  const recipientEmail =
    record.userEmail ?? record.user?.email ?? record.submitterEmail ?? null;

  if (!recipientEmail) {
    throw createAppError("ValidationError", "No email address found for this feedback submitter", 400);
  }

  /* TODO: Replace with real email provider (Resend, Nodemailer, etc.) */
  console.log(
    `[FeedbackEmail] Would send follow-up to ${recipientEmail} for feedback ${id}`,
    message ? `Message: ${message}` : "(no custom message)",
  );

  /* Record that we attempted the email. */
  await feedback.updateOne(
    { _id: objectId },
    {
      $set: { updatedAt: new Date() },
      $push: {
        emailHistory: {
          sentAt: new Date(),
          recipient: recipientEmail,
          message: message ?? null,
          status: "stub",
        },
      },
    } as any,
  );

  return {
    success: true,
    sentTo: recipientEmail,
  };
}
