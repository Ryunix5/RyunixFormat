import { createClient } from "@supabase/supabase-js";

// Support both VITE_ and NEXT_PUBLIC_ prefixes for compatibility
const url = (import.meta.env.VITE_SUPABASE_URL || import.meta.env.NEXT_PUBLIC_SUPABASE_URL) as string;
const anon = (import.meta.env.VITE_SUPABASE_ANON_KEY || import.meta.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) as string;

if (!url || !anon) {
  console.error("Environment variables:", {
    VITE_SUPABASE_URL: import.meta.env.VITE_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_URL: import.meta.env.NEXT_PUBLIC_SUPABASE_URL,
    VITE_SUPABASE_ANON_KEY: import.meta.env.VITE_SUPABASE_ANON_KEY ? 'present' : 'missing',
    NEXT_PUBLIC_SUPABASE_ANON_KEY: import.meta.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'present' : 'missing',
  });
  throw new Error("Missing VITE_SUPABASE_URL/NEXT_PUBLIC_SUPABASE_URL or VITE_SUPABASE_ANON_KEY/NEXT_PUBLIC_SUPABASE_ANON_KEY");
}

export const supabase = createClient(url, anon);