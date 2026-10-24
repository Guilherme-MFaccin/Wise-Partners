import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { AlertTriangle, Check, Mail, MessageCircle, X } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { CampoValor, valorCampoTexto, type CampoDef } from "@/components/comum/CampoDinamico";
import { Pilula } from "@/components/comum/Selos";
import { Carregando } from "@/components/comum/Estados";
import { toastErro } from "@/lib/erros";
import { dataHora } from "@/lib/formato";
import { Secao } from "../ui";
import { invalidarParceiro, nomePerfil, preenchido, useCampos, useParceiroCampos, usePerfis, type Parceiro } from "../dados";
import { CHAVES_APRESENTACAO } from "./campos";

// Campos de "Nossa parceria" que o parceiro também pode propor (chaves "parceria.<coluna>")
const CAMPOS_PARCERIA: CampoDef[] = [
  { id: "parceria.modelos_atuacao", rotulo: "Nossa parceria: modelo de atuação", tipo: "multipla" },
  { id: "parceria.valor_desejado", rotulo: "Nossa parceria: o que o parceiro quer ganhar", tipo: "texto_longo" },
  { id: "parceria.oferta_valor", rotulo: "Nossa parceria: o que a Wise oferece", tipo: "texto_longo" },
  { id: "parceria.entrega_valor", rotulo: "Nossa parceria: como o valor é entregue", tipo: "texto_longo" },
  { id: "parceria.valor_criado", rotulo: "Nossa parceria: valor criado", tipo: "texto_longo" },
] as unknown as CampoDef[];

type Proposta = {
  id: string;
  valores: Record<string, any>;
  estado: "pendente" | "aprovada" | "recusada" | "substituida";
  proposta_por: string | null;
  revisada_por: string | null;
  revisada_em: string | null;
  motivo_recusa: string | null;
  created_at: string;
};

const ESTADOS_PROPOSTA: Record<string, string> = { pendente: "Pendente", aprovada: "Aprovada", recusada: "Recusada", substituida: "Substituída" };

