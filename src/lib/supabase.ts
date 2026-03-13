import { createClient } from "@supabase/supabase-js";
import type { Database } from "./database.types";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Client-side client (uses anon key, respects RLS)
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);

// Server-side admin client (only use in server components / API routes)
export function createServerSupabase() {
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  return createClient<Database>(supabaseUrl, serviceKey ?? supabaseAnonKey, {
    auth: { persistSession: false },
  });
}
