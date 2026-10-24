import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Info, Loader2, Plus, X } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Cabecalho } from "@/components/comum/Cabecalho";
import { Carregando, ErroCarga, Vazio } from "@/components/comum/Estados";
import { ParceiroBusca } from "@/components/comum/ParceiroBusca";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Barra, CLASSE_CARD, Indicador } from "@/components/painel/Blocos";
import { calcularPeriodo, SeletorPeriodo, type Periodo } from "@/components/painel/periodo";
import { toastErro } from "@/lib/erros";
import { Pilula } from "@/components/comum/Selos";
import { data, hojeISO, minutosParaHoras, moeda } from "@/lib/formato";
import { ETAPAS_JORNADA, rotulo } from "@/lib/rotulos";
import { cn } from "@/lib/utils";

type TipoAtividade = { id: string; nome: string; minutos: number; ordem: number; etapa_jornada: string | null };
type Atividade = {
  id: string; data: string; minutos: number; descricao: string | null; parceiro_id: string | null; pessoa_id: string | null;
  etapa_jornada: string | null; custo?: { custo: number | null; custo_hora: number | null } | null;
  tipo: { nome: string } | null; parceiro: { id: string; nome_fantasia: string } | null; pessoa: { nome: string } | null;
};
type Visao = "parceiro" | "pessoa" | "tipo" | "etapa" | "lista";
type Grupo = { chave: string; nome: string; link?: string; quantidade: number; minutos: number; custo: number };

const TODAS = "__todas";
const SEM_ETAPA = "__sem";

// Custo da atividade (só vem preenchido para administradores); nulo quando a pessoa não tem custo-hora
function custoDe(a: Atividade): number | null {
  const c = Array.isArray(a.custo) ? a.custo[0] : a.custo;
  return c && c.custo !== null && c.custo !== undefined ? Number(c.custo) : null;
}

const PODEM_REGISTRAR = ["admin", "parcerias", "consultor"];

function useTiposAtividade() {
  return useQuery({
    queryKey: ["tipos-atividade"],
    staleTime: 5 * 60_000,
    queryFn: async () => {
      const { data: r, error } = await supabase.from("tipos_atividade").select("id, nome, minutos, ordem, etapa_jornada").eq("ativo", true).order("ordem");
      if (error) throw error;
      return (r ?? []) as TipoAtividade[];
    },
  });
}

