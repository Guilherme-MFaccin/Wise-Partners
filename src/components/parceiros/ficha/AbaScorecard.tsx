import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { AlertTriangle, CheckCircle2, ClipboardList, Lightbulb, Loader2, Save } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import { Carregando, ErroCarga, Vazio } from "@/components/comum/Estados";
import { Pilula } from "@/components/comum/Selos";
import { ok, toastErro } from "@/lib/erros";
import { dataHora } from "@/lib/formato";
import { cn } from "@/lib/utils";
import { Campo, Info, Numero, Secao } from "../ui";
import { invalidarParceiro, nomePerfil, usePerfis, type Parceiro } from "../dados";
import { nivelInterno, pct } from "./v2";

type Criterio = {
  id: string; chave: string; nome: string; essencial: boolean; peso: number; regua: Record<string, string>;
  elimina_com_zero: boolean; conta_na_qualidade: boolean; ordem: number;
};
type Scorecard = {
  id: string; notas: Record<string, number>; completo: boolean; nota_potencial: number | null; nota_qualidade: number | null;
  nivel_entrada_sugerido: string | null; nao_elegivel_sugerido: boolean; faltantes: string[]; created_by: string | null; created_at: string;
};

const NOTAS = ["0", "0.5", "1"];
const ROTULO_NOTA: Record<string, string> = { "0": "0", "0.5": "0,5", "1": "1" };

// Sugestão do critério de disponibilidade pelas horas combinadas (História 9, cenário 5)
function sugestaoDisponibilidade(horas: number | null | undefined) {
  if (horas === null || horas === undefined) return null;
  const h = Number(horas);
  if (h >= 2) return "1";
  if (h > 0) return "0.5";
  return "0";
}

// Scorecard de entrada (História 3, Apêndice A). Cada avaliação é uma linha nova; vale a mais recente.
export function AbaScorecard({ parceiro: p }: { parceiro: Parceiro }) {
  const { isParcerias } = useAuth();
  const { data: perfis = [] } = usePerfis();
  const q = useQuery({
    queryKey: ["parceiro", p.id, "scorecard"],
    queryFn: async () => {
      const [c, s] = await Promise.all([
        supabase.from("criterios_scorecard").select("*").eq("ativo", true).order("ordem"),
        supabase.from("scorecards").select("*").eq("parceiro_id", p.id).order("created_at", { ascending: false }),
      ]);
      return { criterios: ok(c) as Criterio[], scorecards: ok(s) as Scorecard[] };
    },
  });

  if (p.tipo_parceria !== "comercial") {
    return <Vazio titulo="Scorecard só para parceria comercial.">Parceria institucional não usa scorecard nem nível por resultado nesta versão.</Vazio>;
  }
  if (q.isLoading) return <Carregando />;
  if (q.error) return <ErroCarga erro={q.error} />;
  const { criterios = [], scorecards = [] } = q.data ?? {};
  const atual = scorecards[0];
  const nomeCriterio = new Map(criterios.map((c) => [c.chave, c.nome]));

  return (
    <div className="space-y-4">
      {!atual ? (
        <Vazio titulo="Nenhum scorecard preenchido.">
          O scorecard completo é exigido antes da proposta com o decisor.
        </Vazio>
      ) : (
        <Secao titulo="Scorecard vigente" descricao={`Preenchido em ${dataHora(atual.created_at)}${nomePerfil(perfis, atual.created_by) ? ` por ${nomePerfil(perfis, atual.created_by)}` : ""}`}
          acoes={atual.completo ? <Pilula tom="menta">Completo</Pilula> : <Pilula tom="alerta">Incompleto</Pilula>}>
          <div className="grid gap-3 sm:grid-cols-3">
            <Numero rotulo="Nota de potencial" valor={atual.completo ? pct(atual.nota_potencial) : "Pendente"} detalhe="Soma ponderada sobre 10" />
            <Numero rotulo="Nota de qualidade" valor={atual.completo ? pct(atual.nota_qualidade) : "Pendente"} detalhe="Seis critérios além da base no ICP" />
            <Numero rotulo="Nível de entrada sugerido" valor={nivelInterno(atual.nivel_entrada_sugerido)}
              detalhe={atual.completo && atual.nota_qualidade !== null && Number(atual.nota_qualidade) < 50 ? "Qualidade abaixo de 50%: um nível abaixo da faixa" : `Base no ICP: ${p.carteira_icp ?? "não informada"}`} />
          </div>
          {atual.faltantes?.length > 0 && (
            <p className="mt-3 flex items-start gap-2 text-sm text-warning">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" /> Faltam: {atual.faltantes.join(", ")}.
            </p>
          )}
          <ul className="mt-4 grid gap-2 text-sm sm:grid-cols-2">
            {criterios.map((c) => {
              const n = atual.notas?.[c.chave];
              const k = n === undefined || n === null ? null : String(Number(n));
              return (
                <li key={c.chave} className="min-w-0 rounded-[10px] border border-white/10 p-3">
                  <div className="flex items-start justify-between gap-2">
                    <span className="font-medium">{c.nome}</span>
                    <Pilula tom={k === null ? "neutro" : k === "0" ? "perigo" : k === "1" ? "menta" : "info"}>{k === null ? "Sem nota" : ROTULO_NOTA[k] ?? k}</Pilula>
                  </div>
                  {k !== null && <p className="mt-1 text-xs text-muted-foreground">{c.regua?.[k]}</p>}
                </li>
              );
            })}
          </ul>
          {atual.nao_elegivel_sugerido && <NaoElegivel parceiro={p} />}
        </Secao>
      )}

      {isParcerias && <FormScorecard parceiro={p} criterios={criterios} atual={atual} />}

      {scorecards.length > 1 && (
        <Secao titulo="Histórico de avaliações">
          <ul className="space-y-2 text-sm">
            {scorecards.map((s, i) => (
              <li key={s.id} className="flex flex-wrap items-center justify-between gap-2 rounded-[10px] border border-white/10 p-3">
                <div className="min-w-0">
                  <p className="font-medium">{dataHora(s.created_at)}{i === 0 ? " (vigente)" : ""}</p>
                  <p className="text-xs text-muted-foreground">
                    {nomePerfil(perfis, s.created_by) || "Autor não identificado"}
                    {s.faltantes?.length ? ` · faltam: ${s.faltantes.map((x) => nomeCriterio.get(x) ?? x).join(", ")}` : ""}
                  </p>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {s.completo ? (
                    <>
                      <Pilula>Potencial {pct(s.nota_potencial)}</Pilula>
                      <Pilula>Qualidade {pct(s.nota_qualidade)}</Pilula>
                    </>
                  ) : <Pilula tom="alerta">Incompleto</Pilula>}
                  <Pilula tom="info">{nivelInterno(s.nivel_entrada_sugerido)}</Pilula>
                  {s.nao_elegivel_sugerido && <Pilula tom="perigo">Não elegível</Pilula>}
                </div>
              </li>
            ))}
          </ul>
        </Secao>
      )}
    </div>
  );
}

