import { useEffect, useMemo, useRef, useState, type FormEvent, type ReactNode } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowDown, Check, CheckCircle2, Loader2, RefreshCcw, ShieldCheck, Timer, X, Zap,
} from "lucide-react";
import { Logo } from "@/components/comum/Logo";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import {
  CABECALHOS, URL_CADASTRO, capturarOrigem, carregarConfig, cnpjValido, fonteVideo, idsMeta, iniciarMedicao, mascaraCnpj, mascaraTelefone,
  registrarCadastro, somenteDigitos, type ConfigLanding,
} from "@/lib/landing";

// Landing page dos parceiros SaaS de CRM e ERP (/parceiros): tráfego dos anúncios do Meta, fora dos buscadores.
// Uma ação só: criar o acesso de parceiro no portal, com aceite eletrônico do termo padrão.

const GARANTIAS = ["Sem custo para você e para o seu cliente", "Sem exclusividade", "Sem meta mínima de indicação", "Sai quando quiser"];

// O que o cliente do parceiro recebe (a consultoria incluída)
const CLIENTE_RECEBE = [
  { titulo: "Diagnóstico de maturidade comercial", texto: "Cinco frentes do comercial: posicionamento, aquisição de clientes, conversão, retenção e governança do time." },
  { titulo: "Mapa de planejamento", texto: "Onde ele está, o que priorizar e um plano de 30, 60 e 90 dias, com indicadores pra acompanhar." },
  { titulo: "Acesso ao Wise Hub", texto: "Imersão de mais de 20 horas em quatro módulos, treinamentos curtos, diagnósticos, calculadoras, planilhas e checklists." },
  { titulo: "Reunião individual com a equipe da Wise", texto: "Para empresas que faturam a partir de R$ 250 mil por mês e têm pelo menos duas pessoas no comercial." },
];

// O que o parceiro recebe ao entrar
const PARCEIRO_RECEBE = [
  { titulo: "Acesso ao portal Wise Partners na hora", texto: "Tudo do programa num lugar só, sem esperar contato." },
  { titulo: "Seu link exclusivo", texto: "Cada cliente que entra por ele fica registrado como seu." },
  { titulo: "Mensagem pronta e página de convite", texto: "É só mandar pros clientes de hoje e incluir na entrada dos novos." },
  { titulo: "Treinamento curto", texto: "Como apresentar a consultoria incluída na venda e no sucesso do cliente." },
  { titulo: "Acompanhamento no portal", texto: "Quem entrou pelo seu link e em que pé está." },
  { titulo: "Comissão quando um cliente contrata a Wise", texto: "40% da primeira mensalidade da consultoria, pago ao CNPJ da sua empresa." },
];

// Transformação: o caminho do parceiro em três passos
const PASSOS_PARCEIRO = [
  { titulo: "Cadastre sua empresa", texto: "Leva uns 2 minutos e o acesso ao portal sai na hora." },
  { titulo: "Pegue o seu link", texto: "No portal ficam o link exclusivo, a mensagem pronta e um treinamento curto." },
  { titulo: "Ofereça à sua base", texto: "Pros clientes de hoje e pra cada cliente novo. O resto você acompanha pelo portal." },
];

// Benefícios em profundidade: cada um com um visual
const BENEFICIOS = [
  { titulo: "Consultoria no lugar do desconto", texto: "Na negociação apertada, em vez de baixar o preço, você inclui um diagnóstico comercial e o Wise Hub. O cliente leva mais, e você protege ticket e margem.", visual: "desconto" },
  { titulo: "Um raio-x da sua base, sem custo", texto: "Os diagnósticos mostram a maturidade comercial dos seus clientes e onde eles travam. Você sabe quem precisa de atenção antes da renovação. Por cliente, só com autorização dele.", visual: "raiox" },
  { titulo: "Mais uso, mais renovação", texto: "Com processo, o time inteiro do cliente passa a trabalhar dentro do sistema. Quem vê resultado no seu software tem motivo pra continuar com você.", visual: "renovacao" },
] as const;

// Camada pra quem só escaneia
const MAIS = [
  { icone: Timer, titulo: "Implantação mais rápida", texto: "O cliente chega com funil, metas e rotina definidos." },
  { icone: Zap, titulo: "Venda mais rápida", texto: "Um argumento concreto quando o concorrente parece igual." },
  { icone: RefreshCcw, titulo: "Motivo pra falar com quem sumiu", texto: "Seu time liga oferecendo o diagnóstico, e não cobrando." },
];

