import { ObjectId } from "mongodb";
import { toEventResponse } from "@/lib/event-helpers";

export function toRegistrationResponse(registration) {
  const snapshot = registration.eventSnapshot || {};
  return {
    id: registration._id.toString(),
    eventId: registration.eventId,
    status: registration.status || "Registered",
    certificate: registration.certificate || "Pending",
    requirementFiles: registration.requirementFiles || [],
    createdAt: registration.createdAt || new Date().toISOString(),
    event: {
      id: snapshot.id || registration.eventId,
      title: snapshot.title || "",
      date: snapshot.date || "",
      venue: snapshot.venue || "",
      description: snapshot.description || "",
      requester: snapshot.requester || "",
      department: snapshot.department || "",
      startTime: snapshot.startTime || "",
      endTime: snapshot.endTime || "",
      status: snapshot.status || "",
      certificate: snapshot.certificate || "",
      posterImage: snapshot.posterImage || "",
    },
  };
}

export function buildEventSnapshot(event) {
  return toEventResponse(event);
}

export function validateRegistrationBody(body) {
  if (!body || typeof body !== "object") {
    return "Invalid request body.";
  }
  const eventId = String(body.eventId || "").trim();
  if (!eventId || !ObjectId.isValid(eventId)) {
    return "A valid eventId is required.";
  }
  return null;
}
