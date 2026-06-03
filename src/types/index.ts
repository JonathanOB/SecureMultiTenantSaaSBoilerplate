// Central type re-exports — import from "@/types" throughout the app.

export type { Json, Database, Tables, Enums } from "./database";
export type {
  ApiSuccessResponse,
  ApiErrorResponse,
  ApiResponse,
  ActionResult,
  PaginationParams,
  PaginatedList,
} from "./api";

// ── Prisma enum mirrors ────────────────────────────────────────────────────
// Kept in sync with prisma/schema.prisma. Centralised so UI code doesn't
// import from @prisma/client directly (which is server-only).

export type UserRole = "SUPERADMIN" | "MEMBER";

export type OrgRole = "OWNER" | "ADMIN" | "MEMBER" | "VIEWER";

export type SubscriptionStatus =
  | "active"
  | "trialing"
  | "past_due"
  | "canceled"
  | "incomplete"
  | "incomplete_expired"
  | "paused"
  | "unpaid";

// ── Utility types ──────────────────────────────────────────────────────────

export type WithId<T> = T & { id: string };

/** Make every property in T and its nested objects optional. */
export type DeepPartial<T> = {
  [K in keyof T]?: T[K] extends object ? DeepPartial<T[K]> : T[K];
};

/** Branded nominal type to prevent mixing up string IDs. */
export type Brand<T, B extends string> = T & { readonly __brand: B };

export type OrgId = Brand<string, "OrgId">;
export type UserId = Brand<string, "UserId">;
