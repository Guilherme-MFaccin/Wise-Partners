// Página do cliente do parceiro (/c/:codigo). Sem login.
// GET ?codigo=: nome e logo do parceiro, vídeo e IDs de medição (os mesmos da página dos parceiros).
// POST {acao:"cadastro"}: cadastro de qualificação; devolve se está no ICP (agenda) ou se segue para o autodiagnóstico.
// POST {acao:"diagnostico"}: respostas da Matriz 5x5; o banco calcula o resultado e devolve o link do Wise Hub.
import { cors, erro, json } from "../_shared/cors.ts";
import { admin } from "../_shared/supabase.ts";
import { excedeuLimite, ipDe } from "../_shared/limite.ts";

const SEM_CACHE = { "X-Robots-Tag": "noindex, nofollow", "Cache-Control": "no-store" };

function texto(v: unknown, max: number) {
  return String(v ?? "").replace(/[\u0000-\u001f]/g, " ").trim().slice(0, max);
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  const ip = ipDe(req);
  const sb = admin();
  try {
    if (req.method === "GET") {
      if (excedeuLimite(`lcl:${ip}`, 60)) return erro("Muitas requisições. Tente de novo em instantes.", 429);
      const codigo = texto(new URL(req.url).searchParams.get("codigo"), 40).toLowerCase();
      const [{ data: cfg }, { data: med }, { data: link }] = await Promise.all([
        sb.from("config_landing_cliente").select("publicada, video_url").eq("id", 1).maybeSingle(),
        sb.from("config_landing").select("pixel_meta_id, ga4_id, privacidade_versao").eq("id", 1).maybeSingle(),
        sb.from("links_cliente").select("parceiro_id, ativo").eq("codigo", codigo).maybeSingle(),
      ]);
      let parceiro: { nome: string; logo_url: string | null } | null = null;
      if (link?.ativo) {
        const { data: p } = await sb.from("parceiros").select("nome_fantasia, logo_caminho, data_encerramento").eq("id", link.parceiro_id).maybeSingle();
        const { data: assinado } = await sb.rpc("parceiro_assinado", { p_id: link.parceiro_id });
        if (p && assinado && !p.data_encerramento) {
          const logo = p.logo_caminho ? sb.storage.from("logos").getPublicUrl(p.logo_caminho).data.publicUrl : null;
          parceiro = { nome: p.nome_fantasia, logo_url: logo };
        }
      }
      return json({
        publicada: !!cfg?.publicada, parceiro, video_url: cfg?.video_url ?? null,
        pixel_meta_id: med?.pixel_meta_id ?? null, ga4_id: med?.ga4_id ?? null, privacidade_versao: med?.privacidade_versao ?? null,
      }, 200, SEM_CACHE);
    }
    if (req.method !== "POST") return erro("Método não aceito.", 405);
    const b = await req.json().catch(() => ({}));

    if (b?.acao === "diagnostico") {
      if (excedeuLimite(`lcd:${ip}`, 20, 3_600_000)) return erro("Muitas tentativas a partir desta conexão. Tente de novo mais tarde.", 429);
      const resp: Record<string, number> = {};
      for (const [k, v] of Object.entries(b?.respostas ?? {})) {
        if (/^[a-z]{4,12}\.[a-z]{4,12}$/.test(k) && Number.isInteger(v)) resp[k] = v as number;
      }
      const { data, error } = await sb.rpc("registrar_diagnostico_cliente", {
        p_id: texto(b?.id, 40), p_chave: texto(b?.chave, 80), p_respostas: resp,
      });
      if (error) return erro(error.message.replace(/^.*?: /, ""));
      return json(data, 200, SEM_CACHE);
    }

    if (excedeuLimite(`lcc:${ip}`, 8, 3_600_000)) return erro("Muitas tentativas a partir desta conexão. Tente de novo mais tarde.", 429);
    if (texto(b?.website, 200)) return json({ icp: false, id: null }); // campo oculto preenchido: robô
    const dados = {
      codigo: texto(b?.codigo, 40), nome: texto(b?.nome, 120), email: texto(b?.email, 160).toLowerCase(), whatsapp: texto(b?.whatsapp, 40),
      empresa: texto(b?.empresa, 160), cnpj: texto(b?.cnpj, 20), cargo: texto(b?.cargo, 120), faturamento_faixa: texto(b?.faturamento_faixa, 20),
      vendedores: /^\d{1,6}$/.test(String(b?.vendedores ?? "")) ? String(b.vendedores) : "", segmento: texto(b?.segmento, 120),
      desafio: texto(b?.desafio, 600), autoriza_parceiro: b?.autoriza_parceiro === true, aceite_privacidade: b?.aceite_privacidade === true,
      utm_source: texto(b?.utm_source, 120), utm_medium: texto(b?.utm_medium, 120), utm_campaign: texto(b?.utm_campaign, 120),
      utm_content: texto(b?.utm_content, 120), utm_term: texto(b?.utm_term, 120), referencia: texto(b?.referencia, 300),
    };
    const { data, error } = await sb.rpc("cadastrar_cliente_parceiro", { p: dados });
    if (error) return erro(error.message.replace(/^.*?: /, ""));
    return json(data, 200, SEM_CACHE);
  } catch (e) {
    return erro(e instanceof Error ? e.message : String(e), 500);
  }
});
