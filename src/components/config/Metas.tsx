import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ArrowRight, Info, Loader2, Save, Split, TriangleAlert } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Carregando, ErroCarga, Vazio } from "@/components/comum/Estados";
import { Pilula } from "@/components/comum/Selos";
import { CLASSE_CARD } from "@/components/painel/Blocos";
import { Aviso } from "@/components/gestao/Restrito";
import { rotuloTrimestre, trimestreDe, trimestresProximos, usePessoasInternas } from "@/components/gestao/dados";
import { numero } from "@/components/gestao/formato";
import { INDICADORES_PESSOA } from "@/components/metas/dados";
import { ok, toastErro } from "@/lib/erros";
import { hojeISO } from "@/lib/formato";
import { ETAPAS_PAINEL, FASES_PROGRAMA, PAPEIS, rotulo } from "@/lib/rotulos";
import { cn } from "@/lib/utils";
import { TabelaConfig, type ColunaConfig, type Opcao } from "./TabelaConfig";

// Metas em cascata (revisão de 28/10/2026): um único cadastro, por trimestre.
// Programa (Wise) se divide entre as pessoas e vira objetivos para cada parceiro. As outras telas só mostram.

const hoje = () => new Date(hojeISO() + "T12:00:00");

function SeletorTrimestre({ valor, onChange }: { valor: string; onChange: (v: string) => void }) {
  return (
    <Select value={valor} onValueChange={onChange}>
      <SelectTrigger className="w-full sm:w-60" aria-label="Trimestre"><SelectValue /></SelectTrigger>
      <SelectContent>
        {trimestresProximos(hoje(), 2, 4).map((t) => <SelectItem key={t} value={t}>{rotuloTrimestre(t)}</SelectItem>)}
      </SelectContent>
    </Select>
  );
}

