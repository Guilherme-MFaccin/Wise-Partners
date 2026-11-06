import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { Link, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowDown, CalendarCheck, Check, CheckCircle2, ClipboardList, ExternalLink, Loader2, Map as MapaIcone, ShieldCheck, Sparkles, X } from "lucide-react";
import { Logo } from "@/components/comum/Logo";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Campo, FaixaEvento, FaixaLogos, QuadroValorHub, Secao, SecaoDepoimentos, Video } from "@/components/landing/Blocos";
import { Autodiagnostico } from "@/components/landing/Autodiagnostico";
import {
  capturarOrigem, carregarPaginaCliente, cnpjValido, enviarCliente, iniciarMedicao, mascaraCnpj, mascaraTelefone, registrarLead, somenteDigitos,
  type PaginaCliente, type RespostaCadastroCliente,
} from "@/lib/landing";
import { CRITERIOS, FAIXAS_FATURAMENTO, PILARES } from "@/lib/diagnostico";

// Página do cliente do parceiro (/c/:codigo), decisões do FO-10.
// O cliente chega pelo link do parceiro, responde o cadastro de qualificação e:
//   com mais de 3 vendedores (ICP, configurável), escolhe o horário da reunião de diagnóstico;
//   com menos, faz o autodiagnóstico na hora e só depois recebe o link do Wise Hub.

const GARANTIAS = ["Sem custo e sem cartão", "Sem ligação insistente", "Seus dados não vão para o seu fornecedor sem a sua autorização"];

const VAZIO = {
  nome: "", cargo: "", email: "", whatsapp: "", empresa: "", cnpj: "", faturamento_faixa: "", vendedores: "", segmento: "", desafio: "",
  autoriza_parceiro: false, aceite_privacidade: false, website: "",
};

function perguntas(p: string) {
  return [
    { p: "Por que é de graça? Qual é o porém?", r: `A ${p} é parceira da Wise Makers e incluiu a consultoria pra quem é cliente dela. A Wise ganha se, depois do diagnóstico, você quiser contratar a consultoria completa. Isso só acontece se você pedir.` },
    { p: "Vão me ligar insistindo?", r: "Não. A equipe da Wise só fala com você na reunião que você marcar, ou se você pedir." },
    { p: `A ${p} vai ver os meus dados?`, r: `A ${p} fica sabendo que a sua empresa se cadastrou e em que pé está. O resultado do diagnóstico só é compartilhado se você marcar a autorização no cadastro. Suas respostas e seus números ficam com a Wise Makers.` },
    { p: "Serve pra minha empresa?", r: "Serve pra qualquer empresa com time comercial. Com mais de 3 vendedores, o diagnóstico é numa reunião online com a equipe da Wise. Com menos, você faz o autodiagnóstico online e vê o resultado na hora." },
    { p: "Quanto tempo leva?", r: "O cadastro leva uns 2 minutos e o autodiagnóstico, uns 5. A reunião de diagnóstico é online, no horário que você escolher." },
    { p: "É curso? Vou ter que assistir 20 horas?", r: "Não. Primeiro vem o diagnóstico e o plano. O Wise Hub tem a imersão de mais de 20 horas e as ferramentas, e você usa o que fizer sentido, no seu ritmo." },
    { p: "Depois vão me cobrar alguma coisa?", r: "Não. O diagnóstico, o plano e o acesso ao Wise Hub não têm custo e não pedem cartão. Se quiser a consultoria completa da Wise depois, é uma conversa à parte." },
    { p: "Quem é a Wise Makers?", r: "Uma consultoria de estrutura e gestão comercial de Maringá, Paraná. Em quatro anos, estruturou o comercial de mais de 300 empresas e capacitou mais de 1.500 vendedores." },
  ];
}

const RECEBE = [
  { icone: ClipboardList, titulo: "Diagnóstico de maturidade comercial", texto: "Cinco pilares do seu comercial, de quem é o cliente ideal até a rotina de gestão e o uso do CRM." },
  { icone: MapaIcone, titulo: "Plano de 30, 60 e 90 dias", texto: "O que priorizar primeiro, com ações e indicadores pra acompanhar." },
  { icone: Sparkles, titulo: "Acesso ao Wise Hub", texto: "Imersão de mais de 20 horas, treinamentos curtos, calculadoras, planilhas e checklists." },
  { icone: CalendarCheck, titulo: "Reunião individual de diagnóstico", texto: "Para empresas com mais de 3 vendedores, online, com a equipe da Wise Makers." },
];

