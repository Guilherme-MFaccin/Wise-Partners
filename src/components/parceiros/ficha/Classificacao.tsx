import { useEffect, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Lightbulb } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SeloNivel, SeloStatus } from "@/components/comum/Selos";
import { toastErro } from "@/lib/erros";
import { data, hojeISO, minutosParaHoras } from "@/lib/formato";
import { NIVEIS_COMERCIAL, NIVEIS_INSTITUCIONAL, nomeNivel } from "@/lib/rotulos";
import { cn } from "@/lib/utils";
import { Campo, Info, Numero, Secao } from "../ui";
import { calcularNivelSugerido, invalidarParceiro, pacotesDoNivel, useNiveis, usePacotes, type Parceiro } from "../dados";

const NENHUM = "__nenhum";

// Classificação (história 5): carteira no ICP, nível sugerido, ajuste com motivo e pacote do nível.
export function Classificacao({ parceiro: p }: { parceiro: Parceiro }) {
  const { isParcerias } = useAuth();
  const qc = useQueryClient();
  const { data: niveis = [] } = useNiveis();
  const { data: pacotes = [] } = usePacotes();
  const comercial = p.tipo_parceria === "comercial";

  const inicial = () => ({
    carteira: p.carteira_icp === null ? "" : String(p.carteira_icp),
    nivel: p.nivel ?? "",
    motivo: p.nivel_ajuste_motivo ?? "",
    pacote: p.pacote ?? "",
  });
  const [f, setF] = useState(inicial);
  const [salvando, setSalvando] = useState(false);
  useEffect(() => setF(inicial()), [p.carteira_icp, p.nivel, p.nivel_ajuste_motivo, p.pacote]); // eslint-disable-line react-hooks/exhaustive-deps

  const carteira = f.carteira === "" ? null : Number(f.carteira);
  const sugerido = calcularNivelSugerido(niveis, p.tipo_parceria, carteira);
  // Sem nível escolhido, o banco usa o sugerido
  const nivelEfetivo = f.nivel || sugerido || "";
  const ajusteManual = comercial && !!sugerido && !!nivelEfetivo && nivelEfetivo !== sugerido;
  const pacotesPermitidos = pacotesDoNivel(pacotes, nivelEfetivo);
  const pacoteInvalido = !!f.pacote && !pacotesPermitidos.some((x) => x.codigo === f.pacote);
  const mudou = JSON.stringify(f) !== JSON.stringify(inicial());
  const nomesNivel = comercial ? NIVEIS_COMERCIAL : NIVEIS_INSTITUCIONAL;

  async function salvar() {
    if (ajusteManual && !f.motivo.trim()) {
      toast.error("Ajuste manual de nível exige motivo.");
      return;
    }
    if (pacoteInvalido) {
      toast.error("O pacote escolhido não está disponível para o nível.");
      return;
    }
    setSalvando(true);
    const { error } = await supabase
      .from("parceiros")
      .update({
        carteira_icp: carteira,
        nivel: f.nivel || null,
        nivel_ajuste_motivo: ajusteManual ? f.motivo.trim() : null,
        pacote: comercial ? f.pacote || null : null,
      })
      .eq("id", p.id);
    setSalvando(false);
    if (error) return toastErro(error);
    toast.success("Classificação salva.");
    invalidarParceiro(qc, p.id);
  }

  return (
    <Secao titulo="Classificação" descricao="O nível mede potencial (carteira no ICP da Wise) e nunca muda por inatividade.">
      <div className="grid gap-4 sm:grid-cols-2">
        <Campo
          rotulo={comercial ? "Clientes da carteira no ICP da Wise" : "Empresas no ICP da Wise (estimativa)"}
          dica={comercial && sugerido ? <>Nível sugerido: <strong className="text-foreground">{nomeNivel("comercial", sugerido)}</strong></> : comercial ? "Informe a carteira para ver o nível sugerido." : undefined}
        >
          <Input type="number" min={0} inputMode="numeric" value={f.carteira} disabled={!isParcerias}
            onChange={(e) => setF((x) => ({ ...x, carteira: e.target.value }))} />
        </Campo>
        <Campo rotulo="Nível">
          <Select value={f.nivel || NENHUM} disabled={!isParcerias}
            onValueChange={(v) => setF((x) => ({ ...x, nivel: v === NENHUM ? "" : v }))}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value={NENHUM}>{comercial ? "Usar o sugerido" : "Sem nível"}</SelectItem>
              {["A", "B", "C"].map((c) => <SelectItem key={c} value={c}>{nomesNivel[c]}{c === sugerido ? " (sugerido)" : ""}</SelectItem>)}
            </SelectContent>
          </Select>
        </Campo>
        {ajusteManual && (
          <Campo rotulo="Motivo do ajuste manual" obrigatorio className="sm:col-span-2"
            dica={`O nível sugerido pela carteira é ${nomeNivel("comercial", sugerido)}.`}>
            <Textarea rows={2} value={f.motivo} disabled={!isParcerias}
              className={cn(!f.motivo.trim() && "border-warning")}
              onChange={(e) => setF((x) => ({ ...x, motivo: e.target.value }))} />
          </Campo>
        )}
        {comercial ? (
          <Campo rotulo="Pacote" dica={nivelEfetivo ? `Disponíveis para ${nomeNivel("comercial", nivelEfetivo)}: ${pacotesPermitidos.map((x) => x.nome).join(", ")}` : "Defina o nível para escolher o pacote."}>
            <Select value={f.pacote || NENHUM} disabled={!isParcerias || !nivelEfetivo}
              onValueChange={(v) => setF((x) => ({ ...x, pacote: v === NENHUM ? "" : v }))}>
              <SelectTrigger className={cn(pacoteInvalido && "border-warning")}><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value={NENHUM}>Sem pacote</SelectItem>
                {pacotesPermitidos.map((x) => <SelectItem key={x.codigo} value={x.codigo}>{x.nome}</SelectItem>)}
              </SelectContent>
            </Select>
            {pacoteInvalido && <p className="text-xs text-warning">O pacote atual não está disponível para este nível. Escolha outro.</p>}
          </Campo>
        ) : (
          <Info rotulo="Pacote">Parcerias institucionais não têm pacote.</Info>
        )}
        <Info rotulo="Nível atual"><SeloNivel tipo={p.tipo_parceria} nivel={p.nivel} /></Info>
      </div>
      {isParcerias && mudou && (
        <div className="mt-4 flex flex-wrap justify-end gap-2">
          <Button variant="outline" onClick={() => setF(inicial())}>Descartar</Button>
          <Button onClick={salvar} disabled={salvando}>{salvando ? "Salvando..." : "Salvar classificação"}</Button>
        </div>
      )}
    </Secao>
  );
}

