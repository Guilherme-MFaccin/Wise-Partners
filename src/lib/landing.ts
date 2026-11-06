// Landing page dos parceiros SaaS: chamada à função pública, origem do anúncio (UTM) e medição (pixel do Meta e GA4).
// Os IDs de medição vêm da configuração do portal; nada é carregado enquanto o administrador não os preencher.

export const URL_CADASTRO = `${import.meta.env.VITE_SUPABASE_URL ?? "http://localhost:54321"}/functions/v1/cadastro-parceiro`;
const CHAVE = (import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ?? import.meta.env.VITE_SUPABASE_ANON_KEY ?? "anon") as string;
export const CABECALHOS = { apikey: CHAVE, Authorization: `Bearer ${CHAVE}` };

export type FormatoVideo = "auto" | "horizontal" | "vertical" | "quadrado";

export type ConfigLanding = {
  publicada: boolean;
  video_url: string | null;
  video_formato?: FormatoVideo;
  pixel_meta_id: string | null;
  ga4_id: string | null;
  termo_versao: string;
  categorias: { id: string; nome: string }[];
};

export type TextoLegal = { titulo: string; versao: string; texto: string; contato?: string };

export async function carregarConfig(): Promise<ConfigLanding> {
  const r = await fetch(URL_CADASTRO, { headers: CABECALHOS });
  if (!r.ok) throw new Error("Não foi possível carregar a página agora.");
  return r.json();
}

export async function carregarTexto(qual: "termo" | "privacidade"): Promise<TextoLegal> {
  const r = await fetch(`${URL_CADASTRO}?texto=${qual}`, { headers: CABECALHOS });
  if (!r.ok) throw new Error("Não foi possível carregar o texto agora.");
  return r.json();
}

const CHAVES_ORIGEM = ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term", "fbclid"] as const;
export type Origem = Partial<Record<(typeof CHAVES_ORIGEM)[number] | "referencia", string>>;

// Guarda a origem da primeira visita da sessão: quem navega pela página e volta ao topo não perde a UTM.
export function capturarOrigem(): Origem {
  let salva: Origem = {};
  try {
    salva = JSON.parse(sessionStorage.getItem("wp_origem") ?? "{}");
  } catch {
    salva = {};
  }
  const p = new URLSearchParams(window.location.search);
  const nova: Origem = {};
  for (const k of CHAVES_ORIGEM) {
    const v = p.get(k);
    if (v) nova[k] = v.slice(0, 300);
  }
  if (document.referrer && !document.referrer.startsWith(window.location.origin)) nova.referencia = document.referrer.slice(0, 300);
  const origem = Object.keys(nova).length ? nova : salva;
  try {
    sessionStorage.setItem("wp_origem", JSON.stringify(origem));
  } catch {
    // sem armazenamento: segue só com a URL atual
  }
  return origem;
}

function cookie(nome: string) {
  return document.cookie.split("; ").find((c) => c.startsWith(`${nome}=`))?.split("=")[1] ?? "";
}

// Identificadores do Meta para casar o evento do navegador com o do servidor
export function idsMeta(origem: Origem) {
  const fbc = cookie("_fbc") || (origem.fbclid ? `fb.1.${Date.now()}.${origem.fbclid}` : "");
  return { fbc, fbp: cookie("_fbp") };
}

