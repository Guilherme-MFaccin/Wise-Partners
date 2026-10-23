import { useEffect, useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { AlertTriangle, Loader2, Plus, Save, Sparkles, Trash2, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { chamarIA, type ResultadoRecomendacao } from "@/lib/ia";
import { toastErro } from "@/lib/erros";
import { semTravessao } from "@/lib/formato";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Pilula } from "@/components/comum/Selos";
import { situacaoCategoria, type Categoria, type OpcaoComNome } from "./dados";
import type { Candidato, CategoriaSugerida, OpcaoRfp, PedidoRfp, SemFornecedor } from "./tipos";

const chave = (o: Pick<OpcaoRfp, "categoria_id" | "parceiro_id">) => `${o.categoria_id}:${o.parceiro_id}`;

// Etapa 2: recomendação por IA e ajuste da seleção pelo consultor.
// A IA só ordena e justifica entre os candidatos que o banco já filtrou (assinados com ficha publicada).
export function EtapaRecomendacao({
  pedido, opcoesSalvas, candidatos, categorias, podeGerir, onAlterado,
}: {
  pedido: PedidoRfp;
  opcoesSalvas: OpcaoComNome[];
  candidatos: Candidato[];
  categorias: Categoria[];
  podeGerir: boolean;
  onAlterado: (pendente: boolean) => void;
}) {
  const qc = useQueryClient();
  const [sugeridas, setSugeridas] = useState<CategoriaSugerida[]>(pedido.categorias_sugeridas ?? []);
  const [selecao, setSelecao] = useState<OpcaoRfp[]>(() => opcoesSalvas.map(({ categoria_id, parceiro_id, ordem, aderencia, justificativa, selecionado }) => ({ categoria_id, parceiro_id, ordem, aderencia, justificativa, selecionado })));
  const [resumida, setResumida] = useState(pedido.necessidade_resumida ?? "");
  const [semFornecedor, setSemFornecedor] = useState<SemFornecedor[]>(pedido.sem_fornecedor ?? []);
  const [novaNecessidade, setNovaNecessidade] = useState("");
  const [pendente, setPendente] = useState(false);
  const [recomendando, setRecomendando] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [falhaIA, setFalhaIA] = useState<string | null>(null);

  useEffect(() => onAlterado(pendente), [pendente, onAlterado]);

  const nomesCategoria = useMemo(() => new Map(categorias.map((c) => [c.id, c.nome])), [categorias]);
  const ativasComerciais = useMemo(() => categorias.filter((c) => c.tipo === "comercial" && c.ativa), [categorias]);
  const candPorId = useMemo(() => new Map(candidatos.map((c) => [c.parceiro_id, c])), [candidatos]);
  const nomeSalvo = useMemo(() => new Map(opcoesSalvas.map((o) => [o.parceiro_id, o.parceiro?.nome_fantasia ?? ""])), [opcoesSalvas]);
  const nomeParceiro = (id: string) => candPorId.get(id)?.nome ?? nomeSalvo.get(id) ?? "Parceiro";

  // Categorias exibidas: sugeridas mais as que tiverem opções
  const idsCategorias = useMemo(() => {
    const ids = sugeridas.map((s) => s.categoria_id);
    for (const o of selecao) if (!ids.includes(o.categoria_id)) ids.push(o.categoria_id);
    return ids;
  }, [sugeridas, selecao]);

  const candidatosDaCategoria = (catId: string) => candidatos.filter((c) => (c.categorias ?? []).some((k) => k.categoria_id === catId));

  function alterar<T>(setter: (v: T) => void) {
    return (v: T) => { setter(v); setPendente(true); };
  }
  const mudarSelecao = alterar(setSelecao);
  const mudarSugeridas = alterar(setSugeridas);
  const mudarSemFornecedor = alterar(setSemFornecedor);

  async function salvar(dados = { sugeridas, selecao, resumida, semFornecedor }) {
    setSalvando(true);
    try {
      const r1 = await supabase.from("pedidos_rfp").update({
        categorias_sugeridas: dados.sugeridas.map((s) => ({ ...s, nome: s.nome ?? nomesCategoria.get(s.categoria_id) })),
        necessidade_resumida: semTravessao(dados.resumida.trim()) || null,
        sem_fornecedor: dados.semFornecedor,
      }).eq("id", pedido.id);
      if (r1.error) throw r1.error;
      if (dados.selecao.length) {
        const r2 = await supabase.from("pedido_rfp_opcoes")
          .upsert(dados.selecao.map((o) => ({ ...o, pedido_id: pedido.id })), { onConflict: "pedido_id,categoria_id,parceiro_id" });
        if (r2.error) throw r2.error;
      }
      const manter = new Set(dados.selecao.map(chave));
      const remover = opcoesSalvas.filter((o) => !manter.has(chave(o))).map((o) => o.id);
      if (remover.length) {
        const r3 = await supabase.from("pedido_rfp_opcoes").delete().in("id", remover);
        if (r3.error) throw r3.error;
      }
      setPendente(false);
      toast.success("Seleção salva.");
      await Promise.all([
        qc.invalidateQueries({ queryKey: ["pedido-rfp", pedido.id] }),
        qc.invalidateQueries({ queryKey: ["pedido-rfp-opcoes", pedido.id] }),
      ]);
    } catch (e) {
      toastErro(e);
    } finally {
      setSalvando(false);
    }
  }

  async function recomendar() {
    setRecomendando(true);
    setFalhaIA(null);
    try {
      const r = await chamarIA<ResultadoRecomendacao>("recomendar_rfp", {
        necessidade: pedido.necessidade, porte: pedido.porte, regiao: pedido.regiao, prazo: pedido.prazo, restricoes: pedido.restricoes,
        categorias: ativasComerciais.map((c) => ({ id: c.id, nome: c.nome })),
        candidatos,
      });
      const idsAtivas = new Set(ativasComerciais.map((c) => c.id));
      const novasSugeridas: CategoriaSugerida[] = [];
      const novaSelecao: OpcaoRfp[] = [];
      const novoSemFornecedor: SemFornecedor[] = (r.sem_fornecedor ?? []).map((s) => ({
        necessidade: semTravessao(s.necessidade ?? ""), categoria_sugerida: s.categoria_sugerida ?? null,
      }));
      for (const cat of r.categorias ?? []) {
        if (!idsAtivas.has(cat.categoria_id)) continue;
        novasSugeridas.push({ categoria_id: cat.categoria_id, nome: nomesCategoria.get(cat.categoria_id), motivo: semTravessao(cat.motivo ?? "") });
        // Nunca sugere parceiro fora da lista de candidatos (sem contrato assinado ou fora da categoria)
        const validos = (cat.parceiros ?? [])
          .filter((p) => candPorId.get(p.parceiro_id)?.categorias?.some((k) => k.categoria_id === cat.categoria_id))
          .sort((a, b) => (b.aderencia ?? 0) - (a.aderencia ?? 0));
        validos.forEach((p, i) => novaSelecao.push({
          categoria_id: cat.categoria_id, parceiro_id: p.parceiro_id, ordem: i,
          aderencia: p.aderencia ?? null, justificativa: semTravessao(p.justificativa ?? ""), selecionado: i < 3,
        }));
        if (!validos.length && !candidatosDaCategoria(cat.categoria_id).length) {
          novoSemFornecedor.push({ necessidade: semTravessao(cat.motivo || pedido.necessidade), categoria_sugerida: nomesCategoria.get(cat.categoria_id) ?? null });
        }
      }
      const novaResumida = semTravessao(r.necessidade_resumida ?? "") || resumida;
      setSugeridas(novasSugeridas);
      setSelecao(novaSelecao);
      setResumida(novaResumida);
      setSemFornecedor(novoSemFornecedor);
      if (!novasSugeridas.length) toast.info("A IA não identificou categorias. Adicione manualmente se fizer sentido.");
      await salvar({ sugeridas: novasSugeridas, selecao: novaSelecao, resumida: novaResumida, semFornecedor: novoSemFornecedor });
    } catch (e: any) {
      setFalhaIA(e?.message ?? "Falha ao chamar a IA.");
      toastErro(e);
    } finally {
      setRecomendando(false);
    }
  }

  function adicionarCategoria(id: string) {
    if (idsCategorias.includes(id)) return;
    mudarSugeridas([...sugeridas, { categoria_id: id, nome: nomesCategoria.get(id), motivo: "" }]);
  }

  function removerCategoria(id: string) {
    setSugeridas(sugeridas.filter((s) => s.categoria_id !== id));
    mudarSelecao(selecao.filter((o) => o.categoria_id !== id));
  }

  function adicionarParceiro(catId: string, parceiroId: string) {
    const ordem = Math.max(-1, ...selecao.filter((o) => o.categoria_id === catId).map((o) => o.ordem)) + 1;
    mudarSelecao([...selecao, { categoria_id: catId, parceiro_id: parceiroId, ordem, aderencia: null, justificativa: null, selecionado: true }]);
  }

  const categoriasDisponiveis = ativasComerciais.filter((c) => !idsCategorias.includes(c.id));

  return (
    <div className="space-y-6">
      <div className="rounded-[14px] border border-white/10 bg-card p-4 sm:p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="font-semibold">Recomendação por IA</p>
            <p className="text-sm text-muted-foreground">
              A IA considera só os {candidatos.length} parceiros assinados com ficha publicada. Você ajusta a seleção antes de montar a página.
            </p>
          </div>
          {podeGerir && (
            <Button onClick={recomendar} disabled={recomendando || salvando} variant={selecao.length ? "outline" : "default"}>
              {recomendando ? <Loader2 className="animate-spin" /> : <Sparkles />}
              {selecao.length ? "Refazer recomendação" : "Recomendar com IA"}
            </Button>
          )}
        </div>
        {falhaIA && (
          <div className="mt-3 flex gap-2 rounded-[10px] border border-warning/40 bg-warning/10 p-3 text-sm">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-warning" />
            <p>A IA não respondeu ({falhaIA}). Monte a seleção manualmente: adicione as categorias abaixo e escolha os parceiros assinados de cada uma.</p>
          </div>
        )}
        <div className="mt-4 space-y-1.5">
          <Label htmlFor="resumida">Necessidade resumida</Label>
          <Input id="resumida" value={resumida} disabled={!podeGerir} placeholder="Ex.: a integração do estoque com as vendas"
            onChange={(e) => { setResumida(e.target.value); setPendente(true); }} />
          <p className="text-xs text-muted-foreground">
            Aparece na página e na mensagem do WhatsApp: "preciso resolver {resumida.trim() || "..."}".
          </p>
        </div>
      </div>

      {idsCategorias.length === 0 && (
        <p className="rounded-[14px] border border-dashed border-white/15 p-6 text-center text-sm text-muted-foreground">
          Nenhuma categoria ainda. Peça a recomendação da IA ou adicione uma categoria manualmente.
        </p>
      )}

      {idsCategorias.map((catId) => {
        const sug = sugeridas.find((s) => s.categoria_id === catId);
        const opcoes = selecao.filter((o) => o.categoria_id === catId).sort((a, b) => a.ordem - b.ordem);
        const sit = situacaoCategoria(catId, selecao, candidatos);
        const paraAdicionar = candidatosDaCategoria(catId).filter((c) => !opcoes.some((o) => o.parceiro_id === c.parceiro_id));
        return (
          <section key={catId} className="rounded-[14px] border border-white/10 bg-card p-4 sm:p-5">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div className="min-w-0">
                <h3 className="text-lg font-semibold">{nomesCategoria.get(catId) ?? "Categoria"}</h3>
                <div className="mt-1 flex flex-wrap gap-2">
                  <Pilula tom={sit.bloqueia ? "perigo" : "menta"}>{sit.selecionados} selecionados de {sit.assinados} assinados</Pilula>
                  {sit.excecao && sit.selecionados > 0 && (
                    <Pilula tom="alerta">exceção registrada: menos de 3 parceiros assinados nesta categoria</Pilula>
                  )}
                </div>
              </div>
              {podeGerir && (
                <Button variant="ghost" size="sm" onClick={() => removerCategoria(catId)}>
                  <Trash2 /> Remover categoria
                </Button>
              )}
            </div>
            {podeGerir ? (
              <Input className="mt-3" value={sug?.motivo ?? ""} placeholder="Por que esta categoria atende o pedido"
                onChange={(e) => mudarSugeridas(
                  sug ? sugeridas.map((s) => (s.categoria_id === catId ? { ...s, motivo: e.target.value } : s))
                    : [...sugeridas, { categoria_id: catId, nome: nomesCategoria.get(catId), motivo: e.target.value }],
                )} />
            ) : sug?.motivo ? <p className="mt-2 text-sm text-muted-foreground">{sug.motivo}</p> : null}
            {sit.bloqueia && (
              <p className="mt-3 text-sm text-red-300">
                Selecione no mínimo 3 opções: há {sit.assinados} parceiros assinados nesta categoria. A Wise nunca recomenda nome único.
              </p>
            )}
            {sit.selecionados === 0 && (
              <p className="mt-3 text-sm text-muted-foreground">
                {sit.assinados === 0 ? "Nenhum parceiro assinado nesta categoria: registre a necessidade em categorias a prospectar." : "Nenhum parceiro selecionado: a categoria fica fora da página."}
              </p>
            )}

            <ul className="mt-3 divide-y divide-white/5">
              {opcoes.map((o) => {
                const elegivel = candPorId.has(o.parceiro_id);
                return (
                  <li key={o.parceiro_id} className="flex items-start gap-3 py-3">
                    <Checkbox className="mt-1" checked={o.selecionado} disabled={!podeGerir}
                      onCheckedChange={(c) => mudarSelecao(selecao.map((x) => (chave(x) === chave(o) ? { ...x, selecionado: !!c } : x)))} />
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-medium">{nomeParceiro(o.parceiro_id)}</span>
                        {o.aderencia !== null && <Pilula tom="info">aderência {o.aderencia}</Pilula>}
                        {!elegivel && <Pilula tom="perigo">não elegível: sem contrato assinado ou sem ficha publicada</Pilula>}
                      </div>
                      {o.justificativa && <p className="mt-1 text-sm text-muted-foreground">{o.justificativa}</p>}
                    </div>
                    {podeGerir && (
                      <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" aria-label="Remover"
                        onClick={() => mudarSelecao(selecao.filter((x) => chave(x) !== chave(o)))}>
                        <X />
                      </Button>
                    )}
                  </li>
                );
              })}
            </ul>
            {podeGerir && paraAdicionar.length > 0 && (
              <Select value="" onValueChange={(v) => adicionarParceiro(catId, v)}>
                <SelectTrigger className="mt-2 w-full sm:w-80"><SelectValue placeholder="Adicionar parceiro assinado desta categoria" /></SelectTrigger>
                <SelectContent>
                  {paraAdicionar.map((c) => <SelectItem key={c.parceiro_id} value={c.parceiro_id}>{c.nome}</SelectItem>)}
                </SelectContent>
              </Select>
            )}
          </section>
        );
      })}

      {podeGerir && categoriasDisponiveis.length > 0 && (
        <Select value="" onValueChange={adicionarCategoria}>
          <SelectTrigger className="w-full sm:w-80"><SelectValue placeholder="Adicionar categoria manualmente" /></SelectTrigger>
          <SelectContent>
            {categoriasDisponiveis.map((c) => <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>)}
          </SelectContent>
        </Select>
      )}

      <section className="rounded-[14px] border border-white/10 bg-card p-4 sm:p-5">
        <h3 className="font-semibold">Sem fornecedor no programa</h3>
        <p className="text-sm text-muted-foreground">Necessidades sem categoria ou sem parceiro assinado entram no relatório de categorias a prospectar.</p>
        <ul className="mt-3 space-y-2">
          {semFornecedor.map((s, i) => (
            <li key={i} className="flex items-start justify-between gap-2 rounded-[10px] bg-white/5 px-3 py-2 text-sm">
              <span className="min-w-0">
                {s.necessidade}
                {s.categoria_sugerida && <span className="text-muted-foreground"> · {s.categoria_sugerida}</span>}
              </span>
              {podeGerir && (
                <button className="shrink-0 text-muted-foreground hover:text-white" aria-label="Remover"
                  onClick={() => mudarSemFornecedor(semFornecedor.filter((_, j) => j !== i))}>
                  <X className="h-4 w-4" />
                </button>
              )}
            </li>
          ))}
          {!semFornecedor.length && <li className="text-sm text-muted-foreground">Nada registrado.</li>}
        </ul>
        {podeGerir && (
          <form className="mt-3 flex gap-2" onSubmit={(e) => {
            e.preventDefault();
            if (!novaNecessidade.trim()) return;
            mudarSemFornecedor([...semFornecedor, { necessidade: novaNecessidade.trim(), categoria_sugerida: null }]);
            setNovaNecessidade("");
          }}>
            <Input value={novaNecessidade} onChange={(e) => setNovaNecessidade(e.target.value)} placeholder="Necessidade sem fornecedor" />
            <Button type="submit" variant="outline" size="icon" aria-label="Adicionar"><Plus /></Button>
          </form>
        )}
      </section>

      {podeGerir && (
        <div className="sticky bottom-2 z-10 flex justify-end">
          <Button onClick={() => salvar()} disabled={!pendente || salvando} className="shadow-lg">
            {salvando ? <Loader2 className="animate-spin" /> : <Save />} {pendente ? "Salvar seleção" : "Seleção salva"}
          </Button>
        </div>
      )}
    </div>
  );
}
