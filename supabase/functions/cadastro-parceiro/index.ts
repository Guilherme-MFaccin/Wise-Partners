// Cadastro pela página do portal (/parceiros), a entrada única de qualquer empresa (26/11/2026): clientes do Grupo
// Tríade, quem quer ser parceiro e quem quer entrar na comunidade. Sem login.
// GET: o que a página precisa (categorias, vídeo, IDs de medição, conteúdo editável, valores de referência, perfil da
// reunião e cases) ou, com ?texto=termo|privacidade, o texto vigente.
// POST: todo cadastro entra na fila e avisa o gerente da comunidade com o perfil declarado. Ele confere quem é e adiciona
// como cliente do grupo, empresa da comunidade ou parceiro (depois da conversa de entrada); o acesso sai com senha provisória.
import { cors, erro, json } from "../_shared/cors.ts";
import { admin } from "../_shared/supabase.ts";
import { excedeuLimite, ipDe } from "../_shared/limite.ts";
import { COLUNAS_CLIENTE, icp, valores } from "../_shared/paginas.ts";

const SEM_CACHE = { "X-Robots-Tag": "noindex, nofollow", "Cache-Control": "no-store" };

function texto(v: unknown, max: number) {
  return String(v ?? "").replace(/[\u0000-\u001f]/g, " ").trim().slice(0, max);
}

