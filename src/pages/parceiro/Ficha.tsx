import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Clock, Loader2, Lock, Pencil, Send, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { ok, toastErro } from "@/lib/erros";
import { dataHora } from "@/lib/formato";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Cabecalho } from "@/components/comum/Cabecalho";
import { Carregando, ErroCarga } from "@/components/comum/Estados";
import { Pilula } from "@/components/comum/Selos";
import { CampoInput, CampoValor, valorCampoTexto, type CampoDef } from "@/components/comum/CampoDinamico";
import { useMeuParceiro } from "@/components/portal/dados";

type Proposta = { id: string; valores: Record<string, any>; estado: string; motivo_recusa: string | null; created_at: string; revisada_em: string | null };

const igual = (a: any, b: any) => JSON.stringify(a ?? null) === JSON.stringify(b ?? null);

export default function Ficha() {
  const { perfil } = useAuth();
  const qc = useQueryClient();
  const pid = perfil?.parceiro_id;
  const parceiroQ = useMeuParceiro();
  const [editando, setEditando] = useState(false);
  const [rascunho, setRascunho] = useState<Record<string, any>>({});
  const [enviando, setEnviando] = useState(false);

  const categoriasQ = useQuery({
    enabled: !!pid,
    queryKey: ["portal-categorias", pid],
    queryFn: async () => ok<any>(await supabase.from("parceiro_categorias").select("categoria_id, principal, categoria:categorias(nome)")
      .eq("parceiro_id", pid)) as { categoria_id: string; principal: boolean; categoria: { nome: string } | null }[],
  });
  // A RLS esconde do parceiro os campos internos
  const camposQ = useQuery({
    queryKey: ["portal-campos"],
    queryFn: async () => ok<any>(await supabase.from("campos_categoria").select("*").eq("ativo", true).order("ordem")) as CampoDef[],
  });
  const valoresQ = useQuery({
    enabled: !!pid,
    queryKey: ["portal-valores", pid],
    queryFn: async () => ok<any>(await supabase.from("parceiro_campos").select("campo_id, valor").eq("parceiro_id", pid)) as { campo_id: string; valor: any }[],
  });
  const propostasQ = useQuery({
    enabled: !!pid,
    queryKey: ["portal-propostas", pid],
    queryFn: async () => ok<any>(await supabase.from("propostas_ficha").select("id, valores, estado, motivo_recusa, created_at, revisada_em")
      .eq("parceiro_id", pid).order("created_at", { ascending: false })) as Proposta[],
  });

  const p = parceiroQ.data;
  const publicado = useMemo(() => Object.fromEntries((valoresQ.data ?? []).map((v) => [v.campo_id, v.valor])), [valoresQ.data]);
  const pendente = (propostasQ.data ?? []).find((x) => x.estado === "pendente" && !Object.keys(x.valores ?? {}).some((k) => k.startsWith("parceria.")));
  const historico = (propostasQ.data ?? []).filter((x) => (x.estado === "aprovada" || x.estado === "recusada") && !Object.keys(x.valores ?? {}).some((k) => k.startsWith("parceria.")));

  // Seções: perfil comum (pelo tipo de parceria) e campos de cada categoria da empresa
  const secoes = useMemo(() => {
    if (!p) return [];
    const campos = (camposQ.data ?? []).filter((c) => !c.interno);
    const s: { titulo: string; campos: CampoDef[] }[] = [];
    if (p.tipo_parceria === "comercial") {
      s.push({ titulo: "Perfil comum", campos: campos.filter((c) => c.escopo === "comum_comercial") });
    } else {
      s.push({ titulo: "Perfil comum", campos: campos.filter((c) => c.escopo === "comum_institucional") });
      if (p.perfil_institucional) s.push({ titulo: "Perfil institucional", campos: campos.filter((c) => c.escopo === "perfil" && c.perfil_institucional === p.perfil_institucional) });
    }
    for (const pc of [...(categoriasQ.data ?? [])].sort((a, b) => Number(b.principal) - Number(a.principal))) {
      const cs = campos.filter((c) => c.escopo === "categoria" && c.categoria_id === pc.categoria_id);
      if (cs.length) s.push({ titulo: pc.categoria?.nome ?? "Categoria", campos: cs });
    }
    return s.filter((x) => x.campos.length);
  }, [p, camposQ.data, categoriasQ.data]);
  const todosCampos = secoes.flatMap((s) => s.campos);

  function iniciarEdicao() {
    // Parte da ficha publicada com a proposta pendente aplicada, porque a nova proposta substitui a anterior
    setRascunho({ ...publicado, ...(pendente?.valores ?? {}) });
    setEditando(true);
  }

  async function enviar() {
    const valores: Record<string, any> = {};
    for (const c of todosCampos) {
      if (c.parceiro_edita && !igual(rascunho[c.id], publicado[c.id])) valores[c.id] = rascunho[c.id] ?? null;
    }
    if (!Object.keys(valores).length) {
      toast.info("Nenhuma alteração em relação à ficha publicada.");
      return;
    }
    setEnviando(true);
    try {
      const { error } = await supabase.from("propostas_ficha").insert({ parceiro_id: pid, valores, estado: "pendente", proposta_por: perfil!.id });
      if (error) throw error;
      toast.success("Proposta enviada. A Wise vai validar antes de publicar.");
      setEditando(false);
      qc.invalidateQueries({ queryKey: ["portal-propostas", pid] });
    } catch (e) {
      toastErro(e);
    } finally {
      setEnviando(false);
    }
  }

  if (parceiroQ.isLoading || camposQ.isLoading || valoresQ.isLoading || propostasQ.isLoading || categoriasQ.isLoading) return <Carregando />;
  const erro = parceiroQ.error || camposQ.error || valoresQ.error || propostasQ.error;
  if (erro) return <ErroCarga erro={erro} />;
  const rotuloCampo = (id: string) => todosCampos.find((c) => c.id === id)?.rotulo ?? "Campo";

  return (
    <div className="space-y-6">
      <Cabecalho titulo="Ficha de apresentação" descricao="Como a Wise apresenta a sua empresa aos clientes. Alterações valem depois da validação da Wise."
        acoes={!editando ? (
          <Button onClick={iniciarEdicao}><Pencil /> Propor alteração</Button>
        ) : (
          <>
            <Button variant="outline" onClick={() => setEditando(false)}><X /> Cancelar</Button>
            <Button onClick={enviar} disabled={enviando}>{enviando ? <Loader2 className="animate-spin" /> : <Send />} Enviar proposta</Button>
          </>
        )} />

      {pendente && (
        <div className="flex gap-2 rounded-[14px] border border-warning/40 bg-warning/10 p-4 text-sm">
          <Clock className="mt-0.5 h-4 w-4 shrink-0 text-warning" />
          <p>
            Proposta enviada em {dataHora(pendente.created_at)}, aguardando validação da Wise; a ficha publicada não muda até lá.
            {editando && " Uma nova proposta substitui a pendente."}
          </p>
        </div>
      )}

      {secoes.map((s) => (
        <section key={s.titulo} className="rounded-[14px] border border-white/10 bg-card p-4 sm:p-5">
          <h2 className="mb-4 font-semibold">{s.titulo}</h2>
          <dl className="space-y-5">
            {s.campos.map((c) => {
              const proposto = pendente && c.id in pendente.valores ? pendente.valores[c.id] : undefined;
              return (
                <div key={c.id} className="space-y-1.5">
                  <dt className="flex flex-wrap items-center gap-2">
                    <Label className="text-sm">{c.rotulo}</Label>
                    {!c.parceiro_edita && <Pilula><Lock className="mr-1 h-3 w-3" /> definido pela Wise</Pilula>}
                  </dt>
                  <dd className="text-sm">
                    {editando && c.parceiro_edita ? (
                      <>
                        <CampoInput campo={c} valor={rascunho[c.id]} onChange={(v) => setRascunho((r) => ({ ...r, [c.id]: v }))} />
                        {c.observacao && <p className="mt-1 text-xs text-muted-foreground">{c.observacao}</p>}
                      </>
                    ) : (
                      <>
                        <CampoValor campo={c} valor={publicado[c.id]} />
                        {proposto !== undefined && (
                          <p className="mt-1 text-xs text-warning">Proposto: {valorCampoTexto(c, proposto) || "vazio"}</p>
                        )}
                      </>
                    )}
                  </dd>
                </div>
              );
            })}
          </dl>
        </section>
      ))}

      {historico.length > 0 && (
        <section className="rounded-[14px] border border-white/10 bg-card p-4 sm:p-5">
          <h2 className="mb-3 font-semibold">Propostas anteriores</h2>
          <ul className="divide-y divide-white/5">
            {historico.map((h) => (
              <li key={h.id} className="py-3 text-sm">
                <div className="flex flex-wrap items-center gap-2">
                  <Pilula tom={h.estado === "aprovada" ? "menta" : "perigo"}>{h.estado === "aprovada" ? "Aprovada" : "Recusada"}</Pilula>
                  <span className="text-muted-foreground">Enviada em {dataHora(h.created_at)}{h.revisada_em && `, revisada em ${dataHora(h.revisada_em)}`}</span>
                </div>
                <p className="mt-1 text-muted-foreground">Campos: {Object.keys(h.valores ?? {}).map(rotuloCampo).join(", ")}</p>
                {h.estado === "recusada" && h.motivo_recusa && <p className="mt-1 text-red-300">Motivo: {h.motivo_recusa}</p>}
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