export function SecaoMetas({ somenteLeitura }: { somenteLeitura: boolean }) {
  const [aba, setAba] = useState("programa");
  const [tri, setTri] = useState(() => trimestreDe(hoje()));
  return (
    <div className="space-y-4">
      <Aviso tom="info">
        <Info className="mt-0.5 h-4 w-4 shrink-0 text-menta-400" />
        <span>
          Toda meta vale para um trimestre; a do ano é a soma dos trimestres. A meta da Wise se divide entre as pessoas do time e vira
          objetivos para cada parceiro. Painel, Meu painel, kanban e relatório semanal leem daqui.
        </span>
      </Aviso>
      <Tabs value={aba} onValueChange={setAba}>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <TabsList>
            <TabsTrigger value="programa">Programa</TabsTrigger>
            <TabsTrigger value="pessoas">Pessoas</TabsTrigger>
            <TabsTrigger value="parceiros">Parceiros</TabsTrigger>
          </TabsList>
          {aba !== "parceiros" && <SeletorTrimestre valor={tri} onChange={setTri} />}
        </div>
        <TabsContent value="programa" className="mt-4"><MetasPrograma tri={tri} somenteLeitura={somenteLeitura} /></TabsContent>
        <TabsContent value="pessoas" className="mt-4"><MetasPessoas tri={tri} somenteLeitura={somenteLeitura} /></TabsContent>
        <TabsContent value="parceiros" className="mt-4"><MetasParceiros somenteLeitura={somenteLeitura} /></TabsContent>
      </Tabs>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Programa: meta da Wise por indicador de resultado, critérios de fase e funil
// ---------------------------------------------------------------------------
type IndMeta = { chave: string; nome: string; formato: string; principal: boolean; etapa: string };
type Meta = { indicador_chave: string; periodo: string; valor: number };

// ROI vem como fração do banco: a meta é digitada e mostrada em %
const ehRoi = (chave: string) => chave === "roi";
const paraTela = (chave: string, v: number) => (ehRoi(chave) ? v * 100 : v);
const paraBanco = (chave: string, v: number) => (ehRoi(chave) ? v / 100 : v);
const unidade = (i: IndMeta) => (ehRoi(i.chave) || i.formato === "percentual" ? "%" : i.formato === "moeda" ? "R$" : i.chave === "nps" ? "pontos" : "");
const somavel = (i: IndMeta) => (i.formato === "numero" || i.formato === "moeda") && i.chave !== "nps";

function useIndicadoresMeta() {
  return useQuery({
    queryKey: ["config", "indicadores-meta"],
    queryFn: async () => (ok<any>(await supabase.from("indicadores").select("chave, nome, formato, principal, etapa, ordem")
      .eq("aceita_meta", true).eq("ativo", true).order("principal", { ascending: false }).order("ordem")) ?? []) as IndMeta[],
  });
}

function useMetasDoAno(ano: string) {
  return useQuery({
    queryKey: ["config", "metas", ano],
    queryFn: async () => (ok<any>(await supabase.from("metas").select("*").like("periodo", `${ano}-T%`)) ?? []) as Meta[],
  });
}

function MetasPrograma({ tri, somenteLeitura }: { tri: string; somenteLeitura: boolean }) {
  const qc = useQueryClient();
  const ano = tri.split("-T")[0];
  const ind = useIndicadoresMeta();
  const metas = useMetasDoAno(ano);
  const [valores, setValores] = useState<Record<string, string>>({});
  const [salvando, setSalvando] = useState(false);

  const doTri = useMemo(() => (metas.data ?? []).filter((m) => m.periodo === tri), [metas.data, tri]);
  useEffect(() => {
    setValores(Object.fromEntries(doTri.map((m) => [m.indicador_chave, String(paraTela(m.indicador_chave, Number(m.valor)))])));
  }, [doTri]);
  const original = Object.fromEntries(doTri.map((m) => [m.indicador_chave, String(paraTela(m.indicador_chave, Number(m.valor)))]));
  const alterado = (ind.data ?? []).some((i) => (valores[i.chave] ?? "") !== (original[i.chave] ?? ""));

  async function salvar() {
    setSalvando(true);
    try {
      const lista = ind.data ?? [];
      const gravar = lista.filter((i) => (valores[i.chave] ?? "").trim() !== "")
        .map((i) => ({ indicador_chave: i.chave, periodo: tri, valor: paraBanco(i.chave, Number(valores[i.chave])) }));
      if (gravar.some((g) => !Number.isFinite(g.valor))) throw new Error("Informe as metas com números.");
      const remover = lista.filter((i) => (valores[i.chave] ?? "").trim() === "" && original[i.chave] !== undefined).map((i) => i.chave);
      if (gravar.length) {
        const { error } = await supabase.from("metas").upsert(gravar, { onConflict: "indicador_chave,periodo" });
        if (error) throw error;
      }
      if (remover.length) {
        const { error } = await supabase.from("metas").delete().eq("periodo", tri).in("indicador_chave", remover);
        if (error) throw error;
      }
      toast.success("Metas do trimestre salvas.");
      qc.invalidateQueries({ queryKey: ["config", "metas"] });
      qc.invalidateQueries({ queryKey: ["metas-trimestre"] });
      qc.invalidateQueries({ queryKey: ["funil-reverso"] });
    } catch (e) {
      toastErro(e);
    } finally {
      setSalvando(false);
    }
  }

  // Soma do ano com o valor em edição no lugar do salvo deste trimestre
  function somaAno(i: IndMeta) {
    const outros = (metas.data ?? []).filter((m) => m.indicador_chave === i.chave && m.periodo !== tri).reduce((a, m) => a + Number(m.valor), 0);
    const este = Number(valores[i.chave] || 0);
    return outros + (Number.isFinite(este) ? este : 0);
  }

  return (
    <div className="space-y-6">
      <section className={cn(CLASSE_CARD, "p-4 sm:p-5")}>
        <div className="mb-3">
          <h3 className="font-semibold">Meta da Wise no {rotuloTrimestre(tri)}</h3>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Só os indicadores de resultado recebem meta. Deixe em branco o que não tem meta neste trimestre.
          </p>
        </div>
        {(ind.isLoading || metas.isLoading) && <Carregando />}
        {ind.error && <ErroCarga erro={ind.error} />}
        {metas.error && <ErroCarga erro={metas.error} />}
        {ind.data && metas.data && (
          <>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[520px] text-sm">
                <thead>
                  <tr className="border-b border-white/10 text-left text-xs text-muted-foreground">
                    <th className="py-2 pr-3 font-medium">Indicador</th>
                    <th className="px-3 py-2 font-medium">Meta do trimestre</th>
                    <th className="py-2 pl-3 text-right font-medium">Ano de {ano}</th>
                  </tr>
                </thead>
                <tbody>
                  {ind.data.map((i) => {
                    const un = unidade(i);
                    return (
                      <tr key={i.chave} className="border-b border-white/5 last:border-0">
                        <td className="py-2 pr-3">
                          <span className="flex flex-wrap items-center gap-2">
                            <span className="font-medium">{i.nome}</span>
                            {i.principal && <Pilula tom="menta">Principal</Pilula>}
                          </span>
                          <span className="text-xs text-muted-foreground">{rotulo(ETAPAS_PAINEL, i.etapa)}</span>
                        </td>
                        <td className="px-3 py-2">
                          <span className="flex items-center gap-2">
                            <Input type="number" inputMode="decimal" className="h-9 w-28 tabular-nums" placeholder="Sem meta"
                              value={valores[i.chave] ?? ""} disabled={somenteLeitura} aria-label={`Meta de ${i.nome}`}
                              onChange={(e) => setValores((v) => ({ ...v, [i.chave]: e.target.value }))} />
                            {un && <span className="text-xs text-muted-foreground">{un}</span>}
                          </span>
                        </td>
                        <td className="py-2 pl-3 text-right tabular-nums">
                          {somavel(i) ? (somaAno(i) > 0 ? `${un === "R$" ? "R$ " : ""}${numero(somaAno(i))}` : <span className="text-muted-foreground">0</span>)
                            : <span className="text-xs text-muted-foreground">Não soma</span>}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            {!somenteLeitura && (
              <div className="mt-3 flex justify-end">
                <Button onClick={salvar} disabled={salvando || !alterado}>{salvando ? <Loader2 className="animate-spin" /> : <Save />} Salvar metas</Button>
              </div>
            )}
          </>
        )}
      </section>

      <section className="space-y-2">
        <div>
          <h3 className="font-semibold">Critérios para mudar de fase</h3>
          <p className="text-sm text-muted-foreground">
            Contam desde o início do programa. Quando todos os da fase atual estão atingidos, o painel sugere a mudança; quem decide é o administrador.
            Critério sem indicador é marcado à mão.
          </p>
        </div>
        <TabelaConfig tabela="criterios_fase" pk={["id"]} ordem="ordem" colunas={COL_CRITERIOS} novo={NOVO_CRITERIO} podeExcluir recolhido
          tituloItem={(l) => `${rotulo(FASES_PROGRAMA, l.fase)}: ${l.descricao || "novo critério"}${l.indicador ? ` (${numero(l.valor)})` : l.atingido ? " (atingido)" : ""}`}
          somenteLeitura={somenteLeitura} />
      </section>

      <section className="space-y-2">
        <div>
          <h3 className="font-semibold">Funil: chance de assinatura e prazo por etapa</h3>
          <p className="text-sm text-muted-foreground">
            A chance alimenta o funil até a meta. O prazo, em dias úteis, marca a negociação como parada; vazio desliga o alerta da etapa.
          </p>
        </div>
        <TabelaConfig tabela="etapas_funil" pk={["codigo"]} ordem="ordem" colunas={COL_FUNIL} filtro={FILTRO_FUNIL} recolhido
          tituloItem={(l) => `${l.nome}${l.chance_assinatura !== null && l.chance_assinatura !== undefined ? ` · ${numero(l.chance_assinatura)}%` : ""}${l.prazo_dias_uteis ? ` · ${l.prazo_dias_uteis} dias úteis` : ""}`}
          somenteLeitura={somenteLeitura} />
      </section>
    </div>
  );
}

const OP_INDICADOR_CRITERIO: Opcao[] = [
  { valor: "assinados", rotulo: "Parceiros assinados (total)" },
  { valor: "ativados", rotulo: "Parceiros ativados (total)" },
  { valor: "clientes_icp", rotulo: "Clientes fechados no ICP (total)" },
  { valor: "respostas_pesquisa", rotulo: "Respostas na pesquisa de satisfação (total)" },
  { valor: "clientes_ativos_6m_pct", rotulo: "Clientes indicados ativos aos 6 meses (%)" },
];
const COL_CRITERIOS: ColunaConfig[] = [
  { chave: "fase", rotulo: "Vale para passar da fase", tipo: "select", opcoes: [
    { valor: "experimentacao", rotulo: "Experimentação para Tração" },
    { valor: "tracao", rotulo: "Tração para Crescimento" },
    { valor: "crescimento", rotulo: "Crescimento para Otimização" },
  ], obrigatoria: true },
  { chave: "descricao", rotulo: "Descrição", tipo: "texto", obrigatoria: true, larga: true },
  { chave: "indicador", rotulo: "Medido pelo indicador", tipo: "select", opcoes: OP_INDICADOR_CRITERIO, ajuda: "Nenhum: critério marcado à mão." },
  { chave: "valor", rotulo: "Valor a atingir", tipo: "numero", visivel: (l) => !!l.indicador },
  { chave: "atingido", rotulo: "Atingido (marcado à mão)", tipo: "booleano", visivel: (l) => !l.indicador },
  { chave: "ordem", rotulo: "Ordem", tipo: "numero" },
];
const NOVO_CRITERIO = { fase: "experimentacao", descricao: "", indicador: null, valor: null, atingido: false, ordem: 99 };

const COL_FUNIL: ColunaConfig[] = [
  { chave: "nome", rotulo: "Etapa", tipo: "texto", somenteLeitura: true },
  { chave: "chance_assinatura", rotulo: "Chance de assinatura (%)", tipo: "numero", ajuda: "De cada 100 parceiros nesta etapa, quantos costumam assinar." },
  { chave: "prazo_dias_uteis", rotulo: "Prazo na etapa (dias úteis)", tipo: "numero", ajuda: "Vazio: sem alerta de negociação parada." },
];
const FILTRO_FUNIL = { perda: false };

// ---------------------------------------------------------------------------
// Pessoas: a meta da Wise dividida entre o time
// ---------------------------------------------------------------------------
type MetaPessoa = { perfil_id: string; trimestre: string; indicador: string; valor: number };

function MetasPessoas({ tri, somenteLeitura }: { tri: string; somenteLeitura: boolean }) {
  const qc = useQueryClient();
  const ano = tri.split("-T")[0];
  const { data: pessoas = [], isLoading: carregandoPessoas } = usePessoasInternas();
  const metasWise = useMetasDoAno(ano);
  const metasP = useQuery({
    queryKey: ["config", "metas-pessoa", tri],
    queryFn: async () => (ok<any>(await supabase.from("metas_pessoa").select("*").eq("trimestre", tri)) ?? []) as MetaPessoa[],
  });
  const responsaveis = useQuery({
    queryKey: ["config", "responsaveis-carteira"],
    queryFn: async () => {
      const r = (ok<any>(await supabase.from("parceiros").select("responsavel_id").not("responsavel_id", "is", null)) ?? []) as { responsavel_id: string }[];
      return [...new Set(r.map((x) => x.responsavel_id))];
    },
  });
  const [extras, setExtras] = useState<string[]>([]);
  const [valores, setValores] = useState<Record<string, Record<string, string>>>({});
  const [salvando, setSalvando] = useState(false);

  const elegiveis = pessoas.filter((p) => p.ativo && (p.papel === "admin" || p.papel === "parcerias"));
  const ids = useMemo(() => {
    const s = new Set<string>([...(responsaveis.data ?? []), ...(metasP.data ?? []).map((m) => m.perfil_id), ...extras]);
    return elegiveis.filter((p) => s.has(p.id)).map((p) => p.id);
  }, [responsaveis.data, metasP.data, extras, elegiveis]);

  const original = useMemo(() => {
    const o: Record<string, Record<string, string>> = {};
    for (const m of metasP.data ?? []) (o[m.perfil_id] ??= {})[m.indicador] = String(Number(m.valor));
    return o;
  }, [metasP.data]);
  useEffect(() => setValores(structuredClone(original)), [original]);
  useEffect(() => setExtras([]), [tri]);

  const wise = (chave: string) => {
    const m = (metasWise.data ?? []).find((x) => x.periodo === tri && x.indicador_chave === chave);
    return m ? Number(m.valor) : null;
  };
  const soma = (chave: string) => ids.reduce((a, id) => a + (Number(valores[id]?.[chave] || 0) || 0), 0);
  const divergentes = INDICADORES_PESSOA.filter((i) => i.somaNaWise && wise(i.chave) !== null && soma(i.chave) !== wise(i.chave));
  const alterado = JSON.stringify(valores) !== JSON.stringify(original);

  function dividir() {
    if (ids.length === 0) return;
    setValores((v) => {
      const n = structuredClone(v);
      for (const i of INDICADORES_PESSOA.filter((x) => x.somaNaWise)) {
        const w = wise(i.chave);
        if (w === null) continue;
        const base = Math.floor(w / ids.length);
        const resto = w - base * ids.length;
        ids.forEach((id, k) => { (n[id] ??= {})[i.chave] = String(base + (k < resto ? 1 : 0)); });
      }
      return n;
    });
  }

  async function salvar() {
    setSalvando(true);
    try {
      const gravar: MetaPessoa[] = [];
      const remover: { perfil_id: string; indicador: string }[] = [];
      for (const id of ids) {
        for (const i of INDICADORES_PESSOA) {
          const v = (valores[id]?.[i.chave] ?? "").trim();
          if (v !== "") {
            if (!Number.isFinite(Number(v)) || Number(v) < 0) throw new Error("Informe metas com números positivos.");
            gravar.push({ perfil_id: id, trimestre: tri, indicador: i.chave, valor: Number(v) });
          } else if (original[id]?.[i.chave] !== undefined) remover.push({ perfil_id: id, indicador: i.chave });
        }
      }
      if (gravar.length) {
        const { error } = await supabase.from("metas_pessoa").upsert(gravar, { onConflict: "perfil_id,trimestre,indicador" });
        if (error) throw error;
      }
      for (const r of remover) {
        const { error } = await supabase.from("metas_pessoa").delete().eq("perfil_id", r.perfil_id).eq("trimestre", tri).eq("indicador", r.indicador);
        if (error) throw error;
      }
      toast.success("Metas das pessoas salvas.");
      qc.invalidateQueries({ queryKey: ["config", "metas-pessoa", tri] });
      qc.invalidateQueries({ queryKey: ["painel-pessoal"] });
    } catch (e) {
      toastErro(e);
    } finally {
      setSalvando(false);
    }
  }

  if (carregandoPessoas || metasP.isLoading || metasWise.isLoading || responsaveis.isLoading) return <Carregando />;
  if (metasP.error) return <ErroCarga erro={metasP.error} />;
  if (metasWise.error) return <ErroCarga erro={metasWise.error} />;

  const nome = (id: string) => pessoas.find((p) => p.id === id)?.nome ?? "Pessoa";
  const disponiveis = elegiveis.filter((p) => !ids.includes(p.id));

  return (
    <section className={cn(CLASSE_CARD, "space-y-3 p-4 sm:p-5")}>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h3 className="font-semibold">Meta de cada pessoa no {rotuloTrimestre(tri)}</h3>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Aparecem quem cuida de parceiros e quem já tem meta. O resultado conta para o responsável pelo parceiro na data de cada evento.
          </p>
        </div>
        {!somenteLeitura && ids.length > 0 && (
          <Button variant="outline" size="sm" onClick={dividir}><Split /> Dividir a meta da Wise</Button>
        )}
      </div>

      {somenteLeitura && <Aviso tom="info"><Info className="mt-0.5 h-4 w-4 shrink-0 text-menta-400" /> Só administradores definem as metas das pessoas. Você vê a sua.</Aviso>}

      {divergentes.length > 0 && (
        <Aviso>
          <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0 text-warning" />
          <span>
            A soma das pessoas não fecha com a meta da Wise em:{" "}
            {divergentes.map((i) => `${i.curto} (${numero(soma(i.chave))} de ${numero(wise(i.chave)!)})`).join(", ")}.
          </span>
        </Aviso>
      )}

      {ids.length === 0 ? (
        <Vazio titulo="Ninguém com carteira ou meta neste trimestre">Adicione uma pessoa abaixo para definir a meta dela.</Vazio>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-sm">
            <thead>
              <tr className="border-b border-white/10 text-left text-xs text-muted-foreground">
                <th className="py-2 pr-3 font-medium">Pessoa</th>
                {INDICADORES_PESSOA.map((i) => <th key={i.chave} className="px-2 py-2 font-medium">{i.curto}{i.percentual ? " (%)" : ""}</th>)}
              </tr>
            </thead>
            <tbody>
              {ids.map((id) => (
                <tr key={id} className="border-b border-white/5">
                  <td className="py-2 pr-3 font-medium">{nome(id)}</td>
                  {INDICADORES_PESSOA.map((i) => (
                    <td key={i.chave} className="px-2 py-2">
                      <Input type="number" inputMode="decimal" min="0" className="h-9 w-20 tabular-nums" placeholder="Sem"
                        value={valores[id]?.[i.chave] ?? ""} disabled={somenteLeitura} aria-label={`${i.curto} de ${nome(id)}`}
                        onChange={(e) => setValores((v) => ({ ...v, [id]: { ...(v[id] ?? {}), [i.chave]: e.target.value } }))} />
                    </td>
                  ))}
                </tr>
              ))}
              <tr className="text-xs text-muted-foreground">
                <td className="py-2 pr-3">Soma das pessoas / meta da Wise</td>
                {INDICADORES_PESSOA.map((i) => {
                  const w = wise(i.chave);
                  const diverge = i.somaNaWise && w !== null && soma(i.chave) !== w;
                  return (
                    <td key={i.chave} className={cn("px-2 py-2 tabular-nums", diverge && "font-semibold text-warning")}>
                      {i.somaNaWise ? `${numero(soma(i.chave))} / ${w === null ? "sem meta" : numero(w)}` : "Não soma"}
                    </td>
                  );
                })}
              </tr>
            </tbody>
          </table>
        </div>
      )}

      {!somenteLeitura && (
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          {disponiveis.length > 0 ? (
            <Select value="" onValueChange={(v) => setExtras((x) => [...x, v])}>
              <SelectTrigger className="w-full sm:w-72" aria-label="Adicionar pessoa"><SelectValue placeholder="Adicionar pessoa" /></SelectTrigger>
              <SelectContent>
                {disponiveis.map((p) => <SelectItem key={p.id} value={p.id}>{p.nome} ({rotulo(PAPEIS, p.papel)})</SelectItem>)}
              </SelectContent>
            </Select>
          ) : <span />}
          <Button onClick={salvar} disabled={salvando || !alterado}>{salvando ? <Loader2 className="animate-spin" /> : <Save />} Salvar metas</Button>
        </div>
      )}
    </section>
  );
}

// ---------------------------------------------------------------------------
// Parceiros: marcos do onboarding e onde ficam requisitos, contrapartidas e ranking
// ---------------------------------------------------------------------------
type MarcoCfg = { tipo: string; nome: string; dias: number | null; descricao: string; regra: Record<string, any>; ordem: number };

function MetasParceiros({ somenteLeitura }: { somenteLeitura: boolean }) {
  const q = useQuery({
    queryKey: ["config", "marcos-onboarding"],
    queryFn: async () => (ok<any>(await supabase.from("marcos_onboarding_config").select("*").order("ordem")) ?? []) as MarcoCfg[],
  });
  const atalhos = [
    { aba: "requisitos", titulo: "Requisitos de nível", texto: "O que o parceiro precisa para manter ou subir de nível, em 180 dias móveis. O portal também mostra o recorte do trimestre." },
    { aba: "contrapartidas", titulo: "Contrapartidas", texto: "Cada contrapartida pode ter quantidade, unidade, prazo e forma de medir. O parceiro vê o progresso." },
    { aba: "pontos", titulo: "Pontos e premiação", texto: "O ranking é reconhecimento anual, sem meta. Quem define o nível são os requisitos." },
  ];
  return (
    <div className="space-y-6">
      <Aviso tom="info">
        <Info className="mt-0.5 h-4 w-4 shrink-0 text-menta-400" />
        <span>
          O parceiro vê tudo isto num só quadro, "Seus objetivos", no início do portal: os marcos nos primeiros 90 dias e, depois, os requisitos do
          próximo nível e as contrapartidas.
        </span>
      </Aviso>

      <section className="space-y-2">
        <div>
          <h3 className="font-semibold">Marcos do onboarding</h3>
          <p className="text-sm text-muted-foreground">Prazo em dias desde a assinatura e o que conta para cumprir. Valem para os próximos onboardings.</p>
        </div>
        {q.isLoading && <Carregando />}
        {q.error && <ErroCarga erro={q.error} />}
        <div className="space-y-3">
          {(q.data ?? []).map((m) => <LinhaMarco key={m.tipo} marco={m} somenteLeitura={somenteLeitura} />)}
        </div>
      </section>

      <section className="grid gap-3 md:grid-cols-3">
        {atalhos.map((a) => (
          <Link key={a.aba} to={`/app/configuracoes?aba=${a.aba}`} className={cn(CLASSE_CARD, "block p-4 hover:border-menta-500/40")}>
            <p className="flex items-center justify-between gap-2 font-semibold">{a.titulo} <ArrowRight className="h-4 w-4 text-menta-400" /></p>
            <p className="mt-1 text-sm text-muted-foreground">{a.texto}</p>
          </Link>
        ))}
      </section>
    </div>
  );
}

function LinhaMarco({ marco, somenteLeitura }: { marco: MarcoCfg; somenteLeitura: boolean }) {
  const qc = useQueryClient();
  const inicial = useMemo(() => ({
    nome: marco.nome, dias: marco.dias === null ? "" : String(marco.dias), descricao: marco.descricao,
    trilha: !!marco.regra?.trilha_iniciada, certificado: !!marco.regra?.responsavel_certificado,
    indicacoes: marco.regra?.indicacoes === undefined ? "" : String(marco.regra.indicacoes),
    qualificadas: marco.regra?.indicacoes_qualificadas === undefined ? "" : String(marco.regra.indicacoes_qualificadas),
  }), [marco]);
  const [e, setE] = useState(inicial);
  useEffect(() => setE(inicial), [inicial]);
  const [salvando, setSalvando] = useState(false);
  const ehMarco = marco.tipo.startsWith("marco_");
  const ativacao = !!marco.regra?.ativacao;
  const alterado = JSON.stringify(e) !== JSON.stringify(inicial);

  async function salvar() {
    setSalvando(true);
    try {
      if (!e.nome.trim() || !e.descricao.trim()) throw new Error("Informe o nome e a descrição.");
      const dias = e.dias.trim() === "" ? null : Number(e.dias);
      if (dias !== null && (!Number.isInteger(dias) || dias <= 0)) throw new Error("O prazo é um número inteiro de dias.");
      let regra: Record<string, any> = marco.regra ?? {};
      if (ehMarco && !ativacao) {
        regra = {};
        if (e.trilha) regra.trilha_iniciada = true;
        if (e.certificado) regra.responsavel_certificado = true;
        if (e.indicacoes.trim() !== "") regra.indicacoes = Number(e.indicacoes);
        if (e.qualificadas.trim() !== "") regra.indicacoes_qualificadas = Number(e.qualificadas);
        if (Object.keys(regra).length === 0) throw new Error("Escolha ao menos um critério para o marco.");
      }
      const { error } = await supabase.from("marcos_onboarding_config")
        .update({ nome: e.nome.trim(), dias, descricao: e.descricao.trim(), regra }).eq("tipo", marco.tipo);
      if (error) throw error;
      toast.success("Marco salvo.");
      qc.invalidateQueries({ queryKey: ["config", "marcos-onboarding"] });
      qc.invalidateQueries({ queryKey: ["marcos-config"] });
    } catch (err) {
      toastErro(err);
    } finally {
      setSalvando(false);
    }
  }

  return (
    <div className={cn(CLASSE_CARD, "space-y-3 p-4")}>
      <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_160px]">
        <div className="space-y-1.5">
          <Label htmlFor={`m-nome-${marco.tipo}`} className="text-xs text-muted-foreground">{ehMarco ? "Marco" : "Encontro"}</Label>
          <Input id={`m-nome-${marco.tipo}`} value={e.nome} disabled={somenteLeitura} onChange={(x) => setE({ ...e, nome: x.target.value })} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor={`m-dias-${marco.tipo}`} className="text-xs text-muted-foreground">Prazo (dias)</Label>
          <Input id={`m-dias-${marco.tipo}`} type="number" min="1" value={e.dias} placeholder="Fim do onboarding" disabled={somenteLeitura}
            onChange={(x) => setE({ ...e, dias: x.target.value })} />
        </div>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor={`m-desc-${marco.tipo}`} className="text-xs text-muted-foreground">O que o parceiro lê no portal</Label>
        <Textarea id={`m-desc-${marco.tipo}`} rows={2} value={e.descricao} disabled={somenteLeitura} onChange={(x) => setE({ ...e, descricao: x.target.value })} />
      </div>
      {ehMarco && (ativacao ? (
        <p className="text-sm text-muted-foreground">Cumprido na ativação: primeira indicação com ICP confirmado que virou reunião.</p>
      ) : (
        <div className="flex flex-wrap items-center gap-x-6 gap-y-3 text-sm">
          <label className="flex items-center gap-2"><Switch checked={e.trilha} disabled={somenteLeitura} onCheckedChange={(v) => setE({ ...e, trilha: v })} /> Trilha iniciada pelo responsável</label>
          <label className="flex items-center gap-2"><Switch checked={e.certificado} disabled={somenteLeitura} onCheckedChange={(v) => setE({ ...e, certificado: v })} /> Responsável certificado</label>
          <label className="flex items-center gap-2">
            Indicações
            <Input type="number" min="0" className="h-9 w-16" value={e.indicacoes} disabled={somenteLeitura} onChange={(x) => setE({ ...e, indicacoes: x.target.value })} />
          </label>
          <label className="flex items-center gap-2">
            Qualificadas
            <Input type="number" min="0" className="h-9 w-16" value={e.qualificadas} disabled={somenteLeitura} onChange={(x) => setE({ ...e, qualificadas: x.target.value })} />
          </label>
        </div>
      ))}
      {!somenteLeitura && (
        <div className="flex justify-end">
          <Button size="sm" onClick={salvar} disabled={salvando || !alterado}>{salvando ? <Loader2 className="animate-spin" /> : <Save />} Salvar</Button>
        </div>
      )}
    </div>
  );
}

