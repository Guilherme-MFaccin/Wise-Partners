import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;
const SUPABASE_PUBLISHABLE_KEY = (import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ?? import.meta.env.VITE_SUPABASE_ANON_KEY) as string;

// Cliente sem tipos gerados: as regras de acesso estão na RLS do banco, não na interface.
export const supabase = createClient<any>(SUPABASE_URL ?? "http://localhost:54321", SUPABASE_PUBLISHABLE_KEY ?? "anon", {
  auth: { storage: localStorage, persistSession: true, autoRefreshToken: true, detectSessionInUrl: true, flowType: "pkce" },
});
