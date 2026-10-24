import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { AlertTriangle, Check, Gavel, Loader2, X } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Carregando, ErroCarga } from "@/components/comum/Estados";
import { Pilula, SeloNivel } from "@/components/comum/Selos";
import { ok, toastErro } from "@/lib/erros";
import { data, dataHora } from "@/lib/formato";
import { FAIXAS, GRUPOS_REQUISITO, PACOTES, RESULTADOS_REVISAO, rotulo } from "@/lib/rotulos";
import { cn } from "@/lib/utils";
import { Info, Numero, Secao } from "../ui";
import { invalidarParceiro, nomePerfil, usePerfis, type Parceiro } from "../dados";
import { nivelInterno } from "./v2";

type Grupo = { cumprido: boolean; descricao: string | null; faltante: string[] };
type CumpreNivel = { nivel: string; cumpre: boolean; grupos: Record<string, Grupo> };
type Situacao = {
  nivel: string | null; nivel_entrada: string | null; em_observacao_ate: string | null;
  pacote_pendente: string | null; pacote_pendente_em: string | null;
  niveis: Record<string, CumpreNivel>;
  regua: { aplica: boolean; cadencia_dias?: number; tolerancia_dias?: number; ultima_reuniao?: string | null; proxima_ate?: string; atrasada?: boolean };
  faixa: { faixa: string; pontos_ano: number; posicao: number; calculada_em: string } | null;
};
type Revisao = {
  id: string; trimestre: string; nivel_no_inicio: string | null; resultado: string; detalhes: any; decisao: string | null;
  decidido_por: string | null; decidido_em: string | null; motivo: string | null; pacote_novo: string | null; pacote_efetivo_em: string | null;
  created_at: string;
};

const TOM_RESULTADO: Record<string, "menta" | "alerta" | "perigo" | "neutro" | "info"> = {
  cumpre: "menta", observacao: "alerta", proposta_rebaixamento: "perigo", isento: "neutro", subida: "info",
};