// Sugestão de "não elegível": só o administrador segue com a negociação, registrando o motivo.
function NaoElegivel({ parceiro: p }: { parceiro: Parceiro }) {
  const { isAdmin } = useAuth();
  const qc = useQueryClient();
  const [motivo, setMotivo] = useState(p.elegibilidade_motivo ?? "");
  const [salvando, setSalvando] = useState(false);
  useEffect(() => setMotivo(p.elegibilidade_motivo ?? ""), [p.elegibilidade_motivo]);

  async function salvar() {
    setSalvando(true);
    const { error } = await supabase.from("parceiros").update({ elegibilidade_motivo: motivo.trim() || null }).eq("id", p.id);
    setSalvando(false);
    if (error) return toastErro(error);
    toast.success("Decisão de elegibilidade registrada.");
    invalidarParceiro(qc, p.id);
  }

  return (
    <div className="mt-4 space-y-3 rounded-[10px] border border-destructive/40 bg-destructive/10 p-4 text-sm">
      <p className="flex items-start gap-2 font-semibold text-red-200">
        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" /> Sugestão: não elegível
      </p>
      <p className="text-muted-foreground">
        Nota zero em complementaridade ou em alinhamento de valores. A proposta com o decisor só segue com decisão de um administrador, com motivo.
      </p>
      {isAdmin ? (
        <>
          <Campo rotulo="Motivo para seguir com a negociação">
            <Textarea rows={2} value={motivo} onChange={(e) => setMotivo(e.target.value)} />
          </Campo>
          <Button size="sm" onClick={salvar} disabled={salvando || motivo === (p.elegibilidade_motivo ?? "")}>
            {salvando ? <Loader2 className="animate-spin" /> : <Save />} Registrar decisão
          </Button>
        </>
      ) : (
        <Info rotulo="Decisão do administrador">{p.elegibilidade_motivo}</Info>
      )}
    </div>
  );
}

