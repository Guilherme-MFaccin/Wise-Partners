// Página pública de RFP (/r/:token). Sem login: valida token, validade e revogação no banco
// e devolve só os blocos publicados e a disponibilidade de contato de cada parceiro.
import { cors, erro, json } from "../_shared/cors.ts";
import { admin } from "../_shared/supabase.ts";
import { excedeuLimite, ipDe } from "../_shared/limite.ts";

const SEM_INDEXACAO = { "X-Robots-Tag": "noindex, nofollow", "Cache-Control": "no-store" };

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (excedeuLimite(`pag:${ipDe(req)}`, 30)) return json({ erro: "Muitas requisições. Tente em instantes." }, 429, SEM_INDEXACAO);
  try {
    const url = new URL(req.url);
    let token = url.searchParams.get("token") ?? "";
    if (!token && req.method === "POST") token = String((await req.json().catch(() => ({})))?.token ?? "");
    if (!/^[A-Za-z0-9_-]{30,100}$/.test(token)) return json({ estado: "nao_encontrada" }, 200, SEM_INDEXACAO);
    const { data, error } = await admin().rpc("rfp_pagina_publica", {
      p_token: token,
      p_user_agent: (req.headers.get("user-agent") ?? "").slice(0, 200),
    });
    if (error) return erro("Não foi possível abrir a página.", 500);
    return json(data, 200, SEM_INDEXACAO);
  } catch {
    return erro("Não foi possível abrir a página.", 500);
  }
});
