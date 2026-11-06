import { useEffect, useRef, useState, type ReactNode } from "react";
import { ArrowUpRight, Check, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { fonteVideo, type FormatoVideo } from "@/lib/landing";

// Blocos das landing pages públicas (parceiros e clientes dos parceiros): prova, vídeo, Wise Hub e campos.
// Os números e casos vêm dos materiais da Wise Makers; mudar aqui muda nas duas páginas.

// Logos de clientes da Wise Makers (apresentação de parceria, slide 5). Os primeiros 12 aparecem também no celular.
// Sem nome: logos que não trazem o nome escrito; ficam como decoração para leitor de tela.
export const CLIENTES: [number, string][] = [
  [14, "Havan"], [21, "Bayer"], [18, "Café Jandaia"], [6, "Fusion Alumínios"], [5, "Telhaço"], [27, "Beckhauser"],
  [1, "Giannini"], [3, "Gelaboca"], [19, "Polifest"], [17, "Natural Produtos"], [10, "Implemar"], [13, "Magro"],
  [2, "Nicopel"], [7, "Colli"], [8, "Chamego Bandeiras"], [9, "Powerfit"], [12, "Aggi"], [15, "Glück"], [16, "Heck"],
  [20, "Dates"], [23, "Ostellato"], [25, "F.A. Colchões"], [26, "Karams"], [4, ""], [11, ""], [22, ""], [24, ""], [28, ""],
];

// Casos completos: a versão de celular é outra página, então cada caso tem os dois endereços
export const CASOS = {
  protectpool: {
    desktop: "https://triade-emails.vercel.app/uploads/03-caso-grupo-protectpool-260821-1125",
    celular: "https://triade-emails.vercel.app/uploads/03-caso-grupo-protectpool-mobile-260821-1125",
  },
  fusion: {
    desktop: "https://triade-emails.vercel.app/uploads/02-caso-fusion-aluminios-260821-1124",
    celular: "https://triade-emails.vercel.app/uploads/02-caso-fusion-aluminios-mobile-260821-1124",
  },
};

// Wise Hub: o que cada entrega custaria contratada à parte (valores da página do Wise Hub)
export const HUB_VALOR = [
  { titulo: "Imersão Wise Makers, +20h", texto: "Quatro módulos: atrair clientes, recrutar vendedores, vender mais pra base e planejamento comercial.", valor: "R$ 3.000" },
  { titulo: "Diagnóstico de maturidade comercial", texto: "O nível real da operação, com pontos fortes e riscos.", valor: "R$ 1.400" },
  { titulo: "Plano comercial de 30, 60 e 90 dias", texto: "20 perguntas viram um PDF com gargalos priorizados, ações e responsáveis.", valor: "R$ 3.300" },
  { titulo: "Calculadoras, planilhas e checklists", texto: "Receita esquecida na base, meta necessária, custo de improdutividade.", valor: "R$ 2.300" },
  { titulo: "Reunião individual com a equipe da Wise", texto: "Para empresas com mais de 3 vendedores.", valor: "R$ 5.000" },
];

// Depoimentos em vídeo (os mesmos da plataformawise.com) e os números de cada caso
export type Depoimento = {
  video: string; capa: string; empresa: string; segmento: string; numero: string; legenda: string; texto: string;
  detalhe?: string; caso?: { desktop: string; celular: string; nome: string };
};
export const DEPOIMENTOS: Depoimento[] = [
  {
    video: "8trnyTsn6RY", capa: "/landing/depoimento-protectpool.webp", empresa: "Grupo Protectpool",
    segmento: "Indústria líder em proteção para piscinas, com mais de 200 parceiros e franqueados",
    numero: "+54,83%", legenda: "de faturamento em julho, mês recorde",
    texto: "Já estava no topo do setor. Estruturou o CRM e o processo comercial da rede e bateu o recorde de faturamento seis meses antes do planejado.",
    detalhe: "Antes do recorde: +35,56% em maio e +26,65% em junho.",
    caso: { ...CASOS.protectpool, nome: "do Grupo Protectpool" },
  },
  {
    video: "rw0lCWnnQ9Q", capa: "/landing/depoimento-fusion.webp", empresa: "Fusion Alumínios",
    segmento: "Indústria do ramo moveleiro, 18 anos de mercado",
    numero: "+30%", legenda: "de faturamento em 8 meses",
    texto: "Análise dos dados comerciais, treinamento do time e ajuste do processo, com a operação rodando com uma equipe mais enxuta.",
    caso: { ...CASOS.fusion, nome: "da Fusion Alumínios" },
  },
  {
    video: "4DtnNtCxlac", capa: "/landing/depoimento-cristal.webp", empresa: "Cristal Móveis",
    segmento: "Loja de móveis", numero: "2x", legenda: "o faturamento",
    texto: "Dobrou o faturamento depois de estruturar o comercial com a Wise Makers. No vídeo, ela conta como foi.",
  },
];

export function Secao({ id, eyebrow, titulo, children, className = "" }: { id?: string; eyebrow?: string; titulo: string; children: ReactNode; className?: string }) {
  return (
    <section id={id} className={`mx-auto w-full max-w-6xl px-4 py-14 sm:px-6 sm:py-20 ${className}`}>
      {eyebrow && <p className="text-xs font-semibold uppercase tracking-[0.12em] text-menta-400">{eyebrow}</p>}
      <h2 className="mt-2 max-w-3xl text-balance text-[28px] font-semibold leading-tight sm:text-[36px]">{titulo}</h2>
      <div className="mt-8 sm:mt-10">{children}</div>
    </section>
  );
}

export const CAPA_VIDEO = "/landing/igor-capa.webp";

// Sem vídeo configurado, mostra a capa com o Igor no lugar do vídeo que ainda vai ser gravado.
// O quadro segue o formato escolhido em Configurações; no automático, Shorts do YouTube ficam em 9:16 e o resto em 16:9.
const QUADRO: Record<Exclude<FormatoVideo, "auto">, string> = {
  horizontal: "aspect-video w-full",
  vertical: "mx-auto aspect-[9/16] w-full max-w-[320px]",
  quadrado: "mx-auto aspect-square w-full max-w-[520px]",
};

export function Video({ url, formato = "auto" }: { url: string | null; formato?: FormatoVideo }) {
  const fonte = fonteVideo(url);
  if (!fonte) {
    return (
      <img src={CAPA_VIDEO} width={670} height={514} decoding="async"
        alt="Igor, da Wise Makers, na capa do vídeo de apresentação do Programa Wise Partners"
        className="h-auto w-full rounded-[14px] border border-white/10 bg-black" />
    );
  }
  const quadro = QUADRO[formato === "auto" ? (fonte.vertical ? "vertical" : "horizontal") : formato];
  if (fonte.youtube) return <VideoYoutube id={fonte.youtube} quadro={quadro} />;
  if (fonte.tipo === "iframe") {
    return (
      <div className={`${quadro} overflow-hidden rounded-[14px] border border-white/10 bg-black`}>
        <iframe src={fonte.src} title="Vídeo do Programa Wise Partners" className="h-full w-full"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen />
      </div>
    );
  }
  return <video src={fonte.src} poster={CAPA_VIDEO} controls playsInline preload="metadata" className={`${quadro} block rounded-[14px] border border-white/10 bg-black object-contain`} />;
}

// ---------------------------------------------------------------------------
// Player do YouTube sem nada além de assistir e pausar: capa própria com play, vídeo sem controles do YouTube,
// clique pausa e a capa volta na pausa e no fim (cobre título, logo e sugestões do YouTube).
// ---------------------------------------------------------------------------
type PlayerYT = { playVideo(): void; pauseVideo(): void; seekTo(s: number, a: boolean): void; destroy(): void; unloadModule?(m: string): void };

// Desliga as legendas do YouTube (automáticas ou não): o vídeo aparece sem nada por cima
function semLegenda(p: PlayerYT) {
  try {
    p.unloadModule?.("captions");
    p.unloadModule?.("cc");
  } catch {
    // player sem o módulo: nada a desligar
  }
}
type ApiYT = { Player: new (el: HTMLElement, o: Record<string, unknown>) => PlayerYT };
let apiYT: Promise<ApiYT> | null = null;
function carregarApiYT(): Promise<ApiYT> {
  const w = window as unknown as { YT?: ApiYT & { Player?: unknown }; onYouTubeIframeAPIReady?: () => void };
  if (w.YT?.Player) return Promise.resolve(w.YT as ApiYT);
  if (!apiYT) {
    apiYT = new Promise((ok) => {
      const antes = w.onYouTubeIframeAPIReady;
      w.onYouTubeIframeAPIReady = () => { antes?.(); ok(w.YT as ApiYT); };
      const s = document.createElement("script");
      s.src = "https://www.youtube.com/iframe_api";
      s.async = true;
      document.head.appendChild(s);
    });
  }
  return apiYT;
}

function VideoYoutube({ id, quadro }: { id: string; quadro: string }) {
  const caixa = useRef<HTMLDivElement>(null);
  const estadoAtual = useRef("capa");
  const player = useRef<PlayerYT | null>(null);
  const [estado, setEstado] = useState<"capa" | "carregando" | "tocando" | "pausado">("capa");
  const [livre, setLivre] = useState(false); // se o navegador não deixar começar sozinho, libera o toque no próprio player
  const [capa, setCapa] = useState(`https://i.ytimg.com/vi/${id}/maxresdefault.jpg`);

  useEffect(() => { estadoAtual.current = estado; }, [estado]);
  useEffect(() => () => player.current?.destroy(), []);

  async function assistir() {
    if (player.current) { player.current.playVideo(); return; }
    setEstado("carregando");
    const YT = await carregarApiYT();
    if (!caixa.current) return;
    // O YouTube troca este elemento por um iframe: ele é criado fora do React para não confundir a árvore
    const el = document.createElement("div");
    caixa.current.appendChild(el);
    player.current = new YT.Player(el, {
      host: "https://www.youtube-nocookie.com",
      videoId: id,
      width: "100%",
      height: "100%",
      playerVars: { autoplay: 1, controls: 0, rel: 0, playsinline: 1, modestbranding: 1, iv_load_policy: 3, disablekb: 1, fs: 0, cc_load_policy: 0 },
      events: {
        onReady: (e: { target: PlayerYT }) => { semLegenda(e.target); e.target.playVideo(); },
        onApiChange: (e: { target: PlayerYT }) => semLegenda(e.target),
        onStateChange: (e: { data: number; target: PlayerYT }) => {
          if (e.data === 1) { semLegenda(e.target); setEstado("tocando"); setLivre(false); }
          if (e.data === 2) setEstado("pausado");
          if (e.data === 0) { e.target.seekTo(0, false); e.target.pauseVideo(); setEstado("capa"); }
        },
      },
    });
    window.setTimeout(() => { if (estadoAtual.current === "carregando") setLivre(true); }, 2500);
  }

  const coberto = estado !== "tocando" && !livre;
  return (
    <div className={`${quadro} relative overflow-hidden rounded-[14px] border border-white/10 bg-black`}>
      <div ref={caixa} className="absolute inset-0 [&_iframe]:h-full [&_iframe]:w-full" />
      {estado === "tocando" && (
        <button type="button" onClick={() => player.current?.pauseVideo()} aria-label="Pausar o vídeo" className="absolute inset-0 cursor-pointer" />
      )}
      {coberto && (
        <button type="button" onClick={assistir} aria-label="Assistir ao vídeo" className="group absolute inset-0 cursor-pointer">
          <img src={capa} alt="" onError={() => setCapa(`https://i.ytimg.com/vi/${id}/hqdefault.jpg`)} decoding="async"
            className="absolute inset-0 h-full w-full object-cover" />
          <span className="absolute inset-0 bg-black/10 transition-colors group-hover:bg-black/20" aria-hidden />
          <span className="absolute left-1/2 top-1/2 flex h-16 w-16 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-menta-500 text-primary-foreground shadow-lg transition-transform duration-150 ease-out group-hover:scale-105 motion-reduce:transition-none sm:h-20 sm:w-20" aria-hidden>
            {estado === "carregando" ? <span className="h-6 w-6 animate-spin rounded-full border-2 border-current border-t-transparent" /> : <Play className="ml-1 h-7 w-7 fill-current sm:h-8 sm:w-8" />}
          </span>
        </button>
      )}
    </div>
  );
}

// Caso completo: a página de celular só aparece em tela pequena, a de computador nas demais
export function LinkCaso({ caso, nome }: { caso: { desktop: string; celular: string }; nome: string }) {
  const classe = "items-center gap-1 font-semibold text-menta-300 underline-offset-4 hover:underline";
  const texto = <>Ver o caso completo <ArrowUpRight className="h-4 w-4" aria-hidden /><span className="sr-only"> {nome} (abre em outra aba)</span></>;
  return (
    <p className="mt-4 text-sm sm:mt-5">
      <a href={caso.desktop} target="_blank" rel="noopener noreferrer" className={`hidden sm:inline-flex ${classe}`}>{texto}</a>
      <a href={caso.celular} target="_blank" rel="noopener noreferrer" className={`inline-flex sm:hidden ${classe}`}>{texto}</a>
    </p>
  );
}

// Depoimento: a capa é local; o vídeo do YouTube só carrega quando a pessoa clica
export function CartaoDepoimento({ d, aoAssistir }: { d: Depoimento; aoAssistir: () => void }) {
  return (
    <article className="grid grid-cols-[112px_1fr] gap-4 rounded-[14px] border border-white/10 bg-card p-4 sm:flex sm:flex-col sm:p-5">
      <button type="button" onClick={aoAssistir} aria-label={`Assistir ao depoimento ${d.caso?.nome ?? "da " + d.empresa}`}
        className="group relative block self-start overflow-hidden rounded-[10px] border border-white/10 bg-black">
        <img src={d.capa} alt="" width={360} height={640} loading="lazy" decoding="async"
          className="aspect-[3/4] h-auto w-full object-cover object-[50%_25%] transition-transform duration-300 ease-out group-hover:scale-[1.03] motion-reduce:transition-none sm:aspect-[4/3]" />
        <span className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" aria-hidden />
        <span className="absolute left-1/2 top-1/2 flex h-11 w-11 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-white text-black shadow-lg sm:h-14 sm:w-14" aria-hidden>
          <Play className="ml-0.5 h-5 w-5 fill-current sm:h-6 sm:w-6" />
        </span>
        <span className="absolute bottom-2 left-2 hidden text-xs font-semibold text-white sm:block" aria-hidden>Assistir ao depoimento</span>
      </button>
      <div className="min-w-0 sm:mt-5 sm:flex sm:flex-1 sm:flex-col">
        <h3 className="font-semibold">{d.empresa}</h3>
        <p className="mt-0.5 text-xs text-neutro-300">{d.segmento}</p>
        <p className="mt-3 text-[28px] font-bold leading-none tabular-nums text-menta-400 sm:mt-4 sm:text-[36px]">{d.numero}</p>
        <p className="mt-1 text-sm text-neutro-300">{d.legenda}</p>
        <p className="mt-3 text-sm text-neutro-100">{d.texto}</p>
        {d.detalhe && <p className="mt-2 text-sm text-neutro-300">{d.detalhe}</p>}
        {d.caso && <div className="sm:mt-auto"><LinkCaso caso={d.caso} nome={d.caso.nome} /></div>}
      </div>
    </article>
  );
}

export function Campo({ id, rotulo, opcional, erro, children }: { id: string; rotulo: string; opcional?: boolean; erro?: string; children: ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id} className="text-[13px] font-medium">
        {rotulo} {opcional && <span className="font-normal text-neutro-300">(opcional)</span>}
      </Label>
      {children}
      {erro && <p id={`${id}-erro`} className="text-xs text-destructive">{erro}</p>}
    </div>
  );
}

