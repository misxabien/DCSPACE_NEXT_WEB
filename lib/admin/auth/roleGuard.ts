import { getServerSession } from "next-auth";
import type { Session } from "next-auth";
import { authOptions } from "./authOptions";

class AdminAuthorizationError extends Error {
  status: number;

  constructor(message: string, status = 403) {
    super(message);
    this.name = "AdminAuthorizationError";
    this.status = status;
  }
}

export type AdminSession = Session & {
  user: Session["user"] & {
    id: string;
    role: string;
  };
};

/**
 * Resolves the active session and ensures the requester has the admin role.
 * Throws an authorization error when the session is missing or not admin.
 */
export async function requireAdmin(session?: Session | null): Promise<AdminSession> {
  const resolvedSession = session ?? (await getServerSession(authOptions));

  if (!resolvedSession?.user) {
    throw new AdminAuthorizationError("Forbidden");
  }

  if (resolvedSession.user.role !== "admin") {
    throw new AdminAuthorizationError("Forbidden");
  }

  return resolvedSession as AdminSession;
}
