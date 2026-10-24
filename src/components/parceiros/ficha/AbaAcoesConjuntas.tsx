import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, ExternalLink, Info as InfoIcon, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Carregando, ErroCarga, Vazio } from "@/components/comum/Estados";
import { Pilula } from "@/components/comum/Selos";
import { ok, toastErro } from "@/lib/erros";
import { data, hojeISO } from "@/lib/formato";
import { ESTADOS_ACAO_WISE, ESTADOS_CONTRAPARTIDA, PERIODICIDADES, TIPOS_ACAO, rotulo } from "@/lib/rotulos";
import { cn } from "@/lib/utils";
import { Campo } from "../ui";
import { invalidarParceiro, nomePerfil, usePerfis } from "../dados";
import { vencida } from "./v2";

type Acao = {
  id: string; parceiro_id: string; lado: "parceiro" | "wise"; nome: string; tipo: string; periodicidade: string;
  data_prevista: string | null; estado: string; concluida_em: string | null; comprovacao_esperada: string | null;
  resultado: { alcance?: number; inscritos?: number } | null; ativa: boolean;
};
type AcaoWise = { id: string; responsavel_id: string | null; comprovacao_link: string | null; observacao: string | null };

const TODOS = "todos";
type Tom = "menta" | "alerta" | "perigo" | "neutro" | "info";
const TOM_ESTADO: Record<string, Tom> = {
  planejada: "neutro", feita: "info", comprovada: "menta", atrasada: "alerta", cancelada: "neutro",
  pendente: "neutro", enviada: "info", validada: "menta", recusada: "perigo",
};

