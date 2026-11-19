import { useEffect, useRef, useState, type ReactNode, type RefObject } from "react";
import { Check, ShieldCheck, X } from "lucide-react";
import { Logo } from "@/components/comum/Logo";
import { Button } from "@/components/ui/button";
import type { Item, Pergunta } from "@/lib/paginas";

// Peças comuns às duas páginas públicas (parceiros e cliente do parceiro), todas alimentadas pelo conteúdo editável.

// Fora dos buscadores e com o título da aba certo enquanto a página está aberta
export function useCabecalhoPagina(titulo: string) {
  useEffect(() => {
    const anterior = document.title;
    document.title = titulo;
    const meta = document.createElement("meta");
    meta.name = "robots";
    meta.content = "noindex,nofollow";
    document.head.appendChild(meta);
    return () => {
      document.title = anterior;
      meta.remove();
    };
  }, [titulo]);
}

// Barra fixa no celular: aparece quando o botão do topo sai da tela e some no cadastro e no rodapé.
// `pronta` refaz a observação quando a página deixa de mostrar o esqueleto.
export function useBarraFixa(pronta: boolean): {
  ctaTopo: RefObject<HTMLButtonElement>; formRef: RefObject<HTMLDivElement>; fimRef: RefObject<HTMLElement>; visivel: boolean;
} {
  const ctaTopo = useRef<HTMLButtonElement>(null);
  const formRef = useRef<HTMLDivElement>(null);
  const fimRef = useRef<HTMLElement>(null);
  const [visivel, setVisivel] = useState(false);
  useEffect(() => {
    if (!pronta) return;
    const vistos = { topo: true, cadastro: false, fim: false };
    const obs = new IntersectionObserver((itens) => {
      for (const i of itens) {
        if (i.target === ctaTopo.current) vistos.topo = i.isIntersecting;
        if (i.target === formRef.current) vistos.cadastro = i.isIntersecting;
        if (i.target === fimRef.current) vistos.fim = i.isIntersecting;
      }
      setVisivel(!vistos.topo && !vistos.cadastro && !vistos.fim);
    });
    [ctaTopo.current, formRef.current, fimRef.current].forEach((el) => el && obs.observe(el));
    return () => obs.disconnect();
  }, [pronta]);
  return { ctaTopo, formRef, fimRef, visivel };
}

export function BarraFixa({ visivel, texto, aoClicar }: { visivel: boolean; texto: string; aoClicar: () => void }) {
  return (
    <div aria-hidden={!visivel}
      className={`fixed inset-x-0 bottom-0 z-20 border-t border-white/10 bg-background/95 p-3 backdrop-blur transition-transform duration-200 ease-out motion-reduce:transition-none sm:hidden ${visivel ? "translate-y-0" : "pointer-events-none translate-y-full"}`}
      style={{ paddingBottom: "max(12px, env(safe-area-inset-bottom))" }}>
      <Button onClick={aoClicar} className="h-11 w-full" tabIndex={visivel ? 0 : -1}>{texto}</Button>
    </div>
  );
}

// Esqueleto com o desenho do topo da página, enquanto o conteúdo chega
export function EsqueletoPagina() {
  return (
    <div className="min-h-screen bg-background text-foreground" aria-busy="true" aria-label="Carregando a página">
      <header className="border-b border-white/10">
        <div className="mx-auto flex h-16 max-w-6xl items-center px-4 sm:px-6"><Logo className="h-7" /></div>
      </header>
      <div className="mx-auto grid w-full max-w-6xl gap-8 px-4 pb-14 pt-10 sm:px-6 lg:grid-cols-[1.2fr_1fr] lg:gap-12 lg:pt-16">
        <div className="space-y-4 motion-safe:animate-pulse">
          <div className="h-3 w-48 rounded bg-white/10" />
          <div className="h-10 w-full rounded bg-white/10" />
          <div className="h-10 w-4/5 rounded bg-white/10" />
          <div className="h-10 w-3/5 rounded bg-white/10" />
          <div className="h-4 w-full rounded bg-white/5" />
          <div className="h-4 w-2/3 rounded bg-white/5" />
          <div className="h-12 w-52 rounded-full bg-white/10" />
        </div>
        <div className="aspect-square w-full max-w-[520px] rounded-[14px] border border-white/10 bg-white/5 motion-safe:animate-pulse" />
      </div>
    </div>
  );
}

// Página inteira para os casos sem conteúdo: fora do ar, link inválido ou erro de carga
export function PaginaAviso({ titulo, texto, acao }: { titulo: string; texto: ReactNode; acao?: ReactNode }) {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background px-4 text-center text-foreground">
      <Logo className="h-8" />
      <h1 className="max-w-[28ch] text-balance text-[22px] font-semibold">{titulo}</h1>
      <p className="max-w-[46ch] text-sm text-neutro-300">{texto}</p>
      {acao}
    </main>
  );
}

