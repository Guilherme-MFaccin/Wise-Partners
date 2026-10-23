import { createClient, type SupabaseClient } from "npm:@supabase/supabase-js@2";

const URL = Deno.env.get("SUPABASE_URL")!;
const ANON = Deno.env.get("SUPABASE_ANON_KEY")!;
const SERVICE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

// Cliente com a service_role: ignora a RLS. Só para rotinas e funções públicas controladas.
export function admin(): SupabaseClient {
  return createClient(URL, SERVICE, { auth: { persistSession: false, autoRefreshToken: false } });
}

// Cliente com o token de quem chamou: a RLS vale normalmente.
export function doUsuario(req: Request): SupabaseClient {
  return createClient(URL, ANON, {
    global: { headers: { Authorization: req.headers.get("Authorization") ?? "" } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export type Perfil = {
  id: string;
  nome: string;
  email: string;
  papel: "admin" | "parcerias" | "consultor" | "comercial" | "financeiro" | "parceiro";
  parceiro_id: string | null;
  empresa_grupo_id: string | null;
  is_diretor: boolean;
  is_responsavel_parceiro: boolean;
  ativo: boolean;
};

// Perfil ativo de quem chamou, ou null.
export async function perfilDaRequisicao(req: Request): Promise<Perfil | null> {
  const cliente = doUsuario(req);
  const { data: u } = await cliente.auth.getUser();
  if (!u?.user) return null;
  const { data } = await cliente.from("perfis").select("*").eq("id", u.user.id).maybeSingle();
  return data && data.ativo ? (data as Perfil) : null;
}

// Rotinas agendadas chamam com o cabeçalho x-cron-secret.
export function ehRotina(req: Request) {
  const segredo = Deno.env.get("CRON_SECRET");
  return !!segredo && req.headers.get("x-cron-secret") === segredo;
}

export async function urlDoApp(sb: SupabaseClient): Promise<string> {
  const env = Deno.env.get("APP_URL");
  if (env) return env.replace(/\/$/, "");
  const { data } = await sb.from("configuracoes").select("valor").eq("chave", "app_url").maybeSingle();
  return String(data?.valor ?? "").replace(/\/$/, "");
}

// Data e hora em Brasília
export function agoraBrasilia() {
  const partes = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Sao_Paulo", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", hour12: false, weekday: "short",
  }).formatToParts(new Date());
  const v = (t: string) => partes.find((p) => p.type === t)?.value ?? "";
  const dias: Record<string, number> = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
  return { data: `${v("year")}-${v("month")}-${v("day")}`, hora: Number(v("hour")) % 24, diaSemana: dias[v("weekday")] };
}
