import { useState } from "react";
import { Upload } from "lucide-react";
import { data, dataHora } from "@/lib/formato";
import { PERIODICIDADES, rotulo } from "@/lib/rotulos";
import { Button } from "@/components/ui/button";
import { Cabecalho } from "@/components/comum/Cabecalho";
import { Carregando, ErroCarga, Vazio } from "@/components/comum/Estados";
import { Pilula } from "@/components/comum/Selos";
import { estadoContrapartida, useMinhasContrapartidas, type Contrapartida } from "@/components/portal/dados";
import { EnviarComprovacaoDialog } from "@/components/portal/EnviarComprovacaoDialog";

const TOM: Record<string, "menta" | "neutro" | "info" | "alerta" | "perigo"> = {
  validada: "menta", pendente: "neutro", enviada: "info", atrasada: "alerta", recusada: "perigo",
};

export default function Contrapartidas() {
  const { data: lista = [], isLoading, error } = useMinhasContrapartidas();
  const [enviando, setEnviando] = useState<Contrapartida | null>(null);

  return (
    <div>
      <Cabecalho titulo="Entregas e contrapartidas"
        descricao="O que a sua empresa combinou no contrato, com o que está em dia e o que falta comprovar." />
      <p className="mb-4 rounded-[10px] bg-white/5 px-3 py-2 text-sm text-muted-foreground">
        Atrasos geram apenas lembretes; nada é suspenso. Se algo mudou, converse com o seu responsável na Wise.
      </p>
      {isLoading ? <Carregando /> : error ? <ErroCarga erro={error} /> : lista.length === 0 ? (
        <Vazio titulo="Nenhuma contrapartida ativa">As contrapartidas aparecem aqui depois da assinatura do contrato.</Vazio>
      ) : (
        <ul className="grid gap-3">
          {lista.map((c) => {
            const est = estadoContrapartida(c);
            const ultima = [...(c.comprovacoes ?? [])].sort((a, b) => b.created_at.localeCompare(a.created_at))[0];
            return (
              <li key={c.id} className="rounded-[14px] border border-white/10 bg-card p-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0 space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-semibold">{c.nome}</p>
                      <Pilula tom={TOM[est.codigo] ?? "neutro"}>{est.rotulo}</Pilula>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {rotulo(PERIODICIDADES, c.periodicidade)}
                      {c.proxima_data && <> · próxima data {data(c.proxima_data)}</>}
                    </p>
                    {c.meta && <p className="text-sm">Meta: {c.meta}</p>}
                    <p className="text-sm text-muted-foreground">Comprovação esperada: {c.comprovacao}</p>
                    {est.codigo === "recusada" && est.motivo && (
                      <p className="text-sm text-red-300">Motivo da recusa: {est.motivo}</p>
                    )}
                    {ultima && <p className="text-xs text-muted-foreground">Último envio em {dataHora(ultima.created_at)}</p>}
                  </div>
                  <Button variant={est.codigo === "validada" || est.codigo === "enviada" ? "outline" : "default"} className="shrink-0"
                    onClick={() => setEnviando(c)}>
                    <Upload /> Enviar comprovação
                  </Button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
      <EnviarComprovacaoDialog contrapartida={enviando} onClose={() => setEnviando(null)} />
    </div>
  );
}
