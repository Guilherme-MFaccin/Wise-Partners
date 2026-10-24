import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Ban, CalendarCheck, Check, Circle, Link2, Loader2, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Carregando, ErroCarga, Vazio } from "@/components/comum/Estados";
import { Pilula } from "@/components/comum/Selos";
import { useEmpresasGrupo } from "@/components/indicacoes/dados";
import { ok, toastErro } from "@/lib/erros";
import { data, dataHora, hojeISO } from "@/lib/formato";
import { MARCOS_ONBOARDING, SITUACOES_ONBOARDING, rotulo } from "@/lib/rotulos";
import { cn } from "@/lib/utils";
import { Campo, Info, Numero, Secao } from "../ui";
import { invalidarParceiro, isAssinado, useEtapas, type Parceiro } from "../dados";
import { vencida } from "./v2";
import { BotaoCopiar } from "./BotaoCopiar";

type Plano = {
  parceiro_id: string; inicio: string; prazo_final: string; estendido_ate: string | null; situacao: string; ativado_em: string | null;
  indicacao_ativacao_id: string | null; primeira_indicacao_em: string | null; dias_ate_primeira_indicacao: number | null; dias_ate_ativacao: number | null;
};
type Marco = { id: string; tipo: string; prazo: string; cumprido_em: string | null; ponto_contato_id: string | null };
type LinkIndicacao = { id: string; token: string; empresas: string[]; ativo: boolean; criado_em: string; revogado_em: string | null; envios: number };

const ORDEM_MARCOS = Object.keys(MARCOS_ONBOARDING);
const TOM_SITUACAO: Record<string, "menta" | "alerta" | "perigo"> = { em_andamento: "alerta", ativado: "menta", nao_ativado: "perigo" };

// Onboarding em 90 dias (História 5, Apêndice F) e link exclusivo de indicação (História 6).
export function AbaOnboarding({ parceiro: p }: { parceiro: Parceiro }) {
  const { isParcerias } = useAuth();
  const [encontro, setEncontro] = useState<Marco | null>(null);
  const q = useQuery({
    queryKey: ["parceiro", p.id, "onboarding"],
    queryFn: async () => {
      const [pl, m] = await Promise.all([
        supabase.from("planos_onboarding").select("*").eq("parceiro_id", p.id).maybeSingle(),
        supabase.from("marcos_onboarding").select("*").eq("parceiro_id", p.id).order("prazo"),
      ]);
      const marcos = (ok(m) as Marco[]).sort((a, b) => a.prazo.localeCompare(b.prazo) || ORDEM_MARCOS.indexOf(a.tipo) - ORDEM_MARCOS.indexOf(b.tipo));
      return { plano: ok(pl) as Plano | null, marcos };
    },
  });

  return (
    <div className="space-y-4">
      {q.isLoading ? <Carregando /> : q.error ? <ErroCarga erro={q.error} /> : !q.data?.plano ? (
        <Vazio titulo="Sem plano de onboarding.">O plano de 90 dias é criado quando o parceiro comercial entra em onboarding.</Vazio>
      ) : (
        <>
          <Resumo plano={q.data.plano} />
          <Secao titulo="Encontros e marcos" descricao="Quatro encontros e os marcos de 30, 60 e 90 dias.">
            <ol className="relative space-y-3 border-l border-white/10 pl-5">
              {q.data.marcos.map((m) => {
                const feito = !!m.cumprido_em;
                const atrasado = !feito && vencida(m.prazo);
                const ehEncontro = m.tipo.startsWith("encontro_");
                return (
                  <li key={m.id} className="relative">
                    <span className={cn("absolute -left-[27px] top-0.5 flex h-4 w-4 items-center justify-center rounded-full border bg-background",
                      feito ? "border-menta-500 text-menta-400" : atrasado ? "border-destructive text-red-300" : "border-white/30 text-neutro-300")}>
                      {feito ? <Check className="h-3 w-3" /> : <Circle className="h-2 w-2" />}
                    </span>
                    <div className="flex flex-wrap items-start justify-between gap-2 text-sm">
                      <div className="min-w-0">
                        <p className={cn("font-medium", !ehEncontro && "text-neutro-300")}>{rotulo(MARCOS_ONBOARDING, m.tipo)}</p>
                        <p className={cn("text-xs", atrasado ? "text-red-300" : "text-muted-foreground")}>
                          {feito ? `Cumprido em ${data(m.cumprido_em)}` : `Prazo ${data(m.prazo)}${atrasado ? " (atrasado)" : ""}`}
                        </p>
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        {feito ? <Pilula tom="menta">Cumprido</Pilula> : atrasado ? <Pilula tom="perigo">Atrasado</Pilula> : <Pilula>Previsto</Pilula>}
                        {isParcerias && ehEncontro && !feito && (
                          <Button size="sm" variant="outline" onClick={() => setEncontro(m)}><CalendarCheck /> Registrar encontro</Button>
                        )}
                      </div>
                    </div>
                  </li>
                );
              })}
            </ol>
          </Secao>
        </>
      )}

      <LinkExclusivo parceiro={p} />

      {encontro && <RegistrarEncontro parceiroId={p.id} marco={encontro} onFechar={() => setEncontro(null)} />}
    </div>
  );
}