// Comparação: vender só o software contra vender com a consultoria incluída
const COMPARACAO: [string, boolean, boolean][] = [
  ["Argumento na negociação além do preço", false, true],
  ["Diagnóstico de maturidade comercial pro cliente", false, true],
  ["Plano de 30, 60 e 90 dias pro cliente", false, true],
  ["Formação e ferramentas de gestão comercial (Wise Hub)", false, true],
  ["Visão da maturidade comercial da sua base", false, true],
  ["Motivo pro seu time falar com quem usa pouco", false, true],
  ["Comissão quando o cliente contrata a Wise", false, true],
];

const PERGUNTAS: { p: string; r: ReactNode }[] = [
  { p: "Quanto custa?", r: "Nada. Não tem mensalidade, taxa nem custo pra você ou pro seu cliente." },
  { p: "Por que é de graça? Qual é o porém?", r: "A Wise Makers ganha quando um cliente seu, depois de ver o próprio diagnóstico, decide contratar a consultoria pra ir além. Isso acontece só se ele quiser. Pra você, o programa é argumento de venda e retenção, sem custo." },
  { p: "A Wise vai vender outra coisa pro meu cliente?", r: "O diagnóstico não é apresentação de vendas. A conversa comercial só acontece se o cliente pedir, e a Wise Makers não vende software. Se ele contratar a consultoria, você recebe comissão." },
  { p: "A Wise concorre com o meu time de implantação ou de sucesso do cliente?", r: "Não. A Wise trata o processo comercial do cliente: meta, funil, rotina e time. Implantação, suporte e uso do seu sistema continuam com você. Na prática, o cliente chega mais preparado pra usar o seu software." },
  { p: "Vai dar trabalho pro meu time?", r: "O cadastro leva uns 2 minutos. Depois, o trabalho é mandar o seu link: a página de convite, a mensagem pronta e o treinamento ficam no portal." },
  { p: "Quais dados dos meus clientes a Wise vê?", r: "Só o que o próprio cliente informa no diagnóstico. A Wise nunca recebe a sua lista de clientes, e o resultado individual só é compartilhado com você se o cliente autorizar." },
  { p: "Meu cliente não é indústria. Serve pra ele?", r: "Serve. O autodiagnóstico do Wise Hub é aberto a qualquer empresa com time comercial. A reunião individual com a equipe da Wise é para empresas que faturam a partir de R$ 250 mil por mês e têm pelo menos duas pessoas no comercial." },
  { p: "Como e quando recebo a comissão?", r: "Você recebe 40% da primeira mensalidade da consultoria, depois que o primeiro pagamento do cliente compensar. O pagamento vai pro CNPJ da sua empresa, com nota fiscal. Vale uma vez por cliente novo; o Wise Hub não gera comissão." },
  { p: "Tem exclusividade ou meta de indicação?", r: "Não. Você continua trabalhando com quem quiser e não precisa bater nenhum número." },
  { p: "Posso sair quando quiser?", r: "Pode. Basta avisar com 30 dias, sem multa. Comissões já geradas continuam sendo pagas." },
  { p: "Quem é a Wise Makers?", r: "Uma consultoria de estrutura e gestão comercial. Em quatro anos, estruturou o comercial de mais de 300 empresas e capacitou mais de 1.500 vendedores." },
  { p: "Quando eu começo?", r: "Na hora. Assim que você termina o cadastro, já entra no portal e encontra o seu link." },
];

const VAZIO = {
  nome: "", cargo: "", email: "", whatsapp: "", empresa: "", cnpj: "", site: "", categoria_id: "", clientes_ativos: "", senha: "",
  aceite_termo: false, aceite_privacidade: false, website: "",
};

function Secao({ id, eyebrow, titulo, children, className = "" }: { id?: string; eyebrow?: string; titulo: string; children: ReactNode; className?: string }) {
  return (
    <section id={id} className={`mx-auto w-full max-w-6xl px-4 py-14 sm:px-6 sm:py-20 ${className}`}>
      {eyebrow && <p className="text-xs font-semibold uppercase tracking-[0.12em] text-menta-400">{eyebrow}</p>}
      <h2 className="mt-2 max-w-3xl text-balance text-[28px] font-semibold leading-tight sm:text-[36px]">{titulo}</h2>
      <div className="mt-8 sm:mt-10">{children}</div>
    </section>
  );
}