// Faixa de logos logo abaixo do topo
export function FaixaLogos() {
  return (
    <section aria-labelledby="clientes-titulo" className="mx-auto w-full max-w-6xl px-4 pb-14 sm:px-6 lg:pb-20">
      <h2 id="clientes-titulo" className="text-center text-sm font-medium text-neutro-300">Empresas que estruturaram o comercial com a Wise Makers</h2>
      <ul className="mt-5 grid grid-cols-6 gap-2 sm:grid-cols-[repeat(14,minmax(0,1fr))] sm:gap-3">
        {CLIENTES.map(([n, nome], i) => (
          <li key={n} className={i >= 12 ? "hidden sm:block" : ""}>
            <img src={`/landing/cliente-${String(n).padStart(2, "0")}.webp`} alt={nome} width={128} height={128} loading="lazy" decoding="async"
              className="aspect-square h-auto w-full rounded-[8px] bg-white/5 sm:rounded-[10px]" />
          </li>
        ))}
      </ul>
    </section>
  );
}

// Quadro de valor do Wise Hub, com a tela do Hub ao lado
export function QuadroValorHub({ paraQuem, destaque, vantagens }: { paraQuem: string; destaque?: ReactNode; vantagens: string[] }) {
  return (
    <div className="mt-8 grid gap-6 lg:grid-cols-[1.1fr_1fr] lg:items-start lg:gap-10">
      <div className="rounded-[14px] border border-white/10 bg-card">
        <ul className="divide-y divide-white/10">
          {HUB_VALOR.map((h) => (
            <li key={h.titulo} className="flex items-start justify-between gap-4 px-5 py-4">
              <span><span className="block font-semibold">{h.titulo}</span><span className="text-sm text-neutro-300">{h.texto}</span></span>
              <span className="shrink-0 pt-0.5 text-sm tabular-nums text-neutro-300">{h.valor}</span>
            </li>
          ))}
        </ul>
        <div className="flex items-end justify-between gap-4 rounded-b-[14px] border-t border-white/10 bg-white/[0.03] px-5 py-4">
          <span className="text-sm text-neutro-300">Valor contratado à parte<span className="block text-base tabular-nums line-through decoration-neutro-500">R$&nbsp;15.000</span></span>
          <span className="text-right text-sm text-neutro-300">{paraQuem}<span className="block text-[28px] font-bold leading-none tabular-nums text-menta-400">R$&nbsp;0</span></span>
        </div>
      </div>
      <div>
        <img src="/landing/wise-hub.webp" width={1200} height={519} loading="lazy" decoding="async"
          alt="Tela inicial do Wise Hub com o painel de evolução, o vídeo de boas-vindas e a próxima etapa do Método Wise"
          className="h-auto w-full rounded-[14px] border border-white/10" />
        <ul className="mt-5 grid gap-2 text-sm text-neutro-100 sm:grid-cols-2">
          {vantagens.map((t) => (
            <li key={t} className="flex items-center gap-2"><Check className="h-4 w-4 shrink-0 text-menta-400" aria-hidden />{t}</li>
          ))}
        </ul>
        {destaque && <p className="mt-6 border-l-2 border-menta-500/60 pl-4 text-lg font-semibold leading-snug">{destaque}</p>}
      </div>
    </div>
  );
}