function Resumo({ plano: pl }: { plano: Plano }) {
  return (
    <Secao titulo="Plano de 90 dias" acoes={<Pilula tom={TOM_SITUACAO[pl.situacao] ?? "neutro"}>{rotulo(SITUACOES_ONBOARDING, pl.situacao)}</Pilula>}>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Numero rotulo="Início" valor={data(pl.inicio)} detalhe={`Prazo final ${data(pl.prazo_final)}`} />
        <Numero rotulo="Extensão" valor={pl.estendido_ate ? data(pl.estendido_ate) : "Não"} detalhe={pl.estendido_ate ? "Sem ativação em 90 dias" : undefined} />
        <Numero rotulo="Primeira indicação" valor={pl.primeira_indicacao_em ? data(pl.primeira_indicacao_em) : "Ainda não"}
          detalhe={pl.dias_ate_primeira_indicacao !== null ? `${pl.dias_ate_primeira_indicacao} dias desde o início` : undefined} />
        <Numero rotulo="Ativação" valor={pl.ativado_em ? data(pl.ativado_em) : "Ainda não"}
          detalhe={pl.dias_ate_ativacao !== null ? `${pl.dias_ate_ativacao} dias até ativar` : "Primeira indicação no ICP confirmada que virou reunião"} />
      </div>
      {pl.indicacao_ativacao_id && (
        <p className="mt-3 text-sm">
          <Link to={`/app/indicacoes?id=${pl.indicacao_ativacao_id}`} className="text-menta-400 hover:underline">Abrir a indicação que ativou o parceiro</Link>
        </p>
      )}
    </Secao>
  );
}

