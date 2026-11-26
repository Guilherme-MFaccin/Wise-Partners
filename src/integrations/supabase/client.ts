import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;
const SUPABASE_PUBLISHABLE_KEY = (import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ?? import.meta.env.VITE_SUPABASE_ANON_KEY) as string;

// Ver como (26/11/2026): a aba aberta pelo administrador ou pelo gerente guarda a sessão da conta visualizada só nela
// (sessionStorage, com chave própria), sem tocar na sessão de quem abriu, que fica no localStorage.
function lerModoVerComo() {
  try {
    return window.location.pathname.startsWith("/ver-como") || sessionStorage.getItem("wp_ver_como") !== null;
  } catch {
    return false;
  }
}
export const MODO_VER_COMO = typeof window !== "undefined" && lerModoVerComo();

// Cliente sem tipos gerados: as regras de acesso estão na RLS do banco, não na interface.
export const supabase = createClient<any>(SUPABASE_URL ?? "http://localhost:54321", SUPABASE_PUBLISHABLE_KEY ?? "anon", {
  auth: {
    storage: MODO_VER_COMO ? sessionStorage : localStorage, persistSession: true, autoRefreshToken: true, detectSessionInUrl: true, flowType: "pkce",
    ...(MODO_VER_COMO ? { storageKey: "wp-ver-como-auth" } : {}),
  },
});
