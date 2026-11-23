import { useMemo, type ReactNode } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { BadgePercent, Building2, Check, ExternalLink, GraduationCap, Lock, Send, Store, X } from "lucide-react";
import { Logo } from "@/components/comum/Logo";
import { Secao, Video } from "@/components/landing/Blocos";
import {
  BarraFixa, EsqueletoPagina, Faixa, Garantias, ListaPerguntas, PaginaAviso, PassosNumerados, useBarraFixa, useCabecalhoPagina,
} from "@/components/landing/Secoes";
import { Button } from "@/components/ui/button";
import { capturarOrigem, carregarComunidade, type ConfigComunidade, type EmpresaGrupo, type ResumoComunidade } from "@/lib/landing";
import { PADRAO_COMUNIDADE, montarConteudo, resolverDados } from "@/lib/paginas";

// Página da Comunidade Wise Partners (/comunidade): para qualquer empresa (clientes do Grupo Tríade, parceiros,
// quem quer ser parceiro e quem quer conhecer). Pergunta que a página responde: "O que é a comunidade, o que a minha
// empresa ganha e como eu entro?". Textos e seções vêm de Programa, Páginas, Comunidade; o padrão está em src/lib/paginas.ts.
// Cadastrar e Entrar ficam no menu; o cadastro (/comunidade/cadastro) abre a conta na hora.

const ICONES_FRENTE = [Store, Send, GraduationCap];

// Quem acessa o quê. Segue as regras do banco (pode_ver_catalogo, pode_ofertar, acesso_comunidade); não é editável.
const PERFIS_ACESSO = ["Cadastrada", "Cliente do grupo", "Parceiro Premium", "Parceiro Elite"];
const LINHAS_ACESSO: { rotulo: string; marcas: boolean[] }[] = [
  { rotulo: "Ver as empresas e o que cada uma oferece", marcas: [true, true, true, true] },
  { rotulo: "Usar as condições especiais do catálogo", marcas: [false, true, true, true] },
  { rotulo: "Indicar a consultoria da Wise Makers com link próprio", marcas: [false, true, true, true] },
  { rotulo: "Conhecer a Wise Makers no minicurso", marcas: [true, true, true, true] },
  { rotulo: "Oferecer produtos e serviços no catálogo", marcas: [false, true, false, true] },
];

