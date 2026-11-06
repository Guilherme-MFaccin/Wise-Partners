// Cadastro de parceiros SaaS pela landing page (/parceiros). Sem login.
// GET: o que a página precisa (tipos de software, vídeo, IDs de medição) ou, com ?texto=termo|privacidade, o texto vigente.
// POST: cria parceiro, aceite eletrônico, onboarding e conta de acesso com a senha que a pessoa escolheu.
// A conta nasce confirmada: sem SMTP próprio, o portal não consegue mandar e-mail de confirmação.
import { cors, erro, json } from "../_shared/cors.ts";
import { admin, urlDoApp } from "../_shared/supabase.ts";
import { excedeuLimite, ipDe } from "../_shared/limite.ts";
import { enviarEmail, layoutEmail } from "../_shared/email.ts";

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
      const { data: cats } = await sb.from("categorias").select("id, nome, ordem").eq("tipo", "comercial").eq("ativa", true)
        .order("ordem").order("nome");
      return json({
        publicada: cfg.publicada, video_url: cfg.video_url, video_formato: cfg.video_formato ?? "auto", pixel_meta_id: cfg.pixel_meta_id, ga4_id: cfg.ga4_id,
        termo_versao: cfg.termo_versao, categorias: (cats ?? []).map((c) => ({ id: c.id, nome: c.nome })),
      }, 200, SEM_CACHE);
    }
    if (req.method !== "POST") return erro("Método não aceito.", 405);
    if (excedeuLimite(`lpc:${ip}`, 8, 3_600_000)) return erro("Muitas tentativas a partir desta conexão. Tente de novo mais tarde.", 429);

    const b = await req.json().catch(() => ({}));
    if (texto(b?.website, 200)) return json({ ok: true }); // campo oculto preenchido: robô
    const senha = String(b?.senha ?? "");
    if (senha.length < 8) return erro("A senha precisa de pelo menos 8 caracteres.");
    const email = texto(b?.email, 160).toLowerCase();
    const whatsapp = texto(b?.whatsapp, 40);
    const dados = {
      nome: texto(b?.nome, 120), email, whatsapp, empresa: texto(b?.empresa, 160), cnpj: texto(b?.cnpj, 20),
      categoria_id: texto(b?.categoria_id, 40), clientes_ativos: /^\d{1,7}$/.test(String(b?.clientes_ativos ?? "")) ? String(b.clientes_ativos) : "",
      site: texto(b?.site, 200), cargo: texto(b?.cargo, 120),
      utm_source: texto(b?.utm_source, 120), utm_medium: texto(b?.utm_medium, 120), utm_campaign: texto(b?.utm_campaign, 120),
      utm_content: texto(b?.utm_content, 120), utm_term: texto(b?.utm_term, 120), fbclid: texto(b?.fbclid, 300),
      referencia: texto(b?.referencia, 300), aceite_termo: b?.aceite_termo === true, aceite_privacidade: b?.aceite_privacidade === true,
    };

    const { data: r, error } = await sb.rpc("cadastrar_parceiro_landing", { p: dados });
    if (error) return erro(error.message.replace(/^.*?: /, ""), error.code === "23505" ? 409 : 400);

    const conta = await sb.auth.admin.createUser({ email, password: senha, email_confirm: true, user_metadata: { nome: dados.nome } });
    if (conta.error) {
      await sb.rpc("desfazer_cadastro_landing", { p_cadastro: r.cadastro_id, p_erro: conta.error.message });
      const jaExiste = /already|registered|exists/i.test(conta.error.message);
      return erro(jaExiste ? "Este e-mail já tem acesso ao portal. Entre com a sua senha." : "Não foi possível criar o seu acesso agora. Tente de novo.", jaExiste ? 409 : 500);
    }

    const { data: cfg } = await sb.from("config_landing").select("pixel_meta_id, capi_ativa").eq("id", 1).maybeSingle();
    if (cfg?.capi_ativa && cfg.pixel_meta_id) await eventoMeta(cfg.pixel_meta_id, b, email, whatsapp, req);

    // Boas-vindas por e-mail só com o Resend configurado; o acesso já funciona sem ele
    const app = await urlDoApp(sb);
    if (Deno.env.get("RESEND_API_KEY") && app) {
      await enviarEmail(email, "Seu acesso ao Wise Partners está pronto", layoutEmail({
        titulo: "Seu acesso ao Wise Partners está pronto",
        paragrafos: [`Oi, ${dados.nome.split(" ")[0]}. A ${dados.empresa} já faz parte do programa.`,
          "No portal você encontra o seu link para oferecer a consultoria comercial aos seus clientes e o passo a passo para começar."],
        botao: { texto: "Entrar no portal", url: `${app}/entrar` },
      }), `Seu acesso ao Wise Partners está pronto. Entre em ${app}/entrar com o e-mail ${email} e a senha que você criou.`).catch(() => {});
    }
    return json({ ok: true, email });
  } catch (e) {
    return erro(e instanceof Error ? e.message : String(e), 500);
  }
});
