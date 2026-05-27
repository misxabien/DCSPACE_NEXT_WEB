const authStorageKey = "dcspace_auth";
const requestTimeoutMs = 10000;

export type UserProfile = {
  id: string;
  firstName: string;
  lastName: string;
  fullName: string;
  studentNumber: string;
  email: string;
  photoUrl?: string;
  role: string;
  rfidNumber?: string;
  organizationPart?: string;
  organizationRole?: string;
  course?: string;
  school?: string;
};

export type UserEvent = {
  id: string;
  title: string;
  date: string;
  venue: string;
  description: string;
  requester: string;
  department: string;
  startTime: string;
  endTime: string;
  status: string;
  certificate: string;
  posterImage?: string;
  minAttendance?: string;
};

type FetchEventsOptions = {
  status?: "approved" | "pending" | "all";
  submittedByEmail?: string;
};

type ApiOptions = {
  method?: string;
  body?: unknown;
  token?: string;
};

function extractErrorMessage(payload: unknown): string | null {
  if (!payload || typeof payload !== "object") {
    return null;
  }

  const errorValue = (payload as { error?: unknown }).error;
  if (typeof errorValue === "string" && errorValue.trim()) {
    if (errorValue === "Failed to register account." || errorValue === "Failed to login.") {
      const detailsValue = (payload as { details?: unknown }).details;
      if (typeof detailsValue === "string" && detailsValue.trim()) {
        return `${errorValue} ${detailsValue}`;
      }
    }
    return errorValue;
  }
  const detailsValue = (payload as { details?: unknown }).details;
  return typeof detailsValue === "string" && detailsValue.trim() ? detailsValue : null;
}

async function apiRequest<T>(path: string, options: ApiOptions = {}): Promise<T> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), requestTimeoutMs);
  let response: Response;

  try {
    response = await fetch(path, {
      method: options.method || "GET",
      headers: {
        "Content-Type": "application/json",
        ...(options.token ? { Authorization: `Bearer ${options.token}` } : {}),
      },
      body: options.body ? JSON.stringify(options.body) : undefined,
      signal: controller.signal,
    });
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      throw new Error("Request timed out. Please check the server and try again.");
    }

    throw new Error("Could not reach the server. Please try again.");
  } finally {
    clearTimeout(timeoutId);
  }

  const contentType = response.headers.get("content-type") || "";

  if (contentType.includes("application/json")) {
    const json = await response.json();

    if (!response.ok) {
      throw new Error(extractErrorMessage(json) || "Request failed.");
    }

    return json as T;
  }

  const rawBody = await response.text();

  if (!response.ok) {
    throw new Error(`Request failed (${response.status}).`);
  }

  throw new Error(`Unexpected server response. ${rawBody ? "Please verify API route setup." : ""}`.trim());
}

export async function registerUser(payload: {
  firstName: string;
  lastName: string;
  studentNumber: string;
  email: string;
  photoUrl?: string;
  rfidNumber?: string;
  organizationPart?: string;
  organizationRole?: string;
  course?: string;
  school?: string;
  password: string;
  confirmPassword: string;
  role?: "student" | "faculty";
  dataPrivacyAccepted: boolean;
}) {
  return apiRequest<{ token: string; user: UserProfile; message: string }>("/api/auth/register", {
    method: "POST",
    body: payload,
  });
}

export async function loginUser(email: string, password: string) {
  return apiRequest<{ token: string; user: UserProfile; message: string }>("/api/auth/login", {
    method: "POST",
    body: { email, password },
  });
}

export async function createGoogleUserSession() {
  return apiRequest<{ token: string; user: UserProfile; message: string }>("/api/auth/google-session");
}

export async function fetchProfile(token: string) {
  return apiRequest<{ profile: UserProfile }>("/api/profile", { token });
}