function FormScorecard({ parceiro: p, criterios, atual }: { parceiro: Parceiro; criterios: Criterio[]; atual?: Scorecard }) {
  const qc = useQueryClient();
  const inicial = () => Object.fromEntries(
    criterios.filter((c) => atual?.notas?.[c.chave] !== undefined && atual?.notas?.[c.chave] !== null)
      .map((c) => [c.chave, String(Number(atual!.notas[c.chave]))]),
  ) as Record<string, string>;
  const [notas, setNotas] = useState<Record<string, string>>(inicial);
  const [aberto, setAberto] = useState(!atual);
  const [salvando, setSalvando] = useState(false);
  useEffect(() => setNotas(inicial()), [atual?.id, criterios.length]); // eslint-disable-line react-hooks/exhaustive-deps

  const preenchidos = criterios.filter((c) => notas[c.chave] !== undefined).length;
  const sugDisp = sugestaoDisponibilidade(p.horas_semana_combinadas);

  async function salvar() {
    setSalvando(true);
    const payload = Object.fromEntries(Object.entries(notas).map(([k, v]) => [k, Number(v)]));
    const { error } = await supabase.from("scorecards").insert({ parceiro_id: p.id, notas: payload });
    setSalvando(false);
    if (error) return toastErro(error);
    toast.success(preenchidos === criterios.length ? "Scorecard salvo." : "Scorecard salvo como incompleto.");
    setAberto(false);
    qc.invalidateQueries({ queryKey: ["parceiro", p.id, "scorecard"] });
    invalidarParceiro(qc, p.id);
  }

  if (!aberto) {
    return (
      <div className="flex justify-end">
        <Button variant="outline" onClick={() => setAberto(true)}><ClipboardList /> Nova avaliação</Button>
      </div>
    );
  }

  return (
    <Secao titulo={atual ? "Nova avaliação" : "Preencher scorecard"}
      descricao="Cada critério recebe 0, 0,5 ou 1 pela régua. Essenciais pesam 2. A nova avaliação vira a vigente.">
      <div className="space-y-4">
        {criterios.map((c) => (
          <fieldset key={c.chave} className="min-w-0 rounded-[10px] border border-white/10 p-3">
            <legend className="px-1 text-sm font-semibold">
              {c.nome}
              {c.essencial && <Pilula tom="info" className="ml-2">Essencial · peso {Number(c.peso).toLocaleString("pt-BR")}</Pilula>}
            </legend>
            {c.chave === "disponibilidade" && sugDisp && (
              <p className="mb-2 flex items-start gap-1.5 text-xs text-menta-300">
                <Lightbulb className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                Sugestão pelas {Number(p.horas_semana_combinadas).toLocaleString("pt-BR")} h por semana combinadas: {ROTULO_NOTA[sugDisp]}
              </p>
            )}
            <RadioGroup value={notas[c.chave] ?? ""} onValueChange={(v) => setNotas((x) => ({ ...x, [c.chave]: v }))} className="gap-2">
              {NOTAS.map((n) => {
                const id = `sc-${c.chave}-${n}`;
                return (
                  <div key={n} className={cn("flex items-start gap-3 rounded-[8px] border p-2.5",
                    notas[c.chave] === n ? "border-menta-500/60 bg-menta-500/5" : "border-white/10")}>
                    <RadioGroupItem value={n} id={id} className="mt-0.5" />
                    <Label htmlFor={id} className="cursor-pointer text-sm font-normal leading-snug">
                      <span className="mr-2 font-semibold">{ROTULO_NOTA[n]}</span>{c.regua?.[n]}
                    </Label>
                  </div>
                );
              })}
            </RadioGroup>
            {c.elimina_com_zero && notas[c.chave] === "0" && (
              <p className="mt-2 text-xs text-red-300">Nota zero aqui sugere "não elegível".</p>
            )}
          </fieldset>
        ))}
      </div>
      <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
        <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
          <CheckCircle2 className={cn("h-4 w-4", preenchidos === criterios.length ? "text-menta-400" : "")} />
          {preenchidos} de {criterios.length} critérios
        </p>
        <div className="flex gap-2">
          {atual && <Button variant="ghost" onClick={() => setAberto(false)}>Cancelar</Button>}
          <Button onClick={salvar} disabled={salvando || preenchidos === 0}>
            {salvando ? <Loader2 className="animate-spin" /> : <Save />} Salvar scorecard
          </Button>
        </div>
      </div>
    </Secao>
  );
}