function RegistrarEncontro({ parceiroId, marco, onFechar }: { parceiroId: string; marco: Marco; onFechar: () => void }) {
  const qc = useQueryClient();
  const [dia, setDia] = useState(hojeISO());
  const [texto, setTexto] = useState("");
  const [salvando, setSalvando] = useState(false);

  async function salvar() {
    if (!dia) return toast.error("Informe a data do encontro.");
    setSalvando(true);
    const { error } = await supabase.rpc("registrar_encontro_onboarding", { p_marco: marco.id, p_data: dia, p_texto: texto.trim() || null });
    setSalvando(false);
    if (error) return toastErro(error);
    toast.success("Encontro registrado na linha do tempo.");
    qc.invalidateQueries({ queryKey: ["parceiro", parceiroId, "onboarding"] });
    invalidarParceiro(qc, parceiroId);
    onFechar();
  }

  return (
    <Dialog open onOpenChange={(v) => !v && onFechar()}>
      <DialogContent className="max-h-[100dvh] max-w-md overflow-y-auto sm:max-h-[90vh] sm:rounded-[14px]">
        <DialogHeader>
          <DialogTitle>{rotulo(MARCOS_ONBOARDING, marco.tipo)}</DialogTitle>
          <DialogDescription>Cria o ponto de contato e a atividade com o esforço do catálogo.</DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <Campo rotulo="Data do encontro" obrigatorio>
            <Input type="date" value={dia} max={hojeISO()} onChange={(e) => setDia(e.target.value)} />
          </Campo>
          <Campo rotulo="Resumo">
            <Textarea rows={4} value={texto} onChange={(e) => setTexto(e.target.value)} placeholder="O que foi combinado" />
          </Campo>
        </div>
        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onFechar}>Cancelar</Button>
          <Button onClick={salvar} disabled={salvando}>{salvando && <Loader2 className="animate-spin" />} Registrar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Link exclusivo de indicação: um ativo por parceiro comercial assinado
function LinkExclusivo({ parceiro: p }: { parceiro: Parceiro }) {
  const { isParcerias } = useAuth();
  const qc = useQueryClient();
  const { data: etapas } = useEtapas();
  const { data: empresas = [] } = useEmpresasGrupo();
  const [escolhidas, setEscolhidas] = useState<string[]>(["wise"]);
  const [confirmar, setConfirmar] = useState<"regenerar" | "revogar" | null>(null);
  const [salvando, setSalvando] = useState(false);
  const q = useQuery({
    queryKey: ["parceiro", p.id, "link-indicacao"],
    queryFn: async () => ok(await supabase.from("links_indicacao").select("*").eq("parceiro_id", p.id).order("criado_em", { ascending: false })) as LinkIndicacao[],
  });
  const ativo = q.data?.find((l) => l.ativo) ?? null;
  const anteriores = (q.data ?? []).filter((l) => !l.ativo);
  useEffect(() => { if (ativo) setEscolhidas(ativo.empresas); }, [ativo?.id]); // eslint-disable-line react-hooks/exhaustive-deps
  const url = ativo ? `${window.location.origin}/i/${ativo.token}` : "";
  const assinado = isAssinado(p, etapas);

  async function executar() {
    setSalvando(true);
    const r = confirmar === "revogar"
      ? await supabase.rpc("revogar_link_indicacao", { p_parceiro: p.id })
      : await supabase.rpc("regenerar_link_indicacao", { p_parceiro: p.id, p_empresas: escolhidas.length ? escolhidas : ["wise"] });
    setSalvando(false);
    if (r.error) return toastErro(r.error);
    toast.success(confirmar === "revogar" ? "Link revogado." : "Novo link gerado. O anterior deixou de funcionar.");
    setConfirmar(null);
    qc.invalidateQueries({ queryKey: ["parceiro", p.id, "link-indicacao"] });
  }

  const nomeEmpresa = (c: string) => empresas.find((e) => e.codigo === c)?.nome ?? c;
  const mudouEmpresas = !!ativo && [...escolhidas].sort().join(",") !== [...ativo.empresas].sort().join(",");

  return (
    <Secao titulo="Link exclusivo de indicação" descricao="Página pública para os clientes do parceiro indicarem direto, com consentimento do próprio contato.">
      {q.isLoading ? <Carregando /> : q.error ? <ErroCarga erro={q.error} /> : (
        <div className="space-y-4">
          {ativo ? (
            <>
              <div className="flex flex-col gap-2 sm:flex-row">
                <Input readOnly value={url} className="font-mono text-xs" onFocus={(e) => e.currentTarget.select()} />
                <BotaoCopiar texto={url} rotulo="Copiar link" />
              </div>
              <div className="grid gap-3 text-sm sm:grid-cols-3">
                <Info rotulo="Criado em">{dataHora(ativo.criado_em)}</Info>
                <Info rotulo="Indicações recebidas">{String(ativo.envios)}</Info>
                <Info rotulo="Empresas atendidas">{ativo.empresas.map(nomeEmpresa).join(", ")}</Info>
              </div>
            </>
          ) : (
            <p className="flex items-center gap-2 text-sm text-muted-foreground">
              <Link2 className="h-4 w-4" /> {assinado ? "Nenhum link ativo." : "O link é exclusivo de parceiros com contrato assinado."}
            </p>
          )}

          {isParcerias && assinado && (
            <div className="space-y-3 border-t border-white/10 pt-4">
              <p className="text-xs font-semibold text-neutro-300">Empresas do grupo atendidas pelo link</p>
              <div className="flex flex-wrap gap-4">
                {empresas.map((e) => (
                  <label key={e.codigo} className="flex items-center gap-2 text-sm">
                    <Checkbox checked={escolhidas.includes(e.codigo)} disabled={e.codigo === "wise"}
                      onCheckedChange={(v) => setEscolhidas((x) => (v ? [...x, e.codigo] : x.filter((c) => c !== e.codigo)))} />
                    {e.nome}
                  </label>
                ))}
              </div>
              <div className="flex flex-wrap gap-2">
                <Button variant={ativo ? "outline" : "default"} onClick={() => setConfirmar("regenerar")}>
                  <RefreshCw /> {ativo ? (mudouEmpresas ? "Gerar novo link com estas empresas" : "Gerar novo link") : "Gerar link"}
                </Button>
                {ativo && <Button variant="outline" onClick={() => setConfirmar("revogar")}><Ban /> Revogar</Button>}
              </div>
            </div>
          )}

          {anteriores.length > 0 && (
            <p className="text-xs text-muted-foreground">
              {anteriores.length} {anteriores.length === 1 ? "link anterior revogado" : "links anteriores revogados"}
              {anteriores[0].revogado_em ? `, o último em ${dataHora(anteriores[0].revogado_em)}` : ""}.
            </p>
          )}
        </div>
      )}

      <AlertDialog open={!!confirmar} onOpenChange={(v) => !v && setConfirmar(null)}>
        <AlertDialogContent className="max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle>{confirmar === "revogar" ? "Revogar o link?" : ativo ? "Gerar um novo link?" : "Gerar o link?"}</AlertDialogTitle>
            <AlertDialogDescription>
              {confirmar === "revogar"
                ? "Quem abrir o link verá que ele está indisponível e nada será gravado."
                : ativo ? "O link atual deixa de funcionar na hora. Envie o novo endereço ao parceiro." : "O parceiro poderá divulgar o endereço aos próprios clientes."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction disabled={salvando} onClick={(e) => { e.preventDefault(); executar(); }}>
              {salvando && <Loader2 className="animate-spin" />} Confirmar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Secao>
  );
}