const PASSOS = [
  { titulo: "Conte sobre a sua empresa", texto: "Um cadastro de 2 minutos: faturamento, time comercial e o principal desafio." },
  { titulo: "Faça o diagnóstico", texto: "Com mais de 3 vendedores, numa reunião online com a Wise. Com menos, online e na hora." },
  { titulo: "Receba o plano e entre no Hub", texto: "Você sai com as prioridades e acesso ao Wise Hub pra colocar o plano em prática." },
];

// Benefícios em profundidade: o que muda no comercial do cliente, cada um com um visual (exemplos, sem números inventados)
function beneficios(p: string) {
  return [
    { visual: "travas" as const, titulo: "Saiba onde o seu comercial mais trava", texto: "O diagnóstico olha os cinco pilares e aponta o mais frágil. Você para de tentar resolver tudo ao mesmo tempo e começa pelo que mais pesa no faturamento." },
    { visual: "sistema" as const, titulo: "Use de verdade o sistema que você já paga", texto: `Com processo e rotina definidos, o time passa a registrar tudo no sistema da ${p}, e não em planilha e WhatsApp. Você enxerga o funil e decide com dado.` },
    { visual: "plano" as const, titulo: "Um comercial que depende menos de você", texto: "O plano de 30, 60 e 90 dias diz o que fazer primeiro, quem faz e como medir. A meta deixa de sair no achismo e o time sabe o que fazer sem esperar o dono." },
  ];
}

// Comparação: resolver sozinho, contratar à parte (valores do Wise Hub) e a consultoria incluída pelo parceiro
const COMPARACAO: [string, boolean, boolean, boolean][] = [
  ["Saber onde o comercial mais trava", false, true, true],
  ["Plano de 30, 60 e 90 dias com prioridades", false, true, true],
  ["Formação pra você e o time, mais de 20 horas", false, true, true],
  ["Calculadoras, planilhas e checklists prontos", false, true, true],
  ["Método aplicado em mais de 300 empresas", false, true, true],
  ["Reunião com a equipe da Wise (mais de 3 vendedores)", false, true, true],
];

const FOTOS = [
  { src: "/landing/equipe.webp", alt: "Equipe da Wise Makers reunida no palco de uma imersão", legenda: "O time da Wise Makers", posicao: "object-center" },
  { src: "/landing/aula-bant.webp", alt: "Consultor da Wise Makers dando aula sobre qualificação de leads com a metodologia BANT", legenda: "Aula da imersão: qualificação de leads", posicao: "object-center" },
  { src: "/landing/igor-retrato.webp", alt: "Igor, diretor da Wise Makers", legenda: "Igor, diretor da Wise Makers", posicao: "object-[50%_22%]" },
];

