import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Link2, Plus, RefreshCw, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Cabecalho } from "@/components/comum/Cabecalho";
import { Carregando, ErroCarga, Vazio } from "@/components/comum/Estados";
import { ParceiroBusca } from "@/components/comum/ParceiroBusca";
import { Pilula, SeloEstado } from "@/components/comum/Selos";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { CLASSE_CARD } from "@/components/painel/Blocos";
import { DetalheIndicacao } from "@/components/indicacoes/DetalheIndicacao";
import { NovaIndicacaoDialog } from "@/components/indicacoes/NovaIndicacaoDialog";
import { DIAS_PARADA, indicacaoParada, SELECT_INDICACAO, slaVencidos, useEmpresasGrupo, type Indicacao } from "@/components/indicacoes/dados";
import { data, moeda } from "@/lib/formato";
import { ETAPAS_INDICACAO, ORIGENS_INDICACAO, PRAZOS_SLA, rotulo, SENTIDOS } from "@/lib/rotulos";
import { cn } from "@/lib/utils";

const TODOS = "__todos";
const PODEM_REGISTRAR = ["admin", "parcerias", "consultor", "comercial"];

type Filtros = {
  sentido: string; empresa: string; parceiro: string | null; etapa: string; origem: string; icp: string;
  de: string; ate: string; aguardando: boolean; paradas: boolean; sla: boolean; qualificadas: boolean;
};

