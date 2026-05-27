const configuredBackendUrl = process.env.NEXT_PUBLIC_BACKEND_USER_API_URL;
const authStorageKey = "dcspace_auth";
const requestTimeoutMs = 10000;

function getCandidateBaseUrls(preferLocalOnly = false) {
  const urls = new Set<string>();

  // Same-origin API routes on the main Next app (port 3000).
  if (typeof window !== "undefined") {
    urls.add(`${window.location.origin}/api/user`);
  }

  if (preferLocalOnly) {
    return Array.from(urls);
  }

  // Prefer explicit environment first.
  if (configuredBackendUrl) {
    urls.add(configuredBackendUrl);
    try {
      const parsed = new URL(configuredBackendUrl);
      if (parsed.hostname === "localhost") {
        parsed.hostname = "127.0.0.1";
        urls.add(parsed.toString().replace(/\/$/, ""));
      } else if (parsed.hostname === "127.0.0.1") {
        parsed.hostname = "localhost";
        urls.add(parsed.toString().replace(/\/$/, ""));
      }
    } catch {
      // Ignore malformed configured URL; request will fail with a clear error.
    }
  } else {
    // Dev fallback order: try both localhost and 127.0.0.1.
    urls.add("http://127.0.0.1:4001");
    urls.add("http://localhost:4001");
    urls.add("http://127.0.0.1:4102");
    urls.add("http://localhost:4102");
    urls.add("http://127.0.0.1:4101");
    urls.add("http://localhost:4101");
    // If frontend is opened via LAN hostname/IP, try that host too.
    if (typeof window !== "undefined") {
      const host = window.location.hostname;
      const protocol = window.location.protocol === "https:" ? "https:" : "http:";
      if (host && host !== "localhost" && host !== "127.0.0.1") {
        urls.add(`${protocol}//${host}:4001`);
        urls.add(`${protocol}//${host}:4102`);
        urls.add(`${protocol}//${host}:4101`);
      }
    }
  }

  return Array.from(urls);
}

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
  minAttendance?: string;
  duration?: string;
  posterImage?: string;
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

type AuthEndpoint = "send-verification" | "register" | "login";

function resolveApiPath(path: string, baseUrl: string) {
  const normalized = path.startsWith("/") ? path : `/${path}`;
  if (baseUrl.endsWith("/api/user")) {
    return normalized.startsWith("/api/") ? normalized.replace(/^\/api/, "") : normalized;
  }
  return normalized.startsWith("/api/") ? normalized : `/api${normalized}`;
}

function resolveRequestUrl(path: string, baseUrl: string) {
  if (/^https?:\/\//i.test(path)) {
    return path;
  }

  const normalized = path.startsWith("/") ? path : `/${path}`;
  if (baseUrl.endsWith("/api/user") && normalized.startsWith("/api/")) {
    return `${baseUrl.slice(0, -"/api/user".length)}${normalized}`;
  }

  return `${baseUrl}${resolveApiPath(path, baseUrl)}`;
}

function resolveUserAuthPath(endpoint: AuthEndpoint, baseUrl: string) {
  return resolveApiPath(`auth/${endpoint}`, baseUrl);
}

function extractErrorMessage(payload: unknown): string | null {
  if (!payload || typeof payload !== "object") {
    return null;
  }

  const errorValue = (payload as { error?: unknown }).error;
  if (typeof errorValue === "string" && errorValue.trim()) {
    const detailsValue = (payload as { details?: unknown }).details;
    const shouldAppendDetails =
      typeof detailsValue === "string" &&
      detailsValue.trim() &&
      (errorValue === "Failed to register account." ||
        errorValue === "Failed to login." ||
        errorValue === "Failed to send verification email." ||
        /email delivery is not configured|mail server|verification email/i.test(errorValue));

    if (shouldAppendDetails && !errorValue.includes(detailsValue)) {
      return `${errorValue} ${detailsValue}`;
    }
    return errorValue;
  }
  const detailsValue = (payload as { details?: unknown }).details;
  if (typeof detailsValue === "string" && detailsValue.trim()) {
    return detailsValue;
  }
  return null;
}

async function apiRequest<T>(
  path: string | ((baseUrl: string) => string),
  options: ApiOptions = {},
  preferLocalOnly = false,
): Promise<T> {
  const candidateBaseUrls = getCandidateBaseUrls(preferLocalOnly);
  let lastError: Error | null = null;

  for (const baseUrl of candidateBaseUrls) {
    const rawPath = typeof path === "function" ? path(baseUrl) : path;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), requestTimeoutMs);
    let response: Response;

    try {
      response = await fetch(resolveRequestUrl(rawPath, baseUrl), {
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
        lastError = new Error("Request timed out. Please check the server and try again.");
      } else {
        lastError = new Error(
          "Could not reach the server. Run npm run dev and ensure .env.local has MONGODB_URI and JWT_SECRET.",
        );
      }
      continue;
    } finally {
      clearTimeout(timeoutId);
    }

    const contentType = response.headers.get("content-type") || "";
    if (contentType.includes("application/json")) {
      const json = await response.json();
      if (!response.ok) {
        const message = extractErrorMessage(json);
        // Server responded with a real error — show it (do not fall through to :4001 and mask it).
        if (message) {
          throw new Error(message);
        }
        if (response.status >= 500) {
          lastError = new Error(`Server error (${response.status}). Please try again.`);
          continue;
        }
        throw new Error("Request failed.");
      }
      return json as T;
    }

    const rawBody = await response.text();
    if (!response.ok) {
      if (response.status >= 500) {
        lastError = new Error(rawBody.trim() || `Server error (${response.status}).`);
        continue;
      }
      throw new Error(`Request failed (${response.status}).`);
    }

    throw new Error(`Unexpected server response. ${rawBody ? "Please verify backend URL and API route setup." : ""}`.trim());
  }

  throw (
    lastError ||
    new Error("Could not reach the server. Run npm run dev on port 3000 and check the terminal for errors.")
  );
}

