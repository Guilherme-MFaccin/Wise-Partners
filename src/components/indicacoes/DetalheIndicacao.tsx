import { useEffect, useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ExternalLink, Loader2, Save } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Carregando, ErroCarga } from "@/components/comum/Estados";
import { Pilula, SeloEstado } from "@/components/comum/Selos";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import { toastErro } from "@/lib/erros";
import { data, dataHora, formatarCnpj, moeda } from "@/lib/formato";
import {
  BENEFICIARIOS, ESTADOS_COMISSAO, ESTADOS_COMISSAO_RECEBER, ETAPAS_INDICACAO, ORIGENS_INDICACAO, rotulo, SENTIDOS,
} from "@/lib/rotulos";
import { AtualizacaoPendente } from "./AtualizacaoPendente";
import { Checagens, FormValidacao, QualidadeSla } from "./QualidadeIndicacao";
import { rotuloValorBase, SELECT_INDICACAO, useCriteriosIcp, type Indicacao } from "./dados";

// Detalhe da indicação. Parcerias atualiza o andamento direto na tabela (a RLS permite só a esse papel).
export function DetalheIndicacao({ id, onOpenChange }: { id: string | null; onOpenChange: (aberto: boolean) => void }) {
  const { isParcerias, veComissao, perfil } = useAuth();
  const consulta = useQuery({
    queryKey: ["indicacoes", "detalhe", id],
    enabled: !!id,
    queryFn: async () => {
      const { data: r, error } = await supabase.from("indicacoes").select(SELECT_INDICACAO).eq("id", id!).maybeSingle();
      if (error) throw error;
      return r as unknown as Indicacao | null;
    },
  });
  const i = consulta.data;

  return (
    <Sheet open={!!id} onOpenChange={onOpenChange}>
      <SheetContent className="w-full overflow-y-auto p-4 sm:max-w-xl sm:p-6">
        <SheetHeader className="pr-8 text-left">
          <SheetTitle>{i?.cliente?.razao_social ?? "Indicação"}</SheetTitle>
          <SheetDescription>
            {i ? `${rotulo(SENTIDOS, i.sentido)} · ${i.empresa?.nome ?? ""}` : "Detalhes da indicação"}
          </SheetDescription>
        </SheetHeader>

        <div className="mt-4 space-y-5">
          {consulta.isLoading && <Carregando />}
          {consulta.error && <ErroCarga erro={consulta.error} />}
          {consulta.isSuccess && !i && <p className="text-sm text-muted-foreground">Indicação não encontrada.</p>}
          {i && (
            <>
              <AtualizacaoPendente indicacao={i} podeConfirmar={isParcerias} />
              <Dados i={i} />
              <QualidadeSla i={i} />
              {/* Validação: parcerias ou o responsável pela indicação (o banco confere) */}
              {i.sentido === "parceiro_para_grupo" && (isParcerias || i.responsavel_id === perfil?.id) && <FormValidacao i={i} />}
              {isParcerias && <FormAndamento i={i} />}
              {i.etapa === "fechada" && <Checagens i={i} podeRegistrar={isParcerias || i.responsavel_id === perfil?.id} />}
              {/* Comissões só existem para quem vê comissão: para os demais, nem a consulta é feita */}
              {veComissao && <ComissoesDaIndicacao indicacaoId={i.id} />}
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}

function Dados({ i }: { i: Indicacao }) {
  const { data: criterios = [] } = useCriteriosIcp();
  const c = i.cliente;
  const temContato = !!(c?.contato_nome || c?.email || c?.telefone);
  const avaliado = i.aderencia_icp && Object.keys(i.aderencia_icp).length > 0;
  return (
    <section className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <SeloEstado estado={i.etapa} mapa={ETAPAS_INDICACAO} />
        {i.aderente_icp === true && <Pilula tom="menta">No ICP</Pilula>}
        {i.aderente_icp === false && <Pilula tom="neutro">Fora do ICP</Pilula>}
        {i.cliente_existente && <Pilula tom="alerta">Cliente existente</Pilula>}
      </div>
      <dl className="grid gap-x-4 gap-y-3 text-sm sm:grid-cols-2">
        <Item rotulo="Parceiro">
          {i.parceiro ? <Link to={`/app/parceiros/${i.parceiro.id}`} className="text-menta-400 hover:underline">{i.parceiro.nome_fantasia}</Link> : ""}
        </Item>
        <Item rotulo="Empresa do grupo">{i.empresa?.nome}</Item>
        <Item rotulo="Data">{data(i.data)}</Item>
        <Item rotulo="Responsável Wise">{i.responsavel?.nome ?? "Não definido"}</Item>
        <Item rotulo="Origem">{rotulo(ORIGENS_INDICACAO, i.origem)}{i.origem_detalhe ? ` · ${i.origem_detalhe}` : ""}</Item>
        <Item rotulo="CNPJ do cliente">{c?.cnpj ? formatarCnpj(c.cnpj) : "Não informado"}</Item>
        <Item rotulo="Data da reunião">{i.data_reuniao ? data(i.data_reuniao) : "Não informada"}</Item>
        <Item rotulo={rotuloValorBase(i.empresa)}>{i.valor_base != null ? moeda(i.valor_base) : "Não informado"}</Item>
        <Item rotulo="Data de fechamento">{i.data_fechamento ? data(i.data_fechamento) : "Não informada"}</Item>
        <Item rotulo="Compensação do primeiro pagamento">{i.data_compensacao ? data(i.data_compensacao) : "Não informada"}</Item>
        <Item rotulo="Última atualização">{dataHora(i.ultima_atualizacao)}</Item>
        {i.pedido_rfp_id && (
          <Item rotulo="Pedido de RFP">
            <Link to={`/app/rfp/${i.pedido_rfp_id}`} className="inline-flex items-center gap-1 text-menta-400 hover:underline">
              Abrir pedido <ExternalLink className="h-3.5 w-3.5" />
            </Link>
          </Item>
        )}
        {i.excecao_duplicidade && <Item rotulo="Exceção registrada" largo>{i.excecao_duplicidade}</Item>}
        {i.observacoes && <Item rotulo="Observações" largo><span className="whitespace-pre-wrap">{i.observacoes}</span></Item>}
      </dl>

      {temContato && (
        <div className="rounded-[8px] border border-white/10 p-3 text-sm">
          <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Contato do cliente</p>
          {c?.contato_nome && <p>{c.contato_nome}</p>}
          {c?.email && <p className="break-all text-muted-foreground">{c.email}</p>}
          {c?.telefone && <p className="text-muted-foreground">{c.telefone}</p>}
          {c?.consentimento_em && <p className="mt-1 text-xs text-muted-foreground">Consentimento declarado em {dataHora(c.consentimento_em)}</p>}
        </div>
      )}

      <div className="text-sm">
        <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Aderência ao ICP</p>
        {!avaliado ? (
          <p className="text-muted-foreground">Não avaliada.</p>
        ) : (
          <ul className="space-y-0.5">
            {criterios.map((k) => (
              <li key={k.chave} className={i.aderencia_icp[k.chave] ? "" : "text-muted-foreground line-through"}>{k.descricao}</li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}

function Item({ rotulo: r, children, largo }: { rotulo: string; children: ReactNode; largo?: boolean }) {
  return (
    <div className={largo ? "min-w-0 sm:col-span-2" : "min-w-0"}>
      <dt className="text-xs text-muted-foreground">{r}</dt>
      <dd className="break-words">{children}</dd>
    </div>
  );
}

type Andamento = {
  etapa: string; data_reuniao: string; valor_base: string; data_fechamento: string; data_compensacao: string;
  observacoes: string; cliente_existente: boolean; excecao_duplicidade: string;
  necessidade: string; prazo_meses: string; valor_total: string;
};

function doRegistro(i: Indicacao): Andamento {
  return {
    etapa: i.etapa,
    data_reuniao: i.data_reuniao ?? "",
    valor_base: i.valor_base != null ? String(i.valor_base) : "",
    data_fechamento: i.data_fechamento ?? "",
    data_compensacao: i.data_compensacao ?? "",
    observacoes: i.observacoes ?? "",
    cliente_existente: i.cliente_existente,
    excecao_duplicidade: i.excecao_duplicidade ?? "",
    necessidade: i.necessidade ?? "",
    prazo_meses: i.prazo_meses != null ? String(i.prazo_meses) : "",
    valor_total: i.valor_total != null ? String(i.valor_total) : "",
  };
}

function FormAndamento({ i }: { i: Indicacao }) {
  const { isAdmin } = useAuth();
  const qc = useQueryClient();
  const [f, setF] = useState<Andamento>(() => doRegistro(i));
  useEffect(() => setF(doRegistro(i)), [i]);
  const set = <K extends keyof Andamento>(k: K, v: Andamento[K]) => setF((x) => ({ ...x, [k]: v }));
  const mostraClienteExistente = i.empresa?.codigo === "triade" || i.empresa?.codigo === "swallow" || i.cliente_existente;

  const salvar = useMutation({
    mutationFn: async () => {
      const alteracoes: Record<string, any> = {
        etapa: f.etapa,
        data_reuniao: f.data_reuniao || null,
        valor_base: f.valor_base === "" ? null : Number(f.valor_base),
        data_fechamento: f.data_fechamento || null,
        data_compensacao: f.data_compensacao || null,
        observacoes: f.observacoes.trim() || null,
        cliente_existente: f.cliente_existente,
        necessidade: f.necessidade.trim() || null,
        prazo_meses: f.prazo_meses === "" ? null : Number(f.prazo_meses),
        valor_total: f.valor_total === "" ? null : Number(f.valor_total),
      };
      // Exceção para cliente existente: só administrador registra
      if (isAdmin) alteracoes.excecao_duplicidade = f.excecao_duplicidade.trim() || null;
      const { error } = await supabase.from("indicacoes").update(alteracoes).eq("id", i.id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Indicação atualizada.");
      qc.invalidateQueries({ queryKey: ["indicacoes"] });
      qc.invalidateQueries({ queryKey: ["comissoes"] });
      qc.invalidateQueries({ queryKey: ["comissoes-indicacao", i.id] });
    },
    onError: toastErro,
  });

  return (
    <form
      className="space-y-4 rounded-[14px] border border-white/10 bg-card p-4"
      onSubmit={(e) => {
        e.preventDefault();
        salvar.mutate();
      }}
    >
      <h3 className="text-sm font-semibold">Atualizar andamento</h3>
      <div className="grid gap-3 sm:grid-cols-2">
        <Campo rotulo="Etapa">
          <Select value={f.etapa} onValueChange={(v) => set("etapa", v)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {Object.entries(ETAPAS_INDICACAO).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
            </SelectContent>
          </Select>
        </Campo>
        <Campo rotulo="Data da reunião">
          <Input type="date" value={f.data_reuniao} onChange={(e) => set("data_reuniao", e.target.value)} />
        </Campo>
        <Campo rotulo={rotuloValorBase(i.empresa)}>
          <Input type="number" inputMode="decimal" step="0.01" min="0" value={f.valor_base} onChange={(e) => set("valor_base", e.target.value)} />
        </Campo>
        <Campo rotulo="Data de fechamento">
          <Input type="date" value={f.data_fechamento} onChange={(e) => set("data_fechamento", e.target.value)} />
        </Campo>
        <Campo rotulo="Compensação do primeiro pagamento">
          <Input type="date" value={f.data_compensacao} onChange={(e) => set("data_compensacao", e.target.value)} />
        </Campo>
        {i.empresa?.codigo === "wise" ? (
          <Campo rotulo="Prazo do contrato (meses)">
            <Input type="number" inputMode="numeric" min="1" step="1" value={f.prazo_meses} onChange={(e) => set("prazo_meses", e.target.value)} />
          </Campo>
        ) : (
          <Campo rotulo="Valor total da venda">
            <Input type="number" inputMode="decimal" step="0.01" min="0" value={f.valor_total} onChange={(e) => set("valor_total", e.target.value)} />
          </Campo>
        )}
      </div>
      <Campo rotulo="Necessidade do cliente">
        <Textarea rows={2} value={f.necessidade} onChange={(e) => set("necessidade", e.target.value)} />
      </Campo>
      <Campo rotulo="Observações">
        <Textarea rows={3} value={f.observacoes} onChange={(e) => set("observacoes", e.target.value)} />
      </Campo>
      {mostraClienteExistente && (
        <label className="flex items-start gap-2 text-sm">
          <Checkbox className="mt-0.5" checked={f.cliente_existente} onCheckedChange={(c) => set("cliente_existente", !!c)} />
          <span>Já é cliente desta empresa: sem comissão</span>
        </label>
      )}
      {isAdmin && f.cliente_existente && (
        <Campo rotulo="Exceção de administrador (justificativa para manter a comissão)">
          <Textarea rows={2} value={f.excecao_duplicidade} onChange={(e) => set("excecao_duplicidade", e.target.value)} />
        </Campo>
      )}
      <div className="flex justify-end">
        <Button type="submit" disabled={salvar.isPending}>
          {salvar.isPending ? <Loader2 className="animate-spin" /> : <Save />} Salvar
        </Button>
      </div>
    </form>
  );
}

function Campo({ rotulo: r, children }: { rotulo: string; children: ReactNode }) {
  return (
    <div className="min-w-0 space-y-1.5">
      <Label className="text-xs text-muted-foreground">{r}</Label>
      {children}
    </div>
  );
}

type ComissaoResumo = {
  id: string; beneficiario: string; percentual: number | null; base_descricao: string | null; base_valor: number | null;
  valor: number | null; estado: string; responsavel: { nome: string } | null;
};

// Só montado para quem vê comissão (admin e parcerias).
function ComissoesDaIndicacao({ indicacaoId }: { indicacaoId: string }) {
  const consulta = useQuery({
    queryKey: ["comissoes-indicacao", indicacaoId],
    queryFn: async () => {
      const { data: r, error } = await supabase
        .from("comissoes")
        .select("id, beneficiario, percentual, base_descricao, base_valor, valor, estado, responsavel:perfis!comissoes_responsavel_perfil_id_fkey(nome)")
        .eq("indicacao_id", indicacaoId)
        .order("beneficiario");
      if (error) throw error;
      return (r ?? []) as unknown as ComissaoResumo[];
    },
  });
  return (
    <section className="space-y-2">
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-sm font-semibold">Comissões</h3>
        <Link to="/app/comissoes?aba=todas" className="text-xs text-menta-400 hover:underline">Ver comissões</Link>
      </div>
      {consulta.isLoading && <Carregando />}
      {consulta.error && <ErroCarga erro={consulta.error} />}
      {consulta.data?.length === 0 && (
        <p className="text-sm text-muted-foreground">Sem comissão nesta indicação (cliente existente, instituição pública ou ainda não gerada).</p>
      )}
      <ul className="space-y-2">
        {consulta.data?.map((c) => (
          <li key={c.id} className="rounded-[8px] border border-white/10 p-3 text-sm">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="font-medium">
                {rotulo(BENEFICIARIOS, c.beneficiario)}
                {c.beneficiario === "responsavel" && c.responsavel?.nome ? `: ${c.responsavel.nome}` : ""}
              </span>
              <SeloEstado estado={c.estado} mapa={c.beneficiario === "grupo" ? ESTADOS_COMISSAO_RECEBER : ESTADOS_COMISSAO} />
            </div>
            <p className="mt-1 text-muted-foreground">
              {c.percentual != null ? `${Number(c.percentual).toLocaleString("pt-BR")}%` : "Percentual não definido"}
              {" de "}{c.base_descricao ?? "base"}{c.base_valor != null ? ` (${moeda(c.base_valor)})` : ""}
            </p>
            <p className="mt-1 text-base font-semibold">{c.valor != null ? moeda(c.valor) : "Valor a calcular"}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}
