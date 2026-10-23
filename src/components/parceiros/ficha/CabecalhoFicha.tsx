import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, CalendarClock, ClipboardCopy, FileDown, FileText, Loader2, MessageSquarePlus } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { useRegistroRapido } from "@/hooks/useRegistroRapido";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Pilula, SeloNivel, SeloStatus } from "@/components/comum/Selos";
import { baixarBlob } from "@/lib/pdf";
import { toastErro } from "@/lib/erros";
import { data, haQuanto } from "@/lib/formato";
import { ETAPAS, PACOTES, rotulo } from "@/lib/rotulos";
import { cn } from "@/lib/utils";
import { SeletorEtapa } from "../SeletorEtapa";
import {
  etapaPerda, nomeArquivoSeguro, nomePerfil, passoAtivo, podeRegistrarContato, useCampos, useCategorias, useEtapas, usePerfis,
  useProximosPassos, type Parceiro,
} from "../dados";
import { carregarExportacao, gerarPdfFicha, montarContexto } from "./exportar";

export function CabecalhoFicha({ parceiro: p, estrategico }: { parceiro: Parceiro; estrategico: boolean }) {
  const { perfil, isParcerias } = useAuth();
  const { abrir } = useRegistroRapido();
  const { data: perfis = [] } = usePerfis();
  const { data: etapas = [] } = useEtapas();
  const { data: campos = [] } = useCampos();
  const { data: categorias = [] } = useCategorias();
  const { data: passos } = useProximosPassos(p.id);
  const ativo = passoAtivo(passos);
  const [contexto, setContexto] = useState<string | null>(null);
  const [gerando, setGerando] = useState<"contexto" | "pdf" | null>(null);

  async function gerarContexto() {
    setGerando("contexto");
    try {
      const d = await carregarExportacao(p, campos, categorias, perfis);
      const texto = montarContexto(d);
      setContexto(texto);
      copiar(texto, false);
    } catch (e) {
      toastErro(e);
    } finally {
      setGerando(null);
    }
  }

  async function exportarPdf() {
    setGerando("pdf");
    try {
      const d = await carregarExportacao(p, campos, categorias, perfis);
      const blob = await gerarPdfFicha(d);
      baixarBlob(blob, `ficha-${nomeArquivoSeguro(p.nome_fantasia).toLowerCase()}.pdf`);
    } catch (e) {
      toastErro(e);
    } finally {
      setGerando(null);
    }
  }

  async function copiar(texto: string, avisarFalha = true) {
    try {
      await navigator.clipboard.writeText(texto);
      toast.success("Contexto copiado para a área de transferência.");
    } catch {
      if (avisarFalha) toast.error("Não foi possível copiar. Selecione o texto e copie manualmente.");
    }
  }

  return (
    <div className="mb-6 space-y-4">
      <Link to="/app/parceiros" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-white">
        <ArrowLeft className="h-4 w-4" /> Parceiros
      </Link>
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0 space-y-2">
          <h1 className="break-words text-2xl font-bold sm:text-3xl">{p.nome_fantasia}</h1>
          {p.razao_social && <p className="break-words text-sm text-muted-foreground">{p.razao_social}</p>}
          <div className="flex flex-wrap items-center gap-1.5">
            <SeloNivel tipo={p.tipo_parceria} nivel={p.nivel} />
            {p.pacote && <Pilula>{rotulo(PACOTES, p.pacote)}</Pilula>}
            <SeloStatus status={p.status_atividade} />
            <Pilula tom={etapaPerda(etapas, p.etapa) ? "perigo" : "menta"}>{rotulo(ETAPAS, p.etapa)}</Pilula>
            {estrategico && <Pilula tom="info">Estratégico</Pilula>}
          </div>
          <p className="text-sm text-muted-foreground">
            Responsável: <span className="text-foreground">{nomePerfil(perfis, p.responsavel_id) || "não definido"}</span>
            {" · "}Último contato: <span className="text-foreground">{p.ultimo_contato ? `${data(p.ultimo_contato)} (${haQuanto(p.ultimo_contato)})` : "nenhum"}</span>
          </p>
          {ativo && (
            <p className={cn(
              "flex items-start gap-2 rounded-[10px] border px-3 py-2 text-sm",
              ativo.estado === "vencido" ? "border-destructive/40 bg-destructive/10 text-red-200" : "border-white/10 bg-card",
            )}>
              <CalendarClock className="mt-0.5 h-4 w-4 shrink-0" />
              <span className="min-w-0 break-words">
                <strong>{ativo.estado === "vencido" ? "Próximo passo vencido" : "Próximo passo"}:</strong> {ativo.descricao} · até {data(ativo.data)}
                {ativo.responsavel_id && ativo.responsavel_id !== p.responsavel_id ? ` · ${nomePerfil(perfis, ativo.responsavel_id)}` : ""}
              </span>
            </p>
          )}
        </div>

        <div className="flex flex-wrap gap-2 lg:max-w-md lg:justify-end">
          {podeRegistrarContato(perfil?.papel) && (
            <Button onClick={() => abrir(p.id)}><MessageSquarePlus /> Registrar contato</Button>
          )}
          <Button variant="outline" onClick={gerarContexto} disabled={!!gerando}>
            {gerando === "contexto" ? <Loader2 className="animate-spin" /> : <FileText />} Contexto do parceiro
          </Button>
          <Button variant="outline" onClick={exportarPdf} disabled={!!gerando}>
            {gerando === "pdf" ? <Loader2 className="animate-spin" /> : <FileDown />} Exportar PDF
          </Button>
          {isParcerias && (
            <div className="w-full sm:w-56">
              <SeletorEtapa parceiro={p} className="w-full" />
            </div>
          )}
        </div>
      </div>

      <Dialog open={contexto !== null} onOpenChange={(v) => !v && setContexto(null)}>
        <DialogContent className="flex max-h-[100dvh] max-w-3xl flex-col sm:max-h-[90vh] sm:rounded-[14px]">
          <DialogHeader>
            <DialogTitle>Contexto do parceiro</DialogTitle>
            <DialogDescription>Texto pronto para colar em uma conversa de IA. Gerado a partir dos dados do portal, sem IA.</DialogDescription>
          </DialogHeader>
          <Textarea readOnly value={contexto ?? ""} className="min-h-[50vh] flex-1 font-mono text-xs" onFocus={(e) => e.currentTarget.select()} />
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setContexto(null)}>Fechar</Button>
            <Button onClick={() => contexto && copiar(contexto)}><ClipboardCopy /> Copiar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