// Ficha de apresentação (FR-013): versão publicada, como o cliente vê, e propostas do parceiro.
export function AbaFichaApresentacao({ parceiro: p }: { parceiro: Parceiro }) {
  const { isParcerias } = useAuth();
  const qc = useQueryClient();
  const campos = useCampos();
  const valores = useParceiroCampos(p.id);
  const { data: perfis = [] } = usePerfis();
  const propostas = useQuery({
    queryKey: ["parceiro", p.id, "propostas"],
    queryFn: async () => {
      const { data, error } = await supabase.from("propostas_ficha").select("*").eq("parceiro_id", p.id).order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as Proposta[];
    },
  });
  const [recusando, setRecusando] = useState<Proposta | null>(null);
  const [motivo, setMotivo] = useState("");
  const [ocupado, setOcupado] = useState(false);

  if (campos.isLoading || valores.isLoading) return <Carregando />;
  const todos = [...(campos.data ?? []), ...CAMPOS_PARCERIA];
  const atual = new Map<string, any>((valores.data ?? []).map((v) => [v.campo_id, v.valor]));
  for (const c of CAMPOS_PARCERIA) atual.set(c.id, (p as any)[c.id.slice("parceria.".length)] ?? null);
  const comum = todos.filter((c) => c.escopo === "comum_comercial");
  const apresentacao = CHAVES_APRESENTACAO.map((k) => comum.find((c) => c.chave === k)).filter(Boolean) as CampoDef[];
  const porChave = (k: string) => {
    const c = apresentacao.find((x) => x.chave === k);
    return c ? atual.get(c.id) : null;
  };
  const pendentes = (propostas.data ?? []).filter((x) => x.estado === "pendente");
  const historico = (propostas.data ?? []).filter((x) => x.estado !== "pendente");

  async function revisar(pr: Proposta, aprovar: boolean, motivoRecusa?: string) {
    setOcupado(true);
    const { error } = await supabase.rpc("revisar_proposta_ficha", { p_id: pr.id, p_aprovar: aprovar, p_motivo: motivoRecusa ?? null });
    setOcupado(false);
    if (error) {
      toastErro(error);
      return false;
    }
    toast.success(aprovar ? "Proposta aprovada. A nova versão da ficha já vale." : "Proposta recusada.");
    invalidarParceiro(qc, p.id);
    return true;
  }

  const semWhatsapp = !preenchido(porChave("whatsapp_comercial"));

  return (
    <div className="space-y-4">
      {p.tipo_parceria === "institucional" && (
        <p className="rounded-[10px] border border-white/10 bg-card p-3 text-sm text-muted-foreground">
          Parcerias institucionais não aparecem em páginas de RFP. As propostas de alteração do parceiro aparecem abaixo.
        </p>
      )}

      {pendentes.map((pendente) => (
        <Secao key={pendente.id}
          titulo={<span className="flex items-center gap-2">Proposta do parceiro pendente <Pilula tom="alerta">Aguardando validação</Pilula></span>}
          descricao={`Enviada em ${dataHora(pendente.created_at)}${nomePerfil(perfis, pendente.proposta_por) ? ` por ${nomePerfil(perfis, pendente.proposta_por)}` : ""}. A ficha publicada só muda depois da aprovação.`}
          className="border-warning/40"
          acoes={isParcerias && (
            <>
              <Button size="sm" variant="outline" disabled={ocupado} onClick={() => { setMotivo(""); setRecusando(pendente); }}><X /> Recusar</Button>
              <Button size="sm" disabled={ocupado} onClick={() => revisar(pendente, true)}><Check /> Aprovar</Button>
            </>
          )}
        >
          <Diferencas proposta={pendente} campos={todos} atual={atual} />
        </Secao>
      ))}

      {p.tipo_parceria === "comercial" && (
        <>
          {semWhatsapp && (
            <p className="flex items-start gap-2 rounded-[10px] border border-warning/40 bg-warning/10 p-3 text-sm text-warning">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
              Sem WhatsApp comercial cadastrado: a página de RFP vai mostrar o e-mail comercial no lugar do botão de WhatsApp.
            </p>
          )}
          <Secao titulo="Como o cliente vê" descricao="Versão publicada da ficha, usada nas páginas de RFP.">
            <PreviaCliente parceiro={p} valor={porChave} />
          </Secao>
          <Secao titulo="Campos da ficha de apresentação">
            <div className="grid gap-4 md:grid-cols-2">
              {apresentacao.map((c) => (
                <div key={c.id} className={c.tipo === "texto_longo" || c.tipo === "multipla" ? "min-w-0 md:col-span-2" : "min-w-0"}>
                  <p className="mb-0.5 text-xs font-semibold text-neutro-300">{c.rotulo}</p>
                  <div className="text-sm"><CampoValor campo={c} valor={atual.get(c.id)} /></div>
                </div>
              ))}
            </div>
            <p className="mt-4 text-xs text-muted-foreground">Para editar, use a aba Perfil e categoria.</p>
          </Secao>
        </>
      )}

      {historico.length > 0 && (
        <Secao titulo="Propostas anteriores">
          <ul className="space-y-3">
            {historico.map((h) => (
              <li key={h.id} className="rounded-[10px] border border-white/10 p-3">
                <div className="flex flex-wrap items-center gap-2 text-sm">
                  <Pilula tom={h.estado === "aprovada" ? "menta" : h.estado === "recusada" ? "perigo" : "neutro"}>{ESTADOS_PROPOSTA[h.estado]}</Pilula>
                  <span className="text-muted-foreground">
                    Enviada em {dataHora(h.created_at)}
                    {h.revisada_em ? ` · revisada em ${dataHora(h.revisada_em)}${nomePerfil(perfis, h.revisada_por) ? ` por ${nomePerfil(perfis, h.revisada_por)}` : ""}` : ""}
                  </span>
                </div>
                {h.motivo_recusa && <p className="mt-1 text-sm">Motivo: {h.motivo_recusa}</p>}
                <details className="mt-2">
                  <summary className="cursor-pointer text-xs text-menta-400">Ver campos propostos</summary>
                  <div className="mt-2"><Diferencas proposta={h} campos={todos} atual={atual} soProposto /></div>
                </details>
              </li>
            ))}
          </ul>
        </Secao>
      )}

      <Dialog open={!!recusando} onOpenChange={(v) => !v && setRecusando(null)}>
        <DialogContent className="max-w-md sm:rounded-[14px]">
          <DialogHeader>
            <DialogTitle>Recusar proposta</DialogTitle>
            <DialogDescription>O parceiro recebe o motivo e a ficha publicada não muda.</DialogDescription>
          </DialogHeader>
          <Textarea rows={3} value={motivo} onChange={(e) => setMotivo(e.target.value)} placeholder="Motivo da recusa" />
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setRecusando(null)}>Cancelar</Button>
            <Button disabled={ocupado || !motivo.trim()} onClick={async () => {
              if (recusando && (await revisar(recusando, false, motivo.trim()))) setRecusando(null);
            }}>Recusar proposta</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Comparação campo a campo entre a versão publicada e a proposta
function Diferencas({ proposta, campos, atual, soProposto }: { proposta: Proposta; campos: CampoDef[]; atual: Map<string, any>; soProposto?: boolean }) {
  const itens = Object.entries(proposta.valores ?? {}).map(([id, v]) => ({ campo: campos.find((c) => c.id === id), id, v }));
  if (!itens.length) return <p className="text-sm text-muted-foreground">Proposta sem campos.</p>;
  return (
    <div className="space-y-3">
      {itens.map(({ campo, id, v }) => {
        const def: CampoDef = campo ?? ({ id, rotulo: "Campo removido da configuração", tipo: "texto_curto", opcoes: [] } as any);
        const igual = JSON.stringify(atual.get(id) ?? null) === JSON.stringify(v ?? null);
        return (
          <div key={id} className="rounded-[10px] border border-white/10 p-3">
            <p className="mb-2 flex flex-wrap items-center gap-2 text-xs font-semibold text-neutro-300">
              {def.rotulo} {igual && <Pilula className="px-1.5 py-0 text-[10px]">Sem mudança</Pilula>}
            </p>
            {soProposto ? (
              <div className="text-sm"><CampoValor campo={def} valor={v} /></div>
            ) : (
              <div className="grid gap-3 md:grid-cols-2">
                <div className="min-w-0 rounded-[8px] bg-white/5 p-2">
                  <p className="mb-1 text-[11px] uppercase tracking-wider text-muted-foreground">Atual</p>
                  <div className="text-sm"><CampoValor campo={def} valor={atual.get(id)} /></div>
                </div>
                <div className="min-w-0 rounded-[8px] bg-menta-500/10 p-2">
                  <p className="mb-1 text-[11px] uppercase tracking-wider text-menta-300">Proposto</p>
                  <div className="text-sm"><CampoValor campo={def} valor={v} /></div>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// Prévia no estilo da página do cliente (fundo escuro, acento menta). Sem nível, pacote ou dados internos.
function PreviaCliente({ parceiro: p, valor }: { parceiro: Parceiro; valor: (k: string) => any }) {
  const texto = (k: string) => valorCampoTexto({ tipo: Array.isArray(valor(k)) ? "multipla" : "texto_curto" }, valor(k));
  const diferenciais = (texto("diferenciais") || "").split("\n").map((x) => x.trim()).filter(Boolean);
  const whatsapp = texto("whatsapp_comercial");
  const email = texto("email_comercial");
  return (
    <div className="mx-auto max-w-2xl rounded-[18px] border border-menta-500/30 bg-neutro-900 p-5 shadow-[0_0_40px_rgba(0,225,147,0.08)] sm:p-6">
      <p className="text-xs font-semibold uppercase tracking-wider text-menta-400">Parceiro Wise</p>
      <h3 className="mt-1 break-words font-display text-2xl font-bold">{p.nome_fantasia}</h3>
      {texto("visao_wise") && (
        <blockquote className="mt-4 border-l-2 border-menta-500 pl-3 text-sm italic text-neutro-100">
          <span className="not-italic font-semibold text-menta-300">Visão da Wise: </span>{texto("visao_wise")}
        </blockquote>
      )}
      {texto("o_que_faz") && <p className="mt-4 whitespace-pre-wrap text-sm text-neutro-100">{texto("o_que_faz")}</p>}
      {diferenciais.length > 0 && (
        <ul className="mt-4 space-y-1.5">
          {diferenciais.map((d, i) => (
            <li key={i} className="flex items-start gap-2 text-sm"><Check className="mt-0.5 h-4 w-4 shrink-0 text-menta-400" /> <span className="min-w-0">{d}</span></li>
          ))}
        </ul>
      )}
      {texto("para_quem") && (
        <div className="mt-4">
          <p className="text-xs font-semibold text-neutro-300">Para quem é indicado</p>
          <p className="mt-0.5 whitespace-pre-wrap text-sm">{texto("para_quem")}</p>
        </div>
      )}
      <div className="mt-4 flex flex-wrap gap-1.5">
        {[...(valor("segmentos") ?? []), ...(valor("porte_cliente") ?? []), ...(valor("regioes") ?? [])].map((t: string, i: number) => (
          <span key={i} className="rounded-full bg-white/10 px-2.5 py-0.5 text-xs">{t}</span>
        ))}
        {texto("atendimento") && <span className="rounded-full bg-menta-500/15 px-2.5 py-0.5 text-xs text-menta-300">Atendimento {texto("atendimento").toLowerCase()}</span>}
      </div>
      {texto("cases") && (
        <div className="mt-4">
          <p className="text-xs font-semibold text-neutro-300">Cases</p>
          <p className="mt-0.5 whitespace-pre-wrap text-sm">{texto("cases")}</p>
        </div>
      )}
      {texto("materiais") && (
        <p className="mt-3 text-sm">
          <a href={texto("materiais")} target="_blank" rel="noreferrer" className="break-all text-menta-400 underline">Materiais do parceiro</a>
        </p>
      )}
      <div className="mt-5">
        {whatsapp ? (
          <span className="inline-flex items-center gap-2 rounded-full bg-menta-500 px-4 py-2 text-sm font-semibold text-neutro-900">
            <MessageCircle className="h-4 w-4" /> Falar pelo WhatsApp
          </span>
        ) : email ? (
          <span className="inline-flex items-center gap-2 rounded-full border border-menta-500 px-4 py-2 text-sm font-semibold text-menta-300">
            <Mail className="h-4 w-4" /> {email}
          </span>
        ) : (
          <span className="text-sm text-warning">Sem WhatsApp nem e-mail comercial: o cliente não terá como falar com o parceiro.</span>
        )}
      </div>
    </div>
  );
}