function VisualBeneficio({ tipo, parceiro }: { tipo: "travas" | "sistema" | "plano"; parceiro: string }) {
  if (tipo === "travas") {
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
  if (tipo === "sistema") {
    return (
      <div className="grid gap-3 sm:grid-cols-2" aria-hidden>
        <div className="rounded-[14px] border border-white/10 bg-card p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-neutro-300">Hoje</p>
          <ul className="mt-3 space-y-2 text-sm text-neutro-300">
            {["Planilha do vendedor", "Conversas só no WhatsApp", "Meta na cabeça do dono"].map((t) => (
              <li key={t} className="flex items-center gap-2"><X className="h-4 w-4 shrink-0 text-neutro-500" />{t}</li>
            ))}
          </ul>
        </div>
        <div className="rounded-[14px] border border-menta-500/40 bg-menta-500/10 p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-menta-300">Com processo</p>
          <ul className="mt-3 space-y-2 text-sm">
            {["Funil e histórico no sistema", `Tudo registrado na ${parceiro}`, "Meta por vendedor, com número"].map((t) => (
              <li key={t} className="flex items-center gap-2"><Check className="h-4 w-4 shrink-0 text-menta-400" />{t}</li>
            ))}
          </ul>
        </div>
      </div>
    );
  }
  const fases: [string, string][] = [
    ["30 dias", "Definir o cliente ideal e as etapas da venda"],
    ["60 dias", "Rotina semanal de prospecção e reunião de números"],
    ["90 dias", "Metas por vendedor a partir do que está no sistema"],
  ];
  return (
    <ol className="rounded-[14px] border border-white/10 bg-card p-5" aria-hidden>
      <li className="mb-4 flex items-baseline justify-between gap-3"><span className="text-sm font-semibold">Seu plano</span><span className="text-xs text-neutro-300">Exemplo ilustrativo</span></li>
      {fases.map(([t, d], i) => (
        <li key={t} className="relative flex gap-4 pb-5 last:pb-0">
          {i < fases.length - 1 && <span className="absolute left-[27px] top-9 h-[calc(100%-28px)] w-px bg-white/10" />}
          <span className={`relative flex h-14 w-14 shrink-0 items-center justify-center rounded-full border text-center text-[11px] font-bold leading-tight ${i === 0 ? "border-menta-500 text-menta-300" : "border-white/20 text-neutro-300"}`}>{t}</span>
          <span className="self-center text-sm text-neutro-100">{d}</span>
        </li>
      ))}
    </ol>
  );
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
  const formRef = useRef<HTMLDivElement>(null);
  const ctaTopo = useRef<HTMLButtonElement>(null);
  const fimRef = useRef<HTMLElement>(null);
  const [fixoVisivel, setFixoVisivel] = useState(false);
  const set = (k: keyof typeof VAZIO, v: string | boolean) => setF((x) => ({ ...x, [k]: v }));
  const barraFixa = fixoVisivel && etapa.tipo === "form";

  const { data, isLoading, isError, refetch } = useQuery<PaginaCliente>({
    queryKey: ["landing-cliente", codigo], queryFn: () => carregarPaginaCliente(codigo), retry: 1, staleTime: 5 * 60_000,
  });
  const parceiro = data?.parceiro?.nome ?? "";

  useEffect(() => {
    const anterior = document.title;
    document.title = parceiro ? `${parceiro} e Wise Makers | Consultoria comercial` : "Wise Makers | Consultoria comercial";
    const meta = document.createElement("meta");
    meta.name = "robots";
    meta.content = "noindex,nofollow";
    document.head.appendChild(meta);
    return () => {
      document.title = anterior;
      meta.remove();
    };
  }, [parceiro]);

  useEffect(() => {
    if (data?.parceiro) iniciarMedicao(data);
  }, [data]);

  // Botão fixo no celular: aparece quando o botão do topo sai da tela e some no cadastro e no rodapé
  useEffect(() => {
    const vistos = { topo: true, cadastro: false, fim: false };
    const obs = new IntersectionObserver((itens) => {
      for (const i of itens) {
        if (i.target === ctaTopo.current) vistos.topo = i.isIntersecting;
        if (i.target === formRef.current) vistos.cadastro = i.isIntersecting;
        if (i.target === fimRef.current) vistos.fim = i.isIntersecting;
      }
      setFixoVisivel(!vistos.topo && !vistos.cadastro && !vistos.fim);
    });
    [ctaTopo.current, formRef.current, fimRef.current].forEach((el) => el && obs.observe(el));
    return () => obs.disconnect();
  }, [data?.parceiro]);

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

  if (isLoading) {
    return <div className="flex min-h-screen items-center justify-center bg-background" aria-busy="true"><Loader2 className="h-6 w-6 animate-spin text-neutro-300" aria-label="Carregando" /></div>;
  }
  if (isError || !data?.parceiro || !data.publicada) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background px-4 text-center text-foreground">
        <Logo className="h-8" />
        <h1 className="text-[22px] font-semibold">{isError ? "Não conseguimos abrir a página agora." : !data?.parceiro ? "Este link não está ativo." : "A página está pausada no momento."}</h1>
        <p className="max-w-[46ch] text-sm text-neutro-300">
          {isError ? "Pode ser a conexão. Tente de novo em instantes." : "Peça um link novo para quem te enviou ou fale com a Wise Makers pelo e-mail contato@wisemakers.com.br."}
        </p>
        {isError && <Button variant="outline" onClick={() => refetch()}>Tentar de novo</Button>}
      </div>
    );
  }

  const marcaParceiro = data.parceiro.logo_url
    ? <img src={data.parceiro.logo_url} alt={parceiro} className="h-8 w-auto max-w-[120px] object-contain sm:max-w-[160px]" />
    : <span className="max-w-[140px] truncate text-sm font-semibold sm:max-w-none">{parceiro}</span>;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-20 border-b border-white/10 bg-background/90 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
          <div className="flex min-w-0 items-center gap-3">
            {marcaParceiro}
            <span className="text-neutro-500" aria-hidden>+</span>
            <Logo className="h-7 shrink-0" />
          </div>
          <Button size="sm" onClick={irParaCadastro} className="hidden sm:inline-flex">Quero meu diagnóstico</Button>
        </div>
      </header>

      <main>
        {/* Topo: convite do parceiro, vídeo e ação */}
        <section className="mx-auto grid w-full max-w-6xl gap-8 px-4 pb-14 pt-10 sm:px-6 lg:grid-cols-[1.2fr_1fr] lg:gap-x-12 lg:gap-y-0 lg:pb-20 lg:pt-16">
          <div className="lg:col-start-1 lg:row-start-1 lg:self-end">
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-menta-400">Para clientes {parceiro}</p>
            <h1 className="mt-3 text-balance font-display text-[34px] font-extrabold leading-[1.08] sm:text-[44px]">
              A {parceiro} está oferecendo uma consultoria de gestão comercial de graça pra você, por tempo limitado.
            </h1>
            <p className="mt-5 max-w-[48ch] text-base text-neutro-300 sm:text-lg">
              Comece pelo diagnóstico do seu comercial. Você sai com um plano de 90 dias e acesso ao Wise Hub.
            </p>
          </div>
          <div className="w-full sm:max-w-[560px] lg:col-start-2 lg:row-span-2 lg:row-start-1 lg:max-w-none lg:self-center">
            <Video url={data.video_url} />
          </div>
          <div className="lg:col-start-1 lg:row-start-2">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center lg:mt-8">
              <Button ref={ctaTopo} size="lg" onClick={irParaCadastro} className="h-12 px-6 text-base">
                Quero meu diagnóstico <ArrowDown className="ml-1 h-4 w-4" aria-hidden />
              </Button>
              <p className="text-sm text-neutro-300">Cadastro em 2 minutos. Sem cartão.</p>
            </div>
          </div>
        </section>

        <FaixaLogos />

        {/* 2. Transformação: três passos logo depois do topo */}
        <Secao eyebrow="Como funciona" titulo="Três passos até o seu plano.">
          <ol className="grid gap-4 md:grid-cols-3">
            {PASSOS.map((p, i) => (
              <li key={p.titulo} className="rounded-[14px] border border-white/10 bg-card p-5">
                <span className="flex h-8 w-8 items-center justify-center rounded-full border border-menta-500/40 text-sm font-bold tabular-nums text-menta-400">{i + 1}</span>
                <p className="mt-4 font-semibold">{p.titulo}</p>
                <p className="mt-2 text-sm text-neutro-300">{p.texto}</p>
              </li>
            ))}
          </ol>
        </Secao>

        {/* 3. Benefícios em profundidade, alternando texto e visual */}
        <div className="border-y border-white/10 bg-neutro-800/40">
          <Secao eyebrow="O que muda no seu comercial" titulo="Menos achismo, mais método. Começando pelo que mais pesa.">
            <div className="space-y-12 sm:space-y-16">
              {beneficios(parceiro).map((b, i) => (
                <div key={b.visual} className="grid items-center gap-6 md:grid-cols-2 md:gap-12">
                  <div className={i % 2 === 1 ? "md:order-2" : ""}>
                    <h3 className="text-[22px] font-semibold leading-snug sm:text-[28px]">{b.titulo}</h3>
                    <p className="mt-3 max-w-[56ch] text-neutro-100">{b.texto}</p>
                  </div>
                  <div className={i % 2 === 1 ? "md:order-1" : ""}><VisualBeneficio tipo={b.visual} parceiro={parceiro} /></div>
                </div>
              ))}
            </div>
          </Secao>
        </div>

        {/* 4. Camada pra quem escaneia: o que o diagnóstico olha */}
        <Secao eyebrow="O diagnóstico" titulo="Cinco pilares do seu comercial, vistos de cinco ângulos.">
          <p className="-mt-4 max-w-[64ch] text-neutro-100 sm:-mt-6">
            O diagnóstico usa a Matriz de Governança Comercial 5x5: cada pilar do comercial é avaliado por cinco critérios, pra mostrar onde a operação trava e por onde começar.
          </p>
          <ol className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
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

        {/* 5. Chamada do meio, com prova */}
        <FaixaEvento titulo="Mais de 300 empresas estruturadas e 1.500 vendedores capacitados pela Wise Makers."
          texto={`Agora a ${parceiro} traz esse método pra você, sem custo.`} botao="Quero meu diagnóstico" aoClicar={irParaCadastro}
          nota="Sem custo · Sem cartão · Sem ligação insistente" />

        {/* 6. O que está incluído: as quatro entregas e o valor do Wise Hub */}
        <Secao eyebrow="O que você recebe" titulo={`A consultoria que a ${parceiro} incluiu pra você.`}>
          <ul className="grid gap-4 sm:grid-cols-2">
            {RECEBE.map((x) => (
              <li key={x.titulo} className="flex items-start gap-4 rounded-[14px] border border-white/10 bg-card p-5">
                <x.icone className="mt-0.5 h-5 w-5 shrink-0 text-menta-400" aria-hidden />
                <span><span className="block font-semibold">{x.titulo}</span><span className="mt-1 block text-sm text-neutro-300">{x.texto}</span></span>
              </li>
            ))}
          </ul>
          <h3 className="mt-14 max-w-3xl text-balance text-[22px] font-semibold leading-snug sm:text-[28px]">{"O Wise Hub vale mais de R$\u00a015.000. Pra você, sai de graça."}</h3>
          <p className="mt-3 max-w-[64ch] text-neutro-100">
            Não é área de curso. É onde você monta o plano, segue o Método Wise passo a passo e usa as ferramentas na rotina do seu time.
          </p>
          <QuadroValorHub paraQuem="Pra você"
            vantagens={[`Com a marca da ${parceiro}`, "Sem cartão e sem instalação", "No navegador ou no celular", "Aulas com cases reais de indústrias"]} />
        </Secao>

        {/* 7 e 8. Prova em camadas: números, citação e vídeos */}
        <div className="border-t border-white/10">
          <SecaoDepoimentos subtitulo="Empresários e gestores que estruturaram o comercial com a Wise Makers." />
        </div>

        {/* 9. Comparação */}
        <div className="border-y border-white/10 bg-neutro-800/40">
          <Secao eyebrow="Lado a lado" titulo="Resolver sozinho, contratar à parte ou usar o que o seu fornecedor incluiu.">
            <div className="overflow-hidden rounded-[14px] border border-white/10 bg-card">
              <table className="w-full text-left text-sm">
                <caption className="sr-only">Comparação entre resolver sozinho, contratar uma consultoria à parte e usar a consultoria incluída pela {parceiro}</caption>
                <thead>
                  <tr className="border-b border-white/10">
                    <th scope="col" className="px-3 py-3 sm:px-5"><span className="sr-only">O que entra</span></th>
                    <th scope="col" className="w-[3.75rem] px-1 py-3 text-center text-xs font-medium text-neutro-300 sm:w-32 sm:text-sm">Sozinho</th>
                    <th scope="col" className="w-[4.25rem] px-1 py-3 text-center text-xs font-medium text-neutro-300 sm:w-36 sm:text-sm">Contratando à parte</th>
                    <th scope="col" className="w-[4.5rem] px-1 py-3 text-center text-xs font-semibold sm:w-40 sm:text-sm">Incluído pela {parceiro}</th>
                  </tr>
                </thead>
                <tbody>
                  {COMPARACAO.map(([item, a, b, c]) => (
                    <tr key={item} className="border-b border-white/10 last:border-0">
                      <th scope="row" className="px-3 py-3 font-normal sm:px-5">{item}</th>
                      {[a, b, c].map((v, k) => (
                        <td key={k} className="px-1 py-3 text-center">
                          {v ? <Check className="mx-auto h-5 w-5 text-menta-400" aria-label="Sim" /> : <X className="mx-auto h-5 w-5 text-neutro-500" aria-label="Não" />}
                        </td>
                      ))}
                    </tr>
                  ))}
                  <tr>
                    <th scope="row" className="px-3 py-3 font-normal sm:px-5">Quanto custa pra você</th>
                    <td className="px-1 py-3 text-center text-xs text-neutro-300 sm:text-sm">Seu tempo</td>
                    <td className="px-1 py-3 text-center text-xs text-neutro-300 sm:text-sm">Mais de R$&nbsp;15.000</td>
                    <td className="px-1 py-3 text-center text-xs font-semibold text-menta-400 sm:text-sm">R$&nbsp;0</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </Secao>
        </div>

        {/* 10. Perguntas frequentes */}
        <Secao eyebrow="Perguntas frequentes" titulo="O que todo mundo pergunta antes de começar.">
          <div className="divide-y divide-white/10 rounded-[14px] border border-white/10 bg-card">
            {perguntas(parceiro).map((q) => (
              <details key={q.p} className="group px-5 py-4 [&_summary::-webkit-details-marker]:hidden">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-semibold">
                  {q.p}
                  <span className="text-xl leading-none text-neutro-300 transition-transform group-open:rotate-45" aria-hidden>+</span>
                </summary>
                <p className="mt-3 max-w-[68ch] text-sm text-neutro-300">{q.r}</p>
              </details>
            ))}
          </div>
        </Secao>

        {/* 11. Faixa de imagens: quem está por trás do diagnóstico */}
        <section aria-labelledby="equipe-titulo" className="mx-auto w-full max-w-6xl px-4 pb-4 sm:px-6">
          <h2 id="equipe-titulo" className="text-sm font-medium text-neutro-300">Quem está por trás do seu diagnóstico</h2>
          <ul className="-mx-4 mt-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-2 sm:mx-0 sm:grid sm:grid-cols-3 sm:overflow-visible sm:px-0 sm:pb-0">
            {FOTOS.map((f) => (
              <li key={f.src} className="w-[78%] shrink-0 snap-start sm:w-auto">
                <figure>
                  <img src={f.src} alt={f.alt} width={900} height={600} loading="lazy" decoding="async"
                    className={`aspect-[4/3] h-auto w-full rounded-[14px] border border-white/10 object-cover ${f.posicao}`} />
                  <figcaption className="mt-2 text-xs text-neutro-300">{f.legenda}</figcaption>
                </figure>
              </li>
            ))}
          </ul>
        </section>

        {/* Cadastro, agenda ou autodiagnóstico */}
        <div ref={formRef} id="cadastro" className="scroll-mt-16 border-t border-white/10">
          <section className="mx-auto w-full max-w-6xl px-4 py-14 sm:px-6 sm:py-20">
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-menta-400">Seu diagnóstico</p>
            <h2 className="mt-2 max-w-3xl text-balance font-display text-[32px] font-extrabold leading-tight sm:text-[44px]">
              Seu comercial pode depender menos de você. Comece pelo diagnóstico.
            </h2>
            <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_1.4fr] lg:items-start">
              <ul className="space-y-3 text-sm text-neutro-100 lg:pt-2">
                {RECEBE.map((t) => (
                  <li key={t.titulo} className="flex items-start gap-2"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-menta-400" aria-hidden />{t.titulo}</li>
                ))}
              </ul>
              <div className="rounded-[14px] border border-white/10 bg-card p-5 sm:p-6">
                {etapa.tipo === "agenda" ? (
                  <div className="space-y-4" role="status">
                    <p className="flex items-center gap-2 font-semibold"><CheckCircle2 className="h-5 w-5 text-menta-400" aria-hidden />Cadastro feito. Agora escolha o horário.</p>
                    <p className="text-sm text-neutro-300">Pelo tamanho do seu time, o seu diagnóstico é numa reunião online com a equipe da Wise Makers.</p>
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
                          <Textarea className="min-h-[72px] border-white/40" id="desafio" rows={2} maxLength={600} placeholder="Ex.: o time não prospecta, a meta não fecha, o CRM não é usado"
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
                        <span>Autorizo a Wise Makers a compartilhar o resultado do meu diagnóstico com a {parceiro}. <span className="text-neutro-300">(opcional)</span></span>
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
                      {enviando ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden />Enviando...</> : "Quero meu diagnóstico"}
                    </Button>
                  </form>
                )}
              </div>
            </div>
            <ul className="mt-6 flex flex-wrap justify-center gap-x-6 gap-y-2 text-sm text-neutro-300">
              {GARANTIAS.map((g) => <li key={g} className="flex items-center gap-2"><ShieldCheck className="h-4 w-4 shrink-0" aria-hidden />{g}</li>)}
            </ul>
          </section>
        </div>
      </main>

      <footer ref={fimRef} className="border-t border-white/10">
        <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-6 text-xs text-neutro-300 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <p>Wise Makers · Estrutura e gestão comercial · Maringá, Paraná · Convite de {parceiro}</p>
          <nav className="flex gap-4" aria-label="Documentos">
            <Link to="/parceiros/privacidade" className="hover:text-foreground">Política de privacidade</Link>
          </nav>
        </div>
      </footer>

      <div aria-hidden={!barraFixa}
        className={`fixed inset-x-0 bottom-0 z-20 border-t border-white/10 bg-background/95 p-3 backdrop-blur transition-transform duration-200 ease-out motion-reduce:transition-none sm:hidden ${barraFixa ? "translate-y-0" : "pointer-events-none translate-y-full"}`}
        style={{ paddingBottom: "max(12px, env(safe-area-inset-bottom))" }}>
        <Button onClick={irParaCadastro} className="h-11 w-full" tabIndex={barraFixa ? 0 : -1}>Quero meu diagnóstico</Button>
      </div>
    </div>
  );
}
