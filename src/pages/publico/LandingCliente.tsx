import { useEffect, useMemo, useState, type FormEvent } from "react";
import { Link, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { CalendarCheck, Check, CheckCircle2, ClipboardList, ExternalLink, Loader2, Map as MapaIcone, Sparkles, X } from "lucide-react";
import { Logo } from "@/components/comum/Logo";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Campo, FaixaEvento, FaixaLogos, QuadroCases, QuadroValorHub, Secao, SecaoDepoimentos, Video } from "@/components/landing/Blocos";
import {
  BarraFixa, EsqueletoPagina, Faixa, Garantias, JornadaConsultoria, ListaPerguntas, PaginaAviso, PassosNumerados, TabelaComparacao, Topo, useBarraFixa, useCabecalhoPagina,
} from "@/components/landing/Secoes";
import { Autodiagnostico } from "@/components/landing/Autodiagnostico";
import {
  capturarOrigem, carregarPaginaCliente, cnpjValido, enviarCliente, iniciarMedicao, mascaraCnpj, mascaraTelefone, registrarLead, somenteDigitos,
  type PaginaCliente, type RespostaCadastroCliente,
} from "@/lib/landing";
import { CRITERIOS, FAIXAS_FATURAMENTO, PILARES } from "@/lib/diagnostico";
import { PADRAO_CLIENTE, montarConteudo, reais, resolverDados } from "@/lib/paginas";

// Página única do cliente do parceiro (/c/:codigo): igual para todos, sem nome, logo ou cor do parceiro.
// Pergunta que a página responde: "O que eu ganho com essa consultoria e como começo?"
// O código do link só atribui o cadastro ao parceiro que mandou o link. Textos, seções, perguntas, valores e cases
// vêm do portal (Programa, Páginas); o padrão está em src/lib/paginas.ts.
// No perfil (vendedores e faturamento mínimos, configuráveis), a pessoa escolhe o horário da reunião de diagnóstico;
// abaixo dele, faz o autodiagnóstico na hora e só depois recebe o link do Wise Hub.

const VAZIO = {
  nome: "", cargo: "", email: "", whatsapp: "", empresa: "", cnpj: "", faturamento_faixa: "", vendedores: "", segmento: "", desafio: "",
  autoriza_parceiro: false, aceite_privacidade: false, website: "",
};

const ICONES_INCLUIDO = [CalendarCheck, MapaIcone, Sparkles, ClipboardList];

const FOTOS = [
  { src: "/landing/equipe.webp", alt: "Equipe da Wise Makers reunida no palco de uma imersão", legenda: "O time da Wise Makers", posicao: "object-center" },
  { src: "/landing/aula-bant.webp", alt: "Consultor da Wise Makers dando aula sobre qualificação de leads com a metodologia BANT", legenda: "Aula da imersão: qualificação de leads", posicao: "object-center" },
  { src: "/landing/igor-retrato.webp", alt: "Igor, diretor da Wise Makers", legenda: "Igor, diretor da Wise Makers", posicao: "object-[50%_22%]" },
];

