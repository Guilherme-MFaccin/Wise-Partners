import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Loader2, Pencil, Send } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { ok, toastErro } from "@/lib/erros";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Cabecalho } from "@/components/comum/Cabecalho";
import { Carregando, ErroCarga } from "@/components/comum/Estados";
import { Pilula } from "@/components/comum/Selos";

type Parceria = {
  nome_fantasia: string;
  responsavel_id: string | null;
  modelos_atuacao: string[] | null;
  valor_desejado: string | null;
  oferta_valor: string | null;
  entrega_valor: string | null;
  valor_criado: string | null;
};

const PONTOS: { chave: keyof Parceria; titulo: string; ajuda: string }[] = [
  { chave: "valor_desejado", titulo: "O que vocês querem ganhar", ajuda: "Objetivo da sua empresa com a parceria." },
  { chave: "oferta_valor", titulo: "O que a Wise oferece", ajuda: "O que a Wise coloca na parceria para vocês." },
  { chave: "entrega_valor", titulo: "Como o valor é entregue", ajuda: "Como, quando e por quais canais isso acontece." },
  { chave: "valor_criado", titulo: "Valor criado", ajuda: "Para cada lado e para o cliente." },
];

// Nossa parceria (FR-147): modelo de atuação e proposta de valor em 4 pontos, só leitura.
// A alteração é proposta à Wise, que valida antes de mudar a ficha.
export default function Parceria() {
  const { perfil } = useAuth();
  const pid = perfil?.parceiro_id;
  const [propondo, setPropondo] = useState(false);

  const q = useQuery({
    enabled: !!pid,
    queryKey: ["portal-parceria", pid],
    queryFn: async () => ok<any>(await supabase.from("parceiros")
      .select("nome_fantasia, responsavel_id, modelos_atuacao, valor_desejado, oferta_valor, entrega_valor, valor_criado")
      .eq("id", pid).single()) as Parceria,
  });
  // Proposta pendente de alteração da parceria (mesmo fluxo de validação da ficha)
  const pendenteQ = useQuery({
    enabled: !!pid,
    queryKey: ["portal-parceria-proposta", pid],
    queryFn: async () => {
      const linhas = ok<any>(await supabase.from("propostas_ficha").select("id, valores, estado, motivo_recusa, created_at")
        .eq("parceiro_id", pid).order("created_at", { ascending: false }).limit(5)) as any[];
      return linhas.find((l) => Object.keys(l.valores ?? {}).some((k) => k.startsWith("parceria."))) ?? null;
    },
  });
  const modelosQ = useQuery({
    queryKey: ["portal-modelos-atuacao"],
    queryFn: async () => {
      const r = ok<any>(await supabase.from("configuracoes").select("valor").eq("chave", "modelos_atuacao").maybeSingle());
      return (Array.isArray(r?.valor) ? r.valor : []) as string[];
    },
  });

  if (q.isLoading) return <Carregando />;
  if (q.error || !q.data) return <ErroCarga erro={q.error ?? "Parceria não encontrada."} />;
  const p = q.data;
  const modelos = p.modelos_atuacao ?? [];

  return (
    <div className="space-y-6">
      <Cabecalho titulo="Nossa parceria" descricao="O modelo de atuação e a proposta de valor que combinamos. Alterações valem depois da validação da Wise."
        acoes={<Button onClick={() => setPropondo(true)}><Pencil /> Propor alteração</Button>} />

      <section className="rounded-[14px] border border-white/10 bg-card p-4 sm:p-5">
        <h2 className="font-semibold">Modelo de atuação</h2>
        {modelos.length ? (
          <div className="mt-3 flex flex-wrap gap-2">{modelos.map((m) => <Pilula key={m} tom="menta">{m}</Pilula>)}</div>
        ) : <p className="mt-2 text-sm text-muted-foreground">Ainda não definido. Ele é combinado no encontro de alinhamento.</p>}
      </section>

      <section className="rounded-[14px] border border-white/10 bg-card p-4 sm:p-5">
        <h2 className="font-semibold">Proposta de valor</h2>
        <p className="mt-1 text-sm text-muted-foreground">Os quatro pontos que orientam a parceria.</p>
        <dl className="mt-4 grid gap-3 sm:grid-cols-2">
          {PONTOS.map((ponto, i) => {
            const valor = (p[ponto.chave] as string | null)?.trim();
            return (
              <div key={ponto.chave} className="rounded-[10px] border border-white/10 p-3">
                <dt className="flex items-center gap-2 text-sm font-semibold">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-menta-500/15 text-xs text-menta-300">{i + 1}</span>
                  {ponto.titulo}
                </dt>
                <dd className="mt-2 whitespace-pre-line text-sm">
                  {valor || <span className="text-muted-foreground">A definir. {ponto.ajuda}</span>}
                </dd>
              </div>
            );
          })}
        </dl>
      </section>

      {pendenteQ.data?.estado === "pendente" && (
        <p className="rounded-[10px] border border-menta-500/30 bg-menta-500/5 px-3 py-2 text-sm">
          Há uma proposta de alteração aguardando a validação da Wise.
        </p>
      )}
      {pendenteQ.data?.estado === "recusada" && (
        <p className="rounded-[10px] border border-white/15 px-3 py-2 text-sm text-muted-foreground">
          A última proposta não foi aprovada: {pendenteQ.data.motivo_recusa}
        </p>
      )}

      <ProporAlteracaoDialog aberto={propondo} onClose={() => setPropondo(false)} parceria={p}
        opcoes={modelosQ.data ?? []} parceiroId={pid!} />
    </div>
  );
}

