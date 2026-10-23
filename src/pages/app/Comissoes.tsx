import { useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Lock, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Cabecalho } from "@/components/comum/Cabecalho";
import { Carregando, ErroCarga, Vazio } from "@/components/comum/Estados";
import { ParceiroBusca } from "@/components/comum/ParceiroBusca";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CLASSE_CARD, Indicador } from "@/components/painel/Blocos";
import { ComissaoItem } from "@/components/comissoes/ComissaoItem";
import { EstadoComissaoDialog } from "@/components/comissoes/EstadoComissaoDialog";
import { ESTADOS_TODOS, SELECT_COMISSAO, somar, type Comissao } from "@/components/comissoes/dados";
import { useEmpresasGrupo } from "@/components/indicacoes/dados";
import { moeda } from "@/lib/formato";
import { BENEFICIARIOS, ESTADOS_COMISSAO } from "@/lib/rotulos";
import { cn } from "@/lib/utils";

const TODOS = "__todos";
type Aba = "pagar" | "receber" | "todas";
type Filtros = { estado: string; beneficiario: string; empresa: string; parceiro: string | null; de: string; ate: string };
const FILTROS_VAZIOS: Filtros = { estado: TODOS, beneficiario: TODOS, empresa: TODOS, parceiro: null, de: "", ate: "" };

// Comissões: admin e parcerias veem tudo; o financeiro vê o que a RLS devolve ("a pagar" em diante) e só marca nota e pagamento.
export default function Comissoes() {
  const { perfil, veComissao } = useAuth();
  const financeiro = perfil?.papel === "financeiro";
  if (!veComissao && !financeiro) {
    return (
      <div>
        <Cabecalho titulo="Comissões" />
        <Vazio titulo="Sem permissão">
          <span className="inline-flex items-center gap-1"><Lock className="h-4 w-4" /> Valores de comissão são visíveis só para o time de parcerias, administradores e o financeiro.</span>
        </Vazio>
      </div>
    );
  }
  return <TelaComissoes modo={financeiro ? "financeiro" : "parcerias"} />;
}

