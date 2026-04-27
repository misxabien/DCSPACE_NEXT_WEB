import jwt from "jsonwebtoken";

export function signAuthToken(payload) {
  const secret = process.env.JWT_SECRET;
  const expiresIn = process.env.JWT_EXPIRES_IN || "7d";
  if (!secret) {
    throw new Error("Missing JWT_SECRET in environment variables.");
  }
  return jwt.sign(payload, secret, { expiresIn });
}

export function verifyAuthToken(token) {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error("Missing JWT_SECRET in environment variables.");
  }
  return jwt.verify(token, secret);
}
