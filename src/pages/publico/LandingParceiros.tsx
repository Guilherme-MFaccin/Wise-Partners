import { useEffect, useMemo, useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { BadgePercent, CheckCircle2, HeartHandshake, Loader2, Repeat, Sparkles } from "lucide-react";
import { Logo } from "@/components/comum/Logo";
import { SeloNivel } from "@/components/comum/Selos";
import { Campo, FaixaEvento, FaixaLogos, QuadroCases, QuadroValorHub, Secao, SecaoDepoimentos, Video } from "@/components/landing/Blocos";
import {
  BarraFixa, EsqueletoPagina, Faixa, Garantias, ListaPerguntas, PaginaAviso, PassosNumerados, TabelaComparacao, Topo, useBarraFixa, useCabecalhoPagina,
} from "@/components/landing/Secoes";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import {
  CABECALHOS, URL_CADASTRO, capturarOrigem, carregarConfig, cnpjValido, idsMeta, iniciarMedicao, mascaraCnpj, mascaraTelefone,
  registrarCadastro, somenteDigitos, type ConfigLanding,
} from "@/lib/landing";
import { PADRAO_PARCEIROS, montarConteudo, reais, resolverDados } from "@/lib/paginas";

// Página única dos parceiros (/parceiros): empresas que vendem para empresas, de qualquer categoria e tamanho.
// Pergunta que a página responde: "Por que oferecer a consultoria da Wise à minha base, e como eu entro?"
// Textos, seções, perguntas, valores e cases vêm do portal (Programa, Páginas); o padrão está em src/lib/paginas.ts.
// Entrada pessoal: cadastro na fila, conversa pelo WhatsApp e conversa de entrada de 45 minutos.

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

const VAZIO = {
  nome: "", cargo: "", email: "", whatsapp: "", empresa: "", cnpj: "", site: "", categoria_id: "", clientes_ativos: "", senha: "",
  aceite_termo: false, aceite_privacidade: false, website: "",
};

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
  const navigate = useNavigate();
  const origem = useMemo(() => capturarOrigem(), []);
  const [f, setF] = useState(VAZIO);
  const [tocado, setTocado] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [falha, setFalha] = useState<string | null>(null);
  const [criado, setCriado] = useState<string | null>(null);
  const [naFila, setNaFila] = useState<string | null>(null);
  const set = (k: keyof typeof VAZIO, v: string | boolean) => setF((x) => ({ ...x, [k]: v }));

  useCabecalhoPagina("Wise Partners | Programa de parceria da Wise Makers");

  const { data: cfg, isLoading, isError, refetch } = useQuery<ConfigLanding>({
    queryKey: ["landing-parceiros"], queryFn: carregarConfigGuardando, retry: 1, staleTime: 5 * 60_000,
    // Quem já visitou abre com o conteúdo da última visita; a configuração nova chega por cima
    placeholderData: lerConfigGuardada,
  });

  const { valores, cases, vars } = useMemo(() => resolverDados(cfg), [cfg]);
  const conteudo = useMemo(() => montarConteudo(PADRAO_PARCEIROS, cfg?.conteudo, vars), [cfg?.conteudo, vars]);
  const s = conteudo.secoes;
  // Desde 07/11/2026 o padrão é a fila: a equipe da Wise fala com cada parceiro antes de liberar o acesso
  const fila = cfg?.modo_cadastro !== "acesso_direto";
  const foraDoAr = !!cfg && !cfg.publicada;
  const carregandoTudo = isLoading && !cfg;
  const { ctaTopo, formRef, fimRef, visivel: barraVisivel } = useBarraFixa(!carregandoTudo && !foraDoAr);

  useEffect(() => {
    if (cfg?.publicada) iniciarMedicao(cfg);
  }, [cfg]);

  const perguntas = useMemo(() => conteudo.perguntas.map((q) => (q.pergunta === "Quando eu começo?" && !fila
    ? { ...q, resposta: "Na hora. Assim que você termina o cadastro, já entra no portal e encontra o seu link." } : q)), [conteudo.perguntas, fila]);

  const categorias = cfg?.categorias ?? [];
  const grupos = [
    { rotulo: "Empresas", itens: categorias.filter((c) => c.grupo !== "institucional") },
    { rotulo: "Entidades e instituições", itens: categorias.filter((c) => c.grupo === "institucional") },
  ].filter((g) => g.itens.length);

  const erros = {
    nome: !f.nome.trim() ? "Informe o seu nome." : "",
    cargo: !f.cargo.trim() ? "Informe o seu cargo." : "",
    email: !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.email.trim()) ? "Informe um e-mail válido." : "",
    whatsapp: somenteDigitos(f.whatsapp).length < 10 ? "Informe o WhatsApp com DDD." : "",
    empresa: !f.empresa.trim() ? "Informe o nome da empresa." : "",
    cnpj: !cnpjValido(f.cnpj) ? "Informe um CNPJ válido." : "",
    categoria_id: !f.categoria_id ? "Escolha a categoria da sua empresa." : "",
    clientes_ativos: !/^\d{1,7}$/.test(f.clientes_ativos) ? "Informe um número aproximado." : "",
    senha: fila || f.senha.length >= 8 ? "" : "Use pelo menos 8 caracteres.",
    aceites: !(f.aceite_termo && f.aceite_privacidade) ? "Marque as duas caixas pra continuar." : "",
  };
  const valido = Object.values(erros).every((e) => !e);
  const mostra = (k: keyof typeof erros) => (tocado ? erros[k] : "");
  const irParaCadastro = () => formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });

  async function enviar(e: FormEvent) {
    e.preventDefault();
    setTocado(true);
    setFalha(null);
    if (!valido) {
      // Leva quem enviou ao primeiro campo com erro (o aviso aparece embaixo dele)
      setTimeout(() => (document.querySelector<HTMLElement>('#cadastro [aria-invalid="true"]'))?.focus(), 0);
      return;
    }
    if (enviando) return;
    setEnviando(true);
    const eventId = crypto.randomUUID();
    const email = f.email.trim().toLowerCase();
    try {
      const r = await fetch(URL_CADASTRO, {
        method: "POST",
        headers: { ...CABECALHOS, "Content-Type": "application/json" },
        body: JSON.stringify({
          ...f, email, cnpj: somenteDigitos(f.cnpj), ...origem, ...idsMeta(origem), event_id: eventId, pagina: window.location.href,
        }),
      });
      const d = await r.json().catch(() => ({}));
      if (!r.ok) {
        setFalha(d?.erro ?? "Não foi possível concluir o cadastro. Tente de novo.");
        return;
      }
      registrarCadastro(eventId);
      if (d?.fila) {
        setNaFila(f.whatsapp);
        return;
      }
      const { error } = await supabase.auth.signInWithPassword({ email, password: f.senha });
      if (error) {
        setCriado(email);
        return;
      }
      navigate("/parceiro", { replace: true });
    } catch {
      setFalha("Sem conexão com o servidor. Confira a internet e tente de novo.");
    } finally {
      setEnviando(false);
    }
  }

  if (carregandoTudo) return <EsqueletoPagina />;
  if (foraDoAr) {
    return (
      <PaginaAviso titulo="O cadastro de parceiros está fora do ar no momento."
        texto="Volte em breve ou fale com a Wise Makers pelo e-mail contato@wisemakers.com.br."
        acao={<Button asChild variant="outline"><Link to="/entrar">Já sou parceiro</Link></Button>} />
    );
  }

  const fixoTexto = s.topo.botao || "Quero ser parceiro";

  return (
    <div className="min-h-screen overflow-x-clip bg-background text-foreground">
      <header className="sticky top-0 z-20 border-b border-white/10 bg-background/90 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
          <Logo className="h-7" />
          <div className="flex items-center gap-2">
            <Button asChild variant="ghost" size="sm"><Link to="/entrar">Já sou parceiro</Link></Button>
            <Button size="sm" onClick={irParaCadastro} className="hidden sm:inline-flex">{fixoTexto}</Button>
          </div>
        </div>
      </header>

      <main>
        <Topo eyebrow={s.topo.eyebrow} titulo={s.topo.titulo} texto={s.topo.texto} botao={s.topo.botao} nota={s.topo.nota}
          ctaRef={ctaTopo} aoClicar={irParaCadastro}
          video={<Video url={cfg?.video_url ?? null} formato={cfg?.video_formato} carregando={!cfg && !isError} />} />

        {s.logos.visivel && <FaixaLogos titulo={s.logos.titulo} />}

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
            <p className="mt-4 max-w-[62ch] text-neutro-100">{fila
              ? s.cadastro.texto
              : "Cadastre sua empresa em 2 minutos e entre no portal Wise Partners com o e-mail e a senha que escolher aqui."}</p>
            <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_1.4fr] lg:items-start">
              <ul className="space-y-3 text-sm text-neutro-100 lg:pt-2">
                {s.incluido.itens_parceiro.slice(0, 6).map((t, i) => (
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
                ) : naFila ? (
                  <div className="space-y-3 text-sm" role="status">
                    <p className="flex items-center gap-2 text-base font-semibold"><CheckCircle2 className="h-5 w-5 text-menta-400" aria-hidden />Cadastro recebido.</p>
                    <p className="text-neutro-100">A equipe da Wise vai falar com você pelo WhatsApp {naFila} em até 24 horas úteis para marcar a conversa de entrada de 45 minutos. Fique de olho nas mensagens.</p>
                    <p className="text-neutro-300">Depois dessa conversa, você recebe o acesso ao portal com o seu link exclusivo.</p>
                  </div>
                ) : criado ? (
                  <div className="space-y-3 text-sm" role="status">
                    <p className="flex items-center gap-2 font-semibold"><CheckCircle2 className="h-5 w-5 text-menta-400" aria-hidden />Seu acesso está pronto.</p>
                    <p className="text-neutro-300">Entre no portal com o e-mail {criado} e a senha que você criou.</p>
                    <Button asChild><Link to="/entrar">Entrar no portal</Link></Button>
                  </div>
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
                      <Campo id="empresa" rotulo="Empresa ou entidade" erro={mostra("empresa")}>
                        <Input className="border-white/40" id="empresa" autoComplete="organization" value={f.empresa} onChange={(e) => set("empresa", e.target.value)} aria-invalid={!!mostra("empresa")} aria-describedby={mostra("empresa") ? "empresa-erro" : undefined} />
                      </Campo>
                      <Campo id="cnpj" rotulo="CNPJ" erro={mostra("cnpj")}>
                        <Input className="border-white/40" id="cnpj" inputMode="numeric" placeholder="00.000.000/0000-00" value={f.cnpj}
                          onChange={(e) => set("cnpj", mascaraCnpj(e.target.value))} aria-invalid={!!mostra("cnpj")} aria-describedby={mostra("cnpj") ? "cnpj-erro" : undefined} />
                      </Campo>
                      <Campo id="categoria" rotulo="Categoria" erro={mostra("categoria_id")}>
                        <Select value={f.categoria_id} onValueChange={(v) => set("categoria_id", v)}>
                          <SelectTrigger id="categoria" className="border-white/40" aria-invalid={!!mostra("categoria_id")} aria-describedby={mostra("categoria_id") ? "categoria-erro" : undefined}><SelectValue placeholder="Escolha" /></SelectTrigger>
                          <SelectContent>
                            {grupos.map((g) => (
                              <SelectGroup key={g.rotulo}>
                                <SelectLabel>{g.rotulo}</SelectLabel>
                                {g.itens.map((c) => <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>)}
                              </SelectGroup>
                            ))}
                          </SelectContent>
                        </Select>
                      </Campo>
                      <Campo id="clientes" rotulo="Clientes ou associados ativos" erro={mostra("clientes_ativos")}>
                        <Input className="border-white/40" id="clientes" inputMode="numeric" placeholder="Ex.: 150" value={f.clientes_ativos}
                          onChange={(e) => set("clientes_ativos", somenteDigitos(e.target.value).slice(0, 7))} aria-invalid={!!mostra("clientes_ativos")} aria-describedby={mostra("clientes_ativos") ? "clientes-erro" : undefined} />
                      </Campo>
                      <Campo id="site" rotulo="Site" opcional>
                        <Input className="border-white/40" id="site" inputMode="url" autoComplete="url" placeholder="suaempresa.com.br" value={f.site} onChange={(e) => set("site", e.target.value)} />
                      </Campo>
                      {!fila && (
                        <Campo id="senha" rotulo="Crie uma senha pro portal" erro={mostra("senha")}>
                          <Input className="border-white/40" id="senha" type="password" autoComplete="new-password" value={f.senha} onChange={(e) => set("senha", e.target.value)} aria-invalid={!!mostra("senha")} aria-describedby={mostra("senha") ? "senha-erro" : undefined} />
                        </Campo>
                      )}
                    </div>

                    {/* Campo oculto contra robôs */}
                    <div className="hidden" aria-hidden>
                      <label htmlFor="website">Site</label>
                      <input id="website" tabIndex={-1} autoComplete="off" value={f.website} onChange={(e) => set("website", e.target.value)} />
                    </div>

                    <div className="space-y-3 border-t border-white/10 pt-4 text-sm">
                      <label className="flex items-start gap-3">
                        <Checkbox checked={f.aceite_termo} onCheckedChange={(v) => set("aceite_termo", v === true)} className="mt-0.5 rounded-[4px] border-white/60"
                          aria-invalid={!!mostra("aceites") && !f.aceite_termo} aria-describedby={mostra("aceites") ? "aceites-erro" : undefined} />
                        <span>Li e aceito o <Link to="/parceiros/termo" target="_blank" className="text-menta-300 underline underline-offset-2">termo de adesão ao programa</Link>.</span>
                      </label>
                      <label className="flex items-start gap-3">
                        <Checkbox checked={f.aceite_privacidade} onCheckedChange={(v) => set("aceite_privacidade", v === true)} className="mt-0.5 rounded-[4px] border-white/60"
                          aria-invalid={!!mostra("aceites") && !f.aceite_privacidade} aria-describedby={mostra("aceites") ? "aceites-erro" : undefined} />
                        <span>Concordo com a <Link to="/parceiros/privacidade" target="_blank" className="text-menta-300 underline underline-offset-2">política de privacidade</Link> e com o uso dos meus dados pra falar sobre a parceria.</span>
                      </label>
                      {mostra("aceites") && <p id="aceites-erro" role="alert" className="text-xs text-destructive">{erros.aceites}</p>}
                    </div>

                    {falha && <p role="alert" className="rounded-[10px] border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm">{falha}</p>}

                    <Button type="submit" size="lg" className="h-12 w-full text-base" disabled={enviando}>
                      {enviando
                        ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden />{fila ? "Enviando..." : "Criando o seu acesso..."}</>
                        : fila ? (s.cadastro.botao || "Quero ser parceiro") : "Criar meu acesso de parceiro"}
                    </Button>
                    <p className="text-center text-xs text-neutro-300">Valor de referência do que o seu cliente recebe: {reais(valores.total)}. Pra ele e pra você, sem custo.</p>
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
          <nav className="flex flex-wrap gap-x-4 gap-y-2" aria-label="Documentos">
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
