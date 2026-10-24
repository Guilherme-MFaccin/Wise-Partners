import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Ban, CalendarPlus, Handshake, X } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { Carregando, ErroCarga, Vazio } from "@/components/comum/Estados";
import { Pilula } from "@/components/comum/Selos";
import { ParceiroBusca, useParceirosResumo } from "@/components/comum/ParceiroBusca";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CLASSE_CARD, Indicador } from "@/components/painel/Blocos";
import { nomePerfil, usePerfis } from "@/components/parceiros/dados";
import { useEmpresasGrupo } from "@/components/indicacoes/dados";
import { data as fmtData, dataHora, hojeISO } from "@/lib/formato";
import { QUADRANTES_CRUZAMENTO } from "@/lib/rotulos";
import { cn } from "@/lib/utils";
import { ROTULO_TIPO_EMPRESA, decidida, formatarRaiz, useCoincidencias, type Coincidencia } from "./dados";
import { DecisaoDialog, type Decisao } from "./DecisaoDialogs";

const TODOS = "__todos";
const ORDEM_QUADRANTES = Object.keys(QUADRANTES_CRUZAMENTO);

function diasAte(iso: string, hoje: string) {
  return Math.round((new Date(iso + "T12:00:00").getTime() - new Date(hoje + "T12:00:00").getTime()) / 86_400_000);
}

