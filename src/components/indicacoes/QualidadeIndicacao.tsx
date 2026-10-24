import { useEffect, useState, type ReactNode } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, Link2, Loader2, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Carregando, ErroCarga } from "@/components/comum/Estados";
import { Pilula } from "@/components/comum/Selos";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { ok, toastErro } from "@/lib/erros";
import { data, dataHora, hojeISO, moeda } from "@/lib/formato";
import { PRAZOS_SLA, rotulo } from "@/lib/rotulos";
import { cn } from "@/lib/utils";
import { prazosSla, useCriteriosIcp, type Indicacao } from "./dados";

function invalidar(qc: ReturnType<typeof useQueryClient>, id: string) {
  qc.invalidateQueries({ queryKey: ["indicacoes"] });
  qc.invalidateQueries({ queryKey: ["indicacoes", "detalhe", id] });
  qc.invalidateQueries({ queryKey: ["pendencias"] });
}

// Nota de qualidade, qualificação, proteção de 180 dias e prazos do SLA (Apêndice E)
export function QualidadeSla({ i }: { i: Indicacao }) {
  const prazos = prazosSla(i);
  const aberta = i.etapa !== "fechada" && i.etapa !== "perdida";
  return (
    <section className="space-y-3 rounded-[14px] border border-white/10 p-4 text-sm">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="font-semibold">Qualidade, SLA e proteção</h3>
        <div className="flex flex-wrap gap-1.5">
          {i.qualificada ? <Pilula tom="menta">Qualificada</Pilula> : <Pilula>Não qualificada</Pilula>}
          {i.link_id && <Pilula tom="info"><Link2 className="mr-1 h-3 w-3" /> Link do parceiro</Pilula>}
        </div>
      </div>
      <dl className="grid gap-x-4 gap-y-3 sm:grid-cols-2">
        <Item rotulo="Nota de qualidade">
          {i.nota_qualidade != null ? (
            <span className="flex items-center gap-2">
              <strong className="text-base">{i.nota_qualidade}</strong>
              <span className="h-1.5 w-24 rounded-full bg-white/10">
                <span className="block h-1.5 rounded-full bg-menta-400" style={{ width: `${Math.min(100, i.nota_qualidade)}%` }} />
              </span>
            </span>
          ) : "Sem nota"}
        </Item>
        <Item rotulo="ICP confirmado pela Wise">
          {i.icp_confirmado == null ? "Ainda não validado" : i.icp_confirmado ? `Sim, em ${dataHora(i.icp_confirmado_em)}` : `Não, em ${dataHora(i.icp_confirmado_em)}`}
        </Item>
        <Item rotulo="Proteção">
          {i.protecao_expirada ? <Pilula>Expirada</Pilula> : i.protecao_ate ? `Até ${data(i.protecao_ate)}` : "Não calculada"}
        </Item>
        {i.empresa?.codigo === "wise"
          ? <Item rotulo="Prazo do contrato">{i.prazo_meses ? `${i.prazo_meses} meses` : "Não informado (vale o padrão)"}</Item>
          : <Item rotulo="Valor total da venda">{i.valor_total != null ? moeda(i.valor_total) : "Não informado"}</Item>}
        <Item rotulo="Necessidade" largo>{i.necessidade ? <span className="whitespace-pre-wrap">{i.necessidade}</span> : "Não descrita"}</Item>
      </dl>
      <div>
        <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Prazos do SLA</p>
        <ul className="space-y-1">
          {prazos.map((x) => (
            <li key={x.chave} className={cn("flex flex-wrap items-center justify-between gap-2 rounded-[8px] px-2 py-1.5",
              x.vencido ? "bg-destructive/15 text-red-200" : "bg-white/5")}>
              <span>{rotulo(PRAZOS_SLA, x.chave)}</span>
              <span className="text-xs">
                {x.cumprido ? <span className="text-menta-300">Feito em {dataHora(x.cumprido)}</span>
                  : !aberta ? "Encerrada"
                  : x.ate ? `${x.vencido ? "Venceu" : "Até"} ${data(x.ate)}` : "Sem prazo"}
              </span>
            </li>
          ))}
        </ul>
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

// Validação da Wise: ICP por critério, confirmação, necessidade, primeiro contato e retorno ao parceiro
export function FormValidacao({ i }: { i: Indicacao }) {
  const qc = useQueryClient();
  const { data: criterios = [] } = useCriteriosIcp();
  const inicial = () => ({
    aderencia: { ...(i.aderencia_icp ?? {}) } as Record<string, boolean>,
    icp: i.icp_confirmado == null ? "" : i.icp_confirmado ? "sim" : "nao",
    necessidade: i.necessidade ?? "",
    primeiro: false,
    retorno: false,
  });
  const [f, setF] = useState(inicial);
  const [aberto, setAberto] = useState(false);
  useEffect(() => setF(inicial()), [i]); // eslint-disable-line react-hooks/exhaustive-deps

  const todos = criterios.length > 0 && criterios.every((c) => f.aderencia[c.chave]);
  const validar = useMutation({
    mutationFn: async () => {
      const p: Record<string, any> = {
        aderencia_icp: Object.fromEntries(criterios.map((c) => [c.chave, !!f.aderencia[c.chave]])),
      };
      if (f.icp) p.icp_confirmado = f.icp === "sim";
      if (f.necessidade.trim()) p.necessidade = f.necessidade.trim();
      if (f.primeiro) p.primeiro_contato = true;
      if (f.retorno) p.retorno_parceiro = true;
      const { error } = await supabase.rpc("validar_indicacao", { p_id: i.id, p });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Validação registrada.");
      setAberto(false);
      invalidar(qc, i.id);
    },
    onError: toastErro,
  });

  if (!aberto) {
    const pendente = i.icp_confirmado == null || !i.primeiro_contato_em || !i.retorno_parceiro_em;
    return (
      <div className="flex flex-wrap items-center justify-between gap-2 rounded-[14px] border border-white/10 p-3 text-sm">
        <span className="text-muted-foreground">
          {pendente ? "Validação da Wise: confirme o ICP, o primeiro contato e o retorno ao parceiro." : "Validação completa."}
        </span>
        <Button size="sm" variant={pendente ? "default" : "outline"} onClick={() => setAberto(true)}><ShieldCheck /> Validar</Button>
      </div>
    );
  }

  return (
    <form className="space-y-4 rounded-[14px] border border-menta-500/30 bg-card p-4"
      onSubmit={(e) => { e.preventDefault(); validar.mutate(); }}>
      <h3 className="text-sm font-semibold">Validar indicação</h3>
      <fieldset>
        <legend className="mb-2 text-xs text-muted-foreground">Critérios do ICP atendidos</legend>
        <div className="space-y-2">
          {criterios.map((c) => (
            <label key={c.chave} className="flex items-start gap-2 text-sm">
              <Checkbox className="mt-0.5" checked={!!f.aderencia[c.chave]}
                onCheckedChange={(v) => setF((x) => ({ ...x, aderencia: { ...x.aderencia, [c.chave]: !!v } }))} />
              <span>{c.descricao}</span>
            </label>
          ))}
        </div>
      </fieldset>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="min-w-0 space-y-1.5">
          <Label className="text-xs text-muted-foreground">ICP confirmado pela Wise</Label>
          <Select value={f.icp} onValueChange={(v) => setF((x) => ({ ...x, icp: v }))}>
            <SelectTrigger><SelectValue placeholder="Não decidido" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="sim">Sim, está no ICP</SelectItem>
              <SelectItem value="nao">Não está no ICP</SelectItem>
            </SelectContent>
          </Select>
          {f.icp === "sim" && !todos && <p className="text-xs text-warning">Para ser qualificada, todos os critérios precisam estar marcados.</p>}
        </div>
      </div>
      <div className="min-w-0 space-y-1.5">
        <Label className="text-xs text-muted-foreground">Necessidade do cliente</Label>
        <Textarea rows={2} value={f.necessidade} onChange={(e) => setF((x) => ({ ...x, necessidade: e.target.value }))} />
      </div>
      <div className="space-y-2 text-sm">
        {i.primeiro_contato_em ? (
          <p className="flex items-center gap-2 text-menta-300"><CheckCircle2 className="h-4 w-4" /> Primeiro contato em {dataHora(i.primeiro_contato_em)}</p>
        ) : (
          <label className="flex items-center gap-2">
            <Checkbox checked={f.primeiro} onCheckedChange={(v) => setF((x) => ({ ...x, primeiro: !!v }))} /> Primeiro contato com o cliente feito
          </label>
        )}
        {i.retorno_parceiro_em ? (
          <p className="flex items-center gap-2 text-menta-300"><CheckCircle2 className="h-4 w-4" /> Retorno ao parceiro em {dataHora(i.retorno_parceiro_em)}</p>
        ) : (
          <label className="flex items-center gap-2">
            <Checkbox checked={f.retorno} onCheckedChange={(v) => setF((x) => ({ ...x, retorno: !!v }))} /> Retorno dado ao parceiro
          </label>
        )}
      </div>
      <div className="flex justify-end gap-2">
        <Button type="button" variant="ghost" onClick={() => setAberto(false)}>Cancelar</Button>
        <Button type="submit" disabled={validar.isPending}>{validar.isPending && <Loader2 className="animate-spin" />} Salvar validação</Button>
      </div>
    </form>
  );
}

type Checagem = {
  id: string; marco: string; prevista_para: string; cliente_ativo: boolean | null; satisfacao: number | null;
  observacao: string | null; registrada_em: string | null;
};

// Checagens do cliente aos 6 e 12 meses do fechamento
export function Checagens({ i, podeRegistrar }: { i: Indicacao; podeRegistrar: boolean }) {
  const q = useQuery({
    queryKey: ["indicacoes", "checagens", i.id],
    queryFn: async () => ok(await supabase.from("checagens_cliente").select("*").eq("indicacao_id", i.id).order("prevista_para")) as Checagem[],
  });
  return (
    <section className="space-y-2">
      <h3 className="text-sm font-semibold">Checagens do cliente</h3>
      {q.isLoading ? <Carregando /> : q.error ? <ErroCarga erro={q.error} /> : !q.data?.length ? (
        <p className="text-sm text-muted-foreground">As checagens de 6 e 12 meses são criadas com a data de fechamento.</p>
      ) : (
        <ul className="space-y-2">
          {q.data.map((c) => <LinhaChecagem key={c.id} c={c} indicacaoId={i.id} podeRegistrar={podeRegistrar} />)}
        </ul>
      )}
    </section>
  );
}

function LinhaChecagem({ c, indicacaoId, podeRegistrar }: { c: Checagem; indicacaoId: string; podeRegistrar: boolean }) {
  const qc = useQueryClient();
  const [aberto, setAberto] = useState(false);
  const [ativo, setAtivo] = useState("");
  const [nota, setNota] = useState("");
  const [obs, setObs] = useState("");
  const vencida = !c.registrada_em && c.prevista_para <= hojeISO();
  const registrar = useMutation({
    mutationFn: async () => {
      const n = Number(nota);
      if (!ativo) throw new Error("Informe se o cliente segue ativo.");
      if (nota === "" || !Number.isInteger(n) || n < 0 || n > 10) throw new Error("A satisfação vai de 0 a 10.");
      const { error } = await supabase.rpc("registrar_checagem", { p_id: c.id, p_ativo: ativo === "sim", p_satisfacao: n, p_observacao: obs.trim() || null });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Checagem registrada.");
      setAberto(false);
      qc.invalidateQueries({ queryKey: ["indicacoes", "checagens", indicacaoId] });
      invalidar(qc, indicacaoId);
    },
    onError: toastErro,
  });

  return (
    <li className={cn("rounded-[8px] border p-3 text-sm", vencida ? "border-warning/50" : "border-white/10")}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="font-medium">{c.marco === "6m" ? "6 meses" : "12 meses"} · prevista para {data(c.prevista_para)}</span>
        {c.registrada_em ? (
          <Pilula tom={c.cliente_ativo ? "menta" : "perigo"}>{c.cliente_ativo ? "Cliente ativo" : "Cliente inativo"} · satisfação {c.satisfacao}</Pilula>
        ) : vencida ? <Pilula tom="alerta">Pendente</Pilula> : <Pilula>Prevista</Pilula>}
      </div>
      {c.registrada_em && <p className="mt-1 text-xs text-muted-foreground">Registrada em {dataHora(c.registrada_em)}</p>}
      {c.observacao && <p className="mt-1 whitespace-pre-wrap break-words text-muted-foreground">{c.observacao}</p>}
      {podeRegistrar && !c.registrada_em && (aberto ? (
        <div className="mt-3 space-y-2">
          <div className="grid gap-2 sm:grid-cols-2">
            <Select value={ativo} onValueChange={setAtivo}>
              <SelectTrigger aria-label="Cliente ativo"><SelectValue placeholder="Cliente segue ativo?" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="sim">Sim, segue ativo</SelectItem>
                <SelectItem value="nao">Não está mais ativo</SelectItem>
              </SelectContent>
            </Select>
            <Input type="number" min={0} max={10} step={1} inputMode="numeric" placeholder="Satisfação de 0 a 10"
              value={nota} onChange={(e) => setNota(e.target.value)} />
          </div>
          <Textarea rows={2} placeholder="Observação (opcional)" value={obs} onChange={(e) => setObs(e.target.value)} />
          <div className="flex justify-end gap-2">
            <Button size="sm" variant="ghost" onClick={() => setAberto(false)}>Cancelar</Button>
            <Button size="sm" onClick={() => registrar.mutate()} disabled={registrar.isPending}>
              {registrar.isPending && <Loader2 className="animate-spin" />} Registrar
            </Button>
          </div>
        </div>
      ) : (
        <Button size="sm" variant="outline" className="mt-2" onClick={() => setAberto(true)}>Registrar checagem</Button>
      ))}
    </li>
  );
}
