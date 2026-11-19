import { useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, Loader2, MessageCircle } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Cabecalho } from "@/components/comum/Cabecalho";
import { Carregando, ErroCarga, Vazio } from "@/components/comum/Estados";
import { Pilula } from "@/components/comum/Selos";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FAIXAS_FATURAMENTO } from "@/lib/diagnostico";
import { toastErro } from "@/lib/erros";
import { dataHora, haQuanto, somenteDigitos } from "@/lib/formato";
import { cn } from "@/lib/utils";

// P-95 Conduzir o diagnóstico do cliente do parceiro: cadastro pela página, reunião de cerca de 2 horas (no ICP),
// plano de ação em até 2 dias úteis. Abaixo do ICP, o cliente faz o autodiagnóstico online e entra no Wise Hub.
type Cadastro = {
  id: string; created_at: string; parceiro_id: string; nome: string; email: string; whatsapp: string; empresa: string; cargo: string;
  faturamento_faixa: string; vendedores: number; segmento: string; desafio: string; autoriza_parceiro: boolean; icp: boolean;
  caminho: "agenda" | "autodiagnostico"; status: string; diagnostico_em: string | null; consultor_id: string | null;
  reuniao_em: string | null; plano_enviado_em: string | null; observacao: string | null; parceiros: { nome_fantasia: string } | null;
};

const ETAPAS = [
  { id: "cadastrado", rotulo: "Cadastrado" },
  { id: "agenda_liberada", rotulo: "Agenda enviada" },
  { id: "reuniao_agendada", rotulo: "Reunião marcada" },
  { id: "reuniao_feita", rotulo: "Reunião feita" },
  { id: "diagnostico_feito", rotulo: "Plano enviado" },
  { id: "descartado", rotulo: "Descartado" },
];
const ROTULO_ETAPA = Object.fromEntries(ETAPAS.map((e) => [e.id, e.rotulo]));
const COLUNAS = "id, created_at, parceiro_id, nome, email, whatsapp, empresa, cargo, faturamento_faixa, vendedores, segmento, desafio, autoriza_parceiro, icp, caminho, status, diagnostico_em, consultor_id, reuniao_em, plano_enviado_em, observacao, parceiros(nome_fantasia)";