// Atividades (FR-060): quantidade e tempo estimado por parceiro, por pessoa e por tipo. Só informativo, sem limite de horas.
export default function Atividades() {
  const { perfil, isAdmin } = useAuth();
  const [etapa, setEtapa] = useState(TODAS);
  const [periodo, setPeriodo] = useState<Periodo>(() => calcularPeriodo("30d"));
  const [visao, setVisao] = useState<Visao>("parceiro");
  const [novaAberta, setNovaAberta] = useState(false);

  const consulta = useQuery({
    queryKey: ["atividades", periodo.inicio, periodo.fim, isAdmin],
    queryFn: async () => {
      const { data: r, error } = await supabase
        .from("atividades")
        // O custo da atividade (atividades_custo) só é lido por administradores; para os demais nem é pedido
        .select(`id, data, minutos, descricao, parceiro_id, pessoa_id, etapa_jornada, tipo:tipos_atividade(nome), parceiro:parceiros(id, nome_fantasia), pessoa:perfis!atividades_pessoa_id_fkey(nome)${isAdmin ? ", custo:atividades_custo(custo, custo_hora)" : ""}`)
        .gte("data", periodo.inicio)
        .lte("data", periodo.fim)
        .order("data", { ascending: false });
      if (error) throw error;
      return (r ?? []) as unknown as Atividade[];
    },
  });
  const atividades = useMemo(
    () => (consulta.data ?? []).filter((a) => etapa === TODAS || (etapa === SEM_ETAPA ? !a.etapa_jornada : a.etapa_jornada === etapa)),
    [consulta.data, etapa],
  );

  const grupos = useMemo(() => {
    if (visao === "lista") return [];
    const mapa = new Map<string, Grupo>();
    for (const a of atividades) {
      let g: Omit<Grupo, "quantidade" | "minutos" | "custo">;
      if (visao === "parceiro") {
        g = a.parceiro
          ? { chave: a.parceiro.id, nome: a.parceiro.nome_fantasia, link: `/app/parceiros/${a.parceiro.id}` }
          : { chave: "__sem", nome: "Sem parceiro (atividades internas)" };
      } else if (visao === "pessoa") {
        g = { chave: a.pessoa_id ?? "__sem", nome: a.pessoa?.nome ?? "Sem pessoa" };
      } else if (visao === "etapa") {
        g = { chave: a.etapa_jornada ?? "__sem", nome: a.etapa_jornada ? rotulo(ETAPAS_JORNADA, a.etapa_jornada) : "Sem etapa da jornada" };
      } else {
        g = { chave: a.tipo?.nome ?? "__sem", nome: a.tipo?.nome ?? "Sem tipo" };
      }
      const atual = mapa.get(g.chave) ?? { ...g, quantidade: 0, minutos: 0, custo: 0 };
      atual.quantidade += 1;
      atual.minutos += Number(a.minutos ?? 0);
      atual.custo += Number(custoDe(a) ?? 0);
      mapa.set(g.chave, atual);
    }
    return [...mapa.values()].sort((a, b) => b.minutos - a.minutos);
  }, [atividades, visao]);

  const totalMin = atividades.reduce((s, a) => s + Number(a.minutos ?? 0), 0);
  const parceiros = new Set(atividades.map((a) => a.parceiro_id).filter(Boolean)).size;
  const custoTotal = atividades.reduce((s, a) => s + Number(custoDe(a) ?? 0), 0);
  const semCusto = atividades.filter((a) => isAdmin && custoDe(a) === null).length;
  const maximo = Math.max(1, ...grupos.map((g) => g.minutos));
  const podeRegistrar = !!perfil && PODEM_REGISTRAR.includes(perfil.papel);

  return (
    <div>
      <Cabecalho
        titulo="Atividades"
        descricao="Esforço por parceiro, por pessoa, por tipo e por etapa da jornada."
        acoes={podeRegistrar && <Button onClick={() => setNovaAberta(true)}><Plus /> Registrar atividade</Button>}
      />

      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <SeletorPeriodo valor={periodo} onChange={setPeriodo} />
        <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Info className="h-3.5 w-3.5 shrink-0" /> Tempo estimado apenas informativo. Não há limite de horas nem alerta.
        </p>
      </div>

      <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center">
        <Select value={etapa} onValueChange={setEtapa}>
          <SelectTrigger className="w-full sm:w-64" aria-label="Etapa da jornada"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value={TODAS}>Todas as etapas da jornada</SelectItem>
            {Object.entries(ETAPAS_JORNADA).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
            <SelectItem value={SEM_ETAPA}>Sem etapa</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className={cn("mb-4 grid grid-cols-1 gap-3", isAdmin ? "sm:grid-cols-2 lg:grid-cols-4" : "sm:grid-cols-3")}>
        <Indicador rotulo="Atividades no período" valor={atividades.length} />
        <Indicador rotulo="Tempo estimado" valor={minutosParaHoras(totalMin)} />
        <Indicador rotulo="Parceiros envolvidos" valor={parceiros} />
        {isAdmin && (
          <Indicador rotulo="Custo das horas" valor={moeda(custoTotal)}
            detalhe={semCusto > 0 ? `${semCusto} ${semCusto === 1 ? "atividade" : "atividades"} sem custo-hora informado` : "Visível só para administradores"} />
        )}
      </div>

      <Tabs value={visao} onValueChange={(v) => setVisao(v as Visao)} className="mb-4">
        <TabsList className="h-auto flex-wrap">
          <TabsTrigger value="parceiro">Por parceiro</TabsTrigger>
          <TabsTrigger value="pessoa">Por pessoa</TabsTrigger>
          <TabsTrigger value="tipo">Por tipo</TabsTrigger>
          <TabsTrigger value="etapa">Por etapa</TabsTrigger>
          <TabsTrigger value="lista">Lista</TabsTrigger>
        </TabsList>
      </Tabs>

      {consulta.isLoading && <Carregando />}
      {consulta.error && <ErroCarga erro={consulta.error} />}
      {consulta.isSuccess && atividades.length === 0 && <Vazio titulo="Nenhuma atividade no período" />}

      {visao !== "lista" && grupos.length > 0 && (
        <ul className={cn(CLASSE_CARD, "divide-y divide-white/10")}>
          {grupos.map((g) => (
            <li key={g.chave} className="p-4">
              <div className="flex items-baseline justify-between gap-3">
                {g.link
                  ? <Link to={g.link} className="min-w-0 truncate font-medium hover:text-menta-400">{g.nome}</Link>
                  : <span className="min-w-0 truncate font-medium">{g.nome}</span>}
                <span className="shrink-0 text-sm text-muted-foreground">
                  {g.quantidade} {g.quantidade === 1 ? "atividade" : "atividades"} · {minutosParaHoras(g.minutos)}
                  {isAdmin && g.custo > 0 ? ` · ${moeda(g.custo)}` : ""}
                </span>
              </div>
              <Barra valor={g.minutos} maximo={maximo} className="mt-2 h-1.5" cor="bg-menta-500/70" />
            </li>
          ))}
        </ul>
      )}

      {visao === "lista" && atividades.length > 0 && (
        <ul className="space-y-2">
          {atividades.map((a) => (
            <li key={a.id} className={cn(CLASSE_CARD, "p-3 text-sm")}>
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <span className="flex flex-wrap items-center gap-2">
                  <span className="font-medium">{a.tipo?.nome}</span>
                  {a.etapa_jornada && <Pilula>{rotulo(ETAPAS_JORNADA, a.etapa_jornada)}</Pilula>}
                </span>
                <span className="text-xs text-muted-foreground">
                  {data(a.data)} · {minutosParaHoras(a.minutos)}
                  {isAdmin && (custoDe(a) === null
                    ? <span className="text-warning"> · custo não informado</span>
                    : <span className="font-semibold text-foreground"> · {moeda(custoDe(a))}</span>)}
                </span>
              </div>
              <p className="text-muted-foreground">
                {a.parceiro ? <Link to={`/app/parceiros/${a.parceiro.id}`} className="hover:text-menta-400">{a.parceiro.nome_fantasia}</Link> : "Sem parceiro"}
                {a.pessoa?.nome ? ` · ${a.pessoa.nome}` : ""}
              </p>
              {a.descricao && <p className="mt-1 break-words text-xs text-muted-foreground">{a.descricao}</p>}
            </li>
          ))}
        </ul>
      )}

      {podeRegistrar && <NovaAtividadeDialog aberto={novaAberta} onOpenChange={setNovaAberta} />}
    </div>
  );
}

// Registro de atividade, com ou sem parceiro (por exemplo, "Revisão semanal com o Diretor").
function NovaAtividadeDialog({ aberto, onOpenChange }: { aberto: boolean; onOpenChange: (v: boolean) => void }) {
  const { perfil } = useAuth();
  const qc = useQueryClient();
  const { data: tipos = [] } = useTiposAtividade();
  const [tipoId, setTipoId] = useState("");
  const [dataAtv, setDataAtv] = useState(hojeISO());
  const [minutos, setMinutos] = useState("");
  const [parceiroId, setParceiroId] = useState<string | null>(null);
  const [descricao, setDescricao] = useState("");

  useEffect(() => {
    if (aberto) {
      setTipoId("");
      setDataAtv(hojeISO());
      setMinutos("");
      setParceiroId(null);
      setDescricao("");
    }
  }, [aberto]);

  function escolherTipo(id: string) {
    setTipoId(id);
    const t = tipos.find((x) => x.id === id);
    if (t) setMinutos(String(t.minutos));
  }

  const salvar = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("atividades").insert({
        tipo_atividade_id: tipoId,
        data: dataAtv,
        minutos: Number(minutos),
        pessoa_id: perfil!.id,
        parceiro_id: parceiroId,
        descricao: descricao.trim() || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Atividade registrada.");
      qc.invalidateQueries({ queryKey: ["atividades"] });
      qc.invalidateQueries({ queryKey: ["painel"] });
      onOpenChange(false);
    },
    onError: toastErro,
  });

  const valido = !!tipoId && !!dataAtv && Number(minutos) > 0;

  return (
    <Dialog open={aberto} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] w-[calc(100vw-2rem)] max-w-md overflow-y-auto rounded-[14px]">
        <DialogHeader>
          <DialogTitle>Registrar atividade</DialogTitle>
          <DialogDescription>Para atividades sem ponto de contato com parceiro. Contatos registrados já geram a atividade.</DialogDescription>
        </DialogHeader>
        <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); if (valido) salvar.mutate(); }}>
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Tipo</Label>
            <Select value={tipoId} onValueChange={escolherTipo}>
              <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
              <SelectContent>
                {tipos.map((t) => (
                  <SelectItem key={t.id} value={t.id}>
                    {t.nome} ({minutosParaHoras(t.minutos)}{t.etapa_jornada ? ` · ${rotulo(ETAPAS_JORNADA, t.etapa_jornada)}` : ""})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Data</Label>
              <Input type="date" value={dataAtv} onChange={(e) => setDataAtv(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Minutos estimados</Label>
              <Input type="number" inputMode="numeric" min="1" value={minutos} onChange={(e) => setMinutos(e.target.value)} />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Parceiro (opcional)</Label>
            <div className="flex gap-1">
              <ParceiroBusca valor={parceiroId} onChange={setParceiroId} placeholder="Sem parceiro" />
              {parceiroId && <Button type="button" variant="ghost" size="icon" aria-label="Sem parceiro" onClick={() => setParceiroId(null)}><X /></Button>}
            </div>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Descrição (opcional)</Label>
            <Textarea rows={2} value={descricao} onChange={(e) => setDescricao(e.target.value)} />
          </div>
          <DialogFooter className="gap-2">
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>Cancelar</Button>
            <Button type="submit" disabled={!valido || salvar.isPending}>
              {salvar.isPending && <Loader2 className="animate-spin" />} Registrar
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