// Status de atividade: calculado pelo banco; aqui só pausa por acordo e motivo de inatividade.
export function StatusAtividade({ parceiro: p }: { parceiro: Parceiro }) {
  const { isParcerias } = useAuth();
  const qc = useQueryClient();
  const [pausa, setPausa] = useState(p.pausado_ate ?? "");
  const [motivo, setMotivo] = useState(p.motivo_inatividade ?? "");
  const [salvando, setSalvando] = useState(false);
  useEffect(() => {
    setPausa(p.pausado_ate ?? "");
    setMotivo(p.motivo_inatividade ?? "");
  }, [p.pausado_ate, p.motivo_inatividade]);

  const inativo = p.status_atividade === "morno" || p.status_atividade === "dormente";
  const faltaMotivo = inativo && !motivo.trim();
  const mudou = pausa !== (p.pausado_ate ?? "") || motivo !== (p.motivo_inatividade ?? "");

  async function salvar(novaPausa = pausa) {
    if (novaPausa && novaPausa < hojeISO()) {
      toast.error("A data de retomada precisa ser hoje ou depois.");
      return;
    }
    setSalvando(true);
    const { error } = await supabase
      .from("parceiros")
      .update({ pausado_ate: novaPausa || null, motivo_inatividade: motivo.trim() || null })
      .eq("id", p.id);
    setSalvando(false);
    if (error) return toastErro(error);
    toast.success("Status de atividade atualizado.");
    invalidarParceiro(qc, p.id);
  }

  return (
    <Secao titulo="Status de atividade" descricao="Calculado pelos prazos do nível desde o último contato ou indicação.">
      <div className="flex flex-wrap items-center gap-2 text-sm">
        <SeloStatus status={p.status_atividade} />
        <span className="text-muted-foreground">
          {p.status_atividade === "pausado" && p.pausado_ate ? `Pausado de comum acordo até ${data(p.pausado_ate)}, sem alertas de inatividade.` : p.ultimo_contato ? `Último contato em ${data(p.ultimo_contato)}.` : "Sem contato registrado."}
        </span>
      </div>
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <Campo rotulo="Pausar até (acordo com o parceiro)">
          <div className="flex gap-2">
            <Input type="date" value={pausa} min={hojeISO()} disabled={!isParcerias} onChange={(e) => setPausa(e.target.value)} />
            {isParcerias && p.pausado_ate && (
              <Button variant="outline" disabled={salvando} onClick={() => { setPausa(""); salvar(""); }}>Retomar</Button>
            )}
          </div>
        </Campo>
        <Campo rotulo="Motivo da inatividade" obrigatorio={inativo}
          dica={faltaMotivo ? "Obrigatório enquanto o parceiro estiver morno ou dormente." : undefined}>
          <Textarea rows={2} value={motivo} disabled={!isParcerias} onChange={(e) => setMotivo(e.target.value)}
            className={cn(faltaMotivo && "border-warning bg-warning/5")} />
        </Campo>
      </div>
      {isParcerias && mudou && (
        <div className="mt-4 flex justify-end">
          <Button onClick={() => salvar()} disabled={salvando}>{salvando ? "Salvando..." : "Salvar status"}</Button>
        </div>
      )}
    </Secao>
  );
}