// A proposta vai para a validação da Wise (propostas_ficha); a parceria só muda depois da aprovação.
function ProporAlteracaoDialog({ aberto, onClose, parceria, opcoes, parceiroId }: {
  aberto: boolean; onClose: () => void; parceria: Parceria; opcoes: string[]; parceiroId: string;
}) {
  const qc = useQueryClient();
  const [modelos, setModelos] = useState<string[]>([]);
  const [textos, setTextos] = useState<Record<string, string>>({});
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    if (!aberto) return;
    setModelos(parceria.modelos_atuacao ?? []);
    setTextos(Object.fromEntries(PONTOS.map((pt) => [pt.chave, (parceria[pt.chave] as string | null) ?? ""])));
  }, [aberto, parceria]);

  const todasOpcoes = [...new Set([...opcoes, ...(parceria.modelos_atuacao ?? [])])];

  async function enviar() {
    const valores: Record<string, unknown> = {};
    const atuais = parceria.modelos_atuacao ?? [];
    if (modelos.length !== atuais.length || modelos.some((m) => !atuais.includes(m))) valores["parceria.modelos_atuacao"] = modelos;
    for (const pt of PONTOS) {
      const novo = (textos[pt.chave] ?? "").trim();
      if (novo !== ((parceria[pt.chave] as string | null) ?? "").trim()) valores[`parceria.${pt.chave}`] = novo;
    }
    if (!Object.keys(valores).length) { toast.info("Nada mudou."); return; }
    setSalvando(true);
    const { error } = await supabase.from("propostas_ficha").insert({ parceiro_id: parceiroId, valores, estado: "pendente" });
    setSalvando(false);
    if (error) { toastErro(error); return; }
    toast.success("Proposta enviada para a validação da Wise.");
    qc.invalidateQueries({ queryKey: ["portal-parceria-proposta", parceiroId] });
    onClose();
  }

  return (
    <Dialog open={aberto} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Propor alteração</DialogTitle>
          <DialogDescription>
            A Wise valida a proposta antes de atualizar a parceria. Uma proposta nova substitui a anterior ainda pendente.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label>Modelo de atuação</Label>
            <div className="mt-2 grid gap-2">
              {todasOpcoes.map((m) => (
                <label key={m} className="flex items-center gap-2 text-sm">
                  <Checkbox checked={modelos.includes(m)}
                    onCheckedChange={(v) => setModelos((at) => v ? [...at, m] : at.filter((x) => x !== m))} />
                  {m}
                </label>
              ))}
            </div>
          </div>
          {PONTOS.map((pt, i) => (
            <div key={pt.chave} className="space-y-1.5">
              <Label htmlFor={`p-${pt.chave}`}>{i + 1}. {pt.titulo}</Label>
              <Textarea id={`p-${pt.chave}`} rows={3} value={textos[pt.chave] ?? ""} placeholder={pt.ajuda}
                onChange={(e) => setTextos((t) => ({ ...t, [pt.chave]: e.target.value }))} />
            </div>
          ))}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button onClick={enviar} disabled={salvando}>{salvando ? <Loader2 className="animate-spin" /> : <Send />} Enviar proposta</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
