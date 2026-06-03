// Server-side Supabase client — uses cookies to forward the user's auth session.
// In Next.js 16, cookies() is async; always await createClient() before use.
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { Database } from "@/types/database";

export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient<Database>(
    process.env["NEXT_PUBLIC_SUPABASE_URL"]!,
    process.env["NEXT_PUBLIC_SUPABASE_ANON_KEY"]!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            for (const { name, value, options } of cookiesToSet)
              cookieStore.set(name, value, options);
          } catch {
            // setAll called from a Server Component — cookies cannot be set
            // here but the read path still works for RSC data fetching.
          }
        },
      },
    }
  );
}