// Plano de ações conjuntas (História 11): contrapartidas (lado do parceiro) e ações da Wise, por mês.
export function AbaAcoesConjuntas({ parceiroId }: { parceiroId: string }) {
  const { isParcerias } = useAuth();
  const { data: perfis = [] } = usePerfis();
  const [lado, setLado] = useState(TODOS);
  const [inativas, setInativas] = useState(false);
  const [concluir, setConcluir] = useState<Acao | null>(null);
  const q = useQuery({
    queryKey: ["parceiro", parceiroId, "acoes-conjuntas"],
    queryFn: async () => {
      const [v, w] = await Promise.all([
        supabase.from("v_acoes_conjuntas").select("*").eq("parceiro_id", parceiroId),
        supabase.from("acoes_wise").select("id, responsavel_id, comprovacao_link, observacao").eq("parceiro_id", parceiroId),
      ]);
      return { acoes: ok(v) as Acao[], wise: new Map((ok(w) as AcaoWise[]).map((a) => [a.id, a])) };
    },
  });

  const grupos = useMemo(() => {
    const lista = (q.data?.acoes ?? [])
      .filter((a) => (lado === TODOS || a.lado === lado) && (inativas || a.ativa))
      .sort((a, b) => (a.data_prevista ?? "9999").localeCompare(b.data_prevista ?? "9999") || a.nome.localeCompare(b.nome));
    const mapa = new Map<string, Acao[]>();
    for (const a of lista) {
      const k = a.data_prevista ? a.data_prevista.slice(0, 7) : "sem-data";
      mapa.set(k, [...(mapa.get(k) ?? []), a]);
    }
    return [...mapa.entries()];
  }, [q.data, lado, inativas]);

  if (q.isLoading) return <Carregando />;
  if (q.error) return <ErroCarga erro={q.error} />;
  const todas = q.data?.acoes ?? [];
  const atrasadasWise = todas.filter((a) => a.lado === "wise" && a.ativa && a.estado === "atrasada").length;

  return (
    <div className="space-y-4">
      <p className="flex items-start gap-2 rounded-[10px] border border-white/10 bg-card p-3 text-sm text-muted-foreground">
        <InfoIcon className="mt-0.5 h-4 w-4 shrink-0 text-menta-400" />
        <span>
          O plano junta as ações do parceiro (contrapartidas) e as da Wise. Comprovações das contrapartidas ficam na aba{" "}
          <Link to={`/app/parceiros/${parceiroId}?aba=contrapartidas`} className="text-menta-400 hover:underline">Contrapartidas</Link>.
        </span>
      </p>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <Select value={lado} onValueChange={setLado}>
            <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value={TODOS}>Os dois lados</SelectItem>
              <SelectItem value="parceiro">Lado do parceiro</SelectItem>
              <SelectItem value="wise">Lado da Wise</SelectItem>
            </SelectContent>
          </Select>
          <label className="flex items-center gap-2 text-sm"><Switch checked={inativas} onCheckedChange={setInativas} /> Mostrar inativas</label>
        </div>
        {atrasadasWise > 0 && <Pilula tom="alerta">{atrasadasWise} {atrasadasWise === 1 ? "ação da Wise atrasada" : "ações da Wise atrasadas"}</Pilula>}
      </div>

      {grupos.length === 0 ? (
        <Vazio titulo="Nenhuma ação no plano.">As ações dos dois lados são geradas na assinatura, conforme o pacote.</Vazio>
      ) : grupos.map(([mes, acoes]) => (
        <section key={mes} className="min-w-0">
          <h3 className="mb-2 text-sm font-semibold capitalize text-neutro-300">
            {mes === "sem-data" ? "Sem data definida (contínuas, por ciclo ou por ação)" : format(new Date(`${mes}-15T12:00:00`), "MMMM 'de' yyyy", { locale: ptBR })}
          </h3>
          <ul className="space-y-2">
            {acoes.map((a) => {
              const w = a.lado === "wise" ? q.data?.wise.get(a.id) : undefined;
              const aberta = a.lado === "wise" ? ["planejada", "atrasada"].includes(a.estado) : !["validada"].includes(a.estado);
              const atrasada = a.estado === "atrasada" || (aberta && a.ativa && vencida(a.data_prevista) && a.lado === "wise");
              return (
                <li key={`${a.lado}-${a.id}`} className={cn("min-w-0 rounded-[14px] border bg-card p-3 text-sm",
                  atrasada && a.ativa ? "border-warning/50" : "border-white/10", !a.ativa && "opacity-60")}>
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <Pilula tom={a.lado === "wise" ? "info" : "menta"}>{a.lado === "wise" ? "Wise" : "Parceiro"}</Pilula>
                        <span className="break-words font-medium">{a.nome}</span>
                      </div>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {a.lado === "wise" ? rotulo(TIPOS_ACAO, a.tipo) : "Contrapartida"} · {rotulo(PERIODICIDADES, a.periodicidade)}
                        {a.data_prevista ? ` · prevista para ${data(a.data_prevista)}` : ""}
                        {a.comprovacao_esperada ? ` · comprovação: ${a.comprovacao_esperada}` : ""}
                        {w?.responsavel_id ? ` · ${nomePerfil(perfis, w.responsavel_id)}` : ""}
                      </p>
                      {a.concluida_em && (
                        <p className="mt-1 text-xs text-menta-300">
                          Concluída em {data(a.concluida_em)}
                          {a.resultado?.alcance != null ? ` · alcance ${a.resultado.alcance}` : ""}
                          {a.resultado?.inscritos != null ? ` · ${a.resultado.inscritos} inscritos` : ""}
                        </p>
                      )}
                      {w?.comprovacao_link && (
                        <a href={w.comprovacao_link} target="_blank" rel="noreferrer" className="mt-1 inline-flex max-w-full items-center gap-1 break-all text-xs text-menta-400 underline">
                          <ExternalLink className="h-3 w-3 shrink-0" /> {w.comprovacao_link}
                        </a>
                      )}
                      {w?.observacao && <p className="mt-1 whitespace-pre-wrap break-words text-xs text-muted-foreground">{w.observacao}</p>}
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      {!a.ativa && <Pilula>Inativa</Pilula>}
                      <Pilula tom={TOM_ESTADO[a.estado] ?? "neutro"}>
                        {a.lado === "wise" ? rotulo(ESTADOS_ACAO_WISE, a.estado) : rotulo(ESTADOS_CONTRAPARTIDA, a.estado)}
                      </Pilula>
                      {isParcerias && a.lado === "wise" && a.ativa && aberta && (
                        <Button size="sm" variant="outline" onClick={() => setConcluir(a)}><CheckCircle2 /> Concluir</Button>
                      )}
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        </section>
      ))}

      {concluir && <ConcluirAcaoWise parceiroId={parceiroId} acao={concluir} onFechar={() => setConcluir(null)} />}
    </div>
  );
}

function ConcluirAcaoWise({ parceiroId, acao, onFechar }: { parceiroId: string; acao: Acao; onFechar: () => void }) {
  const { isAdmin } = useAuth();
  const qc = useQueryClient();
  const [f, setF] = useState({ data: hojeISO(), link: "", alcance: "", inscritos: "", observacao: "", custo: "" });
  const [salvando, setSalvando] = useState(false);
  const set = (k: keyof typeof f, v: string) => setF((x) => ({ ...x, [k]: v }));

  async function salvar() {
    const num = (v: string) => (v.trim() === "" ? undefined : Number(v.replace(",", ".")));
    const alcance = num(f.alcance);
    const inscritos = num(f.inscritos);
    const custo = num(f.custo);
    if ([alcance, inscritos, custo].some((v) => v !== undefined && (Number.isNaN(v) || v < 0))) {
      toast.error("Alcance, inscritos e custo precisam ser números.");
      return;
    }
    const resultado: Record<string, number> = {};
    if (alcance !== undefined) resultado.alcance = alcance;
    if (inscritos !== undefined) resultado.inscritos = inscritos;
    const p: Record<string, any> = { data: f.data || hojeISO() };
    if (f.link.trim()) p.comprovacao_link = f.link.trim();
    if (f.observacao.trim()) p.observacao = f.observacao.trim();
    // O banco lê o resultado em "resultado"; alcance e inscritos também vão soltos, como na referência da API
    if (Object.keys(resultado).length) Object.assign(p, { resultado, ...resultado });
    if (isAdmin && custo) p.custo = custo;
    setSalvando(true);
    const { error } = await supabase.rpc("concluir_acao_wise", { p_id: acao.id, p });
    setSalvando(false);
    if (error) return toastErro(error);
    toast.success(f.link.trim() ? "Ação concluída e comprovada." : "Ação concluída.");
    qc.invalidateQueries({ queryKey: ["parceiro", parceiroId, "acoes-conjuntas"] });
    qc.invalidateQueries({ queryKey: ["pendencias"] });
    invalidarParceiro(qc, parceiroId);
    onFechar();
  }

  return (
    <Dialog open onOpenChange={(v) => !v && onFechar()}>
      <DialogContent className="max-h-[100dvh] max-w-md overflow-y-auto sm:max-h-[90vh] sm:rounded-[14px]">
        <DialogHeader>
          <DialogTitle>Concluir ação da Wise</DialogTitle>
          <DialogDescription>{acao.nome}{acao.comprovacao_esperada ? `. Comprovação esperada: ${acao.comprovacao_esperada}.` : "."}</DialogDescription>
        </DialogHeader>
        <div className="grid gap-3 sm:grid-cols-2">
          <Campo rotulo="Data da conclusão" obrigatorio>
            <Input type="date" value={f.data} onChange={(e) => set("data", e.target.value)} />
          </Campo>
          <Campo rotulo="Link da comprovação" dica="Com link, a ação fica comprovada.">
            <Input type="url" placeholder="https://" value={f.link} onChange={(e) => set("link", e.target.value)} />
          </Campo>
          <Campo rotulo="Alcance">
            <Input inputMode="numeric" value={f.alcance} onChange={(e) => set("alcance", e.target.value)} />
          </Campo>
          <Campo rotulo="Inscritos">
            <Input inputMode="numeric" value={f.inscritos} onChange={(e) => set("inscritos", e.target.value)} />
          </Campo>
          {isAdmin && (
            <Campo rotulo="Custo direto (R$)" dica="Lança o custo direto ligado ao parceiro e à ação." className="sm:col-span-2">
              <Input inputMode="decimal" value={f.custo} onChange={(e) => set("custo", e.target.value)} placeholder="0,00" />
            </Campo>
          )}
          <Campo rotulo="Observação" className="sm:col-span-2">
            <Textarea rows={2} value={f.observacao} onChange={(e) => set("observacao", e.target.value)} />
          </Campo>
        </div>
        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onFechar}>Cancelar</Button>
          <Button onClick={salvar} disabled={salvando}>{salvando && <Loader2 className="animate-spin" />} Concluir</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
