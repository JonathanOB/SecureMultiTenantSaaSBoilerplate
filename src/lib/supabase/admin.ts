// Service-role Supabase client — bypasses RLS entirely.
// NEVER import this in client-side code or expose the key to the browser.
import "server-only";

import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

export function createAdminClient() {
  const url = process.env["NEXT_PUBLIC_SUPABASE_URL"];
  const key = process.env["SUPABASE_SERVICE_ROLE_KEY"];

  if (!url || !key) {
    throw new Error("NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set.");
  }

  return createClient<Database>(url, key, {
    auth: {
      // Service-role clients don't need session management.
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