// Desenhos dos benefícios, na ordem dos itens (exemplos ilustrativos, sem números inventados)
function VisualBeneficio({ posicao }: { posicao: number }) {
  if (posicao === 0) {
    const barras: [string, string, boolean][] = [
      ["Identidade e posicionamento", "w-[70%]", false], ["Demanda e aquisição", "w-[45%]", false], ["Conversão e experiência", "w-[60%]", false],
      ["Expansão e retenção", "w-[20%]", true], ["Governança e integração", "w-[40%]", false],
    ];
    return (
      <div className="rounded-[14px] border border-white/10 bg-card p-5" aria-hidden>
        <div className="flex items-baseline justify-between gap-3">
          <p className="text-sm font-semibold">Seu resultado</p>
          <p className="text-xs text-neutro-300">Exemplo ilustrativo</p>
        </div>
        <ul className="mt-4 space-y-3">
          {barras.map(([n, w, fragil]) => (
            <li key={n} className="text-xs">
              <span className={fragil ? "font-semibold text-foreground" : "text-neutro-300"}>{n}{fragil && <span className="ml-2 font-normal text-menta-300">comece por aqui</span>}</span>
              <div className="mt-1 h-2 rounded-full bg-white/5"><div className={`h-2 rounded-full ${fragil ? "bg-menta-500" : "bg-neutro-300"} ${w}`} /></div>
            </li>
          ))}
        </ul>
      </div>
    );
  }
  if (posicao === 1) {
    return (
      <div className="grid gap-3 sm:grid-cols-2" aria-hidden>
        <div className="rounded-[14px] border border-white/10 bg-card p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-neutro-300">Hoje</p>
          <ul className="mt-3 space-y-2 text-sm text-neutro-300">
            {["Planilhas paralelas", "Informação espalhada no WhatsApp", "Decisão no achismo"].map((t) => (
              <li key={t} className="flex items-center gap-2"><X className="h-4 w-4 shrink-0 text-neutro-500" />{t}</li>
            ))}
          </ul>
        </div>
        <div className="rounded-[14px] border border-menta-500/40 bg-menta-500/10 p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-menta-300">Com processo</p>
          <ul className="mt-3 space-y-2 text-sm">
            {["Etapas da venda definidas", "Informação num lugar só", "Decisão com número"].map((t) => (
              <li key={t} className="flex items-center gap-2"><Check className="h-4 w-4 shrink-0 text-menta-400" />{t}</li>
            ))}
          </ul>
        </div>
      </div>
    );
  }
  if (posicao === 2) {
    const fases: [string, string][] = [
      ["30 dias", "Definir o cliente ideal e as etapas da venda"],
      ["60 dias", "Rotina semanal de prospecção e reunião de números"],
      ["90 dias", "Metas por vendedor acompanhadas com dados"],
    ];
    return (
      <ol className="rounded-[14px] border border-white/10 bg-card p-5" aria-hidden>
        <li className="mb-4 flex items-baseline justify-between gap-3"><span className="text-sm font-semibold">Seu plano</span><span className="text-xs text-neutro-300">Exemplo ilustrativo</span></li>
        {fases.map(([t, d], i) => (
          <li key={t} className="relative flex gap-4 pb-5 last:pb-0">
            {i < fases.length - 1 && <span className="absolute left-[27px] top-9 h-[calc(100%-28px)] w-px bg-white/10" />}
            <span className={`relative flex h-14 w-14 shrink-0 items-center justify-center rounded-full border text-center text-xs font-bold leading-tight ${i === 0 ? "border-menta-500 text-menta-300" : "border-white/20 text-neutro-300"}`}>{t}</span>
            <span className="self-center text-sm text-neutro-100">{d}</span>
          </li>
        ))}
      </ol>
    );
  }
  return null;
}

type Etapa = { tipo: "form" } | { tipo: "agenda"; url: string | null } | { tipo: "diagnostico"; id: string; chave: string; email: string };