export default function Diagnosticos() {
  const { isParcerias, perfil } = useAuth();
  const pode = isParcerias || perfil?.papel === "consultor";
  const [params, setParams] = useSearchParams();
  const [caminho, setCaminho] = useState<"agenda" | "autodiagnostico">("agenda");
  const [etapa, setEtapa] = useState<string>("abertos");

  const lista = useQuery({
    queryKey: ["diagnosticos"],
    enabled: pode,
    queryFn: async () => {
      const { data, error } = await supabase.from("cadastros_cliente" as any).select(COLUNAS).order("created_at", { ascending: false }).limit(500);
      if (error) throw error;
      return (data ?? []) as unknown as Cadastro[];
    },
  });
  const pessoas = useQuery({
    queryKey: ["perfis", "conduzem-diagnostico"],
    enabled: pode,
    staleTime: 10 * 60_000,
    queryFn: async () => {
      const { data, error } = await supabase.from("perfis").select("id, nome").in("papel", ["admin", "parcerias", "consultor"]).eq("ativo", true).order("nome");
      if (error) throw error;
      return (data ?? []) as { id: string; nome: string }[];
    },
  });

  const doCaminho = useMemo(() => (lista.data ?? []).filter((c) => (caminho === "agenda" ? c.icp : !c.icp)), [lista.data, caminho]);
  const aberto = (c: Cadastro) => !["diagnostico_feito", "descartado"].includes(c.status);
  const visiveis = doCaminho.filter((c) => (etapa === "abertos" ? aberto(c) : etapa === "todos" ? true : c.status === etapa));
  const destaque = params.get("id");

  if (!pode) return (<div><Cabecalho titulo="Diagnósticos" /><Vazio titulo="Sem permissão">Os diagnósticos são do time de parcerias, dos consultores e dos administradores.</Vazio></div>);

  return (
    <div>
      <Cabecalho titulo="Diagnósticos"
        descricao="Quais clientes dos parceiros esperam a reunião de diagnóstico ou o plano de ação? A reunião dura cerca de 2 horas e o plano sai em até 2 dias úteis." />

      <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div role="radiogroup" aria-label="Caminho" className="flex w-fit gap-1 rounded-[10px] border border-white/10 bg-card p-1">
          {([["agenda", "Reunião"], ["autodiagnostico", "Autodiagnóstico"]] as const).map(([v, r]) => (
            <button key={v} type="button" role="radio" aria-checked={caminho === v} onClick={() => { setCaminho(v); setEtapa("abertos"); }}
              className={cn("min-h-9 rounded-[8px] px-3 text-sm font-medium text-neutro-300 hover:text-white", caminho === v && "bg-white/10 text-white")}>
              {r} <span className="tabular-nums text-xs text-neutro-300">{lista.isSuccess ? (lista.data ?? []).filter((c) => (v === "agenda" ? c.icp : !c.icp)).length : ""}</span>
            </button>
          ))}
        </div>
        {caminho === "agenda" && (
          <div className="flex gap-1 overflow-x-auto [scrollbar-width:none]" role="tablist" aria-label="Etapa">
            {[{ id: "abertos", rotulo: "Em aberto" }, ...ETAPAS, { id: "todos", rotulo: "Todos" }].map((e) => {
              const n = e.id === "abertos" ? doCaminho.filter(aberto).length : e.id === "todos" ? doCaminho.length : doCaminho.filter((c) => c.status === e.id).length;
              return (
                <button key={e.id} type="button" role="tab" aria-selected={etapa === e.id} onClick={() => setEtapa(e.id)}
                  className={cn("flex min-h-9 shrink-0 items-center gap-1.5 rounded-full border border-white/10 px-3 text-sm text-neutro-300 hover:text-white",
                    etapa === e.id && "border-menta-500/50 bg-menta-500/10 text-white")}>
                  {e.rotulo} <span className="tabular-nums text-xs">{n}</span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {lista.isLoading && <Carregando />}
      {lista.error && <ErroCarga erro={lista.error} />}
      {lista.isSuccess && visiveis.length === 0 && (
        <Vazio titulo={caminho === "agenda" ? "Nenhum diagnóstico nesta etapa" : "Nenhum autodiagnóstico ainda"}>
          {caminho === "agenda" ? "Quando um cliente no perfil se cadastrar pelo link de um parceiro, ele aparece aqui." : "Clientes fora do perfil da reunião fazem o autodiagnóstico online e aparecem aqui."}
        </Vazio>
      )}
      <ul className="space-y-3">
        {(caminho === "agenda" ? visiveis : doCaminho).map((c) => (
          <Cartao key={c.id} c={c} pessoas={pessoas.data ?? []} destaque={destaque === c.id} aoFechar={() => destaque === c.id && setParams({}, { replace: true })} />
        ))}
      </ul>
    </div>
  );
}

function Cartao({ c, pessoas, destaque }: { c: Cadastro; pessoas: { id: string; nome: string }[]; destaque: boolean; aoFechar: () => void }) {
  const qc = useQueryClient();
  const [reuniao, setReuniao] = useState(c.reuniao_em ? c.reuniao_em.slice(0, 16) : "");
  const salvar = useMutation({
    mutationFn: async (mudanca: Partial<Cadastro>) => {
      const { error } = await supabase.from("cadastros_cliente" as any).update({ ...mudanca, atualizado_em: new Date().toISOString() }).eq("id", c.id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["diagnosticos"] }); qc.invalidateQueries({ queryKey: ["tarefas"] }); },
    onError: toastErro,
  });
  const faixa = FAIXAS_FATURAMENTO.find((f) => f.valor === c.faturamento_faixa)?.rotulo ?? c.faturamento_faixa;
  const fone = somenteDigitos(c.whatsapp);
  const id = `diag-${c.id}`;

  return (
    <li id={id} className={cn("rounded-[14px] border border-white/10 bg-card p-4 sm:p-5", destaque && "border-menta-500/60")}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <p className="font-semibold">{c.empresa}</p>
          <p className="text-sm text-neutro-300">
            {c.nome}, {c.cargo} · pelo link de <Link to={`/app/parceiros/${c.parceiro_id}`} className="text-foreground hover:text-menta-400">{c.parceiros?.nome_fantasia ?? "parceiro"}</Link>
          </p>
          <p className="mt-1 text-sm text-neutro-300">{c.vendedores} vendedores · {faixa} · {c.segmento}</p>
          {c.desafio && <p className="mt-2 max-w-[70ch] text-sm"><span className="text-neutro-300">Desafio: </span>{c.desafio}</p>}
        </div>
        <div className="flex shrink-0 flex-col items-start gap-2 sm:items-end">
          {c.icp ? <Pilula tom={c.status === "diagnostico_feito" ? "menta" : c.status === "descartado" ? "neutro" : "alerta"}>{ROTULO_ETAPA[c.status] ?? c.status}</Pilula>
            : <Pilula tom={c.diagnostico_em ? "menta" : "neutro"}>{c.diagnostico_em ? "Autodiagnóstico feito" : "Sem autodiagnóstico"}</Pilula>}
          <span className="text-xs text-neutro-300">Cadastro {haQuanto(c.created_at)}</span>
        </div>
      </div>

      {c.icp && (
        <div className="mt-4 grid gap-3 border-t border-white/10 pt-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-1.5">
            <Label htmlFor={`${id}-etapa`}>Etapa</Label>
            <Select value={c.status} onValueChange={(v) => salvar.mutate({ status: v })}>
              <SelectTrigger id={`${id}-etapa`}><SelectValue /></SelectTrigger>
              <SelectContent>{ETAPAS.map((e) => <SelectItem key={e.id} value={e.id}>{e.rotulo}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor={`${id}-quem`}>Quem conduz</Label>
            <Select value={c.consultor_id ?? ""} onValueChange={(v) => salvar.mutate({ consultor_id: v })}>
              <SelectTrigger id={`${id}-quem`}><SelectValue placeholder="Escolher" /></SelectTrigger>
              <SelectContent>{pessoas.map((p) => <SelectItem key={p.id} value={p.id}>{p.nome}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor={`${id}-quando`}>Reunião</Label>
            <Input id={`${id}-quando`} type="datetime-local" value={reuniao} onChange={(e) => setReuniao(e.target.value)}
              onBlur={() => reuniao !== (c.reuniao_em?.slice(0, 16) ?? "") && salvar.mutate({ reuniao_em: reuniao ? new Date(reuniao).toISOString() : null, ...(reuniao && c.status === "cadastrado" ? { status: "reuniao_agendada" } : {}) })} />
          </div>
          <div className="flex items-end gap-2">
            {c.plano_enviado_em ? (
              <p className="text-sm text-neutro-300"><Check className="mr-1 inline h-4 w-4 text-menta-400" aria-hidden />Plano enviado em {dataHora(c.plano_enviado_em)}</p>
            ) : (
              <Button className="w-full" disabled={salvar.isPending || !["reuniao_feita", "reuniao_agendada"].includes(c.status)}
                onClick={() => salvar.mutate({ plano_enviado_em: new Date().toISOString(), status: "diagnostico_feito" }, { onSuccess: () => toast.success("Plano de ação registrado como enviado.") })}>
                {salvar.isPending ? <Loader2 className="animate-spin" /> : <Check />} Plano enviado
              </Button>
            )}
          </div>
        </div>
      )}

      <div className="mt-3 flex flex-wrap gap-2 text-sm">
        {fone && (
          <Button asChild size="sm" variant="outline">
            <a href={`https://wa.me/${fone.length <= 11 ? "55" + fone : fone}`} target="_blank" rel="noreferrer"><MessageCircle /> WhatsApp</a>
          </Button>
        )}
        <Button asChild size="sm" variant="ghost"><a href={`mailto:${c.email}`}>{c.email}</a></Button>
        {c.autoriza_parceiro && <span className="self-center text-xs text-neutro-300">Autorizou compartilhar o resultado com o parceiro</span>}
      </div>
    </li>
  );
}
