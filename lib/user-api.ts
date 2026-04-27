const configuredBackendUrl = process.env.NEXT_PUBLIC_BACKEND_USER_API_URL;
const defaultBackendUrl = "http://127.0.0.1:4001";
const backendBaseUrl = configuredBackendUrl || defaultBackendUrl;
const authStorageKey = "dcspace_auth";
const requestTimeoutMs = 30000;

function getCandidateBaseUrls() {
  const urls = [];

  // Prefer explicit environment first.
  if (configuredBackendUrl) {
    urls.push(configuredBackendUrl);
  } else {
    // Dev fallback order: 4101 is the active backend-user port.
    urls.push("http://127.0.0.1:4101");
  }

  return urls;
}

export type UserProfile = {
  id: string;
  firstName: string;
  lastName: string;
  fullName: string;
  studentNumber: string;
  email: string;
  role: string;
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
  return typeof errorValue === "string" && errorValue.trim() ? errorValue : null;
}

async function apiRequest<T>(path: string, options: ApiOptions = {}): Promise<T> {
  const candidateBaseUrls = getCandidateBaseUrls();
  let lastError: Error | null = null;

  for (const baseUrl of candidateBaseUrls) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), requestTimeoutMs);
    let response: Response;

    try {
      response = await fetch(`${baseUrl}${path}`, {
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
        lastError = new Error("Could not reach the server. Please check your connection and try again.");
      }
      continue;
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

    throw new Error(`Unexpected server response. ${rawBody ? "Please verify backend URL and API route setup." : ""}`.trim());
  }

  throw lastError || new Error("Request failed.");
}

export async function registerUser(payload: {
  firstName: string;
  lastName: string;
  studentNumber: string;
  email: string;
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
  },
) {
  return apiRequest<{ event: UserEvent; message: string }>("/api/events", {
    method: "POST",
    body: event,
  });
}

export function saveAuthSession(token: string, user: UserProfile) {
  if (typeof window === "undefined") {
    return;
  }
  window.localStorage.setItem(authStorageKey, JSON.stringify({ token, user }));
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