function TelaComissoes({ modo }: { modo: "parcerias" | "financeiro" }) {
  const [params, setParams] = useSearchParams();
  const { data: empresas = [] } = useEmpresasGrupo();
  const abaParam = params.get("aba") as Aba | null;
  const aba: Aba = abaParam === "todas" || (abaParam === "receber" && modo === "parcerias") ? abaParam : "pagar";
  const [filtros, setFiltros] = useState<Filtros>(FILTROS_VAZIOS);
  const set = <K extends keyof Filtros>(k: K, v: Filtros[K]) => setFiltros((x) => ({ ...x, [k]: v }));
  const [edicao, setEdicao] = useState<{ c: Comissao; estados: string[]; inicial?: string } | null>(null);

  const consulta = useQuery({
    queryKey: ["comissoes", "lista"],
    queryFn: async () => {
      const { data, error } = await supabase.from("comissoes").select(SELECT_COMISSAO).order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as Comissao[];
    },
  });
  const todas = useMemo(() => consulta.data ?? [], [consulta.data]);

  const lista = useMemo(() => {
    let l = todas;
    if (aba === "pagar") l = l.filter((c) => c.beneficiario !== "grupo" && (c.estado === "a_pagar" || c.estado === "nf_recebida"));
    if (aba === "receber") l = l.filter((c) => c.beneficiario === "grupo" && c.estado !== "paga" && c.estado !== "cancelada");
    if (aba === "todas") {
      const f = filtros;
      l = l.filter((c) =>
        (f.estado === TODOS || c.estado === f.estado)
        && (f.beneficiario === TODOS || c.beneficiario === f.beneficiario)
        && (f.empresa === TODOS || c.indicacao?.empresa?.id === f.empresa)
        && (!f.parceiro || c.parceiro_id === f.parceiro)
        && (!f.de || (c.indicacao?.data ?? "") >= f.de)
        && (!f.ate || (c.indicacao?.data ?? "") <= f.ate));
    }
    // A pagar: as mais antigas primeiro
    if (aba === "pagar") l = [...l].sort((a, b) => (a.a_pagar_em ?? "").localeCompare(b.a_pagar_em ?? ""));
    return l;
  }, [todas, aba, filtros]);

  const pagaveis = (c: Comissao) => c.beneficiario !== "grupo";
  const totais = modo === "parcerias"
    ? [
      { rotulo: "A pagar", valor: somar(todas, (c) => pagaveis(c) && ["a_pagar", "nf_recebida"].includes(c.estado)) },
      { rotulo: "Aguardando fechamento ou compensação", valor: somar(todas, (c) => pagaveis(c) && ["aguardando_fechamento", "aguardando_compensacao"].includes(c.estado)) },
      { rotulo: "Pagas", valor: somar(todas, (c) => pagaveis(c) && c.estado === "paga") },
      { rotulo: "A receber do parceiro", valor: somar(todas, (c) => !pagaveis(c) && !["paga", "cancelada"].includes(c.estado)) },
    ]
    : [
      { rotulo: "A pagar", valor: somar(todas, (c) => c.estado === "a_pagar") },
      { rotulo: "Nota fiscal recebida", valor: somar(todas, (c) => c.estado === "nf_recebida") },
      { rotulo: "Pagas", valor: somar(todas, (c) => c.estado === "paga") },
    ];

  function mudarAba(v: string) {
    const p = new URLSearchParams(params);
    p.set("aba", v);
    setParams(p, { replace: true });
  }

  const temFiltro = JSON.stringify(filtros) !== JSON.stringify(FILTROS_VAZIOS);

  return (
    <div>
      <Cabecalho
        titulo="Comissões"
        descricao={modo === "financeiro"
          ? "Comissões a pagar. Registre o recebimento da nota fiscal e o pagamento."
          : "Comissões a pagar aos parceiros e responsáveis e a receber dos parceiros."}
      />

      <div className={cn("mb-4 grid gap-3", modo === "parcerias" ? "grid-cols-2 lg:grid-cols-4" : "grid-cols-1 sm:grid-cols-3")}>
        {totais.map((t) => (
          <Indicador key={t.rotulo} rotulo={t.rotulo} valor={moeda(t.valor)} />
        ))}
      </div>

      <Tabs value={aba} onValueChange={mudarAba} className="mb-4">
        <TabsList className="h-auto flex-wrap">
          <TabsTrigger value="pagar">A pagar</TabsTrigger>
          {modo === "parcerias" && <TabsTrigger value="receber">A receber</TabsTrigger>}
          <TabsTrigger value="todas">Todas</TabsTrigger>
        </TabsList>
      </Tabs>

      {aba === "todas" && (
        <section className={cn(CLASSE_CARD, "mb-4 space-y-3 p-4")}>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <Filtro rotulo="Estado">
              <Select value={filtros.estado} onValueChange={(v) => set("estado", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value={TODOS}>Todos</SelectItem>
                  {(modo === "financeiro" ? ["a_pagar", "nf_recebida", "paga"] : ESTADOS_TODOS).map((e) => (
                    <SelectItem key={e} value={e}>{ESTADOS_COMISSAO[e]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Filtro>
            <Filtro rotulo="Beneficiário">
              <Select value={filtros.beneficiario} onValueChange={(v) => set("beneficiario", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value={TODOS}>Todos</SelectItem>
                  {Object.entries(BENEFICIARIOS)
                    .filter(([k]) => modo === "parcerias" || k !== "grupo")
                    .map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                </SelectContent>
              </Select>
            </Filtro>
            <Filtro rotulo="Empresa do grupo">
              <Select value={filtros.empresa} onValueChange={(v) => set("empresa", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value={TODOS}>Todas</SelectItem>
                  {empresas.map((e) => <SelectItem key={e.id} value={e.id}>{e.nome}</SelectItem>)}
                </SelectContent>
              </Select>
            </Filtro>
            <Filtro rotulo="Parceiro">
              <div className="flex gap-1">
                <ParceiroBusca valor={filtros.parceiro} onChange={(v) => set("parceiro", v)} placeholder="Todos" />
                {filtros.parceiro && (
                  <Button variant="ghost" size="icon" aria-label="Limpar parceiro" onClick={() => set("parceiro", null)}><X /></Button>
                )}
              </div>
            </Filtro>
            <Filtro rotulo="Período da indicação">
              <div className="flex items-center gap-2">
                <Input type="date" aria-label="De" className="min-w-0" value={filtros.de} onChange={(e) => set("de", e.target.value)} />
                <span className="text-sm text-muted-foreground">a</span>
                <Input type="date" aria-label="Até" className="min-w-0" value={filtros.ate} onChange={(e) => set("ate", e.target.value)} />
              </div>
            </Filtro>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-2 text-sm text-muted-foreground">
            <span>{lista.length} comissão(ões) · {moeda(somar(lista, () => true))}</span>
            {temFiltro && <Button variant="ghost" size="sm" onClick={() => setFiltros(FILTROS_VAZIOS)}><X /> Limpar filtros</Button>}
          </div>
        </section>
      )}

      {consulta.isLoading && <Carregando />}
      {consulta.error && <ErroCarga erro={consulta.error} />}
      {consulta.isSuccess && lista.length === 0 && (
        <Vazio titulo={aba === "pagar" ? "Nenhuma comissão a pagar" : aba === "receber" ? "Nada a receber" : "Nenhuma comissão encontrada"} />
      )}

      <ul className="space-y-3">
        {lista.map((c) => (
          <ComissaoItem key={c.id} c={c} modo={modo} onMudarEstado={(c, estados, inicial) => setEdicao({ c, estados, inicial })} />
        ))}
      </ul>

      <EstadoComissaoDialog
        comissao={edicao?.c ?? null}
        estados={edicao?.estados ?? []}
        estadoInicial={edicao?.inicial}
        onOpenChange={(a) => !a && setEdicao(null)}
      />
    </div>
  );
}

function Filtro({ rotulo: r, children }: { rotulo: string; children: React.ReactNode }) {
  return (
    <div className="min-w-0 space-y-1.5">
      <Label className="text-xs text-muted-foreground">{r}</Label>
      {children}
    </div>
  );
}