export default function LandingCliente() {
  const { codigo = "" } = useParams();
  const origem = useMemo(() => capturarOrigem(), []);
  const [f, setF] = useState(VAZIO);
  const [tocado, setTocado] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [falha, setFalha] = useState<string | null>(null);
  const [etapa, setEtapa] = useState<Etapa>({ tipo: "form" });
  const set = (k: keyof typeof VAZIO, v: string | boolean) => setF((x) => ({ ...x, [k]: v }));

  useCabecalhoPagina("Wise Makers | Consultoria comercial");

  const { data, isLoading, isError, refetch } = useQuery<PaginaCliente>({
    queryKey: ["landing-cliente", codigo], queryFn: () => carregarPaginaCliente(codigo), retry: 1, staleTime: 5 * 60_000,
  });
  // Enquanto a função publicada for a anterior, ela ainda manda o parceiro em vez de link_valido
  const linkValido = data?.link_valido ?? !!data?.parceiro;
  const pronta = !!data && data.publicada && linkValido;
  const { valores, cases, vars } = useMemo(() => resolverDados(data), [data]);
  const conteudo = useMemo(() => montarConteudo(PADRAO_CLIENTE, data?.conteudo, vars), [data?.conteudo, vars]);
  const s = conteudo.secoes;
  const { ctaTopo, formRef, fimRef, visivel } = useBarraFixa(pronta);
  const barraFixa = visivel && etapa.tipo === "form";

  useEffect(() => {
    if (data && pronta) iniciarMedicao(data);
  }, [data, pronta]);

  const erros = {
    nome: !f.nome.trim() ? "Informe o seu nome." : "",
    cargo: !f.cargo.trim() ? "Informe o seu cargo." : "",
    email: !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.email.trim()) ? "Informe um e-mail válido." : "",
    whatsapp: somenteDigitos(f.whatsapp).length < 10 ? "Informe o WhatsApp com DDD." : "",
    empresa: !f.empresa.trim() ? "Informe o nome da empresa." : "",
    cnpj: !cnpjValido(f.cnpj) ? "Informe um CNPJ válido." : "",
    faturamento_faixa: !f.faturamento_faixa ? "Escolha uma faixa." : "",
    vendedores: !/^\d{1,6}$/.test(f.vendedores) ? "Informe um número." : "",
    segmento: !f.segmento.trim() ? "Informe o segmento." : "",
    desafio: !f.desafio.trim() ? "Conte em uma frase." : "",
    aceite: !f.aceite_privacidade ? "Marque a caixa da política de privacidade pra continuar." : "",
  };
  const valido = Object.values(erros).every((e) => !e);
  const mostra = (k: keyof typeof erros) => (tocado ? erros[k] : "");
  const irParaCadastro = () => formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });

  async function enviar(e: FormEvent) {
    e.preventDefault();
    setTocado(true);
    setFalha(null);
    if (!valido) {
      setTimeout(() => document.querySelector<HTMLElement>('#cadastro [aria-invalid="true"]')?.focus(), 0);
      return;
    }
    if (enviando) return;
    setEnviando(true);
    const email = f.email.trim().toLowerCase();
    try {
      const r = await enviarCliente<RespostaCadastroCliente>({
        acao: "cadastro", codigo, ...f, email, cnpj: somenteDigitos(f.cnpj), ...origem,
      });
      if (!r.id) return; // campo oculto preenchido
      registrarLead(r.icp);
      setEtapa(r.icp ? { tipo: "agenda", url: r.agenda_url } : { tipo: "diagnostico", id: r.id, chave: r.chave, email });
      setTimeout(irParaCadastro, 50);
    } catch (err) {
      setFalha(err instanceof Error ? err.message : "Sem conexão com o servidor. Confira a internet e tente de novo.");
    } finally {
      setEnviando(false);
    }
  }

  if (isLoading) return <EsqueletoPagina />;
  if (isError || !data) {
    return (
      <PaginaAviso titulo="Não conseguimos abrir a página agora." texto="Pode ser a conexão. Tente de novo em instantes."
        acao={<Button variant="outline" onClick={() => refetch()}>Tentar de novo</Button>} />
    );
  }
  if (!data.publicada) {
    return <PaginaAviso titulo="A página está fora do ar no momento." texto="Volte em breve ou fale com a Wise Makers pelo e-mail contato@wisemakers.com.br." />;
  }
  if (!linkValido) {
    return <PaginaAviso titulo="Este link não está ativo." texto="Peça um link novo para quem te enviou ou fale com a Wise Makers pelo e-mail contato@wisemakers.com.br." />;
  }

  const botao = s.topo.botao || "Quero meu diagnóstico";

  return (
    <div className="min-h-screen overflow-x-clip bg-background text-foreground">
      <header className="sticky top-0 z-20 border-b border-white/10 bg-background/90 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
          <Logo className="h-7 shrink-0" />
          <Button size="sm" onClick={irParaCadastro} className="hidden sm:inline-flex">{botao}</Button>
        </div>
      </header>

      <main>
        <Topo eyebrow={s.topo.eyebrow} titulo={s.topo.titulo} texto={s.topo.texto} botao={botao} nota={s.topo.nota}
          ctaRef={ctaTopo} aoClicar={irParaCadastro} video={<Video url={data.video_url} formato={data.video_formato} />} />

        {s.logos.visivel && <FaixaLogos titulo={s.logos.titulo} />}

        {s.como_funciona.visivel && (
          <Secao eyebrow={s.como_funciona.eyebrow} titulo={s.como_funciona.titulo}>
            <PassosNumerados itens={s.como_funciona.itens} />
          </Secao>
        )}

        {s.beneficios.visivel && (
          <Faixa>
            <Secao eyebrow={s.beneficios.eyebrow} titulo={s.beneficios.titulo}>
              <div className="space-y-12 sm:space-y-16">
                {s.beneficios.itens.map((b, i) => (
                  <div key={`${i}-${b.titulo}`} className="grid items-center gap-6 md:grid-cols-2 md:gap-12">
                    <div className={`min-w-0 ${i % 2 === 1 ? "md:order-2" : ""}`}>
                      <h3 className="break-words text-[22px] font-semibold leading-snug sm:text-[28px]">{b.titulo}</h3>
                      {b.texto && <p className="mt-3 max-w-[56ch] text-neutro-100">{b.texto}</p>}
                    </div>
                    {i < 3 && <div className={i % 2 === 1 ? "md:order-1" : ""}><VisualBeneficio posicao={i} /></div>}
                  </div>
                ))}
              </div>
            </Secao>
          </Faixa>
        )}

        {s.matriz.visivel && (
          <Secao eyebrow={s.matriz.eyebrow} titulo={s.matriz.titulo} texto={s.matriz.texto}>
            <ol className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
              {PILARES.map((p, i) => (
                <li key={p.chave} className="rounded-[14px] border border-white/10 bg-card p-4">
                  <p className="text-xs font-bold tabular-nums text-neutro-300">Pilar {i + 1}</p>
                  <p className="mt-1 font-semibold leading-snug">{p.nome}</p>
                  <p className="mt-2 text-sm text-neutro-300">{p.dica}</p>
                </li>
              ))}
            </ol>
            <p className="mt-5 text-sm text-neutro-300">
              Em cada pilar: {CRITERIOS.map((c) => c.nome.toLowerCase()).join(", ").replace(/, ([^,]*)$/, " e $1")}.
            </p>
          </Secao>
        )}

        {s.faixa_meio.visivel && (
          <FaixaEvento titulo={s.faixa_meio.titulo} texto={s.faixa_meio.texto} botao={s.faixa_meio.botao || botao} aoClicar={irParaCadastro} nota={s.faixa_meio.nota} />
        )}

        {(s.incluido.visivel || s.valor.visivel) && (
          <Secao eyebrow={s.incluido.visivel ? s.incluido.eyebrow : s.valor.eyebrow} titulo={s.incluido.visivel ? s.incluido.titulo : s.valor.titulo}
            texto={s.incluido.visivel ? undefined : s.valor.texto}>
            {s.incluido.visivel && (
              <ul className="grid gap-4 sm:grid-cols-2">
                {s.incluido.itens.map((x, i) => {
                  const Icone = ICONES_INCLUIDO[i] ?? CheckCircle2;
                  return (
                    <li key={`${i}-${x.titulo}`} className="flex items-start gap-4 rounded-[14px] border border-white/10 bg-card p-5">
                      <Icone className="mt-0.5 h-5 w-5 shrink-0 text-menta-400" aria-hidden />
                      <span className="min-w-0"><span className="block break-words font-semibold">{x.titulo}</span>{x.texto && <span className="mt-1 block text-sm text-neutro-300">{x.texto}</span>}</span>
                    </li>
                  );
                })}
              </ul>
            )}
            {s.valor.visivel && (
              <>
                {s.incluido.visivel && (
                  <>
                    <h3 className="mt-14 max-w-3xl text-balance break-words text-[22px] font-semibold leading-snug sm:text-[28px]">{s.valor.titulo}</h3>
                    {s.valor.texto && <p className="mt-3 max-w-[64ch] text-neutro-100">{s.valor.texto}</p>}
                  </>
                )}
                <QuadroValorHub paraQuem="Pra você" valores={valores} perfil={vars.perfil_reuniao}
                  vantagens={s.valor.itens.map((v) => v.titulo)} destaque={s.valor.nota || undefined} />
              </>
            )}
          </Secao>
        )}

        {s.jornada.visivel && (
          <Faixa>
            <Secao eyebrow={s.jornada.eyebrow} titulo={s.jornada.titulo} texto={s.jornada.texto}>
              <JornadaConsultoria itens={s.jornada.itens} nota={s.jornada.nota} />
            </Secao>
          </Faixa>
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
              <TabelaComparacao legenda="Comparação entre resolver sozinho, contratar uma consultoria à parte e usar a consultoria incluída pelo seu fornecedor"
                colunas={["Sozinho", "Contratando à parte", "Incluído pelo fornecedor"]} marcas={[false, true, true]} linhas={s.comparacao.itens}
                custo={{ rotulo: "Quanto custa pra você", valores: ["Seu tempo", reais(valores.total), "R$ 0"] }} />
            </Secao>
          </Faixa>
        )}

        {s.perguntas.visivel && conteudo.perguntas.length > 0 && (
          <Secao eyebrow={s.perguntas.eyebrow} titulo={s.perguntas.titulo}>
            <ListaPerguntas perguntas={conteudo.perguntas} />
          </Secao>
        )}

        {s.equipe.visivel && (
          <section aria-labelledby="equipe-titulo" className="mx-auto w-full max-w-6xl px-4 pb-4 sm:px-6">
            <h2 id="equipe-titulo" className="text-sm font-medium text-neutro-300">{s.equipe.titulo}</h2>
            <ul className="-mx-4 mt-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-2 sm:mx-0 sm:grid sm:grid-cols-3 sm:overflow-visible sm:px-0 sm:pb-0">
              {FOTOS.map((foto) => (
                <li key={foto.src} className="w-[78%] shrink-0 snap-start sm:w-auto">
                  <figure>
                    <img src={foto.src} alt={foto.alt} width={900} height={600} loading="lazy" decoding="async"
                      className={`aspect-[4/3] h-auto w-full rounded-[14px] border border-white/10 object-cover ${foto.posicao}`} />
                    <figcaption className="mt-2 text-xs text-neutro-300">{foto.legenda}</figcaption>
                  </figure>
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* Cadastro, agenda ou autodiagnóstico */}
        <div ref={formRef} id="cadastro" className="scroll-mt-16 border-t border-white/10">
          <section className="mx-auto w-full max-w-6xl px-4 py-14 sm:px-6 sm:py-20">
            {s.cadastro.eyebrow && <p className="text-xs font-semibold uppercase tracking-[0.12em] text-menta-400">{s.cadastro.eyebrow}</p>}
            <h2 className="mt-2 max-w-3xl text-balance break-words font-display text-[28px] font-extrabold leading-tight sm:text-[36px]">{s.cadastro.titulo}</h2>
            <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_1.4fr] lg:items-start">
              <ul className="space-y-3 text-sm text-neutro-100 lg:pt-2">
                {s.incluido.itens.map((t, i) => (
                  <li key={`${i}-${t.titulo}`} className="flex items-start gap-2"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-menta-400" aria-hidden />{t.titulo}</li>
                ))}
              </ul>
              <div className="min-w-0 rounded-[14px] border border-white/10 bg-card p-5 sm:p-6">
                {etapa.tipo === "agenda" ? (
                  <div className="space-y-4" role="status">
                    <p className="flex items-center gap-2 font-semibold"><CheckCircle2 className="h-5 w-5 text-menta-400" aria-hidden />Cadastro feito. Agora escolha o horário.</p>
                    <p className="text-sm text-neutro-300">Pelo perfil da sua empresa, o diagnóstico é numa reunião online de cerca de 2 horas com a equipe da Wise Makers. O plano de ação chega por e-mail em até 2 dias úteis.</p>
                    {etapa.url ? (
                      <>
                        <iframe src={etapa.url} title="Agenda da reunião de diagnóstico" className="h-[640px] w-full rounded-[10px] border border-white/10 bg-white" />
                        <a href={etapa.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-sm font-semibold text-menta-300 underline-offset-4 hover:underline">
                          Abrir a agenda em outra aba <ExternalLink className="h-4 w-4" aria-hidden />
                        </a>
                      </>
                    ) : (
                      <p className="text-sm">A equipe da Wise vai te chamar no WhatsApp pra combinar o horário.</p>
                    )}
                  </div>
                ) : etapa.tipo === "diagnostico" ? (
                  <Autodiagnostico id={etapa.id} chave={etapa.chave} email={etapa.email} />
                ) : (
                  <form onSubmit={enviar} noValidate className="space-y-4">
                    <div className="grid gap-4 sm:grid-cols-2">
                      <Campo id="nome" rotulo="Seu nome" erro={mostra("nome")}>
                        <Input className="border-white/40" id="nome" autoComplete="name" value={f.nome} onChange={(e) => set("nome", e.target.value)} aria-invalid={!!mostra("nome")} aria-describedby={mostra("nome") ? "nome-erro" : undefined} />
                      </Campo>
                      <Campo id="cargo" rotulo="Cargo" erro={mostra("cargo")}>
                        <Input className="border-white/40" id="cargo" autoComplete="organization-title" value={f.cargo} onChange={(e) => set("cargo", e.target.value)} aria-invalid={!!mostra("cargo")} aria-describedby={mostra("cargo") ? "cargo-erro" : undefined} />
                      </Campo>
                      <Campo id="email" rotulo="E-mail de trabalho" erro={mostra("email")}>
                        <Input className="border-white/40" id="email" type="email" inputMode="email" autoComplete="email" value={f.email} onChange={(e) => set("email", e.target.value)} aria-invalid={!!mostra("email")} aria-describedby={mostra("email") ? "email-erro" : undefined} />
                      </Campo>
                      <Campo id="whatsapp" rotulo="WhatsApp" erro={mostra("whatsapp")}>
                        <Input className="border-white/40" id="whatsapp" type="tel" inputMode="tel" autoComplete="tel" placeholder="(44) 99999-0000" value={f.whatsapp}
                          onChange={(e) => set("whatsapp", mascaraTelefone(e.target.value))} aria-invalid={!!mostra("whatsapp")} aria-describedby={mostra("whatsapp") ? "whatsapp-erro" : undefined} />
                      </Campo>
                      <Campo id="empresa" rotulo="Empresa" erro={mostra("empresa")}>
                        <Input className="border-white/40" id="empresa" autoComplete="organization" value={f.empresa} onChange={(e) => set("empresa", e.target.value)} aria-invalid={!!mostra("empresa")} aria-describedby={mostra("empresa") ? "empresa-erro" : undefined} />
                      </Campo>
                      <Campo id="cnpj" rotulo="CNPJ" erro={mostra("cnpj")}>
                        <Input className="border-white/40" id="cnpj" inputMode="numeric" placeholder="00.000.000/0000-00" value={f.cnpj}
                          onChange={(e) => set("cnpj", mascaraCnpj(e.target.value))} aria-invalid={!!mostra("cnpj")} aria-describedby={mostra("cnpj") ? "cnpj-erro" : undefined} />
                      </Campo>
                      <Campo id="faturamento" rotulo="Faturamento por mês" erro={mostra("faturamento_faixa")}>
                        <Select value={f.faturamento_faixa} onValueChange={(v) => set("faturamento_faixa", v)}>
                          <SelectTrigger id="faturamento" className="border-white/40" aria-invalid={!!mostra("faturamento_faixa")} aria-describedby={mostra("faturamento_faixa") ? "faturamento-erro" : undefined}><SelectValue placeholder="Escolha a faixa" /></SelectTrigger>
                          <SelectContent>{FAIXAS_FATURAMENTO.map((x) => <SelectItem key={x.valor} value={x.valor}>{x.rotulo}</SelectItem>)}</SelectContent>
                        </Select>
                      </Campo>
                      <Campo id="vendedores" rotulo="Quantas pessoas vendem na empresa" erro={mostra("vendedores")}>
                        <Input className="border-white/40" id="vendedores" inputMode="numeric" placeholder="Ex.: 5" value={f.vendedores}
                          onChange={(e) => set("vendedores", somenteDigitos(e.target.value).slice(0, 6))} aria-invalid={!!mostra("vendedores")} aria-describedby={mostra("vendedores") ? "vendedores-erro" : undefined} />
                      </Campo>
                      <Campo id="segmento" rotulo="Segmento" erro={mostra("segmento")}>
                        <Input className="border-white/40" id="segmento" placeholder="Ex.: indústria de alimentos" value={f.segmento} onChange={(e) => set("segmento", e.target.value)} aria-invalid={!!mostra("segmento")} aria-describedby={mostra("segmento") ? "segmento-erro" : undefined} />
                      </Campo>
                      <div className="sm:col-span-2">
                        <Campo id="desafio" rotulo="Seu principal desafio no comercial hoje" erro={mostra("desafio")}>
                          <Textarea className="min-h-[72px] border-white/40" id="desafio" rows={2} maxLength={600} placeholder="Ex.: o time não prospecta, a meta não fecha, ninguém sabe em que pé está cada venda"
                            value={f.desafio} onChange={(e) => set("desafio", e.target.value)} aria-invalid={!!mostra("desafio")} aria-describedby={mostra("desafio") ? "desafio-erro" : undefined} />
                        </Campo>
                      </div>
                    </div>

                    <div className="hidden" aria-hidden>
                      <label htmlFor="website">Site</label>
                      <input id="website" tabIndex={-1} autoComplete="off" value={f.website} onChange={(e) => set("website", e.target.value)} />
                    </div>

                    <div className="space-y-3 border-t border-white/10 pt-4 text-sm">
                      <label className="flex items-start gap-3">
                        <Checkbox checked={f.autoriza_parceiro} onCheckedChange={(v) => set("autoriza_parceiro", v === true)} className="mt-0.5 rounded-[4px] border-white/60" />
                        <span>Autorizo a Wise Makers a compartilhar o resultado do meu diagnóstico com o fornecedor que me enviou este link. <span className="text-neutro-300">(opcional)</span></span>
                      </label>
                      <label className="flex items-start gap-3">
                        <Checkbox checked={f.aceite_privacidade} onCheckedChange={(v) => set("aceite_privacidade", v === true)} className="mt-0.5 rounded-[4px] border-white/60"
                          aria-invalid={!!mostra("aceite")} aria-describedby={mostra("aceite") ? "aceite-erro" : undefined} />
                        <span>Concordo com a <Link to="/parceiros/privacidade" target="_blank" className="text-menta-300 underline underline-offset-2">política de privacidade</Link> e com o uso dos meus dados pra fazer o diagnóstico e falar comigo sobre ele.</span>
                      </label>
                      {mostra("aceite") && <p id="aceite-erro" role="alert" className="text-xs text-destructive">{erros.aceite}</p>}
                    </div>

                    {falha && <p role="alert" className="rounded-[10px] border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm">{falha}</p>}

                    <Button type="submit" size="lg" className="h-12 w-full text-base" disabled={enviando}>
                      {enviando ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden />Enviando...</> : (s.cadastro.botao || "Quero meu diagnóstico")}
                    </Button>
                  </form>
                )}
              </div>
            </div>
            <Garantias itens={s.cadastro.itens} />
          </section>
        </div>
      </main>

      <footer ref={fimRef} className="border-t border-white/10">
        <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-6 text-xs text-neutro-300 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <p>Wise Makers · Estrutura e gestão comercial · Maringá, Paraná</p>
          <nav className="flex gap-4" aria-label="Documentos">
            <Link to="/parceiros/privacidade" className="hover:text-foreground">Política de privacidade</Link>
          </nav>
        </div>
      </footer>

      <BarraFixa visivel={barraFixa} texto={botao} aoClicar={irParaCadastro} />
    </div>
  );
}
