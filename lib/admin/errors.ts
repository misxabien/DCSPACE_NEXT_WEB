import { NextResponse } from "next/server";

type AppError = Error & { status?: number };

const ERROR_MAP: Record<string, number> = {
  AdminAuthorizationError: 403,
  AuthorizationError: 403,
  AuthenticationError: 401,
  ValidationError: 400,
  NotFoundError: 404,
  ConflictError: 409,
  DatabaseConnectionError: 500,
};

/**
 * Maps a thrown error to a standardised JSON error response.
 *
 * Use this instead of per-route `toErrorResponse` helpers so every admin
 * API route returns the same `{ error, code }` shape.
 */
export function toErrorResponse(error: unknown): NextResponse {
  if (!(error instanceof Error)) {
    return NextResponse.json(
      { error: "Internal Server Error", code: 500 },
      { status: 500 },
    );
  }

  const appError = error as AppError;
  const status =
    appError.status ?? ERROR_MAP[appError.name] ?? 500;

  return NextResponse.json(
    { error: appError.message || "Internal Server Error", code: status },
    { status },
  );
}
