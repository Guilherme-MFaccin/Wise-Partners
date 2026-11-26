import { useMemo, useRef, useState, type FormEvent, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, ArrowRight, CheckCircle2, Loader2 } from "lucide-react";
import { Campo } from "@/components/landing/Blocos";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FAIXAS_FATURAMENTO } from "@/lib/diagnostico";
import {
  CABECALHOS, URL_CADASTRO, capturarOrigem, cnpjValido, idsMeta, mascaraCnpj, mascaraTelefone, registrarCadastro, somenteDigitos, type EmpresaGrupo,
} from "@/lib/landing";
import { cn } from "@/lib/utils";

// Formulário único da página do portal (26/11/2026): qualquer empresa, em três etapas (empresa, relação com o grupo, contato).
// O cadastro entra na fila e avisa o gerente da comunidade com o perfil declarado; o acesso sai depois que a Wise confere.

const UFS = ["AC", "AL", "AP", "AM", "BA", "CE", "DF", "ES", "GO", "MA", "MT", "MS", "MG", "PA", "PB", "PR", "PE", "PI", "RJ", "RN", "RS", "RO", "RR", "SC", "SP", "SE", "TO"];
const INTERESSES = [
  { valor: "comprar", rotulo: "Usar as condições especiais do catálogo" },
  { valor: "oferecer", rotulo: "Oferecer os produtos e serviços da minha empresa" },
  { valor: "indicar", rotulo: "Indicar a consultoria da Wise Makers a quem eu conheço" },
  { valor: "conhecer_consultoria", rotulo: "Conhecer a consultoria da Wise Makers para a minha empresa" },
  { valor: "ser_parceiro", rotulo: "Ser parceiro do programa Wise Partners" },
] as const;
const COMO_CONHECEU = ["Indicação de um cliente ou parceiro", "Consultor ou CS de uma empresa do grupo", "Redes sociais", "Evento", "Busca na internet", "Outro"];
const ETAPAS = ["Empresa", "Relação", "Contato"] as const;

const VAZIO = {
  cnpj: "", empresa: "", site: "", cidade: "", uf: "", segmento: "", faturamento: "", vendedores: "",
  cliente: "" as "" | "sim" | "nao", empresas_grupo: [] as string[], interesses: [] as string[], categoria_id: "", clientes_ativos: "", como_conheceu: "",
  aceite_termo_parceiro: false, nome: "", cargo: "", email: "", whatsapp: "", aceite_uso: false, aceite_privacidade: false,
  website: "",
};
type Form = typeof VAZIO;

function Etapas({ atual }: { atual: number }) {
  return (
    <ol className="grid grid-cols-3 gap-2" aria-label="Etapas do cadastro">
      {ETAPAS.map((e, i) => (
        <li key={e} aria-current={i === atual ? "step" : undefined} className="min-w-0">
          <span className={cn("block h-1 rounded-full", i <= atual ? "bg-menta-500" : "bg-white/10")} />
          <span className={cn("mt-2 block truncate text-xs", i === atual ? "font-semibold text-foreground" : "text-neutro-300")}>
            <span className="tabular-nums">{i + 1}.</span> {e}
          </span>
        </li>
      ))}
    </ol>
  );
}

function Opcao({ marcado, aoMudar, children, id, invalido, descrito }: {
  marcado: boolean; aoMudar: (v: boolean) => void; children: ReactNode; id: string; invalido?: boolean; descrito?: string;
}) {
  return (
    <label htmlFor={id} className={cn("flex min-h-11 cursor-pointer items-start gap-3 rounded-[10px] border px-3 py-2.5 text-sm transition-colors",
      marcado ? "border-menta-500/50 bg-menta-500/5" : "border-white/10 hover:border-white/25")}>
      <Checkbox id={id} checked={marcado} onCheckedChange={(v) => aoMudar(v === true)} className="mt-0.5 rounded-[4px] border-white/60"
        aria-invalid={invalido || undefined} aria-describedby={descrito} />
      <span>{children}</span>
    </label>
  );
}