// Ilustração do catálogo no topo quando não há vídeo: ofertas genéricas, condição travada para quem não é membro
function VisualCatalogo() {
  const cartoes = [
    { area: "Tecnologia", titulo: "Implantação de CRM", largura: "w-11/12" },
    { area: "Serviços", titulo: "Contabilidade consultiva", largura: "w-10/12" },
    { area: "Indústria", titulo: "Manutenção preventiva", largura: "w-9/12" },
  ];
  return (
    <div aria-hidden className="relative mx-auto w-full max-w-[520px] select-none">
      <div className="rounded-[14px] border border-white/10 bg-card p-4 sm:p-5">
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-2 text-sm font-semibold"><Store className="h-4 w-4 text-menta-400" />Catálogo de parceiros</span>
          <span className="rounded-full border border-white/10 px-2 py-0.5 text-[11px] text-neutro-300">Só para membros</span>
        </div>
        <div className="mt-4 space-y-3">
          {cartoes.map((c, i) => (
            <div key={c.titulo} className="rounded-[10px] border border-white/10 bg-background/60 p-3">
              <div className="flex items-center gap-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[8px] bg-white/5 text-neutro-300"><Building2 className="h-4 w-4" /></span>
                <div className="min-w-0 flex-1">
                  <p className="text-[11px] uppercase tracking-wider text-neutro-300">{c.area}</p>
                  <p className="truncate text-sm font-semibold">{c.titulo}</p>
                </div>
              </div>
              <div className={`mt-3 flex items-center gap-2 rounded-[8px] px-2.5 py-1.5 text-xs ${i === 0 ? "border border-menta-500/30 bg-menta-500/5 font-semibold text-menta-300" : "bg-white/5 text-neutro-300"}`}>
                {i === 0 ? <BadgePercent className="h-3.5 w-3.5" /> : <Lock className="h-3.5 w-3.5" />}
                {i === 0 ? "Condição exclusiva para membros" : <span className={`h-2 rounded-full bg-white/10 ${c.largura}`} />}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function CartaoEmpresaGrupo({ e }: { e: EmpresaGrupo }) {
  const url = e.site ? (/^https?:/.test(e.site) ? e.site : `https://${e.site}`) : null;
  return (
    <li className="flex min-w-0 flex-col rounded-[14px] border border-white/10 bg-card p-5">
      <p className="break-words text-lg font-semibold">{e.nome}</p>
      {e.descricao && <p className="mt-2 text-sm text-neutro-300">{e.descricao}</p>}
      {url && (
        <a href={url} target="_blank" rel="noopener noreferrer" className="mt-auto inline-flex items-center gap-1 pt-4 text-sm text-neutro-300 hover:text-white">
          Conhecer o site<ExternalLink className="h-3.5 w-3.5" aria-hidden /><span className="sr-only"> (abre em outra aba)</span>
        </a>
      )}
    </li>
  );
}

function Marca({ sim }: { sim: boolean }) {
  return sim ? <Check className="mx-auto h-5 w-5 text-menta-400" aria-label="Sim" /> : <X className="mx-auto h-5 w-5 text-neutro-500" aria-label="Não" />;
}

// Tabela no computador; no celular, um cartão por perfil com o que ele acessa
function QuadroAcessos() {
  return (
    <>
      <div className="hidden overflow-hidden rounded-[14px] border border-white/10 bg-card md:block">
        <table className="w-full table-fixed text-left text-sm">
          <caption className="sr-only">O que cada empresa acessa na comunidade</caption>
          <thead>
            <tr className="border-b border-white/10">
              <th scope="col" className="px-5 py-3"><span className="sr-only">Acesso</span></th>
              {PERFIS_ACESSO.map((p) => <th key={p} scope="col" className="w-36 px-2 py-3 text-center text-sm font-semibold">{p}</th>)}
            </tr>
          </thead>
          <tbody>
            {LINHAS_ACESSO.map((l) => (
              <tr key={l.rotulo} className="border-b border-white/10 last:border-0">
                <th scope="row" className="px-5 py-3 font-normal">{l.rotulo}</th>
                {l.marcas.map((m, i) => <td key={i} className="px-2 py-3 text-center"><Marca sim={m} /></td>)}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <ul className="grid gap-3 sm:grid-cols-2 md:hidden">
        {PERFIS_ACESSO.map((p, i) => (
          <li key={p} className="rounded-[14px] border border-white/10 bg-card p-4">
            <p className="font-semibold">{p}</p>
            <ul className="mt-3 space-y-2 text-sm">
              {LINHAS_ACESSO.map((l) => (
                <li key={l.rotulo} className={`flex items-start gap-2 ${l.marcas[i] ? "" : "text-neutro-300"}`}>
                  {l.marcas[i] ? <Check className="mt-0.5 h-4 w-4 shrink-0 text-menta-400" aria-label="Sim" /> : <X className="mt-0.5 h-4 w-4 shrink-0 text-neutro-500" aria-label="Não" />}
                  {l.rotulo}
                </li>
              ))}
            </ul>
          </li>
        ))}
      </ul>
    </>
  );
}

function NumerosCatalogo({ resumo, nota }: { resumo: ResumoComunidade | null | undefined; nota: string }) {
  const tem = !!resumo && resumo.ofertas > 0;
  const numero = (valor: number, rotulo: string) => (
    <div className="rounded-[14px] border border-white/10 bg-card p-5">
      <p className="font-display text-[36px] font-bold leading-none tabular-nums">{valor.toLocaleString("pt-BR")}</p>
      <p className="mt-2 text-sm text-neutro-300">{rotulo}</p>
    </div>
  );
  return (
    <div className="space-y-6">
      {tem ? (
        <div className="grid gap-4 sm:grid-cols-3">
          {numero(resumo.ofertas, resumo.ofertas === 1 ? "oferta com condição especial" : "ofertas com condição especial")}
          {numero(resumo.empresas_ofertando, resumo.empresas_ofertando === 1 ? "empresa oferecendo" : "empresas oferecendo")}
          {numero(resumo.membros, "empresas no ecossistema")}
        </div>
      ) : (
        <p className="rounded-[14px] border border-white/10 bg-card px-5 py-4 text-sm text-neutro-300">
          O catálogo está começando: as primeiras ofertas estão em validação pela Wise. Quem se cadastra agora acompanha cada empresa que entra.
        </p>
      )}
      {!!resumo?.categorias.length && (
        <div>
          <p className="text-sm font-semibold">Categorias com ofertas</p>
          <ul className="mt-3 flex flex-wrap gap-2">
            {resumo.categorias.map((c) => <li key={c} className="rounded-full border border-white/10 px-3 py-1 text-sm text-neutro-100">{c}</li>)}
          </ul>
        </div>
      )}
      {nota && <p className="flex items-start gap-2 text-sm text-neutro-300"><Lock className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />{nota}</p>}
    </div>
  );
}

function Lista({ itens, icones }: { itens: { titulo: string; texto: string }[]; icones?: typeof ICONES_FRENTE }) {
  return (
    <ul className={`grid gap-4 sm:grid-cols-2 ${itens.length === 3 ? "lg:grid-cols-3" : "lg:grid-cols-4"}`}>
      {itens.map((x, i) => {
        const Icone = icones?.[i];
        return (
          <li key={`${i}-${x.titulo}`} className="min-w-0 rounded-[14px] border border-white/10 bg-card p-5">
            {Icone && <Icone className="mb-3 h-5 w-5 text-menta-400" aria-hidden />}
            <p className="break-words font-semibold">{x.titulo}</p>
            {x.texto && <p className="mt-2 text-sm text-neutro-300">{x.texto}</p>}
          </li>
        );
      })}
    </ul>
  );
}

export function CabecalhoComunidade({ acao }: { acao?: ReactNode }) {
  return (
    <header className="sticky top-0 z-20 border-b border-white/10 bg-background/90 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-3 px-4 sm:px-6">
        <Link to="/comunidade" className="flex min-w-0 items-center gap-3" aria-label="Comunidade Wise Partners, início">
          <Logo className="h-7 shrink-0" />
          <span className="hidden border-l border-white/15 pl-3 text-sm font-semibold sm:inline">Comunidade Wise Partners</span>
        </Link>
        {acao ?? (
          <nav className="flex items-center gap-2" aria-label="Acesso">
            <Button asChild variant="ghost" size="sm"><Link to="/entrar">Entrar</Link></Button>
            <Button asChild size="sm"><Link to="/comunidade/cadastro">Cadastrar</Link></Button>
          </nav>
        )}
      </div>
    </header>
  );
}

export function RodapeComunidade({ fimRef }: { fimRef?: React.RefObject<HTMLElement> }) {
  return (
    <footer ref={fimRef} className="border-t border-white/10">
      <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-6 text-xs text-neutro-300 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <p>Comunidade Wise Partners · Wise Makers, empresa do Grupo Tríade · Maringá, Paraná</p>
        <nav className="flex flex-wrap gap-x-4 gap-y-2" aria-label="Documentos">
          <Link to="/comunidade/termo" className="hover:text-foreground">Termo de uso</Link>
          <Link to="/parceiros/privacidade" className="hover:text-foreground">Política de privacidade</Link>
          <Link to="/entrar" className="hover:text-foreground">Entrar no portal</Link>
        </nav>
      </div>
    </footer>
  );
}

export default function LandingComunidade() {
  const navigate = useNavigate();
  useMemo(() => capturarOrigem(), []);
  useCabecalhoPagina("Comunidade Wise Partners | Ecossistema do Grupo Tríade");
  const { data: cfg, isLoading, isError } = useQuery<ConfigComunidade>({
    queryKey: ["landing-comunidade"], queryFn: carregarComunidade, retry: 1, staleTime: 5 * 60_000,
  });
  const { vars } = useMemo(() => resolverDados(cfg), [cfg]);
  const conteudo = useMemo(() => montarConteudo(PADRAO_COMUNIDADE, cfg?.conteudo, vars), [cfg?.conteudo, vars]);
  const s = conteudo.secoes;
  const foraDoAr = !!cfg && !cfg.publicada;
  const carregandoTudo = isLoading && !cfg;
  const { ctaTopo, formRef, fimRef, visivel: barraVisivel } = useBarraFixa(!carregandoTudo && !foraDoAr);
  const cadastrar = () => navigate("/comunidade/cadastro");
  const grupo = cfg?.empresas_grupo ?? [];

  if (carregandoTudo) return <EsqueletoPagina />;
  if (foraDoAr) {
    return (
      <PaginaAviso titulo="A Comunidade Wise Partners está fora do ar no momento."
        texto="Quem já tem acesso continua entrando normalmente. Para falar com a Wise Makers, use o e-mail contato@wisemakers.com.br."
        acao={<Button asChild variant="outline"><Link to="/entrar">Entrar no portal</Link></Button>} />
    );
  }

  return (
    <div className="min-h-screen overflow-x-clip bg-background text-foreground">
      <CabecalhoComunidade />
      <main>
        <section className="mx-auto grid w-full max-w-6xl gap-8 px-4 pb-14 pt-10 sm:px-6 lg:grid-cols-[1.15fr_1fr] lg:gap-12 lg:pb-20 lg:pt-16">
          <div className="min-w-0 self-center">
            {s.topo.eyebrow && <p className="text-xs font-semibold uppercase tracking-[0.12em] text-menta-400">{s.topo.eyebrow}</p>}
            <h1 className="mt-3 text-balance break-words font-display text-[36px] font-extrabold leading-[1.06] sm:text-[48px]">{s.topo.titulo}</h1>
            {s.topo.texto && <p className="mt-5 max-w-[56ch] text-base text-neutro-300 sm:text-lg">{s.topo.texto}</p>}
            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
              <Button ref={ctaTopo} size="lg" onClick={cadastrar} className="h-12 px-6 text-base">{s.topo.botao}</Button>
              <Button asChild size="lg" variant="outline" className="h-12 px-6 text-base"><Link to="/entrar">Já tenho acesso</Link></Button>
            </div>
            {s.topo.nota && <p className="mt-3 text-sm text-neutro-300">{s.topo.nota}</p>}
          </div>
          <div className="min-w-0 self-center">
            {cfg?.video_url ? <Video url={cfg.video_url} formato={cfg.video_formato} /> : <VisualCatalogo />}
          </div>
        </section>

        {s.o_que_e.visivel && (
          <Faixa>
            <Secao eyebrow={s.o_que_e.eyebrow} titulo={s.o_que_e.titulo} texto={s.o_que_e.texto}>
              <Lista itens={s.o_que_e.itens} icones={ICONES_FRENTE} />
            </Secao>
          </Faixa>
        )}

        {s.grupo.visivel && grupo.length > 0 && (
          <Secao eyebrow={s.grupo.eyebrow} titulo={s.grupo.titulo} texto={s.grupo.texto}>
            <ul className="grid gap-4 md:grid-cols-3">{grupo.map((e) => <CartaoEmpresaGrupo key={e.id} e={e} />)}</ul>
          </Secao>
        )}

        {s.para_quem.visivel && (
          <Faixa>
            <Secao eyebrow={s.para_quem.eyebrow} titulo={s.para_quem.titulo}>
              <Lista itens={s.para_quem.itens} />
            </Secao>
          </Faixa>
        )}

        {s.como_funciona.visivel && (
          <Secao eyebrow={s.como_funciona.eyebrow} titulo={s.como_funciona.titulo}>
            <PassosNumerados itens={s.como_funciona.itens} />
          </Secao>
        )}

        {s.acessos.visivel && (
          <Faixa>
            <Secao eyebrow={s.acessos.eyebrow} titulo={s.acessos.titulo} texto={s.acessos.texto}>
              <QuadroAcessos />
            </Secao>
          </Faixa>
        )}

        {s.catalogo.visivel && (
          <Secao eyebrow={s.catalogo.eyebrow} titulo={s.catalogo.titulo} texto={s.catalogo.texto}>
            <NumerosCatalogo resumo={cfg?.resumo} nota={s.catalogo.nota} />
          </Secao>
        )}

        {s.indicar.visivel && (
          <Faixa>
            <section className="mx-auto grid w-full max-w-6xl items-center gap-6 px-4 py-14 sm:px-6 sm:py-20 md:grid-cols-[1.4fr_1fr]">
              <div className="min-w-0">
                {s.indicar.eyebrow && <p className="text-xs font-semibold uppercase tracking-[0.12em] text-menta-400">{s.indicar.eyebrow}</p>}
                <h2 className="mt-2 text-balance break-words text-[28px] font-semibold leading-tight sm:text-[36px]">{s.indicar.titulo}</h2>
                {s.indicar.texto && <p className="mt-4 max-w-[60ch] text-neutro-100">{s.indicar.texto}</p>}
              </div>
              {s.indicar.botao && (
                <div className="md:justify-self-end"><Button size="lg" variant="outline" className="h-12 px-6 text-base" onClick={cadastrar}>{s.indicar.botao}</Button></div>
              )}
            </section>
          </Faixa>
        )}

        {s.perguntas.visivel && conteudo.perguntas.length > 0 && (
          <Secao eyebrow={s.perguntas.eyebrow} titulo={s.perguntas.titulo}>
            <ListaPerguntas perguntas={conteudo.perguntas} />
          </Secao>
        )}

        <div ref={formRef} className="border-t border-white/10">
          <section className="mx-auto w-full max-w-3xl px-4 py-14 text-center sm:px-6 sm:py-20">
            {s.cadastro.eyebrow && <p className="text-xs font-semibold uppercase tracking-[0.12em] text-menta-400">{s.cadastro.eyebrow}</p>}
            <h2 className="mt-2 text-balance text-[28px] font-semibold leading-tight sm:text-[36px]">{s.cadastro.titulo}</h2>
            {s.cadastro.texto && <p className="mx-auto mt-4 max-w-[56ch] text-neutro-100">{s.cadastro.texto}</p>}
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Button size="lg" onClick={cadastrar} className="h-12 w-full px-6 text-base sm:w-auto">{s.cadastro.botao}</Button>
              <Button asChild size="lg" variant="ghost" className="h-12 w-full px-6 text-base sm:w-auto"><Link to="/entrar">Já tenho acesso</Link></Button>
            </div>
            <Garantias itens={s.cadastro.itens} />
            {isError && <p className="mt-6 text-xs text-neutro-300">Alguns números da página não carregaram agora. O cadastro funciona normalmente.</p>}
          </section>
        </div>
      </main>
      <RodapeComunidade fimRef={fimRef} />
      <BarraFixa visivel={barraVisivel} texto={s.topo.botao || "Cadastrar minha empresa"} aoClicar={cadastrar} />
    </div>
  );
}
