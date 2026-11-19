// Página do cliente do parceiro (/c/:codigo). Sem login. A página é única e geral: não mostra nome, logo nem cor do parceiro.
// GET ?codigo=: se o link vale, vídeo, IDs de medição (os mesmos da página dos parceiros), conteúdo editável,
// valores de referência, perfil da reunião e cases. O código só serve para atribuir o cadastro ao parceiro.
// POST {acao:"cadastro"}: cadastro de qualificação; devolve se está no ICP (agenda) ou se segue para o autodiagnóstico.
// POST {acao:"diagnostico"}: respostas da Matriz 5x5; o banco calcula o resultado e devolve o link do Wise Hub.
import { cors, erro, json } from "../_shared/cors.ts";
import { admin } from "../_shared/supabase.ts";
import { excedeuLimite, ipDe } from "../_shared/limite.ts";
import { COLUNAS_CLIENTE, icp, valores } from "../_shared/paginas.ts";

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
      const [{ data: cfg }, { data: med }, { data: link }, { data: cases }] = await Promise.all([
        sb.from("config_landing_cliente").select(`publicada, video_url, video_formato, conteudo, ${COLUNAS_CLIENTE}`).eq("id", 1).maybeSingle(),
        sb.from("config_landing").select("pixel_meta_id, ga4_id, privacidade_versao").eq("id", 1).maybeSingle(),
        sb.from("links_cliente").select("parceiro_id, ativo, liberado_sem_contrato").eq("codigo", codigo).maybeSingle(),
        sb.rpc("resumo_cases"),
      ]);
      // A página é a mesma para todos: o código só confirma que o link vale (e atribui o cadastro no POST).
      // Nome, logo e cor do parceiro não saem daqui.
      let linkValido = false;
      if (link?.ativo) {
        const { data: p } = await sb.from("parceiros").select("data_encerramento").eq("id", link.parceiro_id).maybeSingle();
        const { data: assinado } = await sb.rpc("parceiro_assinado", { p_id: link.parceiro_id });
        linkValido = !!p && (!!assinado || !!link.liberado_sem_contrato) && !p.data_encerramento;
      }
      return json({
        publicada: !!cfg?.publicada, link_valido: linkValido, video_url: cfg?.video_url ?? null, video_formato: cfg?.video_formato ?? "auto",
        pixel_meta_id: med?.pixel_meta_id ?? null, ga4_id: med?.ga4_id ?? null, privacidade_versao: med?.privacidade_versao ?? null,
        conteudo: cfg?.conteudo ?? {}, valores: valores(cfg), icp: icp(cfg), cases: cases ?? null,
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
    // O nome do parceiro fica no banco (atribuição e avisos), mas não volta para a página
    const { parceiro: _parceiro, ...resposta } = (data ?? {}) as Record<string, unknown>;
    return json(resposta, 200, SEM_CACHE);
  } catch (e) {
    return erro(e instanceof Error ? e.message : String(e), 500);
  }
});