export function FormularioCadastro({ empresasGrupo, categorias, botao, aoEnviado }: {
  empresasGrupo: EmpresaGrupo[]; categorias: { id: string; nome: string; grupo?: "comercial" | "institucional" }[]; botao?: string;
  aoEnviado?: (r: { whatsapp: string; perfil: string }) => void;
}) {
  const origem = useMemo(() => capturarOrigem(), []);
  const [f, setF] = useState<Form>(VAZIO);
  const [etapa, setEtapa] = useState(0);
  const [tocado, setTocado] = useState<Record<number, boolean>>({});
  const [enviando, setEnviando] = useState(false);
  const [falha, setFalha] = useState<string | null>(null);
  const [pronto, setPronto] = useState<{ whatsapp: string; perfil: string } | null>(null);
  const topo = useRef<HTMLDivElement>(null);
  const legenda = useRef<HTMLLegendElement>(null);
  const set = <K extends keyof Form>(k: K, v: Form[K]) => setF((x) => ({ ...x, [k]: v }));
  const alternar = (k: "empresas_grupo" | "interesses", v: string, on: boolean) =>
    setF((x) => ({ ...x, [k]: on ? [...new Set([...x[k], v])] : x[k].filter((y) => y !== v) }));

  const grupo = empresasGrupo;
  const querParceria = f.interesses.includes("ser_parceiro");
  const querOferecer = f.interesses.includes("oferecer");

  const erros: Record<number, Record<string, string>> = {
    0: {
      cnpj: !cnpjValido(f.cnpj) ? "Informe um CNPJ válido." : "",
      empresa: !f.empresa.trim() ? "Informe o nome da empresa." : "",
      uf: !f.uf ? "Escolha a UF." : "",
      segmento: !f.segmento.trim() ? "Conte em poucas palavras o que a empresa faz." : "",
      faturamento: !f.faturamento ? "Escolha a faixa de faturamento." : "",
      vendedores: !/^\d{1,5}$/.test(f.vendedores) ? "Informe quantas pessoas vendem (pode ser 0)." : "",
    },
    1: {
      cliente: !f.cliente ? "Responda se a empresa é cliente do grupo." : "",
      empresas_grupo: f.cliente === "sim" && !f.empresas_grupo.length ? "Marque de qual empresa do grupo." : "",
      interesses: !f.interesses.length ? "Marque ao menos uma opção." : "",
      categoria_id: querParceria && !f.categoria_id ? "Escolha a categoria da sua empresa." : "",
      clientes_ativos: querParceria && !/^\d{1,7}$/.test(f.clientes_ativos) ? "Informe um número aproximado de clientes ativos." : "",
      aceite_termo_parceiro: querParceria && !f.aceite_termo_parceiro ? "Para ser parceiro, aceite o termo de adesão." : "",
    },
    2: {
      nome: !f.nome.trim() ? "Informe o seu nome." : "",
      cargo: !f.cargo.trim() ? "Informe o seu cargo." : "",
      email: !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.email.trim()) ? "Informe um e-mail válido." : "",
      whatsapp: somenteDigitos(f.whatsapp).length < 10 ? "Informe o WhatsApp com DDD." : "",
      aceites: !(f.aceite_uso && f.aceite_privacidade) ? "Marque as duas caixas para continuar." : "",
    },
  };
  const erro = (n: number, k: string) => (tocado[n] ? erros[n][k] : "");
  const etapaValida = (n: number) => Object.values(erros[n]).every((e) => !e);

  function focarErro() {
    setTimeout(() => document.querySelector<HTMLElement>('#form-comunidade [aria-invalid="true"]')?.focus(), 0);
  }
  // Troca de etapa: rola ao topo (sem animação com "reduzir movimento") e leva o foco ao título da etapa nova
  function irPara(n: number) {
    setEtapa(n);
    const suave = !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    topo.current?.scrollIntoView({ behavior: suave ? "smooth" : "auto", block: "start" });
    setTimeout(() => legenda.current?.focus({ preventScroll: true }), 0);
  }
  function avancar() {
    setTocado((t) => ({ ...t, [etapa]: true }));
    if (!etapaValida(etapa)) return focarErro();
    irPara(etapa + 1);
  }

  async function enviar(e: FormEvent) {
    e.preventDefault();
    if (etapa < 2) return avancar();
    setTocado((t) => ({ ...t, 2: true }));
    setFalha(null);
    if (!etapaValida(2)) return focarErro();
    if (enviando) return;
    setEnviando(true);
    const email = f.email.trim().toLowerCase();
    const eventId = crypto.randomUUID();
    try {
      const r = await fetch(URL_CADASTRO, {
        method: "POST",
        headers: { ...CABECALHOS, "Content-Type": "application/json" },
        body: JSON.stringify({
          ...origem, ...idsMeta(origem), event_id: eventId, pagina: window.location.href, website: f.website,
          cnpj: somenteDigitos(f.cnpj), empresa: f.empresa.trim(), site: f.site.trim(), cidade: f.cidade.trim(), uf: f.uf, segmento: f.segmento.trim(),
          faturamento: f.faturamento, vendedores: f.vendedores, cliente_grupo: f.cliente === "sim", empresas_grupo: f.cliente === "sim" ? f.empresas_grupo : [],
          interesses: f.interesses, categoria_id: f.categoria_id, clientes_ativos: querParceria ? f.clientes_ativos : "", como_conheceu: f.como_conheceu,
          aceite_termo: querParceria && f.aceite_termo_parceiro,
          nome: f.nome.trim(), cargo: f.cargo.trim(), email, whatsapp: f.whatsapp, aceite_uso: f.aceite_uso, aceite_privacidade: f.aceite_privacidade,
        }),
      });
      const d = await r.json().catch(() => ({}));
      if (!r.ok) {
        setFalha(d?.erro ?? "Não foi possível concluir o cadastro. Tente de novo.");
        return;
      }
      registrarCadastro(eventId);
      const fim = { whatsapp: f.whatsapp, perfil: d?.perfil ?? "parceiro" };
      setPronto(fim);
      aoEnviado?.(fim);
    } catch {
      setFalha("Sem conexão com o servidor. Confira a internet e tente de novo.");
    } finally {
      setEnviando(false);
    }
  }

  if (pronto) {
    return (
      <div className="space-y-3 text-sm" role="status">
        <p className="flex items-center gap-2 text-base font-semibold"><CheckCircle2 className="h-5 w-5 text-menta-400" aria-hidden />Cadastro recebido.</p>
        <p className="text-neutro-100">
          A equipe da Wise confere o cadastro e fala com você pelo WhatsApp {pronto.whatsapp} em até 24 horas úteis.
          {pronto.perfil === "cliente_grupo" ? " Confirmado o vínculo com o grupo, o acesso chega pelo mesmo WhatsApp."
            : pronto.perfil === "parceiro" ? " Para ser parceiro, antes vem uma conversa de entrada de 45 minutos." : " Depois da conferência, o acesso chega pelo mesmo WhatsApp."}
        </p>
      </div>
    );
  }

  const destinos = [
    f.cliente === "sim" && "A Wise confirma que a sua empresa é cliente do grupo e manda o acesso pelo WhatsApp. A primeira tela é a Comunidade, com as condições especiais.",
    querParceria && "A equipe da Wise fala com você pelo WhatsApp para marcar a conversa de entrada no programa de parceiros.",
    f.interesses.includes("conhecer_consultoria") && "Um especialista da Wise Makers fala com você sobre a consultoria para a sua empresa.",
    f.cliente === "nao" && !querParceria && "A Wise confere o cadastro e manda o acesso pelo WhatsApp. Você vê quem está na comunidade e o que cada empresa oferece.",
  ].filter(Boolean) as string[];

  return (
    <div ref={topo} className="scroll-mt-24">
      <Etapas atual={etapa} />
        <form id="form-comunidade" onSubmit={enviar} noValidate className="mt-8 space-y-5">
          <input type="text" name="website" value={f.website} onChange={(e) => set("website", e.target.value)} tabIndex={-1} autoComplete="off" aria-hidden className="hidden" />

          {etapa === 0 && (
            <fieldset className="space-y-5">
              <legend ref={legenda} tabIndex={-1} className="text-lg font-semibold focus:outline-none">Sua empresa</legend>
              <div className="grid gap-5 sm:grid-cols-2">
                <Campo id="cnpj" rotulo="CNPJ" erro={erro(0, "cnpj")}>
                  <Input id="cnpj" inputMode="numeric" value={f.cnpj} onChange={(e) => set("cnpj", mascaraCnpj(e.target.value))} aria-invalid={!!erro(0, "cnpj")} aria-describedby={erro(0, "cnpj") ? "cnpj-erro" : undefined} />
                </Campo>
                <Campo id="empresa" rotulo="Nome da empresa" erro={erro(0, "empresa")}>
                  <Input id="empresa" autoComplete="organization" value={f.empresa} onChange={(e) => set("empresa", e.target.value)} aria-invalid={!!erro(0, "empresa")} aria-describedby={erro(0, "empresa") ? "empresa-erro" : undefined} />
                </Campo>
              </div>
              <Campo id="segmento" rotulo="O que a empresa faz" erro={erro(0, "segmento")}>
                <Input id="segmento" value={f.segmento} onChange={(e) => set("segmento", e.target.value)} placeholder="Ex.: indústria de embalagens, software de gestão, contabilidade" maxLength={160}
                  aria-invalid={!!erro(0, "segmento")} aria-describedby={erro(0, "segmento") ? "segmento-erro" : undefined} />
              </Campo>
              <div className="grid gap-5 sm:grid-cols-[1fr_7rem]">
                <Campo id="cidade" rotulo="Cidade" opcional>
                  <Input id="cidade" autoComplete="address-level2" value={f.cidade} onChange={(e) => set("cidade", e.target.value)} />
                </Campo>
                <Campo id="uf" rotulo="UF" erro={erro(0, "uf")}>
                  <Select value={f.uf} onValueChange={(v) => set("uf", v)}>
                    <SelectTrigger id="uf" aria-invalid={!!erro(0, "uf")} aria-describedby={erro(0, "uf") ? "uf-erro" : undefined}><SelectValue placeholder="UF" /></SelectTrigger>
                    <SelectContent>{UFS.map((u) => <SelectItem key={u} value={u}>{u}</SelectItem>)}</SelectContent>
                  </Select>
                </Campo>
              </div>
              <div className="grid gap-5 sm:grid-cols-2">
                <Campo id="faturamento" rotulo="Faturamento por mês" erro={erro(0, "faturamento")}>
                  <Select value={f.faturamento} onValueChange={(v) => set("faturamento", v)}>
                    <SelectTrigger id="faturamento" aria-invalid={!!erro(0, "faturamento")} aria-describedby={erro(0, "faturamento") ? "faturamento-erro" : undefined}><SelectValue placeholder="Escolha a faixa" /></SelectTrigger>
                    <SelectContent>{FAIXAS_FATURAMENTO.map((x) => <SelectItem key={x.valor} value={x.valor}>{x.rotulo}</SelectItem>)}</SelectContent>
                  </Select>
                </Campo>
                <Campo id="vendedores" rotulo="Pessoas que vendem no time" erro={erro(0, "vendedores")}>
                  <Input id="vendedores" inputMode="numeric" value={f.vendedores} onChange={(e) => set("vendedores", e.target.value.replace(/\D/g, "").slice(0, 5))}
                    aria-invalid={!!erro(0, "vendedores")} aria-describedby={erro(0, "vendedores") ? "vendedores-erro" : undefined} />
                </Campo>
              </div>
              <Campo id="site" rotulo="Site" opcional>
                <Input id="site" type="url" inputMode="url" value={f.site} onChange={(e) => set("site", e.target.value)} placeholder="www.suaempresa.com.br" />
              </Campo>
            </fieldset>
          )}

          {etapa === 1 && (
            <fieldset className="space-y-6">
              <legend ref={legenda} tabIndex={-1} className="text-lg font-semibold focus:outline-none">Relação com o Grupo Tríade</legend>
              <div className="space-y-2">
                <p id="cliente-rotulo" className="text-sm font-medium">A sua empresa é cliente de alguma empresa do Grupo Tríade?</p>
                <RadioGroup value={f.cliente} onValueChange={(v) => set("cliente", v as Form["cliente"])} aria-labelledby="cliente-rotulo" className="grid gap-2 sm:grid-cols-2"
                  aria-invalid={!!erro(1, "cliente")} aria-describedby={erro(1, "cliente") ? "cliente-erro" : undefined}>
                  {[["sim", "Sim, é cliente"], ["nao", "Não é cliente"]].map(([v, r]) => (
                    <label key={v} htmlFor={`cliente-${v}`} className={cn("flex min-h-11 cursor-pointer items-center gap-3 rounded-[10px] border px-3 text-sm",
                      f.cliente === v ? "border-menta-500/50 bg-menta-500/5" : "border-white/10 hover:border-white/25")}>
                      <RadioGroupItem id={`cliente-${v}`} value={v} />{r}
                    </label>
                  ))}
                </RadioGroup>
                {erro(1, "cliente") && <p id="cliente-erro" role="alert" className="text-xs text-destructive">{erro(1, "cliente")}</p>}
              </div>
              {f.cliente === "sim" && (
                <fieldset className="space-y-2">
                  <legend className="text-sm font-medium">De qual empresa do grupo?</legend>
                  <div className="grid gap-2 sm:grid-cols-3">
                    {grupo.map((g, i) => (
                      <Opcao key={g.id} id={`grupo-${g.codigo}`} marcado={f.empresas_grupo.includes(g.id)} aoMudar={(v) => alternar("empresas_grupo", g.id, v)}
                        invalido={i === 0 && !!erro(1, "empresas_grupo")} descrito={erro(1, "empresas_grupo") ? "grupo-erro" : undefined}>{g.nome}</Opcao>
                    ))}
                  </div>
                  {!grupo.length && <p className="text-sm text-neutro-300">A lista não carregou. Tente de novo pelo aviso acima.</p>}
                  {erro(1, "empresas_grupo") && <p id="grupo-erro" role="alert" className="text-xs text-destructive">{erro(1, "empresas_grupo")}</p>}
                  <p className="text-xs text-neutro-300">A Wise confirma o vínculo em até 2 dias úteis antes de liberar as condições do catálogo.</p>
                </fieldset>
              )}
              <fieldset className="space-y-2">
                <legend className="text-sm font-medium">O que a sua empresa quer na comunidade?</legend>
                <div className="grid gap-2">
                  {INTERESSES.map((i, n) => (
                    <Opcao key={i.valor} id={`int-${i.valor}`} marcado={f.interesses.includes(i.valor)} aoMudar={(v) => alternar("interesses", i.valor, v)}
                      invalido={n === 0 && !!erro(1, "interesses")} descrito={erro(1, "interesses") ? "interesses-erro" : undefined}>{i.rotulo}</Opcao>
                  ))}
                </div>
                {erro(1, "interesses") && <p id="interesses-erro" role="alert" className="text-xs text-destructive">{erro(1, "interesses")}</p>}
                {querOferecer && f.cliente !== "sim" && !querParceria && (
                  <p className="text-xs text-neutro-300">Oferecer no catálogo é para clientes do grupo e parceiros Elite. A Wise conversa com você sobre o caminho.</p>
                )}
              </fieldset>
              {(querParceria || querOferecer) && (
                <Campo id="categoria" rotulo="Categoria da sua empresa" opcional={!querParceria} erro={erro(1, "categoria_id")}>
                  <Select value={f.categoria_id} onValueChange={(v) => set("categoria_id", v)}>
                    <SelectTrigger id="categoria" aria-invalid={!!erro(1, "categoria_id")} aria-describedby={erro(1, "categoria_id") ? "categoria-erro" : undefined}><SelectValue placeholder="Escolha a categoria" /></SelectTrigger>
                    <SelectContent>
                      {[{ r: "Empresas", g: categorias.filter((c) => c.grupo !== "institucional") }, { r: "Entidades e instituições", g: categorias.filter((c) => c.grupo === "institucional") }]
                        .filter((x) => x.g.length).map((x) => (
                          <SelectGroup key={x.r}><SelectLabel>{x.r}</SelectLabel>{x.g.map((c) => <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>)}</SelectGroup>
                        ))}
                    </SelectContent>
                  </Select>
                </Campo>
              )}
              {querParceria && (
                <div className="space-y-4 rounded-[14px] border border-white/10 bg-card p-4">
                  <p className="text-sm font-semibold">Para o programa de parceiros</p>
                  <Campo id="clientes_ativos" rotulo="Quantos clientes ativos a sua empresa tem, mais ou menos?" erro={erro(1, "clientes_ativos")}>
                    <Input id="clientes_ativos" inputMode="numeric" value={f.clientes_ativos} onChange={(e) => set("clientes_ativos", e.target.value.replace(/\D/g, "").slice(0, 7))}
                      aria-invalid={!!erro(1, "clientes_ativos")} aria-describedby={erro(1, "clientes_ativos") ? "clientes_ativos-erro" : undefined} />
                  </Campo>
                  <label className="flex items-start gap-3 text-sm">
                    <Checkbox checked={f.aceite_termo_parceiro} onCheckedChange={(v) => set("aceite_termo_parceiro", v === true)} className="mt-0.5 rounded-[4px] border-white/60"
                      aria-invalid={!!erro(1, "aceite_termo_parceiro")} aria-describedby={erro(1, "aceite_termo_parceiro") ? "termo-parceiro-erro" : undefined} />
                    <span>Li e aceito o <Link to="/parceiros/termo" target="_blank" className="text-menta-300 underline underline-offset-2">termo de adesão do programa<span className="sr-only"> (abre em outra aba)</span></Link>. A entrada como parceiro acontece depois da conversa com a Wise.</span>
                  </label>
                  {erro(1, "aceite_termo_parceiro") && <p id="termo-parceiro-erro" role="alert" className="text-xs text-destructive">{erro(1, "aceite_termo_parceiro")}</p>}
                </div>
              )}
              <Campo id="como_conheceu" rotulo="Como conheceu a comunidade" opcional>
                <Select value={f.como_conheceu} onValueChange={(v) => set("como_conheceu", v)}>
                  <SelectTrigger id="como_conheceu"><SelectValue placeholder="Escolha uma opção" /></SelectTrigger>
                  <SelectContent>{COMO_CONHECEU.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                </Select>
              </Campo>
            </fieldset>
          )}

          {etapa === 2 && (
            <fieldset className="space-y-5">
              <legend ref={legenda} tabIndex={-1} className="text-lg font-semibold focus:outline-none">Seu contato</legend>
              <div className="grid gap-5 sm:grid-cols-2">
                <Campo id="nome" rotulo="Seu nome" erro={erro(2, "nome")}>
                  <Input id="nome" autoComplete="name" value={f.nome} onChange={(e) => set("nome", e.target.value)} aria-invalid={!!erro(2, "nome")} aria-describedby={erro(2, "nome") ? "nome-erro" : undefined} />
                </Campo>
                <Campo id="cargo" rotulo="Cargo" erro={erro(2, "cargo")}>
                  <Input id="cargo" autoComplete="organization-title" value={f.cargo} onChange={(e) => set("cargo", e.target.value)} aria-invalid={!!erro(2, "cargo")} aria-describedby={erro(2, "cargo") ? "cargo-erro" : undefined} />
                </Campo>
                <Campo id="email" rotulo="E-mail de trabalho" erro={erro(2, "email")}>
                  <Input id="email" type="email" autoComplete="email" value={f.email} onChange={(e) => set("email", e.target.value)} aria-invalid={!!erro(2, "email")} aria-describedby={erro(2, "email") ? "email-erro" : undefined} />
                </Campo>
                <Campo id="whatsapp" rotulo="WhatsApp" erro={erro(2, "whatsapp")}>
                  <Input id="whatsapp" type="tel" autoComplete="tel" value={f.whatsapp} onChange={(e) => set("whatsapp", mascaraTelefone(e.target.value))} aria-invalid={!!erro(2, "whatsapp")} aria-describedby={erro(2, "whatsapp") ? "whatsapp-erro" : undefined} />
                </Campo>
              </div>
              {destinos.length > 0 && (
                <div className="rounded-[14px] border border-white/10 bg-card p-4">
                  <p className="text-sm font-semibold">O que acontece depois do cadastro</p>
                  <ul className="mt-3 space-y-2 text-sm text-neutro-100">
                    {destinos.map((d) => <li key={d} className="flex items-start gap-2"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-menta-400" aria-hidden />{d}</li>)}
                  </ul>
                </div>
              )}
              <div className="space-y-3 text-sm">
                <label className="flex items-start gap-3">
                  <Checkbox checked={f.aceite_uso} onCheckedChange={(v) => set("aceite_uso", v === true)} className="mt-0.5 rounded-[4px] border-white/60" aria-invalid={!!erro(2, "aceites") && !f.aceite_uso} aria-describedby={erro(2, "aceites") ? "aceites-erro" : undefined} />
                  <span>Li e aceito o <Link to="/comunidade/termo" target="_blank" className="text-menta-300 underline underline-offset-2">termo de uso da comunidade<span className="sr-only"> (abre em outra aba)</span></Link>.</span>
                </label>
                <label className="flex items-start gap-3">
                  <Checkbox checked={f.aceite_privacidade} onCheckedChange={(v) => set("aceite_privacidade", v === true)} className="mt-0.5 rounded-[4px] border-white/60" aria-invalid={!!erro(2, "aceites") && !f.aceite_privacidade} aria-describedby={erro(2, "aceites") ? "aceites-erro" : undefined} />
                  <span>Concordo com a <Link to="/parceiros/privacidade" target="_blank" className="text-menta-300 underline underline-offset-2">política de privacidade<span className="sr-only"> (abre em outra aba)</span></Link>.</span>
                </label>
                {erro(2, "aceites") && <p id="aceites-erro" role="alert" className="text-xs text-destructive">{erro(2, "aceites")}</p>}
              </div>
            </fieldset>
          )}

          {falha && <p role="alert" className="rounded-[10px] border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm">{falha}</p>}

          <div className="flex flex-col-reverse gap-3 border-t border-white/10 pt-5 sm:flex-row sm:justify-between">
            {etapa > 0 ? <Button type="button" variant="ghost" onClick={() => irPara(etapa - 1)} disabled={enviando}><ArrowLeft className="mr-1.5 h-4 w-4" aria-hidden />Voltar</Button> : <span />}
            <Button type="submit" size="lg" className="h-12 px-6" disabled={enviando}>
              {enviando ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden />Enviando...</>
                : etapa < 2 ? <>Continuar<ArrowRight className="ml-1.5 h-4 w-4" aria-hidden /></> : (botao || "Enviar cadastro")}
            </Button>
          </div>
        </form>
    </div>
  );
}
