import type { OrgRole } from "@/types";
import { ForbiddenError } from "@/lib/api/response";

// ── Permission definitions ─────────────────────────────────────────────────────

export type Permission =
  | "org:read"
  | "org:update"
  | "org:delete"
  | "member:invite"
  | "member:remove"
  | "member:role:update"
  | "billing:read"
  | "billing:manage"
  | "apikey:create"
  | "apikey:revoke"
  | "auditlog:read"
  | "file:upload"
  | "file:delete";

// ── Role → permissions matrix ──────────────────────────────────────────────────

const ROLE_PERMISSIONS: Record<OrgRole, Permission[]> = {
  OWNER: [
    "org:read",
    "org:update",
    "org:delete",
    "member:invite",
    "member:remove",
    "member:role:update",
    "billing:read",
    "billing:manage",
    "apikey:create",
    "apikey:revoke",
    "auditlog:read",
    "file:upload",
    "file:delete",
  ],
  ADMIN: [
    "org:read",
    "org:update",
    "member:invite",
    "member:remove",
    "member:role:update",
    "billing:read",
    "apikey:create",
    "apikey:revoke",
    "auditlog:read",
    "file:upload",
    "file:delete",
  ],
  MEMBER: [
    "org:read",
    "billing:read",
    "apikey:create",
    "apikey:revoke",
    "file:upload",
    "file:delete",
  ],
  VIEWER: ["org:read", "billing:read", "auditlog:read"],
};

// ── Pure check ─────────────────────────────────────────────────────────────────

export function hasPermission(role: OrgRole, permission: Permission): boolean {
  const perms = ROLE_PERMISSIONS[role];
  return perms.includes(permission);
}

// ── Server action guard ────────────────────────────────────────────────────────
// Throws ForbiddenError so the calling action can catch it and return { error }.

export function requirePermission(role: OrgRole, permission: Permission): void {
  if (!hasPermission(role, permission)) {
    throw new ForbiddenError(`Role "${role}" does not have permission "${permission}".`);
  }
}

// ── React component gate ───────────────────────────────────────────────────────

import type { ReactNode } from "react";

type PermissionGateProps = {
  role: OrgRole;
  permission: Permission;
  fallback?: ReactNode;
  children: ReactNode;
};

export function PermissionGate({
  role,
  permission,
  fallback = null,
  children,
}: PermissionGateProps): ReactNode {
  return hasPermission(role, permission) ? children : fallback;
}