// Topo: sobretítulo, título, texto, vídeo e o primeiro botão
export function Topo({ eyebrow, titulo, texto, botao, nota, video, ctaRef, aoClicar }: {
  eyebrow: string; titulo: string; texto: string; botao: string; nota: string; video: ReactNode;
  ctaRef: RefObject<HTMLButtonElement>; aoClicar: () => void;
}) {
  return (
    <section className="mx-auto grid w-full max-w-6xl gap-8 px-4 pb-14 pt-10 sm:px-6 lg:grid-cols-[1.2fr_1fr] lg:gap-x-12 lg:gap-y-0 lg:pb-20 lg:pt-16">
      <div className="min-w-0 lg:col-start-1 lg:row-start-1 lg:self-end">
        {eyebrow && <p className="text-xs font-semibold uppercase tracking-[0.12em] text-menta-400">{eyebrow}</p>}
        <h1 className="mt-3 text-balance break-words font-display text-[36px] font-extrabold leading-[1.06] sm:text-[48px]">{titulo}</h1>
        {texto && <p className="mt-5 max-w-[52ch] text-base text-neutro-300 sm:text-lg">{texto}</p>}
      </div>
      <div className="w-full sm:max-w-[560px] lg:col-start-2 lg:row-span-2 lg:row-start-1 lg:max-w-none lg:self-center">{video}</div>
      <div className="lg:col-start-1 lg:row-start-2">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center lg:mt-8">
          <Button ref={ctaRef} size="lg" onClick={aoClicar} className="h-12 px-6 text-base">{botao}</Button>
          {nota && <p className="text-sm text-neutro-300">{nota}</p>}
        </div>
      </div>
    </section>
  );
}

export function PassosNumerados({ itens }: { itens: Item[] }) {
  return (
    <ol className={`grid gap-4 ${itens.length >= 4 ? "md:grid-cols-2 lg:grid-cols-4" : "md:grid-cols-3"}`}>
      {itens.map((p, i) => (
        <li key={`${i}-${p.titulo}`} className="min-w-0 rounded-[14px] border border-white/10 bg-card p-5">
          <span className="flex h-8 w-8 items-center justify-center rounded-full border border-menta-500/40 text-sm font-bold tabular-nums text-menta-400">{i + 1}</span>
          <p className="mt-4 break-words font-semibold">{p.titulo}</p>
          {p.texto && <p className="mt-2 text-sm text-neutro-300">{p.texto}</p>}
        </li>
      ))}
    </ol>
  );
}

export function ListaPerguntas({ perguntas }: { perguntas: Pergunta[] }) {
  return (
    <div className="divide-y divide-white/10 rounded-[14px] border border-white/10 bg-card">
      {perguntas.map((q, i) => (
        <details key={`${i}-${q.pergunta}`} className="group px-5 py-4 [&_summary::-webkit-details-marker]:hidden">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-semibold">
            <span className="min-w-0 break-words">{q.pergunta}</span>
            <span className="text-xl leading-none text-neutro-300 transition-transform group-open:rotate-45 motion-reduce:transition-none" aria-hidden>+</span>
          </summary>
          <p className="mt-3 max-w-[68ch] whitespace-pre-line text-sm text-neutro-300">{q.resposta}</p>
        </details>
      ))}
    </div>
  );
}

// Tabela de comparação: cada linha marca "não" nas primeiras colunas e "sim" na última, salvo `marcas` por coluna
export function TabelaComparacao({ legenda, colunas, linhas, marcas, custo }: {
  legenda: string; colunas: string[]; linhas: Item[]; marcas: boolean[]; custo: { rotulo: string; valores: ReactNode[] };
}) {
  return (
    <div className="overflow-hidden rounded-[14px] border border-white/10 bg-card">
      <table className="w-full table-fixed text-left text-sm">
        <caption className="sr-only">{legenda}</caption>
        <thead>
          <tr className="border-b border-white/10">
            <th scope="col" className="px-3 py-3 sm:px-5"><span className="sr-only">O que entra</span></th>
            {colunas.map((c, i) => (
              <th key={c} scope="col" className={`w-[4.5rem] px-1 py-3 text-center text-xs sm:w-40 sm:text-sm ${i === colunas.length - 1 ? "font-semibold" : "font-medium text-neutro-300"}`}>{c}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {linhas.map((l, n) => (
            <tr key={`${n}-${l.titulo}`} className="border-b border-white/10">
              <th scope="row" className="break-words px-3 py-3 font-normal sm:px-5">{l.titulo}</th>
              {marcas.map((v, k) => (
                <td key={k} className="px-1 py-3 text-center">
                  {v ? <Check className="mx-auto h-5 w-5 text-menta-400" aria-label="Sim" /> : <X className="mx-auto h-5 w-5 text-neutro-500" aria-label="Não" />}
                </td>
              ))}
            </tr>
          ))}
          <tr>
            <th scope="row" className="px-3 py-3 font-normal sm:px-5">{custo.rotulo}</th>
            {custo.valores.map((v, k) => (
              <td key={k} className={`px-1 py-3 text-center text-xs sm:text-sm ${k === custo.valores.length - 1 ? "font-semibold text-menta-400" : "text-neutro-300"}`}>{v}</td>
            ))}
          </tr>
        </tbody>
      </table>
    </div>
  );
}

export function Garantias({ itens }: { itens: Item[] }) {
  if (!itens.length) return null;
  return (
    <ul className="mt-6 flex flex-wrap justify-center gap-x-6 gap-y-2 text-sm text-neutro-300">
      {itens.map((g, i) => <li key={`${i}-${g.titulo}`} className="flex items-center gap-2"><ShieldCheck className="h-4 w-4 shrink-0" aria-hidden />{g.titulo}</li>)}
    </ul>
  );
}

// Faixa com fundo levemente destacado entre seções
export function Faixa({ children, borda = "y" }: { children: ReactNode; borda?: "y" | "t" | "nenhuma" }) {
  const b = borda === "y" ? "border-y border-white/10" : borda === "t" ? "border-t border-white/10" : "";
  return <div className={`${b} bg-neutro-800/40`}>{children}</div>;
}
