import { ObjectId } from "mongodb";
import { getDb } from "@/lib/db";
import { verifyAuthToken } from "@/lib/token";

export async function requireAuth(request) {
  const authorization = request.headers.get("authorization") || "";
  const token = authorization.startsWith("Bearer ") ? authorization.slice(7) : "";
  if (!token) {
    return { error: "Missing bearer token.", status: 401 };
  }

  try {
    const payload = verifyAuthToken(token);
    const userId = typeof payload?.sub === "string" ? payload.sub : "";
    if (!ObjectId.isValid(userId)) {
      return { error: "Invalid auth token.", status: 401 };
    }

    const db = await getDb();
    const user = await db.collection("users").findOne({ _id: new ObjectId(userId) });
    if (!user) {
      return { error: "User not found.", status: 404 };
    }
    return { user, tokenPayload: payload };
  } catch {
    return { error: "Invalid or expired auth token.", status: 401 };
  }
}