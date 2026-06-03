"use client";

import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "@/types/database";

// Browser-side Supabase client. Uses the anon key — subject to RLS policies.
// Call this inside Client Components; never on the server.
export function createClient() {
  return createBrowserClient<Database>(
    process.env["NEXT_PUBLIC_SUPABASE_URL"]!,
    process.env["NEXT_PUBLIC_SUPABASE_ANON_KEY"]!
  );
}