// Dados internos: estratégico (decisão do administrador), anotações e relação de origem.
export function DadosInternos({ parceiroId }: { parceiroId: string }) {
  const { isParcerias, isAdmin } = useAuth();
  const qc = useQueryClient();
  const q = useInterno(parceiroId, true);
  const i = q.data;
  const [f, setF] = useState({ estrategico: false, anotacoes: "", relacao_origem: "" });
  const [salvando, setSalvando] = useState(false);
  useEffect(() => {
    if (i) setF({ estrategico: i.estrategico, anotacoes: i.anotacoes ?? "", relacao_origem: i.relacao_origem ?? "" });
  }, [i]);
  if (q.isLoading || !i) return null;
  const mudou = f.estrategico !== i.estrategico || f.anotacoes !== (i.anotacoes ?? "") || f.relacao_origem !== (i.relacao_origem ?? "");

  async function salvar() {
    setSalvando(true);
    const campos: Record<string, any> = { anotacoes: f.anotacoes.trim() || null, relacao_origem: f.relacao_origem.trim() || null };
    if (isAdmin) campos.estrategico = f.estrategico;
    const { error } = await supabase.from("parceiros_interno").update(campos).eq("parceiro_id", parceiroId);
    setSalvando(false);
    if (error) return toastErro(error);
    toast.success("Dados internos salvos.");
    qc.invalidateQueries({ queryKey: ["parceiro", parceiroId] });
  }

  return (
    <Secao titulo="Interno" descricao="Visível só para o time interno. Nunca aparece para parceiros ou clientes.">
      <div className="space-y-4">
        <div className="rounded-[10px] border border-white/10 p-3">
          <label className="flex items-center gap-3 text-sm font-medium">
            <Switch checked={f.estrategico} disabled={!isAdmin} onCheckedChange={(v) => setF((x) => ({ ...x, estrategico: v }))} />
            Parceiro estratégico
          </label>
          <p className="mt-2 flex items-start gap-2 text-xs text-muted-foreground">
            <Lightbulb className="mt-0.5 h-3.5 w-3.5 shrink-0 text-menta-400" />
            <span>
              Sugestão do sistema: {i.estrategico_sugerido ? `marcar como estratégico (${i.estrategico_motivo ?? "critério atingido"})` : "nenhuma no momento"}.
              {!isAdmin && " A decisão é de um administrador."}
            </span>
          </p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Campo rotulo="Relação de origem" dica="Quem tem a relação de origem com o parceiro.">
            <Input value={f.relacao_origem} disabled={!isParcerias} onChange={(e) => setF((x) => ({ ...x, relacao_origem: e.target.value }))} />
          </Campo>
          <Campo rotulo="Anotações internas" className="sm:col-span-2">
            <Textarea rows={4} value={f.anotacoes} disabled={!isParcerias} onChange={(e) => setF((x) => ({ ...x, anotacoes: e.target.value }))} />
          </Campo>
        </div>
        {isParcerias && mudou && (
          <div className="flex justify-end">
            <Button onClick={salvar} disabled={salvando}>{salvando ? "Salvando..." : "Salvar dados internos"}</Button>
          </div>
        )}
      </div>
    </Secao>
  );
}