async function sha256(v: string) {
  const h = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(v));
  return [...new Uint8Array(h)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

// API de Conversões do Meta: evento de cadastro pelo servidor, com o mesmo event_id do pixel (sem contar duas vezes).
async function eventoMeta(pixel: string, b: Record<string, unknown>, email: string, whatsapp: string, req: Request) {
  const token = Deno.env.get("META_CAPI_TOKEN");
  if (!token || !pixel) return;
  const fone = whatsapp.replace(/\D/g, "");
  const corpo = {
    data: [{
      event_name: "CompleteRegistration",
      event_time: Math.floor(Date.now() / 1000),
      event_id: texto(b.event_id, 80) || undefined,
      action_source: "website",
      event_source_url: texto(b.pagina, 500) || undefined,
      user_data: {
        em: [await sha256(email)],
        ph: fone ? [await sha256(fone.startsWith("55") ? fone : `55${fone}`)] : undefined,
        client_ip_address: ipDe(req),
        client_user_agent: req.headers.get("user-agent") ?? undefined,
        fbc: texto(b.fbc, 300) || undefined,
        fbp: texto(b.fbp, 300) || undefined,
      },
    }],
  };
  await fetch(`https://graph.facebook.com/v21.0/${pixel}/events?access_token=${encodeURIComponent(token)}`, {
    method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(corpo),
  }).catch(() => {});
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  const ip = ipDe(req);
  const sb = admin();
  try {
    if (req.method === "GET") {
      if (excedeuLimite(`lp:${ip}`, 60)) return erro("Muitas requisições. Tente de novo em instantes.", 429);
      const qual = new URL(req.url).searchParams.get("texto");
      const { data: cfg } = await sb.from("config_landing").select("*").eq("id", 1).maybeSingle();
      if (!cfg) return json({ publicada: false }, 200, SEM_CACHE);
      if (qual === "termo") return json({ titulo: "Termo de adesão", versao: cfg.termo_versao, texto: cfg.termo_texto }, 200, SEM_CACHE);
      if (qual === "privacidade") {
        return json({ titulo: "Política de privacidade", versao: cfg.privacidade_versao, texto: cfg.privacidade_texto, contato: cfg.contato_privacidade }, 200, SEM_CACHE);
      }
      // Parceiro de qualquer categoria: comerciais e institucionais (federações, Sistema S, associações, universidades)
      const [{ data: cats }, { data: cli }, { data: cases }, { data: grupo }, { data: resumo }, { data: com }] = await Promise.all([
        sb.from("categorias").select("id, nome, tipo, ordem").in("tipo", ["comercial", "institucional"]).eq("ativa", true)
          .order("ordem").order("nome"),
        sb.from("config_landing_cliente").select(COLUNAS_CLIENTE).eq("id", 1).maybeSingle(),
        sb.rpc("resumo_cases"),
        sb.from("empresas_grupo").select("id, codigo, nome, site, descricao_institucional, ordem").order("ordem"),
        sb.rpc("resumo_comunidade"),
        sb.from("config_comunidade").select("termo_uso_versao").eq("id", 1).maybeSingle(),
      ]);
      return json({
        publicada: cfg.publicada, video_url: cfg.video_url, video_formato: cfg.video_formato ?? "auto", modo_cadastro: cfg.modo_cadastro ?? "fila", pixel_meta_id: cfg.pixel_meta_id, ga4_id: cfg.ga4_id,
        termo_versao: cfg.termo_versao, categorias: (cats ?? []).map((c) => ({ id: c.id, nome: c.nome, grupo: c.tipo })),
        conteudo: cfg.conteudo ?? {}, valores: valores(cli), icp: icp(cli), cases: cases ?? null,
        empresas_grupo: (grupo ?? []).map((e) => ({ id: e.id, codigo: e.codigo, nome: e.nome, site: e.site, descricao: e.descricao_institucional })),
        resumo: resumo ?? null, termo_uso_versao: com?.termo_uso_versao ?? null,
      }, 200, SEM_CACHE);
    }
    if (req.method !== "POST") return erro("Método não aceito.", 405);
    if (excedeuLimite(`lpc:${ip}`, 8, 3_600_000)) return erro("Muitas tentativas a partir desta conexão. Tente de novo mais tarde.", 429);

    const b = await req.json().catch(() => ({}));
    if (texto(b?.website, 200)) return json({ ok: true, fila: true }); // campo oculto preenchido: robô
    // Todo cadastro entra na fila; o acesso só sai depois que o gerente confere quem é (e, para parceiro, da conversa de entrada)
    const email = texto(b?.email, 160).toLowerCase();
    const whatsapp = texto(b?.whatsapp, 40);
    const dados = {
      nome: texto(b?.nome, 120), email, whatsapp, empresa: texto(b?.empresa, 160), cnpj: texto(b?.cnpj, 20),
      categoria_id: texto(b?.categoria_id, 40), clientes_ativos: /^\d{1,7}$/.test(String(b?.clientes_ativos ?? "")) ? String(b.clientes_ativos) : "",
      site: texto(b?.site, 200), cargo: texto(b?.cargo, 120),
      utm_source: texto(b?.utm_source, 120), utm_medium: texto(b?.utm_medium, 120), utm_campaign: texto(b?.utm_campaign, 120),
      utm_content: texto(b?.utm_content, 120), utm_term: texto(b?.utm_term, 120), fbclid: texto(b?.fbclid, 300),
      referencia: texto(b?.referencia, 300), aceite_termo: b?.aceite_termo === true, aceite_privacidade: b?.aceite_privacidade === true,
      aceite_uso: b?.aceite_uso === true, cliente_grupo: b?.cliente_grupo === true,
      empresas_grupo: Array.isArray(b?.empresas_grupo) ? b.empresas_grupo.slice(0, 5).map((x: unknown) => texto(x, 40)) : [],
      interesses: Array.isArray(b?.interesses) ? b.interesses.slice(0, 6).map((x: unknown) => texto(x, 40)) : [],
      segmento: texto(b?.segmento, 160), cidade: texto(b?.cidade, 80), uf: texto(b?.uf, 2), faturamento: texto(b?.faturamento, 20),
      vendedores: /^\d{1,5}$/.test(String(b?.vendedores ?? "")) ? String(b.vendedores) : "", como_conheceu: texto(b?.como_conheceu, 160),
    };

    const { data: fila, error: e } = await sb.rpc("entrar_fila_landing", { p: dados });
    if (e) return erro(e.message.replace(/^.*?: /, ""), e.code === "23505" ? 409 : 400);
    const { data: c } = await sb.from("config_landing").select("pixel_meta_id, capi_ativa").eq("id", 1).maybeSingle();
    if (c?.capi_ativa && c.pixel_meta_id) await eventoMeta(c.pixel_meta_id, b, email, whatsapp, req);
    return json({ ok: true, fila: true, perfil: fila?.perfil ?? "parceiro" });
  } catch (e) {
    return erro(e instanceof Error ? e.message : String(e), 500);
  }
});