// Indicações (História 6). Esta tela não mostra comissões; o detalhe só as consulta para quem pode vê-las.
export default function Indicacoes() {
  const { perfil } = useAuth();
  const [params, setParams] = useSearchParams();
  const { data: empresas = [] } = useEmpresasGrupo();
  const [novaAberta, setNovaAberta] = useState(false);
  const [filtros, setFiltros] = useState<Filtros>(() => ({
    sentido: TODOS, empresa: TODOS, parceiro: params.get("parceiro"), etapa: TODOS, origem: TODOS, icp: TODOS,
    de: params.get("de") ?? "", ate: params.get("ate") ?? "",
    aguardando: params.get("aguardando") === "1", paradas: params.get("paradas") === "1", sla: params.get("sla") === "1",
    qualificadas: false,
  }));
  const set = <K extends keyof Filtros>(k: K, v: Filtros[K]) => setFiltros((x) => ({ ...x, [k]: v }));
  const detalheId = params.get("id");

  // Links de outras telas (painel, ficha do parceiro) chegam por parâmetros; aplica quando mudam
  const chaveParams = ["parceiro", "de", "ate", "aguardando", "paradas", "sla"].map((k) => params.get(k) ?? "").join("|");
  useEffect(() => {
    const [parceiro, de, ate, aguardando, paradas, sla] = chaveParams.split("|");
    if (!parceiro && !de && !ate && !aguardando && !paradas && !sla) return;
    setFiltros((x) => ({
      ...x, parceiro: parceiro || x.parceiro, de: de || x.de, ate: ate || x.ate,
      aguardando: aguardando ? aguardando === "1" : x.aguardando, paradas: paradas ? paradas === "1" : x.paradas,
      sla: sla ? sla === "1" : x.sla,
    }));
  }, [chaveParams]);

  function abrirDetalhe(id: string | null) {
    const p = new URLSearchParams(params);
    if (id) p.set("id", id);
    else p.delete("id");
    setParams(p, { replace: !id });
  }

  const consulta = useQuery({
    queryKey: ["indicacoes", "lista"],
    queryFn: async () => {
      const { data: r, error } = await supabase
        .from("indicacoes")
        .select(SELECT_INDICACAO)
        .order("data", { ascending: false })
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (r ?? []) as unknown as Indicacao[];
    },
  });

  const lista = useMemo(() => {
    const f = filtros;
    return (consulta.data ?? []).filter((i) =>
      (f.sentido === TODOS || i.sentido === f.sentido)
      && (f.empresa === TODOS || i.empresa_grupo_id === f.empresa)
      && (!f.parceiro || i.parceiro_id === f.parceiro)
      && (f.etapa === TODOS || i.etapa === f.etapa)
      && (f.origem === TODOS || i.origem === f.origem)
      && (f.icp === TODOS || (f.icp === "sim" ? i.aderente_icp === true : f.icp === "nao" ? i.aderente_icp === false : i.aderente_icp == null))
      && (!f.de || i.data >= f.de)
      && (!f.ate || i.data <= f.ate)
      && (!f.aguardando || !!i.atualizacao_pendente)
      && (!f.paradas || indicacaoParada(i))
      && (!f.sla || slaVencidos(i).length > 0)
      && (!f.qualificadas || i.qualificada));
  }, [consulta.data, filtros]);

  const temFiltro = filtros.sentido !== TODOS || filtros.empresa !== TODOS || !!filtros.parceiro || filtros.etapa !== TODOS
    || filtros.origem !== TODOS || filtros.icp !== TODOS || !!filtros.de || !!filtros.ate || filtros.aguardando || filtros.paradas
    || filtros.sla || filtros.qualificadas;

  function limpar() {
    setFiltros({ sentido: TODOS, empresa: TODOS, parceiro: null, etapa: TODOS, origem: TODOS, icp: TODOS, de: "", ate: "", aguardando: false, paradas: false, sla: false, qualificadas: false });
    setParams(detalheId ? { id: detalheId } : {}, { replace: true });
  }

  const podeRegistrar = !!perfil && PODEM_REGISTRAR.includes(perfil.papel);

  return (
    <div>
      <Cabecalho
        titulo="Indicações"
        descricao="Indicações nos dois sentidos entre os parceiros e a Wise Makers, a Tríade e a Swallow."
        acoes={podeRegistrar && <Button onClick={() => setNovaAberta(true)}><Plus /> Nova indicação</Button>}
      />

      {/* Filtros */}
      <section className={cn(CLASSE_CARD, "mb-4 space-y-3 p-4")}>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Filtro rotulo="Sentido">
            <Select value={filtros.sentido} onValueChange={(v) => set("sentido", v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value={TODOS}>Todos</SelectItem>
                {Object.entries(SENTIDOS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
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
          <Filtro rotulo="Etapa">
            <Select value={filtros.etapa} onValueChange={(v) => set("etapa", v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value={TODOS}>Todas</SelectItem>
                {Object.entries(ETAPAS_INDICACAO).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
              </SelectContent>
            </Select>
          </Filtro>
          <Filtro rotulo="Origem">
            <Select value={filtros.origem} onValueChange={(v) => set("origem", v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value={TODOS}>Todas</SelectItem>
                {Object.entries(ORIGENS_INDICACAO).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
              </SelectContent>
            </Select>
          </Filtro>
          <Filtro rotulo="Aderente ao ICP">
            <Select value={filtros.icp} onValueChange={(v) => set("icp", v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value={TODOS}>Todas</SelectItem>
                <SelectItem value="sim">No ICP</SelectItem>
                <SelectItem value="nao">Fora do ICP</SelectItem>
                <SelectItem value="sem">Não avaliadas</SelectItem>
              </SelectContent>
            </Select>
          </Filtro>
          <Filtro rotulo="Período">
            <div className="flex items-center gap-2">
              <Input type="date" aria-label="De" className="min-w-0" value={filtros.de} onChange={(e) => set("de", e.target.value)} />
              <span className="text-sm text-muted-foreground">a</span>
              <Input type="date" aria-label="Até" className="min-w-0" value={filtros.ate} onChange={(e) => set("ate", e.target.value)} />
            </div>
          </Filtro>
          <div className="flex flex-col justify-end gap-2 text-sm">
            <label className="flex items-center gap-2">
              <Checkbox checked={filtros.aguardando} onCheckedChange={(c) => set("aguardando", !!c)} /> Aguardando confirmação
            </label>
            <label className="flex items-center gap-2">
              <Checkbox checked={filtros.paradas} onCheckedChange={(c) => set("paradas", !!c)} /> Paradas há {DIAS_PARADA} dias
            </label>
            <label className="flex items-center gap-2">
              <Checkbox checked={filtros.sla} onCheckedChange={(c) => set("sla", !!c)} /> SLA vencido
            </label>
            <label className="flex items-center gap-2">
              <Checkbox checked={filtros.qualificadas} onCheckedChange={(c) => set("qualificadas", !!c)} /> Qualificadas
            </label>
          </div>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-2 text-sm text-muted-foreground">
          <span>{lista.length} indicação(ões)</span>
          {temFiltro && <Button variant="ghost" size="sm" onClick={limpar}><X /> Limpar filtros</Button>}
        </div>
      </section>

      {consulta.isLoading && <Carregando />}
      {consulta.error && <ErroCarga erro={consulta.error} />}
      {consulta.isSuccess && lista.length === 0 && (
        <Vazio titulo="Nenhuma indicação encontrada">{temFiltro ? "Ajuste os filtros para ver mais resultados." : "Registre a primeira indicação."}</Vazio>
      )}

      {lista.length > 0 && (
        <>
          {/* Celular: cartões */}
          <ul className="space-y-2 md:hidden">
            {lista.map((i) => (
              <li key={i.id}>
                <button type="button" onClick={() => abrirDetalhe(i.id)}
                  className={cn(CLASSE_CARD, "w-full p-4 text-left hover:border-menta-500/40")}>
                  <div className="flex items-start justify-between gap-2">
                    <span className="min-w-0 font-semibold">{i.cliente?.razao_social}</span>
                    <SeloEstado estado={i.etapa} mapa={ETAPAS_INDICACAO} />
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">{i.parceiro?.nome_fantasia} · {i.empresa?.nome}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {data(i.data)} · {rotulo(SENTIDOS, i.sentido)} · {rotulo(ORIGENS_INDICACAO, i.origem)}
                  </p>
                  <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
                    {i.nota_qualidade != null && <span className="font-medium">Nota {i.nota_qualidade}</span>}
                    {i.valor_base != null && <span className="font-medium">{moeda(i.valor_base)}</span>}
                    {i.responsavel?.nome && <span className="text-muted-foreground">Resp.: {i.responsavel.nome}</span>}
                    <Marcadores i={i} />
                  </div>
                </button>
              </li>
            ))}
          </ul>

          {/* Computador: tabela com rolagem contida */}
          <div className={cn(CLASSE_CARD, "hidden overflow-x-auto md:block")}>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Parceiro</TableHead>
                  <TableHead>Empresa</TableHead>
                  <TableHead>Sentido</TableHead>
                  <TableHead>Origem</TableHead>
                  <TableHead>Etapa</TableHead>
                  <TableHead className="text-right">Nota</TableHead>
                  <TableHead className="text-right">Valor base</TableHead>
                  <TableHead>Responsável</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {lista.map((i) => (
                  <TableRow key={i.id} className="cursor-pointer" onClick={() => abrirDetalhe(i.id)}>
                    <TableCell className="whitespace-nowrap">{data(i.data)}</TableCell>
                    <TableCell className="max-w-[220px]">
                      <span className="block truncate font-medium">{i.cliente?.razao_social}</span>
                      <div className="mt-1 flex flex-wrap gap-1"><Marcadores i={i} /></div>
                    </TableCell>
                    <TableCell className="max-w-[180px] truncate">{i.parceiro?.nome_fantasia}</TableCell>
                    <TableCell className="whitespace-nowrap">{i.empresa?.nome}</TableCell>
                    <TableCell className="whitespace-nowrap text-xs">{i.sentido === "parceiro_para_grupo" ? "Recebida" : "Enviada"}</TableCell>
                    <TableCell className="whitespace-nowrap text-xs">{rotulo(ORIGENS_INDICACAO, i.origem)}</TableCell>
                    <TableCell><SeloEstado estado={i.etapa} mapa={ETAPAS_INDICACAO} /></TableCell>
                    <TableCell className="whitespace-nowrap text-right font-medium">{i.nota_qualidade ?? ""}</TableCell>
                    <TableCell className="whitespace-nowrap text-right">{i.valor_base != null ? moeda(i.valor_base) : ""}</TableCell>
                    <TableCell className="max-w-[140px] truncate text-xs">{i.responsavel?.nome ?? ""}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <p className="mt-2 hidden text-xs text-muted-foreground md:block">
            Recebida: do parceiro para o grupo. Enviada: do grupo para o parceiro.
          </p>
        </>
      )}

      {podeRegistrar && (
        <NovaIndicacaoDialog aberto={novaAberta} onOpenChange={setNovaAberta} parceiroInicial={filtros.parceiro}
          onCriada={(id) => abrirDetalhe(id)} />
      )}
      <DetalheIndicacao id={detalheId} onOpenChange={(a) => !a && abrirDetalhe(null)} />
    </div>
  );
}

function Marcadores({ i }: { i: Indicacao }) {
  const vencidos = slaVencidos(i);
  return (
    <>
      {i.atualizacao_pendente && <Pilula tom="alerta"><RefreshCw className="mr-1 h-3 w-3" /> Aguardando confirmação</Pilula>}
      {vencidos.length > 0 && <Pilula tom="perigo" className="whitespace-normal">SLA vencido: {vencidos.map((k) => rotulo(PRAZOS_SLA, k)).join(", ")}</Pilula>}
      {indicacaoParada(i) && <Pilula tom="perigo">Parada</Pilula>}
      {i.qualificada ? <Pilula tom="menta">Qualificada</Pilula> : i.icp_confirmado ? <Pilula tom="menta">ICP confirmado</Pilula>
        : i.aderente_icp === true && <Pilula tom="menta">ICP</Pilula>}
      {i.link_id && <Pilula tom="info"><Link2 className="mr-1 h-3 w-3" /> Link</Pilula>}
      {i.protecao_expirada && <Pilula>Proteção expirada</Pilula>}
    </>
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
