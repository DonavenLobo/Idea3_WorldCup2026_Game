import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn("Supabase env vars are missing. Copy apps/mobile/.env.example before wiring auth.");
}

export const supabase = createClient(supabaseUrl ?? "http://localhost:54321", supabaseAnonKey ?? "anon-key");
