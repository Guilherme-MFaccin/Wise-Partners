import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Heart, Loader2, Send } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toastErro } from "@/lib/erros";
import { dataHora } from "@/lib/formato";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Cabecalho } from "@/components/comum/Cabecalho";
import { Carregando, ErroCarga, Vazio } from "@/components/comum/Estados";
import { useMeuParceiro } from "@/components/portal/dados";
import { trimestreAtual, useMinhaPesquisa } from "@/components/portal/dadosV2";

// Pesquisa de satisfação trimestral (nota de 0 a 10), uma resposta por pessoa por trimestre
export default function Pesquisa() {
  const qc = useQueryClient();
  const parceiroQ = useMeuParceiro();
  const q = useMinhaPesquisa();
  const [nota, setNota] = useState<number | null>(null);
  const [comentario, setComentario] = useState("");
  const [enviando, setEnviando] = useState(false);
  const tri = trimestreAtual();
  const rotuloTri = `${tri.slice(-1)}º trimestre de ${tri.slice(0, 4)}`;

  async function enviar() {
    if (nota === null) return;
    setEnviando(true);
    try {
      const { error } = await supabase.rpc("responder_pesquisa", { p_nota: nota, p_comentario: comentario.trim() || null });
      if (error) throw error;
      toast.success("Obrigado pela resposta!");
      await qc.invalidateQueries({ queryKey: ["portal-pesquisa"] });
    } catch (e) {
      toastErro(e);
      qc.invalidateQueries({ queryKey: ["portal-pesquisa"] });
    } finally {
      setEnviando(false);
    }
  }

  if (q.isLoading || parceiroQ.isLoading) return <Carregando />;
  if (q.error) return <ErroCarga erro={q.error} />;

  if (!parceiroQ.data?.data_assinatura) {
    return (
      <div>
        <Cabecalho titulo="Pesquisa de satisfação" />
        <Vazio titulo="Pesquisa disponível após a assinatura">A pesquisa trimestral é para parceiros com contrato assinado.</Vazio>
      </div>
    );
  }

  if (q.data) {
    return (
      <div>
        <Cabecalho titulo="Pesquisa de satisfação" />
        <section className="mx-auto max-w-xl rounded-[14px] border border-menta-500/30 bg-menta-500/5 p-6 text-center">
          <Heart className="mx-auto h-8 w-8 text-menta-400" />
          <p className="mt-3 text-lg font-semibold">Obrigado por responder!</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Você deu nota {q.data.nota} no {rotuloTri}, em {dataHora(q.data.respondida_em)}. A próxima pesquisa abre no início do próximo trimestre.
          </p>
          {q.data.comentario && <p className="mt-4 whitespace-pre-line rounded-[10px] bg-white/5 p-3 text-left text-sm">{q.data.comentario}</p>}
        </section>
      </div>
    );
  }

  return (
    <div>
      <Cabecalho titulo="Pesquisa de satisfação" descricao={`Conte como está a parceria com a Wise neste ${rotuloTri}. Leva menos de 1 minuto.`} />
      <section className="max-w-2xl space-y-6 rounded-[14px] border border-white/10 bg-card p-4 sm:p-6">
        <fieldset>
          <legend className="text-sm font-semibold">De 0 a 10, quanto você recomendaria o programa Wise Partners a outra empresa?</legend>
          <div className="mt-3 grid grid-cols-6 gap-2 sm:grid-cols-11" role="radiogroup" aria-label="Nota de 0 a 10">
            {Array.from({ length: 11 }, (_, n) => (
              <button key={n} type="button" role="radio" aria-checked={nota === n} onClick={() => setNota(n)}
                className={`h-11 rounded-[10px] border text-sm font-semibold transition-colors ${nota === n
                  ? "border-menta-500 bg-menta-500 text-neutro-900"
                  : "border-white/10 hover:border-menta-500/50 hover:bg-white/5"}`}>
                {n}
              </button>
            ))}
          </div>
          <div className="mt-2 flex justify-between text-xs text-muted-foreground"><span>Nada provável</span><span>Muito provável</span></div>
        </fieldset>
        <div className="space-y-1.5">
          <Label htmlFor="comentario">O que podemos melhorar? (opcional)</Label>
          <Textarea id="comentario" rows={4} value={comentario} onChange={(e) => setComentario(e.target.value)} maxLength={2000} />
        </div>
        <Button onClick={enviar} disabled={nota === null || enviando}>
          {enviando ? <Loader2 className="animate-spin" /> : <Send />} Enviar resposta
        </Button>
        <p className="text-xs text-muted-foreground">Uma resposta por pessoa a cada trimestre.</p>
      </section>
    </div>
  );
}
