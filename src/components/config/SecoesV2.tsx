import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { addDays, format, parseISO } from "date-fns";
import { ChevronDown, Info, Loader2, Plus, Save, Send, Trash2, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Carregando, ErroCarga } from "@/components/comum/Estados";
import { Pilula } from "@/components/comum/Selos";
import { CLASSE_CARD } from "@/components/painel/Blocos";
import { CartaoFase, useDefinirFase, useSugestaoFase } from "@/components/gestao/FasePrograma";
import { useConfiguracao } from "@/components/gestao/dados";
import { Remuneracoes } from "@/components/gestao/Remuneracoes";
import { Aviso } from "@/components/gestao/Restrito";
import { ok, toastErro } from "@/lib/erros";
import { data, dataHora, hojeISO } from "@/lib/formato";
import {
  ETAPAS_PAINEL, FASES_PROGRAMA, GRUPOS_REQUISITO, PACOTES, PERIODICIDADES, TIPOS_ACAO, nomeNivel, rotulo,
} from "@/lib/rotulos";
import { cn } from "@/lib/utils";
import { Parametros } from "./Parametros";
import { TabelaConfig, type ColunaConfig, type Opcao } from "./TabelaConfig";

const op = (m: Record<string, string>): Opcao[] => Object.entries(m).map(([valor, r]) => ({ valor, rotulo: r }));

// ---------------------------------------------------------------------------
// Parâmetros agrupados por assunto (as demais chaves seguem na aba Parâmetros)
// ---------------------------------------------------------------------------
export const CHAVES_CUSTOS = [
  "horas_mensais_padrao", "fator_encargos_padrao", "margem_contribuicao_pct", "horizonte_receita_meses", "prazo_contrato_padrao_meses",
  "rateio_custo_geral", "ciclo_venda_direta_dias", "receita_nova_wise_periodo",
];
export const CHAVES_SLA = [
  "sla_validacao_dias_uteis", "sla_retorno_parceiro_dias_uteis", "sla_atualizacao_dias", "sla_parceiro_contato_dias_uteis",
  "sla_parceiro_atualizacao_dias_uteis", "protecao_indicacao_dias", "indicacao_parada_dias", "link_limite_hora", "link_indicacao_texto",
];
export const CHAVES_PONTOS = ["pontos_ranking", "categorias_premiacao", "faixa_destaque_pct", "faixa_potencial_pct"];
export const CHAVES_CRUZAMENTO = [
  "termo_cruzamento_texto", "termo_cruzamento_versao", "cruzamento_min_cnpjs", "cruzamento_max_linhas", "cruzamento_intervalo_dias",
  "cruzamento_retencao_dias",
];
export const CHAVES_REGRAS = ["vigencia_minima_regra_dias"];
export const CHAVES_AGRUPADAS = [...CHAVES_CUSTOS, ...CHAVES_SLA, ...CHAVES_PONTOS, ...CHAVES_CRUZAMENTO, ...CHAVES_REGRAS, "regras_publicadas"];

function Titulo({ children, descricao }: { children: React.ReactNode; descricao?: React.ReactNode }) {
  return (
    <div className="mb-2">
      <h3 className="font-semibold">{children}</h3>
      {descricao && <p className="text-sm text-muted-foreground">{descricao}</p>}
    </div>
  );
}

// Custos e remunerações (só administradores)
export function SecaoCustos() {
  return (
    <div className="space-y-6">
      <div>
        <Titulo descricao="Remuneração mensal de referência de cada pessoa interna e o custo-hora calculado.">Remunerações</Titulo>
        <Remuneracoes />
      </div>
      <div>
        <Titulo descricao="Usados no cálculo do resultado do canal (Apêndice M).">Parâmetros do resultado</Titulo>
        <Parametros somenteLeitura={false} chaves={CHAVES_CUSTOS} />
      </div>
    </div>
  );
}

export function SecaoSla({ somenteLeitura }: { somenteLeitura: boolean }) {
  return (
    <div className="space-y-3">
      <Aviso tom="info"><Info className="mt-0.5 h-4 w-4 shrink-0 text-menta-400" /> Prazos de SLA nos dois sentidos e proteção da indicação (180 dias desde a última interação, sem exceção). Mudança que afeta parceiros entra numa nova versão das regras publicadas.</Aviso>
      <Parametros somenteLeitura={somenteLeitura} chaves={CHAVES_SLA} />
    </div>
  );
}