export function useInterno(parceiroId: string, habilitado: boolean) {
  return useQuery({
    queryKey: ["parceiro", parceiroId, "interno"],
    enabled: habilitado,
    queryFn: async () => {
      const { data, error } = await supabase.from("parceiros_interno").select("*").eq("parceiro_id", parceiroId).maybeSingle();
      if (error) throw error;
      return data as null | {
        estrategico: boolean; estrategico_sugerido: boolean; estrategico_motivo: string | null; anotacoes: string | null; relacao_origem: string | null;
      };
    },
  });
}

// Instrumento do parceiro (comissão que ele paga ao grupo). Só para quem vê comissões.
export function InstrumentoParceiro({ parceiroId }: { parceiroId: string }) {
  const qc = useQueryClient();
  const q = useQuery({
    queryKey: ["parceiro", parceiroId, "instrumento"],
    queryFn: async () => {
      const { data, error } = await supabase.from("parceiros_instrumento").select("*").eq("parceiro_id", parceiroId).maybeSingle();
      if (error) throw error;
      return data;
    },
  });
  const vazio = { programa_proprio: false, instrumento_nome: "", comissao_pct: "", comissao_base: "", comissao_condicao: "", exigencias: "", exigencias_solucao: "" };
  const [f, setF] = useState(vazio);
  const [salvando, setSalvando] = useState(false);
  useEffect(() => {
    const d = q.data;
    if (d) setF({
      programa_proprio: !!d.programa_proprio, instrumento_nome: d.instrumento_nome ?? "",
      comissao_pct: d.comissao_pct === null ? "" : String(d.comissao_pct), comissao_base: d.comissao_base ?? "",
      comissao_condicao: d.comissao_condicao ?? "", exigencias: d.exigencias ?? "", exigencias_solucao: d.exigencias_solucao ?? "",
    });
  }, [q.data]);
  const set = (k: keyof typeof vazio, v: any) => setF((x) => ({ ...x, [k]: v }));

  async function salvar() {
    setSalvando(true);
    const { error } = await supabase.from("parceiros_instrumento").upsert({
      parceiro_id: parceiroId,
      programa_proprio: f.programa_proprio,
      instrumento_nome: f.instrumento_nome.trim() || null,
      comissao_pct: f.comissao_pct === "" ? null : Number(f.comissao_pct),
      comissao_base: f.comissao_base.trim() || null,
      comissao_condicao: f.comissao_condicao.trim() || null,
      exigencias: f.exigencias.trim() || null,
      exigencias_solucao: f.exigencias_solucao.trim() || null,
    });
    setSalvando(false);
    if (error) return toastErro(error);
    toast.success("Instrumento salvo.");
    qc.invalidateQueries({ queryKey: ["parceiro", parceiroId, "instrumento"] });
  }

  if (q.isLoading) return null;
  return (
    <Secao titulo="Instrumento do parceiro" descricao="Programa de parceiros próprio e comissão que o parceiro paga ao grupo. Entra no Quadro e no contrato.">
      <div className="space-y-4">
        <label className="flex items-center gap-3 text-sm font-medium">
          <Switch checked={f.programa_proprio} onCheckedChange={(v) => set("programa_proprio", v)} />
          Tem programa de parceiros próprio
        </label>
        <div className="grid gap-4 sm:grid-cols-2">
          <Campo rotulo="Nome do instrumento"><Input value={f.instrumento_nome} onChange={(e) => set("instrumento_nome", e.target.value)} /></Campo>
          <Campo rotulo="Comissão (%)"><Input type="number" step="0.01" inputMode="decimal" value={f.comissao_pct} onChange={(e) => set("comissao_pct", e.target.value)} /></Campo>
          <Campo rotulo="Base da comissão"><Input value={f.comissao_base} onChange={(e) => set("comissao_base", e.target.value)} placeholder="Ex.: primeira mensalidade" /></Campo>
          <Campo rotulo="Condição"><Input value={f.comissao_condicao} onChange={(e) => set("comissao_condicao", e.target.value)} placeholder="Ex.: após o primeiro pagamento" /></Campo>
          <Campo rotulo="Exigências do programa deles" className="sm:col-span-2">
            <Textarea rows={2} value={f.exigencias} onChange={(e) => set("exigencias", e.target.value)} placeholder="Cadastro, atividade econômica (CNAE), contrato próprio" />
          </Campo>
          <Campo rotulo="Solução adotada" className="sm:col-span-2">
            <Textarea rows={2} value={f.exigencias_solucao} onChange={(e) => set("exigencias_solucao", e.target.value)} />
          </Campo>
        </div>
        <div className="flex justify-end">
          <Button onClick={salvar} disabled={salvando}>{salvando ? "Salvando..." : "Salvar instrumento"}</Button>
        </div>
      </div>
    </Secao>
  );
}

