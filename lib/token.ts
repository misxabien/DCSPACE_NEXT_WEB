import { createHmac, timingSafeEqual } from "crypto";

type JwtPayload = Record<string, unknown> & {
  exp?: number;
  iat?: number;
};

function base64UrlEncode(value: string | Buffer) {
  return Buffer.from(value).toString("base64url");
}

function base64UrlJson(value: unknown) {
  return base64UrlEncode(JSON.stringify(value));
}

function parseExpirySeconds(value: string) {
  const match = value.trim().match(/^(\d+)([smhd])?$/i);

  if (!match) {
    return 7 * 24 * 60 * 60;
  }

  const amount = Number(match[1]);
  const unit = (match[2] || "s").toLowerCase();
  const multipliers: Record<string, number> = {
    s: 1,
    m: 60,
    h: 60 * 60,
    d: 24 * 60 * 60,
  };

  return amount * multipliers[unit];
}

function getSecret() {
  const secret = process.env.JWT_SECRET;

  if (!secret) {
    throw new Error("Missing JWT_SECRET in environment variables.");
  }

  return secret;
}

function sign(input: string, secret: string) {
  return createHmac("sha256", secret).update(input).digest("base64url");
}

export function signAuthToken(payload: JwtPayload) {
  const secret = getSecret();
  const now = Math.floor(Date.now() / 1000);
  const expiresIn = parseExpirySeconds(process.env.JWT_EXPIRES_IN || "7d");
  const header = { alg: "HS256", typ: "JWT" };
  const body = { ...payload, iat: now, exp: now + expiresIn };
  const unsignedToken = `${base64UrlJson(header)}.${base64UrlJson(body)}`;

  return `${unsignedToken}.${sign(unsignedToken, secret)}`;
}

export function verifyAuthToken(token: string) {
  const secret = getSecret();
  const [header, payload, signature] = token.split(".");

  if (!header || !payload || !signature) {
    throw new Error("Invalid auth token.");
  }

  const unsignedToken = `${header}.${payload}`;
  const expectedSignature = sign(unsignedToken, secret);
  const expectedBuffer = Buffer.from(expectedSignature);
  const actualBuffer = Buffer.from(signature);

  if (expectedBuffer.length !== actualBuffer.length || !timingSafeEqual(expectedBuffer, actualBuffer)) {
    throw new Error("Invalid auth token.");
  }

  const decoded = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as JwtPayload;

  if (decoded.exp && decoded.exp < Math.floor(Date.now() / 1000)) {
    throw new Error("Expired auth token.");
  }

  return decoded;
}