export async function fetchEvents(search?: string, options: FetchEventsOptions = {}) {
  const params = new URLSearchParams();
  if (search) {
    params.set("search", search);
  }
  if (options.status) {
    params.set("status", options.status);
  }
  if (options.submittedByEmail) {
    params.set("submittedByEmail", options.submittedByEmail);
  }
  const query = params.toString() ? `?${params.toString()}` : "";
  return apiRequest<{ events: UserEvent[] }>(`/api/events${query}`);
}

export async function fetchEventById(eventId: string) {
  return apiRequest<{ event: UserEvent }>(`/api/events/${encodeURIComponent(eventId)}`);
}

export async function registerForEvent(token: string, eventId: string) {
  return apiRequest<{ message: string; eventId: string }>(
    `/api/events/registrations/${encodeURIComponent(eventId)}`,
    {
      method: "POST",
      token,
    },
  );
}

export async function submitOrganizedEvent(
  event: {
    eventName: string;
    date: string;
    venue: string;
    description?: string;
    requester?: string;
    department?: string;
    school?: string;
    courseCode?: string;
    courseOrganizer?: string;
    submittedByEmail?: string;
    startTime?: string;
    endTime?: string;
    duration?: string;
    minAttendance?: string;
    posterImage?: string;
  },
) {
  return apiRequest<{ event: UserEvent; message: string }>("/api/events", {
    method: "POST",
    body: event,
  });
}

export async function recordAttendanceTap(
  token: string,
  payload: {
    eventId: string;
    eventName: string;
    eventDate: string;
    rfidNumber: string;
  },
) {
  return apiRequest<{
    message: string;
    tapType: "tap in" | "tap out";
    currentTime: string;
    record: {
      eventId: string;
      eventName: string;
      eventDate: string;
      studentNumber: string;
      rfidNumber: string;
      tapIn?: string;
      tapOut?: string;
      taps?: Array<{ tapIn?: string; tapOut?: string }>;
      updatedAt: string;
    };
  }>("/api/attendance", {
    method: "POST",
    token,
    body: payload,
  });
}

export async function fetchAttendanceLogs(token: string) {
  return apiRequest<{
    attendance: Array<{
      eventId: string;
      eventName: string;
      eventDate: string;
      studentNumber: string;
      rfidNumber: string;
      tapIn?: string;
      tapOut?: string;
      taps?: Array<{ tapIn?: string; tapOut?: string }>;
      updatedAt?: string;
    }>;
  }>("/api/attendance", {
    method: "GET",
    token,
  });
}

export function saveAuthSession(token: string, user: UserProfile) {
  if (typeof window === "undefined") {
    return;
  }
  window.localStorage.setItem(authStorageKey, JSON.stringify({ token, user }));
}

export function saveUserProfileDetails(user: UserProfile) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem("dcspaceFirstName", user.firstName || "");
  window.localStorage.setItem("dcspaceLastName", user.lastName || "");
  window.localStorage.setItem("dcspaceStudentNumber", user.studentNumber || "");
  window.localStorage.setItem("dcspaceStudentEmail", user.email || "");
  window.localStorage.setItem("dcspacePhotoUrl", user.photoUrl || "");
  window.localStorage.setItem("dcspaceRfidNumber", user.rfidNumber || "");
  window.localStorage.setItem("dcspaceCourse", user.course || "");
  window.localStorage.setItem("dcspaceSchool", user.school || "");
  window.localStorage.setItem("dcspaceOrganizationPart", user.organizationPart || "");
  window.localStorage.setItem("dcspaceOrganizationRole", user.organizationRole || "");
}

export function clearAuthSession() {
  if (typeof window === "undefined") {
    return;
  }
  window.localStorage.removeItem(authStorageKey);
}

export function readAuthSession(): { token: string; user: UserProfile } | null {
  if (typeof window === "undefined") {
    return null;
  }
  const raw = window.localStorage.getItem(authStorageKey);
  if (!raw) {
    return null;
  }
  try {
    return JSON.parse(raw) as { token: string; user: UserProfile };
  } catch {
    return null;
  }
}
