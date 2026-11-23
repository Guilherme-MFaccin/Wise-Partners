// Comunidade Wise Partners: página pública (/comunidade) e cadastro (/comunidade/cadastro). Sem login.
// GET: o que a página precisa (conteúdo editável, vídeo, empresas do grupo, categorias, números do catálogo, valores,
// perfil da reunião e cases) ou, com ?texto=uso, o termo de uso vigente.
// POST: cria a empresa, o membro e a conta com a senha escolhida, numa ordem que pode ser desfeita. A pessoa entra
// direto no portal. Quem declarou ser cliente do grupo espera a confirmação da Wise para ver as condições; quem quer
// ser parceiro entra também na fila de candidatos (a entrada como parceiro continua pela conversa de entrada).
import { cors, erro, json } from "../_shared/cors.ts";
import { admin } from "../_shared/supabase.ts";
import { excedeuLimite, ipDe } from "../_shared/limite.ts";
import { COLUNAS_CLIENTE, icp, valores } from "../_shared/paginas.ts";

const SEM_CACHE = { "X-Robots-Tag": "noindex, nofollow", "Cache-Control": "no-store" };

function texto(v: unknown, max: number) {
  return String(v ?? "").replace(/[\u0000-\u001f]/g, " ").replace(/[–—]/g, ",").trim().slice(0, max);
}
const lista = (v: unknown, max = 10) => (Array.isArray(v) ? v.slice(0, max).map((x) => texto(x, 60)).filter(Boolean) : []);

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  const ip = ipDe(req);
  const sb = admin();
  try {
    if (req.method === "GET") {
      if (excedeuLimite(`com:${ip}`, 60)) return erro("Muitas requisições. Tente de novo em instantes.", 429);
      const { data: cfg } = await sb.from("config_comunidade").select("*").eq("id", 1).maybeSingle();
      if (!cfg) return json({ publicada: false }, 200, SEM_CACHE);
      if (new URL(req.url).searchParams.get("texto") === "uso") {
        return json({ titulo: "Termo de uso da Comunidade Wise Partners", versao: cfg.termo_uso_versao, texto: cfg.termo_uso_texto }, 200, SEM_CACHE);
      }
      const [{ data: grupo }, { data: cats }, { data: resumo }, { data: cli }, { data: cases }, { data: land }] = await Promise.all([
        sb.from("empresas_grupo").select("id, codigo, nome, site, descricao_institucional, ordem").order("ordem"),
        sb.from("categorias").select("id, nome, tipo, ordem").in("tipo", ["comercial", "institucional"]).eq("ativa", true).order("ordem").order("nome"),
        sb.rpc("resumo_comunidade"),
        sb.from("config_landing_cliente").select(COLUNAS_CLIENTE).eq("id", 1).maybeSingle(),
        sb.rpc("resumo_cases"),
        sb.from("config_landing").select("termo_versao, privacidade_versao").eq("id", 1).maybeSingle(),
      ]);
      return json({
        publicada: cfg.publicada, video_url: cfg.video_url, video_formato: cfg.video_formato ?? "auto", conteudo: cfg.conteudo ?? {},
        termo_uso_versao: cfg.termo_uso_versao, privacidade_versao: land?.privacidade_versao ?? null, termo_parceiro_versao: land?.termo_versao ?? null,
        empresas_grupo: (grupo ?? []).map((e) => ({ id: e.id, codigo: e.codigo, nome: e.nome, site: e.site, descricao: e.descricao_institucional })),
        categorias: (cats ?? []).map((c) => ({ id: c.id, nome: c.nome, grupo: c.tipo })),
        resumo: resumo ?? null, valores: valores(cli), icp: icp(cli), cases: cases ?? null,
      }, 200, SEM_CACHE);
    }
    if (req.method !== "POST") return erro("Método não aceito.", 405);
    if (excedeuLimite(`comc:${ip}`, 8, 3_600_000)) return erro("Muitas tentativas a partir desta conexão. Tente de novo mais tarde.", 429);

    const b = await req.json().catch(() => ({}));
    if (texto(b?.website, 200)) return json({ ok: true }); // campo oculto preenchido: robô
    const email = texto(b?.email, 160).toLowerCase();
    const senha = String(b?.senha ?? "");
    if (senha.length < 8 || senha.length > 72) return erro("A senha precisa ter de 8 a 72 caracteres.");
    if (!/[A-Za-z]/.test(senha) || !/\d/.test(senha)) return erro("Use letras e números na senha.");

    const dados = {
      nome: texto(b?.nome, 120), cargo: texto(b?.cargo, 120), email, whatsapp: texto(b?.whatsapp, 40),
      empresa: texto(b?.empresa, 160), cnpj: texto(b?.cnpj, 20), site: texto(b?.site, 200), cidade: texto(b?.cidade, 80), uf: texto(b?.uf, 2),
      segmento: texto(b?.segmento, 160), faturamento: texto(b?.faturamento, 20), vendedores: /^\d{1,5}$/.test(String(b?.vendedores ?? "")) ? String(b.vendedores) : "",
      cliente_grupo: b?.cliente_grupo === true, empresas_grupo: lista(b?.empresas_grupo, 5), interesses: lista(b?.interesses, 6),
      categoria_id: texto(b?.categoria_id, 40), clientes_ativos: /^\d{1,7}$/.test(String(b?.clientes_ativos ?? "")) ? String(b.clientes_ativos) : "",
      como_conheceu: texto(b?.como_conheceu, 160),
      utm_source: texto(b?.utm_source, 120), utm_medium: texto(b?.utm_medium, 120), utm_campaign: texto(b?.utm_campaign, 120),
      utm_content: texto(b?.utm_content, 120), referencia: texto(b?.referencia, 300),
      aceite_uso: b?.aceite_uso === true, aceite_privacidade: b?.aceite_privacidade === true, aceite_termo_parceiro: b?.aceite_termo_parceiro === true,
    };

    const { data: prep, error: e } = await sb.rpc("preparar_membro_comunidade", { p: dados });
    if (e) return erro(e.message.replace(/^.*?: /, ""), e.code === "23505" ? 409 : 400);

    // A conta nasce confirmada, com a senha escolhida; o gatilho do banco cria o perfil a partir do convite
    const novo = await sb.auth.admin.createUser({ email, password: senha, email_confirm: true, user_metadata: { nome: dados.nome } });
    if (novo.error || !novo.data.user) {
      await sb.rpc("desfazer_membro_comunidade", { p_parceiro: prep.parceiro_id });
      const jaExiste = /already|registered|exists/i.test(novo.error?.message ?? "");
      return erro(jaExiste ? "Este e-mail já tem conta. Entre com ele ou recupere a senha." : "Não foi possível criar o acesso agora. Tente de novo.", jaExiste ? 409 : 500);
    }
    await sb.from("membros_comunidade").update({ perfil_id: novo.data.user.id }).eq("id", prep.membro_id);
    return json({ ok: true, fila: !!prep.fila_id });
  } catch (e) {
    return erro(e instanceof Error ? e.message : String(e), 500);
  }
});