function Video({ url }: { url: string | null }) {
  const fonte = fonteVideo(url);
  if (!fonte) return null;
  if (fonte.tipo === "iframe") {
    return (
      <div className="aspect-video w-full overflow-hidden rounded-[14px] border border-white/10 bg-black">
        <iframe src={fonte.src} title="Vídeo do Programa Wise Partners" className="h-full w-full" loading="lazy"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen />
      </div>
    );
  }
  return <video src={fonte.src} controls playsInline preload="metadata" className="aspect-video w-full rounded-[14px] border border-white/10 bg-black" />;
}

function Campo({ id, rotulo, opcional, erro, children }: { id: string; rotulo: string; opcional?: boolean; erro?: string; children: ReactNode }) {
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

// Visuais dos benefícios: desenhos de interface, sem números inventados
function VisualBeneficio({ tipo }: { tipo: "desconto" | "raiox" | "renovacao" }) {
  if (tipo === "desconto") {
    return (
      <div className="space-y-3 rounded-[14px] border border-white/10 bg-card p-5" aria-hidden>
        <p className="w-fit max-w-[85%] rounded-[14px] rounded-bl-[4px] bg-white/5 px-4 py-2.5 text-sm">Gostei do sistema, mas o outro tá mais barato. Consegue um desconto?</p>
        <div className="ml-auto max-w-[85%] rounded-[14px] rounded-br-[4px] border border-white/10 px-4 py-2.5 text-sm text-neutro-300 line-through decoration-neutro-500">Vou ver o que consigo fazer no preço.</div>
        <div className="ml-auto max-w-[85%] rounded-[14px] rounded-br-[4px] border border-menta-500/40 bg-menta-500/10 px-4 py-2.5 text-sm">
          Melhor: o seu time ganha um diagnóstico comercial da Wise Makers, um plano de 90 dias e acesso ao Wise Hub. Sem custo.
        </div>
      </div>
    );
  }
  if (tipo === "raiox") {
    const frentes: [string, string][] = [
      ["Posicionamento", "w-[72%]"], ["Aquisição de clientes", "w-[48%]"], ["Conversão", "w-[60%]"], ["Retenção", "w-[34%]"], ["Governança do time", "w-[40%]"],
    ];
    return (
      <div className="rounded-[14px] border border-white/10 bg-card p-5" aria-hidden>
        <div className="flex items-baseline justify-between gap-3">
          <p className="text-sm font-semibold">Maturidade comercial da sua base</p>
          <p className="text-xs text-neutro-300">Exemplo ilustrativo</p>
        </div>
        <ul className="mt-4 space-y-3">
          {frentes.map(([n, w]) => (
            <li key={n} className="text-xs">
              <span className="text-neutro-300">{n}</span>
              <div className="mt-1 h-2 rounded-full bg-white/5"><div className={`h-2 rounded-full bg-neutro-300 ${w}`} /></div>
            </li>
          ))}
        </ul>
        <p className="mt-4 rounded-[10px] bg-white/5 px-3 py-2 text-xs text-neutro-100">Onde a base mais trava: retenção e governança do time.</p>
      </div>
    );
  }
  const etapas = ["Cliente assina o seu sistema", "Faz o diagnóstico comercial", "Segue o plano de 30, 60 e 90 dias", "O time inteiro trabalha no sistema", "Renova com você"];
  return (
    <ol className="rounded-[14px] border border-white/10 bg-card p-5" aria-hidden>
      {etapas.map((e, i) => (
        <li key={e} className="relative flex items-center gap-3 pb-4 last:pb-0">
          {i < etapas.length - 1 && <span className="absolute left-[11px] top-6 h-[calc(100%-12px)] w-px bg-white/10" />}
          <span className={`relative flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-[11px] font-bold ${i === etapas.length - 1 ? "border-menta-500 bg-menta-500 text-primary-foreground" : "border-white/20 text-neutro-300"}`}>
            {i === etapas.length - 1 ? <Check className="h-3.5 w-3.5" /> : i + 1}
          </span>
          <span className={`text-sm ${i === etapas.length - 1 ? "font-semibold" : "text-neutro-100"}`}>{e}</span>
        </li>
      ))}
    </ol>
  );
}

export default function LandingParceiros() {
  const navigate = useNavigate();
  const origem = useMemo(() => capturarOrigem(), []);
  const [f, setF] = useState(VAZIO);
  const [tocado, setTocado] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [falha, setFalha] = useState<string | null>(null);
  const [criado, setCriado] = useState<string | null>(null);
  const formRef = useRef<HTMLDivElement>(null);
  const ctaTopo = useRef<HTMLButtonElement>(null);
  const fimRef = useRef<HTMLElement>(null);
  const [fixoVisivel, setFixoVisivel] = useState(false);
  const set = (k: keyof typeof VAZIO, v: string | boolean) => setF((x) => ({ ...x, [k]: v }));

  useEffect(() => {
    const anterior = document.title;
    document.title = "Wise Partners | Consultoria comercial incluída no seu software";
    const meta = document.createElement("meta");
    meta.name = "robots";
    meta.content = "noindex,nofollow";
    document.head.appendChild(meta);
    return () => {
      document.title = anterior;
      meta.remove();
    };
  }, []);

  const { data: cfg, isLoading, isError, refetch } = useQuery<ConfigLanding>({
    queryKey: ["landing-parceiros"], queryFn: carregarConfig, retry: 1, staleTime: 5 * 60_000,
  });

  useEffect(() => {
    if (cfg) iniciarMedicao(cfg);
  }, [cfg]);

  // Botão fixo no celular: aparece quando o botão do topo sai da tela e some quando o cadastro aparece
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
    if (ctaTopo.current) obs.observe(ctaTopo.current);
    if (formRef.current) obs.observe(formRef.current);
    if (fimRef.current) obs.observe(fimRef.current);
    return () => obs.disconnect();
  }, []);

  const erros = {
    nome: !f.nome.trim() ? "Informe o seu nome." : "",
    cargo: !f.cargo.trim() ? "Informe o seu cargo." : "",
    email: !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.email.trim()) ? "Informe um e-mail válido." : "",
    whatsapp: somenteDigitos(f.whatsapp).length < 10 ? "Informe o WhatsApp com DDD." : "",
    empresa: !f.empresa.trim() ? "Informe o nome da empresa." : "",
    cnpj: !cnpjValido(f.cnpj) ? "Informe um CNPJ válido." : "",
    categoria_id: !f.categoria_id ? "Escolha o tipo de software." : "",
    clientes_ativos: !/^\d{1,7}$/.test(f.clientes_ativos) ? "Informe um número aproximado." : "",
    senha: f.senha.length < 8 ? "Use pelo menos 8 caracteres." : "",
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

  const fechado = cfg && !cfg.publicada;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-20 border-b border-white/10 bg-background/90 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
          <Logo className="h-7" />
          <div className="flex items-center gap-2">
            <Button asChild variant="ghost" size="sm"><Link to="/entrar">Já sou parceiro</Link></Button>
            <Button size="sm" onClick={irParaCadastro} className="hidden sm:inline-flex">Quero ser parceiro</Button>
          </div>
        </div>
      </header>

      <main>
        {/* Topo: promessa, prova rápida, vídeo e ação */}
        <section className="mx-auto grid w-full max-w-6xl gap-8 px-4 pb-14 pt-10 sm:px-6 lg:grid-cols-[1.2fr_1fr] lg:gap-x-12 lg:gap-y-0 lg:pb-20 lg:pt-16">
          <div className="lg:col-start-1 lg:row-start-1">
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-menta-400">Wise Partners · para empresas de CRM e ERP</p>
            <h1 className="mt-3 text-balance font-display text-[36px] font-extrabold leading-[1.06] sm:text-[48px]">
              Pare de competir por preço: inclua consultoria comercial no seu software, sem custo.
            </h1>
            <p className="mt-5 max-w-[62ch] text-base text-neutro-100 sm:text-lg">
              Seu cliente faz um diagnóstico de maturidade comercial com a Wise Makers, recebe um plano de 30, 60 e 90 dias e ganha acesso ao Wise Hub. Você ganha um argumento que o concorrente não tem.
            </p>
          </div>
          <div className="lg:col-start-2 lg:row-span-2 lg:row-start-1 lg:self-center">
            <Video url={cfg?.video_url ?? null} />
            <dl className="mt-4 grid grid-cols-3 gap-3 text-center">
              {[["4 anos", "de Wise Makers"], ["+300", "empresas estruturadas"], ["+1.500", "vendedores capacitados"]].map(([n, r]) => (
                <div key={r} className="rounded-[10px] border border-white/10 bg-card px-2 py-3">
                  <dt className="sr-only">{r}</dt>
                  <dd className="text-2xl font-bold tabular-nums">{n}</dd>
                  <dd className="text-xs text-neutro-300">{r}</dd>
                </div>
              ))}
            </dl>
          </div>
          <div className="lg:col-start-1 lg:row-start-2">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center lg:mt-7">
              <Button ref={ctaTopo} size="lg" onClick={irParaCadastro} className="h-12 px-6 text-base">
                Quero ser parceiro <ArrowDown className="ml-1 h-4 w-4" aria-hidden />
              </Button>
              <p className="text-sm text-neutro-300">Cadastro em 2 minutos, acesso na hora.</p>
            </div>
            <ul className="mt-6 grid gap-2 text-sm text-neutro-100 sm:grid-cols-2">
              {GARANTIAS.map((g) => (
                <li key={g} className="flex items-center gap-2"><ShieldCheck className="h-4 w-4 shrink-0 text-neutro-300" aria-hidden />{g}</li>
              ))}
            </ul>
          </div>
        </section>

        {/* 2. Transformação: o caminho do parceiro em três passos */}
        <div className="border-y border-white/10 bg-neutro-800/40">
          <Secao eyebrow="Como funciona" titulo="Três passos, e o seu software passa a vir com consultoria.">
            <ol className="grid gap-4 md:grid-cols-3">
              {PASSOS_PARCEIRO.map((p, i) => (
                <li key={p.titulo} className="relative rounded-[14px] border border-white/10 bg-card p-5">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full border border-menta-500/40 text-sm font-bold tabular-nums text-menta-400">{i + 1}</span>
                  <p className="mt-4 font-semibold">{p.titulo}</p>
                  <p className="mt-2 text-sm text-neutro-300">{p.texto}</p>
                </li>
              ))}
            </ol>
          </Secao>
        </div>

        {/* 3. Benefícios em profundidade, alternando texto e visual */}
        <Secao eyebrow="O que muda pro seu negócio" titulo="Você para de disputar preço e começa a entregar resultado.">
          <div className="space-y-12 sm:space-y-16">
            {BENEFICIOS.map((b, i) => (
              <div key={b.titulo} className="grid items-center gap-6 md:grid-cols-2 md:gap-12">
                <div className={i % 2 === 1 ? "md:order-2" : ""}>
                  <p className="text-sm font-bold tabular-nums text-neutro-300">0{i + 1}</p>
                  <h3 className="mt-2 text-[22px] font-semibold leading-snug sm:text-[28px]">{b.titulo}</h3>
                  <p className="mt-3 max-w-[56ch] text-neutro-100">{b.texto}</p>
                </div>
                <div className={i % 2 === 1 ? "md:order-1" : ""}><VisualBeneficio tipo={b.visual} /></div>
              </div>
            ))}
          </div>

          {/* 4. Camada pra quem só escaneia */}
          <ul className="mt-14 grid gap-4 border-t border-white/10 pt-10 sm:grid-cols-3">
            {MAIS.map((m) => (
              <li key={m.titulo} className="flex items-start gap-3">
                <m.icone className="mt-0.5 h-5 w-5 shrink-0 text-neutro-300" aria-hidden />
                <span><span className="block font-semibold">{m.titulo}</span><span className="text-sm text-neutro-300">{m.texto}</span></span>
              </li>
            ))}
          </ul>
        </Secao>

        {/* 5. Chamada do meio, com prova */}
        <section className="border-y border-white/10 bg-card">
          <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-10 sm:px-6 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-lg font-semibold">Mais de 300 empresas estruturadas e 1.500 vendedores capacitados pela Wise Makers.</p>
              <p className="mt-1 text-sm text-neutro-300">Agora esse método pode ir junto com o seu software, sem custo.</p>
            </div>
            <div className="flex flex-col items-start gap-2 lg:items-end">
              <Button size="lg" onClick={irParaCadastro} className="h-12 px-6 text-base">Quero ser parceiro</Button>
              <p className="text-xs text-neutro-300">Sem custo · Sem exclusividade · Sai quando quiser</p>
            </div>
          </div>
        </section>

        {/* 6. O que está incluído, dos dois lados */}
        <Secao eyebrow="O que está incluído" titulo="Sem letra miúda: o que o seu cliente recebe e o que você recebe.">
          <div className="grid gap-4 lg:grid-cols-2">
            {[["Seu cliente recebe", CLIENTE_RECEBE], ["Você recebe", PARCEIRO_RECEBE]].map(([t, lista]) => (
              <div key={t as string} className="rounded-[14px] border border-white/10 bg-card p-6">
                <h3 className="text-lg font-semibold">{t as string}</h3>
                <ul className="mt-4 space-y-4">
                  {(lista as { titulo: string; texto: string }[]).map((x) => (
                    <li key={x.titulo} className="flex items-start gap-3">
                      <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-menta-400" aria-hidden />
                      <span><span className="block font-semibold">{x.titulo}</span><span className="text-sm text-neutro-300">{x.texto}</span></span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <p className="mt-4 text-sm text-neutro-300">Vale pra toda a sua base de hoje e pra cada cliente novo. O diagnóstico online é aberto a qualquer cliente seu.</p>
        </Secao>

        {/* 7. Prova */}
        <Secao eyebrow="Resultados da Wise Makers" titulo="O método que vai pro seu cliente já funciona em empresas líderes.">
          <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
            <figure className="rounded-[14px] border border-white/10 bg-card p-6">
              <p className="text-sm font-semibold text-neutro-300">Grupo Protectpool · indústria líder em proteção para piscinas, com mais de 200 parceiros e franqueados</p>
              <p className="mt-3 text-neutro-100">
                Já estava no topo do setor. Com a Wise Makers, estruturou o CRM e o processo comercial da rede e bateu o recorde de faturamento seis meses antes do planejado.
              </p>
              <dl className="mt-5 grid grid-cols-3 gap-3">
                {[["+35,56%", "maio"], ["+26,65%", "junho"], ["+54,83%", "julho, recorde"]].map(([n, m]) => (
                  <div key={m}>
                    <dt className="sr-only">Crescimento do faturamento em {m}</dt>
                    <dd className="text-2xl font-bold tabular-nums text-menta-400 sm:text-3xl">{n}</dd>
                    <dd className="text-xs text-neutro-300">{m}</dd>
                  </div>
                ))}
              </dl>
              <blockquote className="mt-6 border-l-2 border-menta-500/60 pl-4 text-neutro-100">
                "Loucura é esperar resultados diferentes fazendo sempre as mesmas coisas."
              </blockquote>
              <figcaption className="mt-2 pl-4 text-sm text-neutro-300">João Vitor, sócio e gerente comercial do Grupo Protectpool</figcaption>
            </figure>
            <div className="rounded-[14px] border border-white/10 bg-card p-6">
              <p className="text-sm font-semibold text-neutro-300">Fusion Alumínios · indústria do ramo moveleiro, 18 anos de mercado</p>
              <p className="mt-5 text-[36px] font-bold tabular-nums text-menta-400">+30%</p>
              <p className="text-sm text-neutro-300">de faturamento em 8 meses</p>
              <p className="mt-4 text-neutro-100">Análise de dados comerciais, treinamento do time e ajuste do processo, com a operação rodando com uma equipe mais enxuta.</p>
            </div>
          </div>
        </Secao>

        {/* 9. Comparação */}
        <div className="border-y border-white/10 bg-neutro-800/40">
          <Secao eyebrow="Lado a lado" titulo="Vender só o software, ou vender com consultoria incluída.">
            <div className="overflow-hidden rounded-[14px] border border-white/10 bg-card">
              <table className="w-full text-left text-sm">
                <caption className="sr-only">Comparação entre vender só o software e vender com a consultoria incluída do Wise Partners</caption>
                <thead>
                  <tr className="border-b border-white/10">
                    <th scope="col" className="px-4 py-3 font-medium text-neutro-300 sm:px-5"><span className="sr-only">O que entra</span></th>
                    <th scope="col" className="w-[4.5rem] px-1 py-3 text-center text-xs font-medium text-neutro-300 sm:w-40 sm:px-2 sm:text-sm">Só o software</th>
                    <th scope="col" className="w-[5.5rem] px-1 py-3 text-center text-xs font-semibold sm:w-48 sm:px-2 sm:text-sm">Com o Wise Partners</th>
                  </tr>
                </thead>
                <tbody>
                  {COMPARACAO.map(([item, sem, com]) => (
                    <tr key={item} className="border-b border-white/10 last:border-0">
                      <th scope="row" className="px-4 py-3 font-normal sm:px-5">{item}</th>
                      {[sem, com].map((v, k) => (
                        <td key={k} className="px-2 py-3 text-center">
                          {v ? <Check className="mx-auto h-5 w-5 text-menta-400" aria-label="Sim" /> : <X className="mx-auto h-5 w-5 text-neutro-500" aria-label="Não" />}
                        </td>
                      ))}
                    </tr>
                  ))}
                  <tr>
                    <th scope="row" className="px-4 py-3 font-normal sm:px-5">Custo a mais pra você</th>
                    <td className="px-2 py-3 text-center text-neutro-300">Nenhum</td>
                    <td className="px-2 py-3 text-center font-semibold">Nenhum</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </Secao>
        </div>

        {/* 10. Perguntas frequentes */}
        <div>
          <Secao eyebrow="Perguntas frequentes" titulo="O que todo dono de software pergunta antes de entrar.">
            <div className="divide-y divide-white/10 rounded-[14px] border border-white/10 bg-card">
              {PERGUNTAS.map((q) => (
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
        </div>

        {/* Fechamento: frase emocional, cadastro e garantias embaixo */}
        <div ref={formRef} id="cadastro" className="scroll-mt-16">
          <section className="mx-auto w-full max-w-6xl px-4 py-14 sm:px-6 sm:py-20">
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-menta-400">Cadastro</p>
            <h2 className="mt-2 max-w-3xl text-balance font-display text-[32px] font-extrabold leading-tight sm:text-[44px]">
              Seu cliente não precisa escolher pelo preço. Dá pra ele um motivo pra escolher você.
            </h2>
            <p className="mt-4 max-w-[62ch] text-neutro-100">Cadastre sua empresa em 2 minutos e entre no portal Wise Partners com o e-mail e a senha que escolher aqui.</p>
            <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_1.4fr] lg:items-start">
              <ul className="space-y-3 text-sm text-neutro-100 lg:pt-2">
                {PARCEIRO_RECEBE.slice(0, 5).map((t) => (
                  <li key={t.titulo} className="flex items-start gap-2"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-menta-400" aria-hidden />{t.titulo}</li>
                ))}
              </ul>
              <div className="rounded-[14px] border border-white/10 bg-card p-5 sm:p-6">
                {isLoading ? (
                  <div className="space-y-4" aria-busy="true" aria-label="Carregando o formulário">
                    {Array.from({ length: 6 }).map((_, i) => <div key={i} className="h-10 animate-pulse rounded-[10px] bg-white/5" />)}
                  </div>
                ) : isError ? (
                  <div className="space-y-3 text-sm">
                    <p className="font-semibold">Não conseguimos abrir o cadastro agora.</p>
                    <p className="text-neutro-300">Pode ser a conexão. Tente de novo em instantes.</p>
                    <Button variant="outline" onClick={() => refetch()}>Tentar de novo</Button>
                  </div>
                ) : fechado ? (
                  <div className="space-y-2 text-sm">
                    <p className="font-semibold">O cadastro pela página está pausado.</p>
                    <p className="text-neutro-300">Volte em breve ou fale com a Wise Makers pelo e-mail contato@wisemakers.com.br.</p>
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
                      <Campo id="empresa" rotulo="Empresa" erro={mostra("empresa")}>
                        <Input className="border-white/40" id="empresa" autoComplete="organization" value={f.empresa} onChange={(e) => set("empresa", e.target.value)} aria-invalid={!!mostra("empresa")} aria-describedby={mostra("empresa") ? "empresa-erro" : undefined} />
                      </Campo>
                      <Campo id="cnpj" rotulo="CNPJ" erro={mostra("cnpj")}>
                        <Input className="border-white/40" id="cnpj" inputMode="numeric" placeholder="00.000.000/0000-00" value={f.cnpj}
                          onChange={(e) => set("cnpj", mascaraCnpj(e.target.value))} aria-invalid={!!mostra("cnpj")} aria-describedby={mostra("cnpj") ? "cnpj-erro" : undefined} />
                      </Campo>
                      <Campo id="categoria" rotulo="Tipo de software" erro={mostra("categoria_id")}>
                        <Select value={f.categoria_id} onValueChange={(v) => set("categoria_id", v)}>
                          <SelectTrigger id="categoria" className="border-white/40" aria-invalid={!!mostra("categoria_id")} aria-describedby={mostra("categoria_id") ? "categoria-erro" : undefined}><SelectValue placeholder="Escolha" /></SelectTrigger>
                          <SelectContent>
                            {(cfg?.categorias ?? []).map((c) => <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </Campo>
                      <Campo id="clientes" rotulo="Clientes ativos na base" erro={mostra("clientes_ativos")}>
                        <Input className="border-white/40" id="clientes" inputMode="numeric" placeholder="Ex.: 150" value={f.clientes_ativos}
                          onChange={(e) => set("clientes_ativos", somenteDigitos(e.target.value).slice(0, 7))} aria-invalid={!!mostra("clientes_ativos")} aria-describedby={mostra("clientes_ativos") ? "clientes-erro" : undefined} />
                      </Campo>
                      <Campo id="site" rotulo="Site da empresa" opcional>
                        <Input className="border-white/40" id="site" inputMode="url" autoComplete="url" placeholder="suaempresa.com.br" value={f.site} onChange={(e) => set("site", e.target.value)} />
                      </Campo>
                      <Campo id="senha" rotulo="Crie uma senha pro portal" erro={mostra("senha")}>
                        <Input className="border-white/40" id="senha" type="password" autoComplete="new-password" value={f.senha} onChange={(e) => set("senha", e.target.value)} aria-invalid={!!mostra("senha")} aria-describedby={mostra("senha") ? "senha-erro" : undefined} />
                      </Campo>
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
                        <span>Concordo com a <Link to="/parceiros/privacidade" target="_blank" className="text-menta-300 underline underline-offset-2">política de privacidade</Link> e com o uso dos meus dados pra criar o acesso e falar sobre a parceria.</span>
                      </label>
                      {mostra("aceites") && <p id="aceites-erro" role="alert" className="text-xs text-destructive">{erros.aceites}</p>}
                    </div>

                    {falha && <p role="alert" className="rounded-[10px] border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm">{falha}</p>}

                    <Button type="submit" size="lg" className="h-12 w-full text-base" disabled={enviando}>
                      {enviando ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden />Criando o seu acesso...</> : "Criar meu acesso de parceiro"}
                    </Button>
                    <p className="text-center text-xs text-neutro-300">Sem custo, sem exclusividade e sem meta mínima. Sai quando quiser.</p>
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
          <p>Wise Makers · Estrutura e gestão comercial · Maringá, Paraná</p>
          <nav className="flex gap-4" aria-label="Documentos">
            <Link to="/parceiros/termo" className="hover:text-foreground">Termo de adesão</Link>
            <Link to="/parceiros/privacidade" className="hover:text-foreground">Política de privacidade</Link>
            <Link to="/entrar" className="hover:text-foreground">Entrar no portal</Link>
          </nav>
        </div>
      </footer>

      {/* Botão fixo no celular, até chegar ao cadastro */}
      <div aria-hidden={!fixoVisivel}
        className={`fixed inset-x-0 bottom-0 z-20 border-t border-white/10 bg-background/95 p-3 backdrop-blur transition-transform duration-200 ease-out motion-reduce:transition-none sm:hidden ${fixoVisivel ? "translate-y-0" : "pointer-events-none translate-y-full"}`}
        style={{ paddingBottom: "max(12px, env(safe-area-inset-bottom))" }}>
        <Button onClick={irParaCadastro} className="h-11 w-full" tabIndex={fixoVisivel ? 0 : -1}>Quero ser parceiro</Button>
      </div>
    </div>
  );
}