// Coincidências por parceiro e quadrante, com a decisão do time de parcerias.
export function ListaCoincidencias() {
  const { isParcerias } = useAuth();
  const q = useCoincidencias();
  const { data: parceiros = [] } = useParceirosResumo();
  const { data: empresas = [] } = useEmpresasGrupo();
  const { data: perfis = [] } = usePerfis();
  const [situacao, setSituacao] = useState("pendentes");
  const [quadrante, setQuadrante] = useState(TODOS);
  const [parceiro, setParceiro] = useState<string | null>(null);
  const [decisao, setDecisao] = useState<Decisao | null>(null);
  const hoje = hojeISO();

  const nomeParceiro = (id: string) => parceiros.find((p) => p.id === id)?.nome_fantasia ?? "Parceiro";
  const todas = useMemo(() => q.data ?? [], [q.data]);
  const lista = useMemo(() => todas.filter((c) =>
    (situacao === "todas" || (situacao === "pendentes" ? !decidida(c) : decidida(c)))
    && (quadrante === TODOS || c.quadrante === quadrante)
    && (!parceiro || c.parceiro_id === parceiro)), [todas, situacao, quadrante, parceiro]);

  const grupos = useMemo(() => {
    const m = new Map<string, Map<string, Coincidencia[]>>();
    for (const c of lista) {
      const porQ = m.get(c.parceiro_id) ?? new Map<string, Coincidencia[]>();
      porQ.set(c.quadrante, [...(porQ.get(c.quadrante) ?? []), c]);
      m.set(c.parceiro_id, porQ);
    }
    return [...m.entries()]
      .map(([id, porQ]) => ({
        id, nome: nomeParceiro(id), total: [...porQ.values()].reduce((a, l) => a + l.length, 0),
        quadrantes: [...porQ.entries()].sort(([a], [b]) => ORDEM_QUADRANTES.indexOf(a) - ORDEM_QUADRANTES.indexOf(b)),
      }))
      .sort((a, b) => a.nome.localeCompare(b.nome));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lista, parceiros]);

  const pendentes = todas.filter((c) => !decidida(c));

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {ORDEM_QUADRANTES.map((k) => (
          <Indicador key={k} rotulo={QUADRANTES_CRUZAMENTO[k]} valor={pendentes.filter((c) => c.quadrante === k).length} detalhe="pendentes" />
        ))}
      </div>

      <section className={cn(CLASSE_CARD, "grid gap-3 p-4 sm:grid-cols-3")}>
        <div className="min-w-0 space-y-1.5">
          <Label className="text-xs text-muted-foreground">Situação</Label>
          <Select value={situacao} onValueChange={setSituacao}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="pendentes">Pendentes</SelectItem>
              <SelectItem value="decididas">Decididas</SelectItem>
              <SelectItem value="todas">Todas</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="min-w-0 space-y-1.5">
          <Label className="text-xs text-muted-foreground">Quadrante</Label>
          <Select value={quadrante} onValueChange={setQuadrante}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value={TODOS}>Todos</SelectItem>
              {Object.entries(QUADRANTES_CRUZAMENTO).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="min-w-0 space-y-1.5">
          <Label className="text-xs text-muted-foreground">Parceiro</Label>
          <div className="flex gap-1">
            <ParceiroBusca valor={parceiro} onChange={setParceiro} placeholder="Todos" />
            {parceiro && <Button variant="ghost" size="icon" aria-label="Limpar parceiro" onClick={() => setParceiro(null)}><X /></Button>}
          </div>
        </div>
      </section>

      {q.isLoading && <Carregando />}
      {q.error && <ErroCarga erro={q.error} />}
      {q.isSuccess && !lista.length && (
        <Vazio titulo="Nenhuma coincidência">Quando um parceiro fizer o cruzamento, as empresas da base da Wise que coincidirem aparecem aqui.</Vazio>
      )}

      {grupos.map((g) => (
        <section key={g.id} className={cn(CLASSE_CARD, "p-4")}>
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <Link to={`/app/parceiros/${g.id}`} className="font-semibold text-menta-400 hover:underline">{g.nome}</Link>
            <span className="text-sm text-muted-foreground">{g.total} coincidência(s)</span>
          </div>
          <div className="space-y-4">
            {g.quadrantes.map(([quad, itens]) => (
              <div key={quad}>
                <h3 className="mb-2 text-sm font-semibold">{QUADRANTES_CRUZAMENTO[quad] ?? quad} <span className="font-normal text-muted-foreground">({itens.length})</span></h3>
                <p className="mb-2 text-xs text-muted-foreground">Ação sugerida: {itens[0].acao_sugerida}</p>
                <ul className="space-y-2">
                  {itens.map((c) => {
                    const dias = diasAte(c.expira_em, hoje);
                    return (
                      <li key={c.id} className="flex min-w-0 flex-col gap-2 rounded-[10px] border border-white/10 p-3 sm:flex-row sm:items-start">
                        <div className="min-w-0 flex-1 space-y-1">
                          <p className="break-words font-medium">{c.base?.razao_social ?? "Empresa removida da base"}</p>
                          <p className="text-xs text-muted-foreground">
                            {[
                              c.base && formatarRaiz(c.base.cnpj_raiz),
                              empresas.find((e) => e.id === c.base?.empresa_grupo_id)?.nome,
                              c.base && `Wise: ${ROTULO_TIPO_EMPRESA[c.base.tipo]}`,
                              `Parceiro: ${ROTULO_TIPO_EMPRESA[c.tipo_parceiro]}`,
                            ].filter(Boolean).join(" · ")}
                          </p>
                          <div className="flex flex-wrap items-center gap-2 text-xs">
                            {c.virou === "indicacao" && (
                              <Link to={`/app/indicacoes?id=${c.referencia_id}`}><Pilula tom="menta">Virou indicação</Pilula></Link>
                            )}
                            {c.virou === "acao" && (
                              <Link to={`/app/parceiros/${c.parceiro_id}?aba=acoes`}><Pilula tom="menta">Virou ação conjunta</Pilula></Link>
                            )}
                            {c.descartada && <Pilula>Descartada</Pilula>}
                            {decidida(c) && c.decidido_em && (
                              <span className="text-muted-foreground">
                                {dataHora(c.decidido_em)}{nomePerfil(perfis, c.decidido_por) ? ` por ${nomePerfil(perfis, c.decidido_por)}` : ""}
                              </span>
                            )}
                            {!c.virou && (
                              <Pilula tom={dias <= 15 ? "perigo" : dias <= 45 ? "alerta" : "neutro"}>Expira em {fmtData(c.expira_em)}</Pilula>
                            )}
                          </div>
                          {c.observacao && <p className="break-words text-xs text-muted-foreground">{c.observacao}</p>}
                        </div>
                        {isParcerias && !decidida(c) && (
                          <div className="flex flex-wrap gap-2 sm:flex-col">
                            <Button size="sm" onClick={() => setDecisao({ tipo: "indicacao", c, parceiroNome: g.nome })}><Handshake /> Virar indicação</Button>
                            <Button size="sm" variant="outline" onClick={() => setDecisao({ tipo: "acao", c, parceiroNome: g.nome })}><CalendarPlus /> Virar ação</Button>
                            <Button size="sm" variant="ghost" onClick={() => setDecisao({ tipo: "descartar", c, parceiroNome: g.nome })}><Ban /> Descartar</Button>
                          </div>
                        )}
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </div>
        </section>
      ))}

      <DecisaoDialog decisao={decisao} onFechar={() => setDecisao(null)} />
    </div>
  );
}