// Resumo de atividades do parceiro: só informativo, sem limite nem alerta.
export function ResumoAtividades({ parceiroId }: { parceiroId: string }) {
  const q = useQuery({
    queryKey: ["parceiro", parceiroId, "atividades"],
    queryFn: async () => {
      const { data, error } = await supabase.from("atividades").select("data, minutos, tipo_atividade_id, tipos_atividade(nome)").eq("parceiro_id", parceiroId);
      if (error) throw error;
      return (data ?? []) as any[];
    },
  });
  const resumo = useMemo(() => {
    const limite = new Date();
    limite.setDate(limite.getDate() - 90);
    const corte = limite.toISOString().slice(0, 10);
    const porTipo = new Map<string, { nome: string; q90: number; m90: number; qt: number; mt: number }>();
    for (const a of q.data ?? []) {
      const nome = a.tipos_atividade?.nome ?? "Outro";
      const r = porTipo.get(nome) ?? { nome, q90: 0, m90: 0, qt: 0, mt: 0 };
      r.qt += 1;
      r.mt += a.minutos ?? 0;
      if (a.data >= corte) {
        r.q90 += 1;
        r.m90 += a.minutos ?? 0;
      }
      porTipo.set(nome, r);
    }
    const linhas = [...porTipo.values()].sort((a, b) => b.qt - a.qt);
    const soma = (k: "q90" | "m90" | "qt" | "mt") => linhas.reduce((s, l) => s + l[k], 0);
    return { linhas, q90: soma("q90"), m90: soma("m90"), qt: soma("qt"), mt: soma("mt") };
  }, [q.data]);

  if (q.isLoading) return null;
  return (
    <Secao titulo="Atividades com este parceiro" descricao="Tempo estimado apenas como informação, sem limite de horas.">
      <div className="grid grid-cols-2 gap-3">
        <Numero rotulo="Últimos 90 dias" valor={resumo.q90} detalhe={minutosParaHoras(resumo.m90)} />
        <Numero rotulo="Desde o início" valor={resumo.qt} detalhe={minutosParaHoras(resumo.mt)} />
      </div>
      {resumo.linhas.length > 0 && (
        <ul className="mt-4 divide-y divide-white/10 text-sm">
          {resumo.linhas.map((l) => (
            <li key={l.nome} className="flex flex-wrap items-center justify-between gap-2 py-2">
              <span className="min-w-0">{l.nome}</span>
              <span className="text-xs text-muted-foreground">
                90 dias: {l.q90} ({minutosParaHoras(l.m90)}) · total: {l.qt} ({minutosParaHoras(l.mt)})
              </span>
            </li>
          ))}
        </ul>
      )}
    </Secao>
  );
}
