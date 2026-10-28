import { useState } from "react";
import { ExternalLink, Upload } from "lucide-react";
import { data, dataHora, hojeISO } from "@/lib/formato";
import { ESTADOS_ACAO_WISE, PERIODICIDADES, TIPOS_ACAO, rotulo } from "@/lib/rotulos";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Cabecalho } from "@/components/comum/Cabecalho";
import { Carregando, ErroCarga, Vazio } from "@/components/comum/Estados";
import { Pilula } from "@/components/comum/Selos";
import { estadoContrapartida, useMinhasContrapartidas, type Contrapartida } from "@/components/portal/dados";
import { useAcoesWise, type AcaoWise } from "@/components/portal/dadosV2";
import { EnviarComprovacaoDialog } from "@/components/portal/EnviarComprovacaoDialog";
import { MetaContrapartida } from "@/components/metas/MetaContrapartida";

type Tom = "menta" | "neutro" | "info" | "alerta" | "perigo";
const TOM: Record<string, Tom> = {
  validada: "menta", pendente: "neutro", enviada: "info", atrasada: "alerta", recusada: "perigo",
};
const TOM_WISE: Record<string, Tom> = { planejada: "neutro", feita: "info", comprovada: "menta", atrasada: "alerta", cancelada: "neutro" };

// Ações conjuntas (História 11): o lado do parceiro (contrapartidas da v1, com comprovação)
// e o lado da Wise (ações do pacote, só leitura). Não há verba de marketing para parceiros.
export default function Acoes() {
  const contrapartidasQ = useMinhasContrapartidas();
  const wiseQ = useAcoesWise();
  const [enviando, setEnviando] = useState<Contrapartida | null>(null);
  const nParceiro = contrapartidasQ.data?.length ?? 0;
  const nWise = (wiseQ.data ?? []).filter((a) => a.estado !== "cancelada").length;

  return (
    <div>
      <Cabecalho titulo="Ações conjuntas"
        descricao="O plano da parceria nos dois sentidos: o que a sua empresa combinou e o que a Wise faz por vocês." />
      <Tabs defaultValue="parceiro">
        <TabsList className="mb-4 h-auto w-full flex-wrap justify-start sm:w-auto">
          <TabsTrigger value="parceiro">Lado do parceiro{nParceiro ? ` (${nParceiro})` : ""}</TabsTrigger>
          <TabsTrigger value="wise">Lado da Wise{nWise ? ` (${nWise})` : ""}</TabsTrigger>
        </TabsList>
        <TabsContent value="parceiro">
          <LadoParceiro lista={contrapartidasQ.data ?? []} carregando={contrapartidasQ.isLoading} erro={contrapartidasQ.error} onEnviar={setEnviando} />
        </TabsContent>
        <TabsContent value="wise">
          <LadoWise lista={wiseQ.data ?? []} carregando={wiseQ.isLoading} erro={wiseQ.error} />
        </TabsContent>
      </Tabs>
      <EnviarComprovacaoDialog contrapartida={enviando} onClose={() => setEnviando(null)} />
    </div>
  );
}

function LadoParceiro({ lista, carregando, erro, onEnviar }: { lista: Contrapartida[]; carregando: boolean; erro: any; onEnviar: (c: Contrapartida) => void }) {
  return (
    <>
      <p className="mb-4 rounded-[10px] bg-white/5 px-3 py-2 text-sm text-muted-foreground">
        Atrasos geram apenas lembretes; nada é suspenso. Se algo mudou, converse com o seu responsável na Wise.
      </p>
      {carregando ? <Carregando /> : erro ? <ErroCarga erro={erro} /> : lista.length === 0 ? (
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
                    <MetaContrapartida c={c} className="pt-1" />
                    <p className="text-sm text-muted-foreground">Comprovação esperada: {c.comprovacao}</p>
                    {est.codigo === "recusada" && est.motivo && (
                      <p className="text-sm text-red-300">Motivo da recusa: {est.motivo}</p>
                    )}
                    {ultima && <p className="text-xs text-muted-foreground">Último envio em {dataHora(ultima.created_at)}</p>}
                  </div>
                  <Button variant={est.codigo === "validada" || est.codigo === "enviada" ? "outline" : "default"} className="shrink-0"
                    onClick={() => onEnviar(c)}>
                    <Upload /> Enviar comprovação
                  </Button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}

function LadoWise({ lista, carregando, erro }: { lista: AcaoWise[]; carregando: boolean; erro: any }) {
  const hoje = hojeISO();
  const visiveis = lista.filter((a) => a.estado !== "cancelada");
  return (
    <>
      <p className="mb-4 rounded-[10px] bg-white/5 px-3 py-2 text-sm text-muted-foreground">
        Ações que a Wise faz pela parceria, conforme o pacote. Se uma ação atrasar, o seu responsável na Wise é avisado.
      </p>
      {carregando ? <Carregando /> : erro ? <ErroCarga erro={erro} /> : visiveis.length === 0 ? (
        <Vazio titulo="Nenhuma ação da Wise programada">As ações da Wise aparecem aqui depois da assinatura do contrato.</Vazio>
      ) : (
        <ul className="grid gap-3">
          {visiveis.map((a) => {
            const atrasada = a.estado === "atrasada" || (a.estado === "planejada" && !!a.data_prevista && a.data_prevista < hoje);
            const estado = atrasada ? "atrasada" : a.estado;
            const r = a.resultado ?? {};
            return (
              <li key={a.id} className="rounded-[14px] border border-white/10 bg-card p-4">
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-semibold">{a.nome}</p>
                    <Pilula tom={TOM_WISE[estado] ?? "neutro"}>{rotulo(ESTADOS_ACAO_WISE, estado)}</Pilula>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {rotulo(TIPOS_ACAO, a.tipo_acao)} · {rotulo(PERIODICIDADES, a.periodicidade)}
                    {a.concluida_em ? <> · feita em {data(a.concluida_em)}</> : a.data_prevista ? <> · prevista para {data(a.data_prevista)}</>
                      : a.periodicidade === "continua" ? null : <> · data a combinar</>}
                  </p>
                  {(r.alcance || r.inscritos) ? (
                    <p className="text-sm">
                      {r.alcance ? `Alcance: ${Number(r.alcance).toLocaleString("pt-BR")}` : ""}
                      {r.alcance && r.inscritos ? " · " : ""}
                      {r.inscritos ? `Inscritos: ${Number(r.inscritos).toLocaleString("pt-BR")}` : ""}
                    </p>
                  ) : null}
                  {a.comprovacao_link && (
                    <a href={a.comprovacao_link} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-sm text-menta-400 hover:underline">
                      <ExternalLink className="h-4 w-4" /> Ver a ação
                    </a>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}