export function SecaoPontos({ somenteLeitura }: { somenteLeitura: boolean }) {
  return <Parametros somenteLeitura={somenteLeitura} chaves={CHAVES_PONTOS} />;
}

export function SecaoCruzamento({ somenteLeitura }: { somenteLeitura: boolean }) {
  return (
    <div className="space-y-3">
      <Aviso tom="info"><Info className="mt-0.5 h-4 w-4 shrink-0 text-menta-400" /> Ao mudar o texto do termo, aumente a versão: o parceiro precisa aceitar a versão nova antes do próximo cruzamento.</Aviso>
      <Parametros somenteLeitura={somenteLeitura} chaves={CHAVES_CRUZAMENTO} />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Scorecard de entrada (Apêndice A)
// ---------------------------------------------------------------------------
const COL_SCORECARD: ColunaConfig[] = [
  { chave: "chave", rotulo: "Chave", tipo: "texto", fixaAposCriar: true, obrigatoria: true, ajuda: "Identificador sem espaços, definido na criação." },
  { chave: "nome", rotulo: "Critério", tipo: "texto", obrigatoria: true, larga: true },
  { chave: "peso", rotulo: "Peso", tipo: "numero", obrigatoria: true },
  { chave: "ordem", rotulo: "Ordem", tipo: "numero" },
  { chave: "essencial", rotulo: "Essencial", tipo: "booleano" },
  { chave: "elimina_com_zero", rotulo: "Nota 0 torna não elegível", tipo: "booleano" },
  { chave: "conta_na_qualidade", rotulo: "Conta na nota de qualidade", tipo: "booleano" },
  { chave: "ativo", rotulo: "Ativo", tipo: "booleano" },
  {
    chave: "regua", rotulo: "Régua de notas", tipo: "objeto",
    campos: [{ valor: "0", rotulo: "Nota 0" }, { valor: "0.5", rotulo: "Nota 0,5" }, { valor: "1", rotulo: "Nota 1" }],
  },
];
const NOVO_CRITERIO = { chave: "", nome: "", peso: 1, ordem: 99, essencial: false, elimina_com_zero: false, conta_na_qualidade: false, ativo: true, regua: { "0": "", "0.5": "", "1": "" } };
export function SecaoScorecard({ somenteLeitura }: { somenteLeitura: boolean }) {
  return (
    <div className="space-y-3">
      <Aviso tom="info">
        <Info className="mt-0.5 h-4 w-4 shrink-0 text-menta-400" />
        Cada critério recebe 0, 0,5 ou 1. Os essenciais definem a nota de potencial; os marcados para a qualidade entram na nota de qualidade.
        Mudanças valem para avaliações novas; as anteriores mantêm o resultado da época.
      </Aviso>
      <TabelaConfig tabela="criterios_scorecard" pk={["id"]} colunas={COL_SCORECARD} novo={NOVO_CRITERIO} recolhido
        tituloItem={(l) => `${l.ativo ? "" : "(inativo) "}${l.nome}${l.essencial ? " · essencial" : ""}`} somenteLeitura={somenteLeitura} />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Régua de atendimento (Apêndice C)
// ---------------------------------------------------------------------------
const COL_REGUA: ColunaConfig[] = [
  { chave: "chave", rotulo: "Chave", tipo: "texto", fixaAposCriar: true, obrigatoria: true, ajuda: "pacote:A, pacote:A:ciclo, pacote:B, pacote:C, faixa:destaque, faixa:potencial ou faixa:base." },
  { chave: "cadencia_dias", rotulo: "Cadência da reunião (dias; vazio = sem cadência própria)", tipo: "numero" },
  { chave: "tolerancia_dias", rotulo: "Tolerância para o alerta (dias)", tipo: "numero", obrigatoria: true },
  { chave: "descricao", rotulo: "Descrição (aparece nas regras do programa)", tipo: "texto", obrigatoria: true, larga: true },
];
const NOVA_REGUA = { chave: "", cadencia_dias: null, tolerancia_dias: 7, descricao: "" };
export function SecaoRegua({ somenteLeitura }: { somenteLeitura: boolean }) {
  return (
    <div className="space-y-3">
      <p className="rounded-[10px] bg-white/5 px-3 py-2 text-sm text-muted-foreground">
        Quando pacote e faixa pedem cadências diferentes, vale a mais frequente. O alerta sai depois da cadência mais a tolerância.
      </p>
      <TabelaConfig tabela="regua_atendimento" pk={["chave"]} ordem="chave" colunas={COL_REGUA} novo={NOVA_REGUA} podeExcluir
        tituloItem={(l) => `${l.chave} · ${l.descricao}`} somenteLeitura={somenteLeitura} />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Catálogo de ações da Wise (Apêndice H)
// ---------------------------------------------------------------------------
const COL_ACOES: ColunaConfig[] = [
  { chave: "nome", rotulo: "Nome", tipo: "texto", obrigatoria: true, larga: true },
  { chave: "tipo_acao", rotulo: "Tipo", tipo: "select", opcoes: op(TIPOS_ACAO), obrigatoria: true },
  { chave: "periodicidade", rotulo: "Periodicidade", tipo: "select", opcoes: op(PERIODICIDADES), obrigatoria: true },
  { chave: "prazo_inicial_dias", rotulo: "Prazo inicial (dias após a assinatura)", tipo: "numero" },
  { chave: "pacotes", rotulo: "Pacotes em que vale", tipo: "multi", opcoes: op(PACOTES).sort((a, b) => a.valor.localeCompare(b.valor)) },
  { chave: "comprovacao", rotulo: "Forma de comprovação", tipo: "texto", obrigatoria: true },
  { chave: "ordem", rotulo: "Ordem", tipo: "numero" },
  { chave: "ativa", rotulo: "Ativa", tipo: "booleano" },
  { chave: "periodicidade_por_pacote", rotulo: "Periodicidade por pacote (JSON, ex.: {\"A\": \"quinzenal\"})", tipo: "json" },
];
const NOVA_ACAO = { nome: "", tipo_acao: "marketing", periodicidade: "mensal", prazo_inicial_dias: 0, pacotes: [], comprovacao: "", ordem: 99, ativa: true, periodicidade_por_pacote: {} };
export function SecaoAcoesWise({ somenteLeitura }: { somenteLeitura: boolean }) {
  return (
    <TabelaConfig tabela="catalogo_acoes_wise" pk={["id"]} colunas={COL_ACOES} novo={NOVA_ACAO} podeExcluir recolhido reordenar
      tituloItem={(l) => `${l.ativa ? "" : "(inativa) "}${l.nome}`} somenteLeitura={somenteLeitura} />
  );
}

// ---------------------------------------------------------------------------
// Requisitos de nível (Apêndice B): cada mudança é uma versão nova com vigência mínima
// ---------------------------------------------------------------------------
type Requisito = { id: string; nivel: string; grupo: string; regra: Record<string, any>; descricao: string; vigente_desde: string; versao: number };

export function SecaoRequisitos({ somenteLeitura }: { somenteLeitura: boolean }) {
  const q = useQuery({
    queryKey: ["config", "requisitos_nivel"],
    queryFn: async () =>
      (ok<any>(await supabase.from("requisitos_nivel").select("id, nivel, grupo, regra, descricao, vigente_desde, versao")
        .order("nivel").order("grupo").order("vigente_desde", { ascending: false }).order("versao", { ascending: false })) ?? []) as Requisito[],
  });
  const { data: diasMin } = useConfiguracao<number>("vigencia_minima_regra_dias");
  const minimo = format(addDays(parseISO(hojeISO() + "T12:00:00"), Number(diasMin ?? 30)), "yyyy-MM-dd");

  if (q.isLoading) return <Carregando />;
  if (q.error) return <ErroCarga erro={q.error} />;
  const lista = q.data ?? [];

  return (
    <div className="space-y-4">
      <Aviso tom="info">
        <Info className="mt-0.5 h-4 w-4 shrink-0 text-menta-400" />
        <span>
          Mudança de requisito afeta parceiros: o banco exige vigência a partir de {data(minimo)} (no mínimo {diasMin ?? 30} dias).
          Crie uma nova versão com a data de vigência; a atual continua valendo até lá. Depois, publique as regras na aba Regras publicadas para
          gerar o comunicado aos parceiros.
        </span>
      </Aviso>
      {["A", "B", "C"].map((nivel) => (
        <section key={nivel} className={cn(CLASSE_CARD, "p-3 sm:p-4")}>
          <h3 className="mb-3 font-semibold">Nível {nivel} · {nomeNivel("comercial", nivel)}</h3>
          <div className="grid gap-3 lg:grid-cols-3">
            {Object.keys(GRUPOS_REQUISITO).map((grupo) => (
              <GrupoRequisito key={grupo} nivel={nivel} grupo={grupo} minimo={minimo} somenteLeitura={somenteLeitura}
                itens={lista.filter((r) => r.nivel === nivel && r.grupo === grupo)} />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}

function GrupoRequisito({ nivel, grupo, itens, minimo, somenteLeitura }: { nivel: string; grupo: string; itens: Requisito[]; minimo: string; somenteLeitura: boolean }) {
  const qc = useQueryClient();
  const hoje = hojeISO();
  const vigente = itens.find((r) => r.vigente_desde <= hoje);
  const futuras = itens.filter((r) => r.vigente_desde > hoje);
  const anteriores = itens.filter((r) => r.vigente_desde <= hoje && r !== vigente);
  const [editando, setEditando] = useState<Requisito | "nova" | null>(null);
  const [historico, setHistorico] = useState(false);
  const recarregar = () => qc.invalidateQueries({ queryKey: ["config", "requisitos_nivel"] });

  async function excluir(r: Requisito) {
    if (!confirm("Excluir esta versão futura do requisito?")) return;
    const { error } = await supabase.from("requisitos_nivel").delete().eq("id", r.id);
    if (error) return toastErro(error);
    toast.success("Versão excluída.");
    recarregar();
  }

  return (
    <div className="min-w-0 rounded-[10px] bg-white/5 p-3 text-sm">
      <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">{rotulo(GRUPOS_REQUISITO, grupo)}</p>
      {vigente ? <VersaoRequisito r={vigente} rotuloEstado="Vigente" /> : <p className="text-muted-foreground">Sem requisito vigente.</p>}
      {futuras.map((r) => (
        <div key={r.id} className="mt-2 border-t border-white/10 pt-2">
          <VersaoRequisito r={r} rotuloEstado={`A partir de ${data(r.vigente_desde)}`} />
          {!somenteLeitura && (
            <div className="mt-1 flex gap-1">
              <Button variant="ghost" size="sm" className="h-7 px-2" onClick={() => setEditando(r)}>Editar</Button>
              <Button variant="ghost" size="sm" className="h-7 px-2 text-red-300" onClick={() => excluir(r)}><Trash2 /> Excluir</Button>
            </div>
          )}
        </div>
      ))}
      {anteriores.length > 0 && (
        <button type="button" className="mt-2 flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground" onClick={() => setHistorico(!historico)}>
          <ChevronDown className={cn("h-3.5 w-3.5 transition-transform", !historico && "-rotate-90")} /> Versões anteriores ({anteriores.length})
        </button>
      )}
      {historico && anteriores.map((r) => (
        <div key={r.id} className="mt-2 opacity-70"><VersaoRequisito r={r} rotuloEstado={`Desde ${data(r.vigente_desde)}`} /></div>
      ))}
      {!somenteLeitura && !editando && (
        <Button variant="outline" size="sm" className="mt-3" onClick={() => setEditando("nova")}><Plus /> Nova versão</Button>
      )}
      {editando && (
        <FormRequisito nivel={nivel} grupo={grupo} base={editando === "nova" ? vigente ?? null : editando} editar={editando !== "nova"}
          proximaVersao={Math.max(0, ...itens.map((i) => i.versao)) + 1} minimo={minimo}
          onFechar={() => setEditando(null)} onSalvo={() => { setEditando(null); recarregar(); }} />
      )}
    </div>
  );
}

function VersaoRequisito({ r, rotuloEstado }: { r: Requisito; rotuloEstado: string }) {
  return (
    <div className="space-y-1">
      <div className="flex flex-wrap items-center gap-1.5">
        <Pilula tom={rotuloEstado === "Vigente" ? "menta" : "neutro"}>{rotuloEstado}</Pilula>
        <span className="text-xs text-muted-foreground">versão {r.versao}</span>
      </div>
      <p className="break-words">{r.descricao}</p>
      {Object.keys(r.regra ?? {}).length > 0 && (
        <p className="break-words font-mono text-[11px] text-muted-foreground">
          {Object.entries(r.regra).map(([k, v]) => `${k}: ${JSON.stringify(v)}`).join(" · ")}
        </p>
      )}
    </div>
  );
}

function FormRequisito({
  nivel, grupo, base, editar, proximaVersao, minimo, onFechar, onSalvo,
}: {
  nivel: string; grupo: string; base: Requisito | null; editar: boolean; proximaVersao: number; minimo: string;
  onFechar: () => void; onSalvo: () => void;
}) {
  const [descricao, setDescricao] = useState(base?.descricao ?? "");
  const [regra, setRegra] = useState(JSON.stringify(base?.regra ?? {}, null, 2));
  const [desde, setDesde] = useState(editar && base ? base.vigente_desde : minimo);
  const [salvando, setSalvando] = useState(false);

  async function salvar() {
    let regraJson: any;
    try { regraJson = JSON.parse(regra || "{}"); } catch { return toast.error("Regra: JSON inválido."); }
    if (!descricao.trim()) return toast.error("Preencha a descrição.");
    setSalvando(true);
    try {
      const dados = { descricao: descricao.trim(), regra: regraJson, vigente_desde: desde };
      const { error } = editar && base
        ? await supabase.from("requisitos_nivel").update(dados).eq("id", base.id)
        : await supabase.from("requisitos_nivel").insert({ ...dados, nivel, grupo, versao: proximaVersao });
      if (error) throw error;
      toast.success("Requisito salvo. Publique as regras para avisar os parceiros.");
      onSalvo();
    } catch (e) {
      toastErro(e);
    } finally {
      setSalvando(false);
    }
  }

  return (
    <div className="mt-3 space-y-2 rounded-[10px] border border-menta-500/30 p-3">
      <p className="text-xs font-semibold">{editar ? "Editar versão futura" : `Nova versão (${proximaVersao})`}</p>
      <div className="space-y-1">
        <Label className="text-xs text-muted-foreground">Descrição (o parceiro lê)</Label>
        <Textarea rows={2} value={descricao} onChange={(e) => setDescricao(e.target.value)} />
      </div>
      <div className="space-y-1">
        <Label className="text-xs text-muted-foreground">Regra (JSON usado no cálculo do nível)</Label>
        <Textarea rows={4} className="font-mono text-xs" value={regra} onChange={(e) => setRegra(e.target.value)} />
        <p className="text-[11px] text-muted-foreground">
          Chaves aceitas: indicacoes_qualificadas, clientes_fechados, janela_dias, responsavel_certificado, pessoas_certificadas, contrato,
          contrapartida_atraso_max_dias, acoes_comprovadas, acoes_janela_dias.
        </p>
      </div>
      <div className="space-y-1">
        <Label className="text-xs text-muted-foreground">Vigente a partir de (mínimo {data(minimo)})</Label>
        <Input type="date" min={minimo} value={desde} onChange={(e) => setDesde(e.target.value)} />
      </div>
      <div className="flex justify-end gap-2">
        <Button variant="ghost" size="sm" onClick={onFechar}><X /> Cancelar</Button>
        <Button size="sm" onClick={salvar} disabled={salvando}>{salvando ? <Loader2 className="animate-spin" /> : <Save />} Salvar</Button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Indicadores do painel (Apêndice L). As metas ficam na seção Metas (migração 0022).
// ---------------------------------------------------------------------------
type IndicadorCat = { chave: string; etapa: string; nome: string; formato: string; destaque: boolean; so_admin: boolean; ordem: number; ativo: boolean; aceita_meta: boolean; principal: boolean };

export function SecaoIndicadores({ somenteLeitura }: { somenteLeitura: boolean }) {
  const ind = useQuery({
    queryKey: ["config", "indicadores"],
    queryFn: async () => (ok<any>(await supabase.from("indicadores").select("*").order("etapa").order("ordem")) ?? []) as IndicadorCat[],
  });
  const porFrente = useMemo(() => Object.keys(ETAPAS_PAINEL).map((e) => ({ frente: e, itens: (ind.data ?? []).filter((i) => i.etapa === e) })), [ind.data]);

  if (ind.isLoading) return <Carregando />;
  if (ind.error) return <ErroCarga erro={ind.error} />;

  return (
    <div className="space-y-4">
      <Aviso tom="info">
        <Info className="mt-0.5 h-4 w-4 shrink-0 text-menta-400" />
        <span>
          Os indicadores em destaque aparecem primeiro no painel e no relatório semanal. Indicadores só do administrador não aparecem para os demais
          papéis. As metas ficam em <Link to="/app/configuracoes?aba=metas" className="text-menta-400 hover:underline">Configurações, Metas</Link>, só para
          os indicadores marcados como "Recebe meta".
        </span>
      </Aviso>
      {porFrente.map((g) => g.itens.length > 0 && (
        <section key={g.frente} className={cn(CLASSE_CARD, "p-3 sm:p-4")}>
          <h3 className="mb-2 font-semibold">{rotulo(ETAPAS_PAINEL, g.frente)}</h3>
          <ul className="divide-y divide-white/10">
            {g.itens.map((i) => <LinhaIndicador key={i.chave} ind={i} somenteLeitura={somenteLeitura} />)}
          </ul>
        </section>
      ))}
    </div>
  );
}

function LinhaIndicador({ ind, somenteLeitura }: { ind: IndicadorCat; somenteLeitura: boolean }) {
  const qc = useQueryClient();
  const [estado, setEstado] = useState(ind);
  useEffect(() => setEstado(ind), [ind]);
  const [salvando, setSalvando] = useState(false);
  const alterado = JSON.stringify(estado) !== JSON.stringify(ind);

  async function salvar() {
    setSalvando(true);
    try {
      const { error } = await supabase.from("indicadores")
        .update({ nome: estado.nome.trim(), destaque: estado.destaque, ativo: estado.ativo, so_admin: estado.so_admin, ordem: Number(estado.ordem) })
        .eq("chave", ind.chave);
      if (error) throw error;
      toast.success("Indicador salvo.");
      qc.invalidateQueries({ queryKey: ["config", "indicadores"] });
      qc.invalidateQueries({ queryKey: ["painel-v2"] });
    } catch (e) {
      toastErro(e);
    } finally {
      setSalvando(false);
    }
  }

  return (
    <li className="space-y-2 py-3">
      <div className="flex flex-col gap-2 lg:flex-row lg:items-center">
        <div className="flex min-w-0 items-center gap-2 lg:flex-1">
          <Input className="min-w-0 flex-1" value={estado.nome} disabled={somenteLeitura} aria-label="Nome do indicador"
            onChange={(e) => setEstado({ ...estado, nome: e.target.value })} />
          {ind.principal ? <Pilula tom="menta">Principal</Pilula> : ind.aceita_meta ? <Pilula>Recebe meta</Pilula> : null}
        </div>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
          {([["destaque", "Destaque"], ["ativo", "Ativo"], ["so_admin", "Só administrador"]] as const).map(([k, r]) => (
            <label key={k} className="flex items-center gap-1.5">
              <Switch checked={estado[k]} disabled={somenteLeitura} onCheckedChange={(v) => setEstado({ ...estado, [k]: v })} /> {r}
            </label>
          ))}
          <label className="flex items-center gap-1.5">
            Ordem
            <Input type="number" className="h-8 w-16" value={estado.ordem} disabled={somenteLeitura}
              onChange={(e) => setEstado({ ...estado, ordem: Number(e.target.value) })} />
          </label>
          {!somenteLeitura && (
            <Button size="sm" disabled={!alterado || salvando || !estado.nome.trim()} onClick={salvar}>
              {salvando ? <Loader2 className="animate-spin" /> : <Save />} Salvar
            </Button>
          )}
        </div>
      </div>
    </li>
  );
}

// ---------------------------------------------------------------------------
// Fase do programa (Apêndice L)
// ---------------------------------------------------------------------------
type FaseHist = { id: string; fase: string; desde: string; created_at: string; perfil: { nome: string } | null };

export function SecaoFase({ podeDefinir }: { podeDefinir: boolean }) {
  const sugestao = useSugestaoFase();
  const { definir, salvando } = useDefinirFase();
  const [escolha, setEscolha] = useState("");
  const hist = useQuery({
    queryKey: ["fase", "historico"],
    queryFn: async () =>
      (ok<any>(await supabase.from("fase_programa").select("id, fase, desde, created_at, perfil:perfis(nome)")
        .order("desde", { ascending: false }).order("created_at", { ascending: false })) ?? []) as unknown as FaseHist[],
  });
  const atual = hist.data?.[0]?.fase ?? sugestao.data?.fase ?? null;

  return (
    <div className="space-y-4">
      {sugestao.isLoading ? <Carregando /> : <CartaoFase fase={atual} sugestao={sugestao.data} />}
      {podeDefinir && (
        <section className={cn(CLASSE_CARD, "p-4")}>
          <Titulo descricao="Use para corrigir a fase ou voltar a uma anterior. A sugestão do portal não muda a fase sozinha.">Definir a fase manualmente</Titulo>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Select value={escolha} onValueChange={setEscolha}>
              <SelectTrigger className="w-full sm:w-64"><SelectValue placeholder="Escolha a fase" /></SelectTrigger>
              <SelectContent>{Object.entries(FASES_PROGRAMA).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent>
            </Select>
            <Button disabled={!escolha || escolha === atual || salvando} onClick={async () => { if (await definir(escolha)) setEscolha(""); }}>
              {salvando && <Loader2 className="animate-spin" />} Definir fase
            </Button>
          </div>
        </section>
      )}
      <section className={cn(CLASSE_CARD, "p-4")}>
        <Titulo>Histórico</Titulo>
        {hist.isLoading && <Carregando />}
        {hist.error && <ErroCarga erro={hist.error} />}
        <ul className="divide-y divide-white/10 text-sm">
          {(hist.data ?? []).map((h, i) => (
            <li key={h.id} className="flex flex-wrap items-center justify-between gap-2 py-2">
              <span className="flex items-center gap-2">
                {rotulo(FASES_PROGRAMA, h.fase)} {i === 0 && <Pilula tom="menta">Atual</Pilula>}
              </span>
              <span className="text-xs text-muted-foreground">Desde {data(h.desde)}{h.perfil?.nome ? ` · ${h.perfil.nome}` : ""}</span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Regras publicadas (FR-167 a FR-169)
// ---------------------------------------------------------------------------
type VersaoRegras = {
  id: string; versao: number; conteudo: any; mudancas: string | null; vigente_desde: string; afeta_parceiros: boolean; created_at: string;
};

export function SecaoRegras({ podePublicar, somenteLeitura }: { podePublicar: boolean; somenteLeitura: boolean }) {
  const qc = useQueryClient();
  const { data: diasMin } = useConfiguracao<number>("vigencia_minima_regra_dias");
  const minimo = format(addDays(parseISO(hojeISO() + "T12:00:00"), Number(diasMin ?? 30)), "yyyy-MM-dd");
  const q = useQuery({
    queryKey: ["config", "versoes_regras"],
    queryFn: async () =>
      (ok<any>(await supabase.from("versoes_regras").select("id, versao, conteudo, mudancas, vigente_desde, afeta_parceiros, created_at")
        .order("versao", { ascending: false })) ?? []) as VersaoRegras[],
  });
  const [vigencia, setVigencia] = useState("");
  const [mudancas, setMudancas] = useState("");
  const [afeta, setAfeta] = useState(true);
  const [publicando, setPublicando] = useState(false);
  const [aberta, setAberta] = useState<string | null>(null);
  useEffect(() => { if (!vigencia) setVigencia(minimo); }, [minimo, vigencia]);

  const hoje = hojeISO();
  const vigente = (q.data ?? []).filter((v) => v.vigente_desde <= hoje).sort((a, b) => b.vigente_desde.localeCompare(a.vigente_desde) || b.versao - a.versao)[0];

  async function publicar() {
    if (!mudancas.trim()) return toast.error("Descreva o que mudou.");
    if (!confirm("Publicar uma nova versão das regras do programa?")) return;
    setPublicando(true);
    try {
      const { error } = await supabase.rpc("publicar_regras", { p_vigencia: vigencia, p_mudancas: mudancas.trim(), p_afeta_parceiros: afeta });
      if (error) throw error;
      toast.success(afeta ? "Regras publicadas. O rascunho do comunicado aos parceiros está em Comunicados." : "Regras publicadas.");
      setMudancas("");
      qc.invalidateQueries({ queryKey: ["config", "versoes_regras"] });
      qc.invalidateQueries({ queryKey: ["configuracao", "regras_publicadas"] });
    } catch (e) {
      toastErro(e);
    } finally {
      setPublicando(false);
    }
  }

  return (
    <div className="space-y-4">
      <Aviso tom="info">
        <Info className="mt-0.5 h-4 w-4 shrink-0 text-menta-400" />
        <span>
          Publicar tira um retrato das regras atuais (níveis e requisitos, pacotes, comissões, proteção, SLA, régua, desligamento, ranking e premiação)
          que o parceiro vê em Regras do programa. Mudança que afeta parceiros precisa de vigência de no mínimo {diasMin ?? 30} dias e abre o rascunho
          de um comunicado em <Link to="/app/comunicados" className="text-menta-400 hover:underline">Comunicados</Link>.
        </span>
      </Aviso>

      {podePublicar && (
        <section className={cn(CLASSE_CARD, "p-4")}>
          <Titulo>Publicar nova versão</Titulo>
          <div className="grid gap-3 sm:grid-cols-[12rem_1fr]">
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Vigente a partir de</Label>
              <Input type="date" value={vigencia} min={afeta ? minimo : undefined} onChange={(e) => setVigencia(e.target.value)} />
              {afeta && <p className="text-xs text-muted-foreground">Mínimo {data(minimo)}</p>}
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">O que mudou (vira o texto do comunicado)</Label>
              <Textarea rows={3} value={mudancas} onChange={(e) => setMudancas(e.target.value)} />
            </div>
          </div>
          <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <label className="flex items-center gap-2 text-sm">
              <Switch checked={afeta} onCheckedChange={setAfeta} /> A mudança afeta os parceiros
            </label>
            <Button onClick={publicar} disabled={publicando || !vigencia}>{publicando ? <Loader2 className="animate-spin" /> : <Send />} Publicar regras</Button>
          </div>
        </section>
      )}

      <section className={cn(CLASSE_CARD, "p-4")}>
        <Titulo>Versões</Titulo>
        {q.isLoading && <Carregando />}
        {q.error && <ErroCarga erro={q.error} />}
        {q.isSuccess && q.data.length === 0 && <p className="text-sm text-muted-foreground">Nenhuma versão publicada.</p>}
        <ul className="divide-y divide-white/10">
          {(q.data ?? []).map((v) => (
            <li key={v.id} className="py-2.5 text-sm">
              <button type="button" className="flex w-full flex-wrap items-center gap-2 text-left" onClick={() => setAberta(aberta === v.id ? null : v.id)}>
                <ChevronDown className={cn("h-4 w-4 text-muted-foreground transition-transform", aberta !== v.id && "-rotate-90")} />
                <span className="font-semibold">Versão {v.versao}</span>
                {v.id === vigente?.id && <Pilula tom="menta">Vigente</Pilula>}
                {v.vigente_desde > hoje && <Pilula tom="info">A partir de {data(v.vigente_desde)}</Pilula>}
                {!v.afeta_parceiros && <Pilula>Não afeta parceiros</Pilula>}
                <span className="ml-auto text-xs text-muted-foreground">Vigência {data(v.vigente_desde)} · publicada em {dataHora(v.created_at)}</span>
              </button>
              {v.mudancas && <p className="mt-1 whitespace-pre-wrap break-words pl-6 text-muted-foreground">{v.mudancas}</p>}
              {aberta === v.id && <RetratoRegras conteudo={v.conteudo} />}
            </li>
          ))}
        </ul>
      </section>
      <Parametros somenteLeitura={somenteLeitura} chaves={CHAVES_REGRAS} />
    </div>
  );
}

function RetratoRegras({ conteudo }: { conteudo: any }) {
  const niveis: any[] = conteudo?.niveis ?? [];
  return (
    <div className="mt-2 space-y-2 pl-6 text-xs">
      {niveis.map((n) => (
        <div key={n.codigo}>
          <p className="font-semibold">{n.nome}</p>
          <ul className="list-disc pl-4 text-muted-foreground">
            {(n.requisitos ?? []).map((r: any, i: number) => <li key={i}>{rotulo(GRUPOS_REQUISITO, r.grupo)}: {r.descricao}</li>)}
          </ul>
        </div>
      ))}
      <p className="text-muted-foreground">
        Proteção da indicação: {conteudo?.protecao_dias ?? ""} dias
        {conteudo?.ranking ? ` · pontos: ${Object.entries(conteudo.ranking).map(([k, v]) => `${k} ${v}`).join(", ")}` : ""}
      </p>
    </div>
  );
}