// Seção de depoimentos em vídeo, com a janela do YouTube
export function SecaoDepoimentos({ subtitulo }: { subtitulo: string }) {
  const [videoAberto, setVideoAberto] = useState<Depoimento | null>(null);
  return (
    <>
      <Secao eyebrow="Depoimentos" titulo="Quem aplicou o método conta o resultado.">
        <p className="-mt-4 max-w-[64ch] text-neutro-100 sm:-mt-6">{subtitulo}</p>
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {DEPOIMENTOS.map((d) => <CartaoDepoimento key={d.video} d={d} aoAssistir={() => setVideoAberto(d)} />)}
        </div>
        <figure className="mt-6 rounded-[14px] border border-white/10 bg-card p-5 sm:p-6">
          <blockquote className="text-lg text-neutro-100 sm:text-[22px] sm:leading-snug">"Loucura é esperar resultados diferentes fazendo sempre as mesmas coisas."</blockquote>
          <figcaption className="mt-2 text-sm text-neutro-300">João Vitor, sócio e gerente comercial do Grupo Protectpool</figcaption>
        </figure>
      </Secao>
      <Dialog open={!!videoAberto} onOpenChange={(v) => !v && setVideoAberto(null)}>
        <DialogContent className="w-[min(400px,calc(100vw-2rem))] max-w-none gap-0 overflow-hidden rounded-[14px] border-white/10 bg-black p-0">
          <div className="px-4 py-3 pr-12">
            <DialogTitle className="text-sm font-semibold">Depoimento {videoAberto?.empresa}</DialogTitle>
            <DialogDescription className="text-xs text-neutro-300">{videoAberto?.numero} {videoAberto?.legenda}</DialogDescription>
          </div>
          {videoAberto && (
            <iframe src={`https://www.youtube-nocookie.com/embed/${videoAberto.video}?autoplay=1&rel=0&playsinline=1`} title={`Depoimento ${videoAberto.empresa}`}
              className="aspect-[9/16] max-h-[78vh] w-full" allow="autoplay; encrypted-media; picture-in-picture; fullscreen" allowFullScreen />
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

// Faixa com a foto do evento, um número de prova e a chamada
export function FaixaEvento({ titulo, texto, botao, aoClicar, nota }: { titulo: string; texto: string; botao: string; aoClicar: () => void; nota: string; }) {
  return (
    <section className="border-y border-white/10 bg-card">
      <div className="mx-auto grid max-w-6xl items-center gap-6 px-4 py-10 sm:px-6 md:grid-cols-[1fr_1.1fr] md:gap-10 lg:py-12">
        <img src="/landing/evento.webp" width={1200} height={868} loading="lazy" decoding="async"
          alt="Equipe da Wise Makers com dezenas de profissionais de vendas de clientes num encontro presencial"
          className="h-auto w-full rounded-[14px] border border-white/10" />
        <div>
          <p className="text-[22px] font-semibold leading-snug">{titulo}</p>
          <p className="mt-2 text-neutro-300">{texto}</p>
          <Button size="lg" onClick={aoClicar} className="mt-6 h-12 px-6 text-base">{botao}</Button>
          <p className="mt-2 text-xs text-neutro-300">{nota}</p>
        </div>
      </div>
    </section>
  );
}
