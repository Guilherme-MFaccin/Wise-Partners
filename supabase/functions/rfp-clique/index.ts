// Clique em "falar com este parceiro": registra o clique, avisa consultor e parceiro e devolve
// o endereço do WhatsApp (ou do e-mail comercial) com a mensagem pronta.
import { cors, json } from "../_shared/cors.ts";
import { admin } from "../_shared/supabase.ts";
import { excedeuLimite, ipDe } from "../_shared/limite.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  const extra = { "X-Robots-Tag": "noindex, nofollow", "Cache-Control": "no-store" };
  if (excedeuLimite(`clique:${ipDe(req)}`, 20)) return json({ erro: "limite" }, 429, extra);
  try {
    const { token, parceiro_id } = await req.json();
    if (!/^[A-Za-z0-9_-]{30,100}$/.test(String(token ?? "")) || !/^[0-9a-f-]{36}$/.test(String(parceiro_id ?? ""))) {
      return json({ erro: "indisponivel" }, 200, extra);
    }
    const { data, error } = await admin().rpc("rfp_registrar_clique", {
      p_token: token,
      p_parceiro: parceiro_id,
      p_user_agent: (req.headers.get("user-agent") ?? "").slice(0, 200),
    });
    if (error) return json({ erro: "indisponivel" }, 200, extra);
    return json(data, 200, extra);
  } catch {
    return json({ erro: "indisponivel" }, 200, extra);
  }
});
