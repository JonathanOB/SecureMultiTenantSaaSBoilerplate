-- Supabase Row-Level Security policies for the multi-tenant SaaS boilerplate.
-- Run this once against your Supabase project after `prisma migrate deploy`.
--
-- This setup assumes Clerk JWTs are forwarded to Supabase:
--   1. Create a Clerk JWT template with audience "supabase".
--   2. In Supabase Dashboard → Auth → JWT Settings, add Clerk's JWKS URL.
--   3. Pass the Clerk session token as the Supabase auth token (see lib/supabase).
--
-- All Prisma-generated table names are PascalCase and require double-quoting.

-- ── Helper functions ──────────────────────────────────────────────────────────

-- Extract the Clerk user ID from the JWT `sub` claim.
CREATE OR REPLACE FUNCTION public.requesting_user_clerk_id()
RETURNS TEXT
LANGUAGE SQL
STABLE
AS $$
  SELECT NULLIF(
    COALESCE(
      current_setting('request.jwt.claims', true)::jsonb ->> 'sub',
      ''
    ),
    ''
  )
$$;

-- Extract the active org ID from the JWT `org_id` claim.
-- Clerk populates this when the user has an active organization.
CREATE OR REPLACE FUNCTION public.requesting_org_id()
RETURNS TEXT
LANGUAGE SQL
STABLE
AS $$
  SELECT NULLIF(
    COALESCE(
      current_setting('request.jwt.claims', true)::jsonb ->> 'org_id',
      ''
    ),
    ''
  )
$$;

-- SECURITY DEFINER runs as the function owner (bypasses RLS on User table),
-- preventing infinite recursion when User's own RLS checks is_superadmin().
CREATE OR REPLACE FUNCTION public.is_superadmin()
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM "User" u
    WHERE u."clerkId" = public.requesting_user_clerk_id()
      AND u.role = 'SUPERADMIN'
  )
$$;

-- ── Enable RLS ────────────────────────────────────────────────────────────────

ALTER TABLE "User"                   ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Organization"           ENABLE ROW LEVEL SECURITY;
ALTER TABLE "OrganizationMembership" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ApiKey"                 ENABLE ROW LEVEL SECURITY;
ALTER TABLE "AuditLog"               ENABLE ROW LEVEL SECURITY;
ALTER TABLE "UploadedFile"           ENABLE ROW LEVEL SECURITY;

-- ── User policies ─────────────────────────────────────────────────────────────

CREATE POLICY "user_select_own_or_superadmin" ON "User"
  FOR SELECT
  USING (
    "clerkId" = public.requesting_user_clerk_id()
    OR public.is_superadmin()
  );

CREATE POLICY "user_update_own" ON "User"
  FOR UPDATE
  USING ("clerkId" = public.requesting_user_clerk_id())
  WITH CHECK ("clerkId" = public.requesting_user_clerk_id());

-- Service-role bypasses RLS for webhook-driven inserts.
CREATE POLICY "user_insert_service_role" ON "User"
  FOR INSERT
  WITH CHECK (TRUE);

CREATE POLICY "user_delete_superadmin" ON "User"
  FOR DELETE
  USING (public.is_superadmin());

-- ── Organization policies ─────────────────────────────────────────────────────

CREATE POLICY "org_select_member_or_superadmin" ON "Organization"
  FOR SELECT
  USING (
    public.is_superadmin()
    OR id = public.requesting_org_id()
  );

CREATE POLICY "org_update_owner_or_superadmin" ON "Organization"
  FOR UPDATE
  USING (
    public.is_superadmin()
    OR id = public.requesting_org_id()
  )
  WITH CHECK (
    public.is_superadmin()
    OR id = public.requesting_org_id()
  );

CREATE POLICY "org_insert_authenticated" ON "Organization"
  FOR INSERT
  WITH CHECK (TRUE);

CREATE POLICY "org_delete_superadmin" ON "Organization"
  FOR DELETE
  USING (public.is_superadmin());

-- ── OrganizationMembership policies ──────────────────────────────────────────

CREATE POLICY "membership_select_own_org" ON "OrganizationMembership"
  FOR SELECT
  USING (
    "orgId" = public.requesting_org_id()
    OR public.is_superadmin()
  );

CREATE POLICY "membership_insert_own_org" ON "OrganizationMembership"
  FOR INSERT
  WITH CHECK (
    "orgId" = public.requesting_org_id()
    OR public.is_superadmin()
  );

CREATE POLICY "membership_update_own_org" ON "OrganizationMembership"
  FOR UPDATE
  USING ("orgId" = public.requesting_org_id() OR public.is_superadmin())
  WITH CHECK ("orgId" = public.requesting_org_id() OR public.is_superadmin());

CREATE POLICY "membership_delete_own_org" ON "OrganizationMembership"
  FOR DELETE
  USING (
    "orgId" = public.requesting_org_id()
    OR public.is_superadmin()
  );

-- ── ApiKey policies ───────────────────────────────────────────────────────────

CREATE POLICY "apikey_select_own_org" ON "ApiKey"
  FOR SELECT
  USING ("orgId" = public.requesting_org_id() OR public.is_superadmin());

CREATE POLICY "apikey_insert_own_org" ON "ApiKey"
  FOR INSERT
  WITH CHECK ("orgId" = public.requesting_org_id() OR public.is_superadmin());

CREATE POLICY "apikey_update_own_org" ON "ApiKey"
  FOR UPDATE
  USING ("orgId" = public.requesting_org_id() OR public.is_superadmin())
  WITH CHECK ("orgId" = public.requesting_org_id() OR public.is_superadmin());

CREATE POLICY "apikey_delete_own_org" ON "ApiKey"
  FOR DELETE
  USING ("orgId" = public.requesting_org_id() OR public.is_superadmin());

-- ── AuditLog policies ─────────────────────────────────────────────────────────
-- Audit logs are append-only: no UPDATE or DELETE for non-superadmins.

CREATE POLICY "auditlog_select_own_org" ON "AuditLog"
  FOR SELECT
  USING ("orgId" = public.requesting_org_id() OR public.is_superadmin());

CREATE POLICY "auditlog_insert_own_org" ON "AuditLog"
  FOR INSERT
  WITH CHECK ("orgId" = public.requesting_org_id() OR public.is_superadmin());

CREATE POLICY "auditlog_delete_superadmin" ON "AuditLog"
  FOR DELETE
  USING (public.is_superadmin());

-- ── UploadedFile policies ─────────────────────────────────────────────────────

CREATE POLICY "uploadedfile_select_own_org" ON "UploadedFile"
  FOR SELECT
  USING ("orgId" = public.requesting_org_id() OR public.is_superadmin());

CREATE POLICY "uploadedfile_insert_own_org" ON "UploadedFile"
  FOR INSERT
  WITH CHECK ("orgId" = public.requesting_org_id() OR public.is_superadmin());

CREATE POLICY "uploadedfile_delete_own_org" ON "UploadedFile"
  FOR DELETE
  USING ("orgId" = public.requesting_org_id() OR public.is_superadmin());

-- ── Supabase Storage bucket policies (run in Supabase dashboard) ──────────────
-- These enforce per-org path prefixes so users can never access other orgs' files.
-- Format: {orgId}/{userId}/{filename}
--
-- Example policy for the "avatars" bucket (set via Supabase dashboard):
--
-- INSERT: (storage.foldername(name))[1] = requesting_org_id()
-- SELECT: (storage.foldername(name))[1] = requesting_org_id() OR is_superadmin()
-- DELETE: (storage.foldername(name))[1] = requesting_org_id()