declare global {
  interface Window {
    fbq?: (...args: unknown[]) => void;
    _fbq?: unknown;
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

// Carrega o pixel do Meta e o GA4 só quando há ID configurado, uma vez por página.
export function iniciarMedicao(cfg: Pick<ConfigLanding, "pixel_meta_id" | "ga4_id">) {
  if (cfg.pixel_meta_id && !window.fbq) {
    const fbq: any = function (...args: unknown[]) {
      if (fbq.callMethod) fbq.callMethod(...args);
      else fbq.queue.push(args);
    };
    fbq.push = fbq;
    fbq.loaded = true;
    fbq.version = "2.0";
    fbq.queue = [];
    window.fbq = fbq;
    window._fbq = fbq;
    const s = document.createElement("script");
    s.async = true;
    s.src = "https://connect.facebook.net/en_US/fbevents.js";
    document.head.appendChild(s);
    window.fbq("init", cfg.pixel_meta_id);
    window.fbq("track", "PageView");
  }
  if (cfg.ga4_id && !window.gtag) {
    window.dataLayer = window.dataLayer || [];
    window.gtag = function (...args: unknown[]) {
      window.dataLayer!.push(args);
    };
    const s = document.createElement("script");
    s.async = true;
    s.src = `https://www.googletagmanager.com/gtag/js?id=${cfg.ga4_id}`;
    document.head.appendChild(s);
    window.gtag("js", new Date());
    window.gtag("config", cfg.ga4_id);
  }
}

export function registrarCadastro(eventId: string) {
  window.fbq?.("track", "CompleteRegistration", {}, { eventID: eventId });
  window.gtag?.("event", "sign_up", { method: "landing_parceiros" });
}

export function somenteDigitos(v: string) {
  return v.replace(/\D/g, "");
}

// CNPJ com os dígitos verificadores certos
export function cnpjValido(v: string) {
  const c = somenteDigitos(v);
  if (c.length !== 14 || /^(\d)\1+$/.test(c)) return false;
  const dv = (base: string) => {
    const pesos = base.length === 12 ? [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2] : [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
    const s = base.split("").reduce((t, d, i) => t + Number(d) * pesos[i], 0);
    const r = s % 11;
    return r < 2 ? 0 : 11 - r;
  };
  const d1 = dv(c.slice(0, 12));
  const d2 = dv(c.slice(0, 12) + d1);
  return c.endsWith(`${d1}${d2}`);
}

export function mascaraCnpj(v: string) {
  const d = somenteDigitos(v).slice(0, 14);
  return d
    .replace(/^(\d{2})(\d)/, "$1.$2")
    .replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3")
    .replace(/\.(\d{3})(\d)/, ".$1/$2")
    .replace(/(\d{4})(\d)/, "$1-$2");
}

export function mascaraTelefone(v: string) {
  const d = somenteDigitos(v).slice(0, 11);
  if (d.length <= 10) return d.replace(/^(\d{2})(\d)/, "($1) $2").replace(/(\d{4})(\d)/, "$1-$2");
  return d.replace(/^(\d{2})(\d)/, "($1) $2").replace(/(\d{5})(\d)/, "$1-$2");
}

// Vídeo do YouTube, do Vimeo ou arquivo direto
export function fonteVideo(url: string | null): { tipo: "iframe" | "arquivo"; src: string; vertical?: boolean } | null {
  if (!url) return null;
  const yt = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([\w-]{6,})/);
  if (yt) return { tipo: "iframe", src: `https://www.youtube-nocookie.com/embed/${yt[1]}?rel=0`, vertical: /youtube\.com\/shorts\//.test(url) };
  const vm = url.match(/vimeo\.com\/(?:video\/)?(\d+)/);
  if (vm) return { tipo: "iframe", src: `https://player.vimeo.com/video/${vm[1]}` };
  if (/^https:\/\//.test(url)) return { tipo: "arquivo", src: url };
  return null;
}

// ---------------------------------------------------------------------------
// Página do cliente do parceiro (/c/:codigo)
// ---------------------------------------------------------------------------
export const URL_CLIENTE = `${import.meta.env.VITE_SUPABASE_URL ?? "http://localhost:54321"}/functions/v1/cliente-parceiro`;

export type PaginaCliente = {
  publicada: boolean;
  parceiro: { nome: string; logo_url: string | null } | null;
  video_url: string | null;
  video_formato?: FormatoVideo;
  pixel_meta_id: string | null;
  ga4_id: string | null;
  privacidade_versao: string | null;
};

export type RespostaCadastroCliente = { id: string; chave: string; icp: boolean; agenda_url: string | null; parceiro: string };

export async function carregarPaginaCliente(codigo: string): Promise<PaginaCliente> {
  const r = await fetch(`${URL_CLIENTE}?codigo=${encodeURIComponent(codigo)}`, { headers: CABECALHOS });
  if (!r.ok) throw new Error("Não foi possível carregar a página agora.");
  return r.json();
}

export async function enviarCliente<T>(corpo: Record<string, unknown>): Promise<T> {
  const r = await fetch(URL_CLIENTE, { method: "POST", headers: { ...CABECALHOS, "Content-Type": "application/json" }, body: JSON.stringify(corpo) });
  const d = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(d?.erro ?? "Não foi possível enviar agora. Tente de novo.");
  return d as T;
}

export function registrarLead(icp: boolean) {
  window.fbq?.("track", "Lead", { content_category: icp ? "icp" : "autodiagnostico" });
  window.gtag?.("event", "generate_lead", { method: "landing_cliente", icp });
}