// Nível por resultado (História 4, Apêndice B): requisitos por grupo, régua, faixa e revisões trimestrais.
export function AbaNivel({ parceiro: p }: { parceiro: Parceiro }) {
  const { isParcerias } = useAuth();
  const { data: perfis = [] } = usePerfis();
  const [decidir, setDecidir] = useState<Revisao | null>(null);
  const q = useQuery({
    queryKey: ["parceiro", p.id, "nivel"],
    queryFn: async () => {
      const [s, r] = await Promise.all([
        supabase.rpc("situacao_nivel", { p_parceiro: p.id }),
        supabase.from("revisoes_nivel").select("*").eq("parceiro_id", p.id).order("created_at", { ascending: false }),
      ]);
      return { situacao: ok(s) as Situacao, revisoes: ok(r) as Revisao[] };
    },
  });

  if (q.isLoading) return <Carregando />;
  if (q.error) return <ErroCarga erro={q.error} />;
  const { situacao: s, revisoes = [] } = q.data!;
  const pendentes = revisoes.filter((r) => r.resultado === "proposta_rebaixamento" && !r.decisao);

  return (
    <div className="space-y-4">
      {pendentes.map((r) => (
        <div key={r.id} className="flex flex-col gap-3 rounded-[14px] border border-destructive/40 bg-destructive/10 p-4 text-sm sm:flex-row sm:items-center sm:justify-between">
          <p className="flex items-start gap-2">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-red-300" />
            <span>
              <strong>Proposta de rebaixamento ({r.trimestre}).</strong> O parceiro seguiu sem cumprir os requisitos depois de um trimestre em observação.
              Nada muda até alguém confirmar ou manter o nível, com motivo.
            </span>
          </p>
          {isParcerias && <Button size="sm" onClick={() => setDecidir(r)}><Gavel /> Decidir</Button>}
        </div>
      ))}

      <Secao titulo="Situação do nível">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Numero rotulo="Nível atual" valor={<SeloNivel tipo="comercial" nivel={s.nivel} className="text-sm" />} detalhe={nivelInterno(s.nivel)} />
          <Numero rotulo="Nível de entrada" valor={nivelInterno(s.nivel_entrada)} detalhe="Base no ICP ajustada pelo scorecard" />
          <Numero rotulo="Em observação" valor={s.em_observacao_ate ? `Até ${data(s.em_observacao_ate)}` : "Não"}
            detalhe={s.em_observacao_ate ? "Sem cumprir na próxima revisão, gera proposta de rebaixamento" : undefined} />
          <Numero rotulo="Faixa" valor={s.faixa ? rotulo(FAIXAS, s.faixa.faixa) : "Sem faixa"}
            detalhe={s.faixa ? `${s.faixa.pontos_ano} pontos no ano · ${s.faixa.posicao}º lugar` : "Calculada na revisão trimestral"} />
        </div>
        {s.pacote_pendente && (
          <p className="mt-3 rounded-[10px] border border-warning/40 bg-warning/10 p-3 text-sm">
            Pacote pendente: <strong>{rotulo(PACOTES, s.pacote_pendente)}</strong> a partir de {data(s.pacote_pendente_em)}
            {p.pacote_pendente_motivo ? ` (${p.pacote_pendente_motivo})` : ""}. Até lá vale o pacote atual, {rotulo(PACOTES, p.pacote) || "sem pacote"}.
          </p>
        )}
        <div className="mt-4 rounded-[10px] border border-white/10 p-3">
          <p className="mb-2 text-xs font-semibold text-neutro-300">Régua de atendimento</p>
          {!s.regua?.aplica ? (
            <p className="text-sm text-muted-foreground">Não se aplica (parceiro não assinado, pausado ou sem pacote).</p>
          ) : (
            <div className="grid gap-3 text-sm sm:grid-cols-4">
              <Info rotulo="Cadência">A cada {s.regua.cadencia_dias} dias (+{s.regua.tolerancia_dias} de tolerância)</Info>
              <Info rotulo="Última reunião">{s.regua.ultima_reuniao ? data(s.regua.ultima_reuniao) : "Nenhuma registrada"}</Info>
              <Info rotulo="Próxima até">{data(s.regua.proxima_ate)}</Info>
              <Info rotulo="Situação">{s.regua.atrasada ? <Pilula tom="perigo">Atrasada</Pilula> : <Pilula tom="menta">Em dia</Pilula>}</Info>
            </div>
          )}
        </div>
      </Secao>

      <div className="grid gap-4 lg:grid-cols-3">
        {["C", "B", "A"].map((n) => {
          const c = s.niveis?.[n];
          if (!c) return null;
          const atual = s.nivel === n;
          return (
            <section key={n} className={cn("min-w-0 rounded-[14px] border bg-card p-4", atual ? "border-menta-500/60" : "border-white/10")}>
              <header className="mb-3 flex flex-wrap items-center justify-between gap-2">
                <h3 className="font-semibold">{nivelInterno(n)}{atual ? " (atual)" : ""}</h3>
                {c.cumpre ? <Pilula tom="menta">Cumpre</Pilula> : <Pilula tom="alerta">Não cumpre</Pilula>}
              </header>
              <ul className="space-y-3 text-sm">
                {Object.keys(GRUPOS_REQUISITO).map((g) => {
                  const gr = c.grupos?.[g];
                  if (!gr) return null;
                  return (
                    <li key={g} className="min-w-0">
                      <p className="flex items-center gap-1.5 font-medium">
                        {gr.cumprido ? <Check className="h-4 w-4 text-menta-400" /> : <X className="h-4 w-4 text-red-300" />}
                        {GRUPOS_REQUISITO[g]}
                      </p>
                      {gr.descricao && <p className="text-xs text-muted-foreground">{gr.descricao}</p>}
                      {gr.faltante?.length > 0 && (
                        <ul className="mt-1 list-disc space-y-0.5 pl-5 text-xs text-warning">
                          {gr.faltante.map((x, i) => <li key={i}>Falta: {x}</li>)}
                        </ul>
                      )}
                    </li>
                  );
                })}
              </ul>
            </section>
          );
        })}
      </div>

      <Secao titulo="Revisões de nível" descricao="Revisão trimestral no primeiro dia útil de janeiro, abril, julho e outubro, e subidas por resultado.">
        {revisoes.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhuma revisão registrada.</p>
        ) : (
          <ul className="space-y-2 text-sm">
            {revisoes.map((r) => (
              <li key={r.id} className="rounded-[10px] border border-white/10 p-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="font-medium">{r.trimestre} · nível no início: {nivelInterno(r.nivel_no_inicio)}</span>
                  <div className="flex flex-wrap gap-1.5">
                    <Pilula tom={TOM_RESULTADO[r.resultado] ?? "neutro"}>{rotulo(RESULTADOS_REVISAO, r.resultado)}</Pilula>
                    {r.decisao && <Pilula tom={r.decisao === "confirmado" ? "perigo" : "menta"}>{r.decisao === "confirmado" ? "Rebaixamento confirmado" : "Nível mantido"}</Pilula>}
                  </div>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  {dataHora(r.created_at)}
                  {r.decidido_em ? ` · decidido em ${dataHora(r.decidido_em)}${nomePerfil(perfis, r.decidido_por) ? ` por ${nomePerfil(perfis, r.decidido_por)}` : ""}` : ""}
                </p>
                {r.motivo && <p className="mt-1 whitespace-pre-wrap break-words">{r.motivo}</p>}
                {r.pacote_novo && (
                  <p className="mt-1 text-xs text-muted-foreground">Pacote novo: {rotulo(PACOTES, r.pacote_novo)} a partir de {data(r.pacote_efetivo_em)}</p>
                )}
                {r.detalhes?.grupos && <Faltantes grupos={r.detalhes.grupos} />}
              </li>
            ))}
          </ul>
        )}
      </Secao>

      {decidir && <DecisaoRebaixamento parceiro={p} revisao={decidir} onFechar={() => setDecidir(null)} />}
    </div>
  );
}

