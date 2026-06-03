import type { ActionResult, ApiErrorResponse, ApiSuccessResponse } from "@/types";

// ── Error classes ──────────────────────────────────────────────────────────────

export class AppError extends Error {
  readonly code: string;
  readonly statusCode: number;

  constructor(message: string, code: string, statusCode = 500) {
    super(message);
    this.name = "AppError";
    this.code = code;
    this.statusCode = statusCode;
  }
}

export class ForbiddenError extends AppError {
  constructor(message = "You do not have permission to perform this action.") {
    super(message, "FORBIDDEN", 403);
    this.name = "ForbiddenError";
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = "Authentication required.") {
    super(message, "UNAUTHORIZED", 401);
    this.name = "UnauthorizedError";
  }
}

export class NotFoundError extends AppError {
  constructor(resource = "Resource") {
    super(`${resource} not found.`, "NOT_FOUND", 404);
    this.name = "NotFoundError";
  }
}

export class PaymentRequiredError extends AppError {
  constructor(message = "An active subscription is required.") {
    super(message, "PAYMENT_REQUIRED", 402);
    this.name = "PaymentRequiredError";
  }
}

export class ValidationError extends AppError {
  constructor(message: string) {
    super(message, "VALIDATION_ERROR", 422);
    this.name = "ValidationError";
  }
}

// ── Server action result helpers ───────────────────────────────────────────────
// All server actions return { data, error } — never throw to the client.

export function ok<T>(data: T): ActionResult<T> {
  return { data, error: null };
}

export function err(error: AppError | { code: string; message: string }): ActionResult<never> {
  return {
    data: null,
    error: { code: error.code, message: error.message },
  };
}

export function fromError(e: unknown): ActionResult<never> {
  if (e instanceof AppError) return err(e);
  const message = e instanceof Error ? e.message : "An unexpected error occurred.";
  return err({ code: "INTERNAL_ERROR", message });
}

// ── REST API response helpers ──────────────────────────────────────────────────

export function apiSuccess<T>(data: T, requestId: string): ApiSuccessResponse<T> {
  return { data, meta: { version: "1", requestId } };
}

export function apiError(code: string, message: string, details?: unknown): ApiErrorResponse {
  return { error: { code, message, ...(details !== undefined ? { details } : {}) } };
}

export function apiErrorFromAppError(e: AppError): ApiErrorResponse {
  return apiError(e.code, e.message);
}

// ── HTTP response helpers ──────────────────────────────────────────────────────

export function jsonResponse<T>(body: T, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

export function errorResponse(e: unknown, requestId: string): Response {
  if (e instanceof AppError) {
    return jsonResponse(apiError(e.code, e.message), e.statusCode);
  }
  // Never expose internal errors externally.
  return jsonResponse(apiError("INTERNAL_ERROR", "An unexpected error occurred."), 500);
}
