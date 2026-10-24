// Página pública do link exclusivo de indicação (/i/:token, FR-128 a FR-130). Sem login.
// GET devolve só nome do parceiro, empresas atendidas e perguntas do ICP.
// POST registra a indicação e SEMPRE devolve a mesma resposta neutra (token inválido, revogado,
// limite estourado, campo oculto preenchido e duplicidade não se distinguem por fora).
import { cors, json } from "../_shared/cors.ts";
import { admin } from "../_shared/supabase.ts";
import { excedeuLimite, ipDe } from "../_shared/limite.ts";

const SEM_INDEXACAO = { "X-Robots-Tag": "noindex, nofollow", "Cache-Control": "no-store" };
const NEUTRO = { ok: true };

// Hash do IP com o dia: serve para o limite por origem sem guardar o endereço
async function hashOrigem(ip: string) {
  const dia = new Date().toISOString().slice(0, 10);
  const segredo = Deno.env.get("CRON_SECRET") ?? "";
  const dados = new TextEncoder().encode(`${ip}|${dia}|${segredo}`);
  const h = await crypto.subtle.digest("SHA-256", dados);
  return [...new Uint8Array(h)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

function texto(v: unknown, max: number) {
  return String(v ?? "").replace(/[\u0000-\u001f]/g, " ").trim().slice(0, max);
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  const ip = ipDe(req);
  try {
    if (req.method === "GET") {
      if (excedeuLimite(`ig:${ip}`, 30)) return json({ estado: "indisponivel" }, 200, SEM_INDEXACAO);
      const token = new URL(req.url).searchParams.get("token") ?? "";
      if (!/^[A-Za-z0-9_-]{30,100}$/.test(token)) return json({ estado: "indisponivel" }, 200, SEM_INDEXACAO);
      const { data, error } = await admin().rpc("link_indicacao_publico", { p_token: token });
      if (error) return json({ estado: "indisponivel" }, 200, SEM_INDEXACAO);
      return json(data, 200, SEM_INDEXACAO);
    }
    if (req.method !== "POST") return json(NEUTRO, 200, SEM_INDEXACAO);
    if (excedeuLimite(`ip:${ip}`, 10, 3_600_000)) return json(NEUTRO, 200, SEM_INDEXACAO);
    const b = await req.json().catch(() => ({}));
    const token = texto(b?.token, 100);
    if (!/^[A-Za-z0-9_-]{30,100}$/.test(token)) return json(NEUTRO, 200, SEM_INDEXACAO);
    const icp: Record<string, boolean> = {};
    for (const [k, v] of Object.entries(b?.aderencia_icp ?? {})) if (/^[a-z_]{1,40}$/.test(k)) icp[k] = v === true;
    const dados = {
      empresa: texto(b?.empresa, 20),
      cliente_razao_social: texto(b?.cliente_razao_social, 200),
      cliente_cnpj: texto(b?.cliente_cnpj, 20),
      contato_nome: texto(b?.contato_nome, 120),
      contato_cargo: texto(b?.contato_cargo, 120),
      contato_email: texto(b?.contato_email, 160),
      contato_telefone: texto(b?.contato_telefone, 40),
      necessidade: texto(b?.necessidade, 2000),
      aderencia_icp: icp,
      consentimento: b?.consentimento === true,
      website: texto(b?.website, 200), // campo oculto: pessoas não preenchem
    };
    await admin().rpc("indicacao_publica", { p_token: token, p_dados: dados, p_origem_hash: await hashOrigem(ip) });
    return json(NEUTRO, 200, SEM_INDEXACAO);
  } catch {
    return json(NEUTRO, 200, SEM_INDEXACAO);
  }
});
