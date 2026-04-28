export function toEventResponse(event) {
  return {
    id: event._id.toString(),
    title: event.title,
    date: event.date || "",
    venue: event.venue || "",
    description: event.description || "",
    requester: event.requester || "",
    department: event.department || "",
    startTime: event.startTime || "",
    endTime: event.endTime || "",
    status: event.status || "pending",
    certificate: event.certificate || "Processing",
    posterImage: event.posterImage || "",
    createdAt: event.createdAt || new Date().toISOString(),
  };
}

export function validateCreateEventBody(body) {
  if (!body || typeof body !== "object") {
    return "Invalid request body.";
  }
  const requiredFields = ["eventName", "date", "venue"];
  for (const field of requiredFields) {
    if (!body[field] || String(body[field]).trim() === "") {
      return `${field} is required.`;
    }
  }
  return null;
}