function Faltantes({ grupos }: { grupos: Record<string, Grupo> }) {
  const itens = Object.entries(grupos).flatMap(([g, x]) => (x?.faltante ?? []).map((f) => `${rotulo(GRUPOS_REQUISITO, g)}: ${f}`));
  if (!itens.length) return null;
  return (
    <details className="mt-1">
      <summary className="cursor-pointer text-xs text-menta-400">O que faltava ({itens.length})</summary>
      <ul className="mt-1 list-disc space-y-0.5 pl-5 text-xs text-muted-foreground">{itens.map((x, i) => <li key={i}>{x}</li>)}</ul>
    </details>
  );
}

function DecisaoRebaixamento({ parceiro: p, revisao, onFechar }: { parceiro: Parceiro; revisao: Revisao; onFechar: () => void }) {
  const qc = useQueryClient();
  const [opcao, setOpcao] = useState<"confirmar" | "manter" | "">("");
  const [motivo, setMotivo] = useState("");
  const [salvando, setSalvando] = useState(false);
  const novo = p.nivel === "A" ? "B" : "C";

  async function salvar() {
    if (!opcao || !motivo.trim()) {
      toast.error("Escolha a decisão e informe o motivo.");
      return;
    }
    setSalvando(true);
    const { error } = await supabase.rpc("decidir_rebaixamento", { p_revisao: revisao.id, p_confirmar: opcao === "confirmar", p_motivo: motivo.trim() });
    setSalvando(false);
    if (error) return toastErro(error);
    toast.success(opcao === "confirmar" ? `Rebaixamento confirmado para ${nivelInterno(novo)}.` : "Nível mantido.");
    qc.invalidateQueries({ queryKey: ["parceiro", p.id, "nivel"] });
    qc.invalidateQueries({ queryKey: ["pendencias"] });
    invalidarParceiro(qc, p.id);
    onFechar();
  }

  return (
    <Dialog open onOpenChange={(v) => !v && onFechar()}>
      <DialogContent className="max-h-[100dvh] max-w-md overflow-y-auto sm:max-h-[90vh] sm:rounded-[14px]">
        <DialogHeader>
          <DialogTitle>Proposta de rebaixamento</DialogTitle>
          <DialogDescription>
            {p.nome_fantasia}, revisão {revisao.trimestre}. A decisão é de uma pessoa e exige motivo.
          </DialogDescription>
        </DialogHeader>
        <RadioGroup value={opcao} onValueChange={(v) => setOpcao(v as "confirmar" | "manter")} className="gap-2">
          <label htmlFor="rb-confirmar" className="flex cursor-pointer items-start gap-3 rounded-[10px] border border-white/10 p-3 text-sm">
            <RadioGroupItem value="confirmar" id="rb-confirmar" className="mt-0.5" />
            <span>
              Confirmar o rebaixamento para {nivelInterno(novo)}
              <span className="block text-xs text-muted-foreground">Se o pacote não couber no novo nível, ele muda no fim do ciclo do Base Ativa ou em 30 dias, o que vier depois.</span>
            </span>
          </label>
          <label htmlFor="rb-manter" className="flex cursor-pointer items-start gap-3 rounded-[10px] border border-white/10 p-3 text-sm">
            <RadioGroupItem value="manter" id="rb-manter" className="mt-0.5" />
            <span>Manter o nível {nivelInterno(p.nivel)}<span className="block text-xs text-muted-foreground">A observação é encerrada.</span></span>
          </label>
        </RadioGroup>
        <div className="space-y-1.5">
          <Label htmlFor="rb-motivo" className="text-xs">Motivo <span className="text-menta-400">*</span></Label>
          <Textarea id="rb-motivo" rows={3} value={motivo} onChange={(e) => setMotivo(e.target.value)} />
        </div>
        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onFechar}>Cancelar</Button>
          <Button onClick={salvar} disabled={salvando || !opcao || !motivo.trim()}>
            {salvando && <Loader2 className="animate-spin" />} Registrar decisão
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