export async function sendRegistrationVerificationEmail(email: string) {
  return apiRequest<{
    message: string;
    email: string;
    expiresAt: string;
  }>(
    (baseUrl) => resolveUserAuthPath("send-verification", baseUrl),
    {
      method: "POST",
      body: { email },
    },
    true,
  );
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
  verificationCode?: string;
  role?: "student" | "faculty";
  dataPrivacyAccepted: boolean;
}) {
  return apiRequest<{ token: string; user: UserProfile; message: string }>(
    payload.verificationCode ? (baseUrl) => resolveUserAuthPath("register", baseUrl) : "/api/auth/register",
    {
      method: "POST",
      body: payload,
    },
    true,
  );
}

export async function loginUser(email: string, password: string) {
  return apiRequest<{ token: string; user: UserProfile; message: string }>(
    (baseUrl) => resolveUserAuthPath("login", baseUrl),
    {
      method: "POST",
      body: { email, password },
    },
    true,
  );
}

export async function createGoogleUserSession() {
  return apiRequest<{ token: string; user: UserProfile; message: string }>(
    "/api/auth/google-session",
    {},
    true,
  );
}

export async function sendForgotPasswordCode(email: string) {
  return apiRequest<{ message: string; email: string; expiresAt: string }>("auth/forgot-password/send-code", {
    method: "POST",
    body: { email },
  });
}

export async function verifyForgotPasswordCode(email: string, code: string) {
  return apiRequest<{ message: string }>("auth/forgot-password/verify-code", {
    method: "POST",
    body: { email, code },
  });
}

export async function resetForgotPassword(payload: {
  email: string;
  code: string;
  password: string;
  confirmPassword: string;
}) {
  return apiRequest<{ message: string }>("auth/forgot-password/reset", {
    method: "POST",
    body: payload,
  });
}

export async function fetchProfile(token: string) {
  return apiRequest<{ profile: UserProfile }>("profile", { token });
}

export async function updateProfile(
  token: string,
  payload: Partial<
    Pick<
      UserProfile,
      "firstName" | "lastName" | "photoUrl" | "course" | "school" | "organizationPart" | "organizationRole" | "rfidNumber"
    >
  >,
) {
  return apiRequest<{ profile: UserProfile; message: string }>("profile", {
    method: "PATCH",
    token,
    body: payload,
  });
}

export async function deleteEvent(token: string, eventId: string) {
  return apiRequest<{ message: string }>(`events/${encodeURIComponent(eventId)}`, {
    method: "DELETE",
    token,
  });
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
  return apiRequest<{ events: UserEvent[] }>(`events${query}`);
}

export async function fetchEventById(eventId: string) {
  return apiRequest<{ event: UserEvent }>(`events/${encodeURIComponent(eventId)}`);
}

export async function fetchBookmarkedEvents(token: string) {
  return apiRequest<{ events: UserEvent[] }>("events/bookmarks", { token });
}

export async function addEventBookmark(token: string, eventId: string) {
  return apiRequest<{ message: string }>(`events/bookmarks/${encodeURIComponent(eventId)}`, {
    method: "POST",
    token,
  });
}

export async function removeEventBookmark(token: string, eventId: string) {
  return apiRequest<{ message: string }>(`events/bookmarks/${encodeURIComponent(eventId)}`, {
    method: "DELETE",
    token,
  });
}

export async function fetchCertificates(token: string) {
  return apiRequest<{
    certificates: Array<{
      id: string;
      eventId: string;
      eventName: string;
      eventDate: string;
      issuedAt?: string;
      downloadUrl?: string;
    }>;
  }>("certificates", { token });
}

export type UserRegistration = {
  id: string;
  eventId: string;
  status: string;
  certificate: string;
  requirementFiles: Array<{
    requirementName?: string;
    name: string;
    type: string;
    size: number;
  }>;
  createdAt: string;
  event: UserEvent;
};

export async function fetchRegistrations(token: string) {
  return apiRequest<{ registrations: UserRegistration[] }>("registrations", { token });
}

export async function registerForEvent(
  token: string,
  eventOrPayload:
    | string
    | {
        eventId: string;
        requirementFiles?: Array<{
          requirementName?: string;
          name: string;
          type: string;
          size: number;
        }>;
      },
) {
  if (typeof eventOrPayload === "string") {
    return apiRequest<{ message: string; eventId: string }>(
      `/api/events/registrations/${encodeURIComponent(eventOrPayload)}`,
      {
        method: "POST",
        token,
      },
      true,
    );
  }

  return apiRequest<{ message: string; registration: UserRegistration }>("registrations", {
    method: "POST",
    token,
    body: eventOrPayload,
  });
}

export async function registerForEventWithRequirements(
  token: string,
  payload: {
    eventId: string;
    requirementFiles?: Array<{
      requirementName?: string;
      name: string;
      type: string;
      size: number;
    }>;
  },
) {
  return apiRequest<{ message: string; registration: UserRegistration }>("registrations", {
    method: "POST",
    token,
    body: payload,
  });
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
  return apiRequest<{ event: UserEvent; message: string }>("events", {
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
  }>("attendance", {
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
  }>("attendance", {
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
