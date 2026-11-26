import { useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { BadgePercent, CheckCircle2, HeartHandshake, Repeat, Send, Sparkles, Store } from "lucide-react";
import { CartaoEmpresaGrupo, NumerosCatalogo, QuadroAcessos } from "@/components/landing/Comunidade";
import { FormularioCadastro } from "@/components/landing/FormularioCadastro";
import { Logo } from "@/components/comum/Logo";
import { SeloNivel } from "@/components/comum/Selos";
import { FaixaEvento, FaixaLogos, QuadroCases, QuadroValorHub, Secao, SecaoDepoimentos, Video } from "@/components/landing/Blocos";
import { BarraFixa, EsqueletoPagina, Faixa, ListaPerguntas, PaginaAviso, PassosNumerados, TabelaComparacao, Topo, useBarraFixa, useCabecalhoPagina } from "@/components/landing/Secoes";
import { Button } from "@/components/ui/button";
import { capturarOrigem, carregarConfig, iniciarMedicao, type ConfigLanding } from "@/lib/landing";
import { PADRAO_PARCEIROS, montarConteudo, resolverDados } from "@/lib/paginas";

// Página do portal Wise Partners (/parceiros), a entrada única de qualquer empresa (26/11/2026): clientes do Grupo Tríade,
// quem quer ser parceiro e quem quer conhecer o ecossistema. Pergunta que a página responde: "O que a minha empresa ganha no
// Wise Partners, e como eu entro?"
// Textos, seções, perguntas, valores e cases vêm do portal (Programa, Páginas); o padrão está em src/lib/paginas.ts.
// Um cadastro só: entra na fila, a Wise confere e libera o acesso (parceiro, depois da conversa de entrada de 45 minutos).

// Última configuração recebida, guardada no navegador (só o que a página pública já mostra)
const CHAVE_CFG = "wp_cfg_landing";
function lerConfigGuardada(): ConfigLanding | undefined {
  try {
    const t = localStorage.getItem(CHAVE_CFG);
    return t ? (JSON.parse(t) as ConfigLanding) : undefined;
  } catch {
    return undefined;
  }
}
async function carregarConfigGuardando(): Promise<ConfigLanding> {
  const cfg = await carregarConfig();
  try {
    localStorage.setItem(CHAVE_CFG, JSON.stringify(cfg));
  } catch {
    // sem armazenamento: segue sem guardar
  }
  return cfg;
}

const ICONES_BENEFICIO = [Repeat, Sparkles, BadgePercent];
// Selo do nível quando o título do item é o nome do nível
const CODIGO_NIVEL: Record<string, string> = { Select: "C", Premium: "B", Elite: "A" };

// Desenhos dos benefícios, na ordem dos itens: interface ilustrativa, sem números inventados
function VisualBeneficio({ posicao }: { posicao: number }) {
  if (posicao === 0) {
    const etapas = ["Cliente compra de você", "Faz o diagnóstico comercial", "Segue o plano de ação", "Vende mais, com processo", "Continua com você"];
    return (
      <ol className="rounded-[14px] border border-white/10 bg-card p-5" aria-hidden>
        {etapas.map((e, i) => (
          <li key={e} className="relative flex items-center gap-3 pb-4 last:pb-0">
            {i < etapas.length - 1 && <span className="absolute left-[11px] top-6 h-[calc(100%-12px)] w-px bg-white/10" />}
            <span className={`relative flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-xs font-bold ${i === etapas.length - 1 ? "border-menta-500 bg-menta-500 text-primary-foreground" : "border-white/20 text-neutro-300"}`}>
              {i === etapas.length - 1 ? <HeartHandshake className="h-3.5 w-3.5" /> : i + 1}
            </span>
            <span className={`text-sm ${i === etapas.length - 1 ? "font-semibold" : "text-neutro-100"}`}>{e}</span>
          </li>
        ))}
      </ol>
    );
  }
  if (posicao === 1) {
    return (
      <div className="space-y-3 rounded-[14px] border border-white/10 bg-card p-5" aria-hidden>
        <p className="w-fit max-w-[85%] rounded-[14px] rounded-bl-[4px] bg-white/5 px-4 py-2.5 text-sm">Gostei da proposta, mas o outro tá mais barato. Consegue um desconto?</p>
        <div className="ml-auto max-w-[85%] rounded-[14px] rounded-br-[4px] border border-white/10 px-4 py-2.5 text-sm text-neutro-300 line-through decoration-neutro-500">Vou ver o que consigo fazer no preço.</div>
        <div className="ml-auto max-w-[85%] rounded-[14px] rounded-br-[4px] border border-menta-500/40 bg-menta-500/10 px-4 py-2.5 text-sm">
          Melhor: fechando com a gente, o seu time ganha um diagnóstico comercial da Wise Makers, um plano de ação e acesso ao Wise Hub. Sem custo.
        </div>
      </div>
    );
  }
  if (posicao === 2) {
    const passos = ["Cliente entra pelo seu link", "Faz o diagnóstico", "Contrata a consultoria da Wise"];
    return (
      <div className="rounded-[14px] border border-white/10 bg-card p-5" aria-hidden>
        <ul className="space-y-2">
          {passos.map((p) => (
            <li key={p} className="flex items-center gap-2 text-sm text-neutro-100"><CheckCircle2 className="h-4 w-4 shrink-0 text-neutro-300" />{p}</li>
          ))}
        </ul>
        <div className="mt-4 rounded-[10px] border border-menta-500/40 bg-menta-500/10 px-4 py-3">
          <p className="text-[28px] font-bold leading-none tabular-nums text-menta-400">40%</p>
          <p className="mt-1 text-sm">da primeira mensalidade, pago ao CNPJ da sua empresa</p>
        </div>
      </div>
    );
  }
  return null;
}

export default function LandingParceiros() {
  const origem = useMemo(() => capturarOrigem(), []);
  useCabecalhoPagina("Wise Partners | Ecossistema de negócios do Grupo Tríade");

  const { data: cfg, isLoading, isError, refetch } = useQuery<ConfigLanding>({
    queryKey: ["landing-parceiros"], queryFn: carregarConfigGuardando, retry: 1, staleTime: 5 * 60_000,
    // Quem já visitou abre com o conteúdo da última visita; a configuração nova chega por cima
    placeholderData: lerConfigGuardada,
  });

  const { valores, cases, vars } = useMemo(() => resolverDados(cfg), [cfg]);
  const conteudo = useMemo(() => montarConteudo(PADRAO_PARCEIROS, cfg?.conteudo, vars), [cfg?.conteudo, vars]);
  const s = conteudo.secoes;
  // A entrada é sempre pessoal (P-21 a P-23): cadastro na fila, WhatsApp, conversa de entrada e só então o acesso
  const foraDoAr = !!cfg && !cfg.publicada;
  const carregandoTudo = isLoading && !cfg;
  const { ctaTopo, formRef, fimRef, visivel: barraVisivel } = useBarraFixa(!carregandoTudo && !foraDoAr);

  useEffect(() => {
    if (cfg?.publicada) iniciarMedicao(cfg);
  }, [cfg]);

  const perguntas = conteudo.perguntas;

  const irParaCadastro = () => formRef.current?.scrollIntoView({ behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth", block: "start" });
  // Quem chega de /comunidade/cadastro ou de um link com #cadastro vai direto ao formulário
  useEffect(() => {
    if (!carregandoTudo && window.location.hash === "#cadastro") setTimeout(() => formRef.current?.scrollIntoView({ block: "start" }), 50);
  }, [carregandoTudo, formRef]);

  if (carregandoTudo) return <EsqueletoPagina />;
  if (foraDoAr) {
    return (
      <PaginaAviso titulo="O cadastro no Wise Partners está fora do ar no momento."
        texto="Volte em breve ou fale com a Wise Makers pelo e-mail contato@wisemakers.com.br."
        acao={<Button asChild variant="outline"><Link to="/entrar">Entrar no portal</Link></Button>} />
    );
  }

  const fixoTexto = s.topo.botao || "Cadastrar minha empresa";
  const grupo = cfg?.empresas_grupo ?? [];

  return (
    <div className="min-h-screen overflow-x-clip bg-background text-foreground">
      <header className="sticky top-0 z-20 border-b border-white/10 bg-background/90 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
          <span className="flex min-w-0 items-center gap-3">
            <Logo className="h-7 shrink-0" />
            <span className="hidden border-l border-white/15 pl-3 text-sm font-semibold sm:inline">Wise Partners</span>
          </span>
          <nav className="flex items-center gap-2" aria-label="Acesso">
            <Button asChild variant="ghost" size="sm"><Link to="/entrar">Entrar</Link></Button>
            <Button size="sm" onClick={irParaCadastro}>Cadastrar</Button>
          </nav>
        </div>
      </header>

      <main>
        <Topo eyebrow={s.topo.eyebrow} titulo={s.topo.titulo} texto={s.topo.texto} botao={s.topo.botao} nota={s.topo.nota}
          ctaRef={ctaTopo} aoClicar={irParaCadastro}
          video={<Video url={cfg?.video_url ?? null} formato={cfg?.video_formato} carregando={!cfg && !isError} />} />

        {s.logos.visivel && <FaixaLogos titulo={s.logos.titulo} />}

        {s.caminhos.visivel && (
          <Secao eyebrow={s.caminhos.eyebrow} titulo={s.caminhos.titulo}>
            <ul className="grid gap-4 md:grid-cols-2">
              {s.caminhos.itens.map((x, i) => {
                const Icone = i === 0 ? Store : Send;
                return (
                  <li key={`${i}-${x.titulo}`} className="min-w-0 rounded-[14px] border border-white/10 bg-card p-6">
                    <Icone className="h-6 w-6 text-menta-400" aria-hidden />
                    <p className="mt-3 break-words text-[22px] font-semibold leading-snug">{x.titulo}</p>
                    {x.texto && <p className="mt-2 text-neutro-100">{x.texto}</p>}
                  </li>
                );
              })}
            </ul>
          </Secao>
        )}

        {s.grupo.visivel && grupo.length > 0 && (
          <Faixa>
            <Secao eyebrow={s.grupo.eyebrow} titulo={s.grupo.titulo} texto={s.grupo.texto}>
              <ul className="grid gap-4 md:grid-cols-3">{grupo.map((e) => <CartaoEmpresaGrupo key={e.id} e={e} />)}</ul>
            </Secao>
          </Faixa>
        )}

        {s.para_quem.visivel && (
          <Faixa>
            <Secao eyebrow={s.para_quem.eyebrow} titulo={s.para_quem.titulo} texto={s.para_quem.texto}>
              <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {s.para_quem.itens.map((x, i) => (
                  <li key={`${i}-${x.titulo}`} className="min-w-0 rounded-[14px] border border-white/10 bg-card p-5">
                    <p className="break-words font-semibold">{x.titulo}</p>
                    {x.texto && <p className="mt-2 text-sm text-neutro-300">{x.texto}</p>}
                  </li>
                ))}
              </ul>
            </Secao>
          </Faixa>
        )}

        {s.como_funciona.visivel && (
          <Secao eyebrow={s.como_funciona.eyebrow} titulo={s.como_funciona.titulo}>
            <PassosNumerados itens={s.como_funciona.itens} />
          </Secao>
        )}

        {s.catalogo.visivel && (
          <Faixa>
            <Secao eyebrow={s.catalogo.eyebrow} titulo={s.catalogo.titulo} texto={s.catalogo.texto}>
              <NumerosCatalogo resumo={cfg?.resumo} nota={s.catalogo.nota} />
            </Secao>
          </Faixa>
        )}

        {s.acessos.visivel && (
          <Secao eyebrow={s.acessos.eyebrow} titulo={s.acessos.titulo} texto={s.acessos.texto}>
            <QuadroAcessos />
          </Secao>
        )}

        {s.beneficios.visivel && (
          <Faixa>
            <Secao eyebrow={s.beneficios.eyebrow} titulo={s.beneficios.titulo}>
              <div className="space-y-12 sm:space-y-16">
                {s.beneficios.itens.map((b, i) => {
                  const Icone = ICONES_BENEFICIO[i] ?? Sparkles;
                  return (
                    <div key={`${i}-${b.titulo}`} className="grid items-center gap-6 md:grid-cols-2 md:gap-12">
                      <div className={`min-w-0 ${i % 2 === 1 ? "md:order-2" : ""}`}>
                        <Icone className="h-6 w-6 text-menta-400" aria-hidden />
                        <h3 className="mt-3 break-words text-[22px] font-semibold leading-snug sm:text-[28px]">{b.titulo}</h3>
                        {b.texto && <p className="mt-3 max-w-[56ch] text-neutro-100">{b.texto}</p>}
                      </div>
                      {i < 3 && <div className={i % 2 === 1 ? "md:order-1" : ""}><VisualBeneficio posicao={i} /></div>}
                    </div>
                  );
                })}
              </div>
            </Secao>
          </Faixa>
        )}

        {s.faixa_meio.visivel && (
          <FaixaEvento titulo={s.faixa_meio.titulo} texto={s.faixa_meio.texto} botao={s.faixa_meio.botao || fixoTexto} aoClicar={irParaCadastro} nota={s.faixa_meio.nota} />
        )}

        {s.incluido.visivel && (
          <Secao eyebrow={s.incluido.eyebrow} titulo={s.incluido.titulo}>
            <div className="grid gap-4 lg:grid-cols-2">
              {([["Seu cliente recebe", s.incluido.itens], ["Você recebe", s.incluido.itens_parceiro]] as const).map(([t, lista]) => (
                <div key={t} className="rounded-[14px] border border-white/10 bg-card p-6">
                  <h3 className="text-lg font-semibold">{t}</h3>
                  <ul className="mt-4 space-y-4">
                    {lista.map((x, i) => (
                      <li key={`${i}-${x.titulo}`} className="flex items-start gap-3">
                        <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-menta-400" aria-hidden />
                        <span className="min-w-0"><span className="block break-words font-semibold">{x.titulo}</span>{x.texto && <span className="text-sm text-neutro-300">{x.texto}</span>}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
            {s.incluido.texto && <p className="mt-4 text-sm text-neutro-300">{s.incluido.texto}</p>}
          </Secao>
        )}

        {s.niveis.visivel && (
          <Faixa>
            <Secao eyebrow={s.niveis.eyebrow} titulo={s.niveis.titulo} texto={s.niveis.texto}>
              <ol className="grid gap-4 md:grid-cols-3">
                {s.niveis.itens.map((n, i) => (
                  <li key={`${i}-${n.titulo}`} className="min-w-0 rounded-[14px] border border-white/10 bg-card p-5">
                    {CODIGO_NIVEL[n.titulo]
                      ? <SeloNivel tipo="comercial" nivel={CODIGO_NIVEL[n.titulo]} className="text-sm" />
                      : <p className="font-semibold">{n.titulo}</p>}
                    {n.texto && <p className="mt-3 text-sm text-neutro-100">{n.texto}</p>}
                  </li>
                ))}
              </ol>
            </Secao>
          </Faixa>
        )}

        {s.valor.visivel && (
          <Secao eyebrow={s.valor.eyebrow} titulo={s.valor.titulo} texto={s.valor.texto}>
            <QuadroValorHub paraQuem="Pro seu cliente" valores={valores} perfil={vars.perfil_reuniao}
              vantagens={s.valor.itens.map((v) => v.titulo)} destaque={s.valor.nota || undefined} />
          </Secao>
        )}

        {s.cases.visivel && cases.itens.length > 0 && (
          <div className="border-t border-white/10">
            <Secao eyebrow={s.cases.eyebrow} titulo={s.cases.titulo} texto={s.cases.texto}>
              <QuadroCases cases={cases} nota={s.cases.nota} />
            </Secao>
          </div>
        )}

        {s.depoimentos.visivel && <SecaoDepoimentos eyebrow={s.depoimentos.eyebrow} titulo={s.depoimentos.titulo} />}

        {s.comparacao.visivel && (
          <Faixa>
            <Secao eyebrow={s.comparacao.eyebrow} titulo={s.comparacao.titulo}>
              <TabelaComparacao legenda="Comparação entre vender sem o programa e vender com a consultoria incluída do Wise Partners"
                colunas={["Sem o programa", "Com o Wise Partners"]} marcas={[false, true]} linhas={s.comparacao.itens}
                custo={{ rotulo: "Custo a mais pra você", valores: ["Nenhum", "Nenhum"] }} />
            </Secao>
          </Faixa>
        )}

        {s.perguntas.visivel && perguntas.length > 0 && (
          <Secao eyebrow={s.perguntas.eyebrow} titulo={s.perguntas.titulo}>
            <ListaPerguntas perguntas={perguntas} />
          </Secao>
        )}

        {/* Fechamento: frase, cadastro e garantias */}
        <div ref={formRef} id="cadastro" className="scroll-mt-16 border-t border-white/10">
          <section className="mx-auto w-full max-w-6xl px-4 py-14 sm:px-6 sm:py-20">
            {s.cadastro.eyebrow && <p className="text-xs font-semibold uppercase tracking-[0.12em] text-menta-400">{s.cadastro.eyebrow}</p>}
            <h2 className="mt-2 max-w-3xl text-balance break-words font-display text-[28px] font-extrabold leading-tight sm:text-[36px]">{s.cadastro.titulo}</h2>
            <p className="mt-4 max-w-[62ch] text-neutro-100">{s.cadastro.texto}</p>
            <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_1.4fr] lg:items-start">
              <ul className="space-y-3 text-sm text-neutro-100 lg:pt-2">
                {s.cadastro.itens.map((t, i) => (
                  <li key={`${i}-${t.titulo}`} className="flex items-start gap-2"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-menta-400" aria-hidden />{t.titulo}</li>
                ))}
              </ul>
              <div className="min-w-0 rounded-[14px] border border-white/10 bg-card p-5 sm:p-6">
                {isError && !cfg ? (
                  <div className="space-y-3 text-sm" role="alert">
                    <p className="font-semibold">Não conseguimos abrir o cadastro agora.</p>
                    <p className="text-neutro-300">Pode ser a conexão. Tente de novo em instantes.</p>
                    <Button variant="outline" onClick={() => refetch()}>Tentar de novo</Button>
                  </div>
                ) : (
                  <FormularioCadastro empresasGrupo={grupo} categorias={cfg?.categorias ?? []} botao={s.cadastro.botao} />
                )}
              </div>
            </div>

          </section>
        </div>
      </main>

      <footer ref={fimRef} className="border-t border-white/10">
        <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-6 text-xs text-neutro-300 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <p>Wise Partners · Wise Makers, empresa do Grupo Tríade · Maringá, Paraná</p>
          <nav className="flex flex-wrap gap-x-4 gap-y-2" aria-label="Documentos">
            <Link to="/comunidade/termo" className="hover:text-foreground">Termo de uso</Link>
            <Link to="/parceiros/termo" className="hover:text-foreground">Termo de adesão</Link>
            <Link to="/parceiros/privacidade" className="hover:text-foreground">Política de privacidade</Link>
            <Link to="/entrar" className="hover:text-foreground">Entrar no portal</Link>
          </nav>
        </div>
      </footer>

      <BarraFixa visivel={barraVisivel} texto={fixoTexto} aoClicar={irParaCadastro} />
    </div>
  );
}
