import { useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import Papa from "papaparse";
import readXlsxFile from "read-excel-file";
import { toast } from "sonner";
import { AlertTriangle, FileSpreadsheet, Loader2, Lock, Shuffle, Trash2, Upload } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { mensagemErro, ok, toastErro } from "@/lib/erros";
import { data, dataHora } from "@/lib/formato";
import { QUADRANTES_CRUZAMENTO } from "@/lib/rotulos";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Cabecalho } from "@/components/comum/Cabecalho";
import { Carregando, ErroCarga } from "@/components/comum/Estados";
import { useParametro } from "@/components/portal/dados";
import { extrairDaPlanilha, type ItemParceiro } from "../../../supabase/functions/_shared/cruzamento";

type Situacao = { pode: boolean; motivo: string | null; ultimo_em: string | null; proximo_em: string | null; minimo: number; maximo: number; versao_termo: number };
type Totais = Record<string, number | string>;
type Cruzamento = { id: string; executado_em: string; total_enviado: number; totais: Totais };

const QUADRANTES = ["cliente_comum", "wise_apresenta", "parceiro_apresenta", "acao_conjunta"];

// Lê o arquivo no navegador. Do arquivo só saem raiz do CNPJ e tipo; nomes e demais colunas ficam no computador.
async function lerLinhas(arquivo: File): Promise<unknown[][]> {
  const nome = arquivo.name.toLowerCase();
  if (nome.endsWith(".xlsx")) {
    const linhas = await readXlsxFile(arquivo);
    // CNPJ salvo como número perde os zeros à esquerda: devolve os 14 dígitos
    return linhas.map((l) => l.map((c) => (typeof c === "number" && Number.isInteger(c) && String(c).length >= 12 && String(c).length < 14
      ? String(c).padStart(14, "0") : c)));
  }
  if (nome.endsWith(".csv") || nome.endsWith(".txt")) {
    return new Promise((resolve, reject) => {
      Papa.parse<string[]>(arquivo, {
        skipEmptyLines: true,
        complete: (r) => resolve(r.data),
        error: (e) => reject(e),
      });
    });
  }
  throw new Error("Use um arquivo CSV ou XLSX.");
}

// Erro da Edge Function: a mensagem vem no corpo ({ erro })
async function erroDaFuncao(e: any): Promise<string> {
  try {
    const corpo = await e?.context?.json?.();
    if (corpo?.erro) return corpo.erro;
  } catch {
    // corpo não é JSON
  }
  return mensagemErro(e);
}

// Cruzamento de carteiras (História 14, Apêndice I)
export default function Cruzamento() {
  const { perfil } = useAuth();
  const qc = useQueryClient();
  const pid = perfil?.parceiro_id;
  const termoQ = useParametro<string>("termo_cruzamento_texto");
  const inputRef = useRef<HTMLInputElement>(null);
  const [aceito, setAceito] = useState(false);
  const [arquivo, setArquivo] = useState<string | null>(null);
  const [lendo, setLendo] = useState(false);
  const [extracao, setExtracao] = useState<{ itens: ItemParceiro[]; problemas: string[]; semColuna: boolean } | null>(null);
  const [enviando, setEnviando] = useState(false);
  const [resultado, setResultado] = useState<Totais | null>(null);
  const [confirmarExclusao, setConfirmarExclusao] = useState(false);
  const [excluindo, setExcluindo] = useState(false);

  const situacaoQ = useQuery({
    enabled: !!pid,
    queryKey: ["portal-cruzamento-situacao", pid],
    queryFn: async () => ok<any>(await supabase.rpc("situacao_cruzamento")) as Situacao,
  });
  const historicoQ = useQuery({
    enabled: !!pid,
    queryKey: ["portal-cruzamentos", pid],
    queryFn: async () => ok<any>(await supabase.from("cruzamentos").select("id, executado_em, total_enviado, totais")
      .eq("parceiro_id", pid).order("executado_em", { ascending: false })) as Cruzamento[],
  });

  if (situacaoQ.isLoading) return <Carregando />;
  if (situacaoQ.error || !situacaoQ.data) return <ErroCarga erro={situacaoQ.error ?? "Situação indisponível."} />;
  const s = situacaoQ.data;
  const itens = extracao?.itens ?? [];
  const poucos = !!extracao && !extracao.semColuna && itens.length < s.minimo;
  const demais = itens.length > s.maximo;
  const podeEnviar = s.pode && aceito && !!extracao && !extracao.semColuna && !poucos && !demais && !enviando;
  const historico = historicoQ.data ?? [];

  async function escolher(f: File | undefined) {
    setExtracao(null);
    setResultado(null);
    if (!f) { setArquivo(null); return; }
    setArquivo(f.name);
    setLendo(true);
    try {
      const linhas = await lerLinhas(f);
      setExtracao(extrairDaPlanilha(linhas, s.maximo));
    } catch (e) {
      toastErro(e);
      setArquivo(null);
    } finally {
      setLendo(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  async function enviar() {
    if (!extracao) return;
    setEnviando(true);
    try {
      const { data: aceite, error: e1 } = await supabase.rpc("aceitar_termo_cruzamento");
      if (e1) throw e1;
      const { data: r, error: e2 } = await supabase.functions.invoke("cruzamento-carteiras", {
        body: { aceite_id: aceite, itens: extracao.itens },
      });
      if (e2) {
        toast.error(await erroDaFuncao(e2));
        return;
      }
      setResultado((r as any)?.totais ?? {});
      setExtracao(null);
      setArquivo(null);
      setAceito(false);
      toast.success("Cruzamento concluído. A lista enviada já foi descartada.");
      qc.invalidateQueries({ queryKey: ["portal-cruzamento-situacao"] });
      qc.invalidateQueries({ queryKey: ["portal-cruzamentos"] });
    } catch (e) {
      toastErro(e);
    } finally {
      setEnviando(false);
    }
  }

  async function excluir() {
    setExcluindo(true);
    try {
      const { data: n, error } = await supabase.rpc("excluir_cruzamentos");
      if (error) throw error;
      toast.success(n ? `${n} ${n === 1 ? "coincidência excluída" : "coincidências excluídas"}.` : "Não havia coincidências guardadas para excluir.");
      setConfirmarExclusao(false);
      qc.invalidateQueries({ queryKey: ["portal-cruzamentos"] });
    } catch (e) {
      toastErro(e);
    } finally {
      setExcluindo(false);
    }
  }

  const clientes = itens.filter((i) => i.tipo === "cliente").length;

  return (
    <div className="space-y-6">
      <Cabecalho titulo="Cruzamento de carteiras"
        descricao="Descubra oportunidades em comum comparando a carteira de vocês com a da Wise. É facultativo e só os CNPJs saem do seu computador."
        acoes={historico.length > 0 && (
          <Button variant="outline" onClick={() => setConfirmarExclusao(true)}><Trash2 /> Excluir coincidências</Button>
        )} />

      {resultado && <Quadrantes totais={resultado} titulo="Resultado do cruzamento" destaque />}

      {!s.pode ? (
        <section className="flex gap-3 rounded-[14px] border border-white/10 bg-card p-4 text-sm sm:p-5">
          <Lock className="mt-0.5 h-5 w-5 shrink-0 text-muted-foreground" />
          <div>
            <p className="font-semibold">Cruzamento indisponível no momento</p>
            <p className="mt-1 text-muted-foreground">{s.motivo}</p>
            {s.proximo_em && <p className="mt-1 text-muted-foreground">Próximo cruzamento possível a partir de {data(s.proximo_em)}.</p>}
          </div>
        </section>
      ) : (
        <>
          <section className="rounded-[14px] border border-white/10 bg-card p-4 sm:p-5">
            <h2 className="font-semibold">1. Termo do cruzamento <span className="text-xs font-normal text-muted-foreground">(versão {s.versao_termo})</span></h2>
            <div className="mt-3 max-h-72 overflow-y-auto whitespace-pre-line rounded-[10px] border border-white/10 bg-white/5 p-3 text-sm leading-relaxed">
              {termoQ.isLoading ? "Carregando..." : (typeof termoQ.data === "string" && termoQ.data) || "Termo indisponível. Fale com o seu responsável na Wise."}
            </div>
            <label className="mt-3 flex gap-2 text-sm">
              <Checkbox checked={aceito} onCheckedChange={(c) => setAceito(!!c)} className="mt-0.5" disabled={!termoQ.data} />
              <span>Li e aceito o termo do cruzamento de carteiras para este envio.</span>
            </label>
          </section>

          <section className="rounded-[14px] border border-white/10 bg-card p-4 sm:p-5">
            <h2 className="font-semibold">2. Arquivo da carteira</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              CSV ou XLSX com as colunas <strong>CNPJ</strong> e <strong>Tipo</strong> (cliente ou prospect). Entre {s.minimo} e {s.maximo.toLocaleString("pt-BR")} CNPJs.
              Não inclua nomes, e-mails ou telefones de pessoas: o arquivo não é enviado, só a raiz de cada CNPJ (8 primeiros dígitos) e o tipo.
            </p>
            <input ref={inputRef} type="file" accept=".csv,.xlsx,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
              className="hidden" onChange={(e) => escolher(e.target.files?.[0])} />
            <div className="mt-3 flex flex-wrap items-center gap-3">
              <Button variant="outline" onClick={() => inputRef.current?.click()} disabled={lendo}>
                {lendo ? <Loader2 className="animate-spin" /> : <Upload />} Escolher arquivo
              </Button>
              {arquivo && <span className="flex min-w-0 items-center gap-1 text-sm text-muted-foreground"><FileSpreadsheet className="h-4 w-4 shrink-0" /><span className="truncate">{arquivo}</span></span>}
            </div>

            {extracao && (
              <div className="mt-4 space-y-3 text-sm">
                {!extracao.semColuna && (
                  <p className={poucos || demais ? "text-warning" : ""}>
                    {itens.length} CNPJs válidos ({clientes} clientes e {itens.length - clientes} prospects).
                    {poucos && ` O mínimo é ${s.minimo}.`}
                    {demais && ` O máximo é ${s.maximo.toLocaleString("pt-BR")}.`}
                  </p>
                )}
                {extracao.problemas.length > 0 && (
                  <div className="rounded-[10px] border border-warning/40 bg-warning/10 p-3">
                    <p className="flex items-center gap-2 font-semibold"><AlertTriangle className="h-4 w-4 text-warning" />
                      {extracao.semColuna ? "Não foi possível ler o arquivo" : `${extracao.problemas.length} ${extracao.problemas.length === 1 ? "linha ignorada" : "linhas ignoradas"}`}
                    </p>
                    <ul className="mt-2 max-h-40 space-y-0.5 overflow-y-auto text-muted-foreground">
                      {extracao.problemas.slice(0, 50).map((p, i) => <li key={i}>{p}</li>)}
                      {extracao.problemas.length > 50 && <li>e mais {extracao.problemas.length - 50}.</li>}
                    </ul>
                    {!extracao.semColuna && <p className="mt-2 text-xs text-muted-foreground">As linhas com problema não são enviadas. Corrija o arquivo e escolha de novo, se quiser incluí-las.</p>}
                  </div>
                )}
              </div>
            )}
          </section>

          <div className="flex flex-wrap items-center gap-3">
            <Button onClick={enviar} disabled={!podeEnviar}>
              {enviando ? <Loader2 className="animate-spin" /> : <Shuffle />} Cruzar carteiras
            </Button>
            {!aceito && <span className="text-xs text-muted-foreground">Aceite o termo para continuar.</span>}
          </div>
        </>
      )}

      <section className="rounded-[14px] border border-white/10 bg-card p-4 sm:p-5">
        <h2 className="font-semibold">Cruzamentos anteriores</h2>
        {historicoQ.isLoading ? <Carregando /> : historicoQ.error ? <ErroCarga erro={historicoQ.error} /> : historico.length === 0 ? (
          <p className="mt-2 text-sm text-muted-foreground">Nenhum cruzamento feito ainda.</p>
        ) : (
          <ul className="mt-3 space-y-4">
            {historico.map((c) => (
              <li key={c.id} className="rounded-[10px] border border-white/10 p-3">
                <p className="text-sm font-semibold">{dataHora(c.executado_em)} · {c.total_enviado} CNPJs enviados</p>
                {c.totais?.excluido_em && <p className="text-xs text-muted-foreground">Coincidências excluídas a pedido em {dataHora(String(c.totais.excluido_em))}.</p>}
                <Quadrantes totais={c.totais ?? {}} compacto />
              </li>
            ))}
          </ul>
        )}
        <p className="mt-4 text-xs text-muted-foreground">
          A Wise guarda só as coincidências, por até 180 dias, e nunca a lista enviada. Vocês podem pedir a exclusão a qualquer momento.
        </p>
      </section>

      <AlertDialog open={confirmarExclusao} onOpenChange={setConfirmarExclusao}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir as coincidências?</AlertDialogTitle>
            <AlertDialogDescription>
              As coincidências guardadas dos cruzamentos de vocês são apagadas na hora. As que já viraram indicação ou ação conjunta continuam nos registros delas.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={excluindo}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={(e) => { e.preventDefault(); excluir(); }} disabled={excluindo}>
              {excluindo && <Loader2 className="animate-spin" />} Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function Quadrantes({ totais, titulo, destaque, compacto }: { totais: Totais; titulo?: string; destaque?: boolean; compacto?: boolean }) {
  const n = (k: string) => Number(totais?.[k] ?? 0);
  return (
    <section className={compacto ? "mt-2" : `rounded-[14px] border p-4 sm:p-5 ${destaque ? "border-menta-500/30 bg-menta-500/5" : "border-white/10 bg-card"}`}>
      {titulo && (
        <>
          <h2 className="font-semibold">{titulo}</h2>
          <p className="mt-1 text-sm text-muted-foreground">{n("total_enviado")} CNPJs comparados · {n("coincidencias")} coincidências. O time de parcerias da Wise vai analisar cada uma com vocês.</p>
        </>
      )}
      <ul className={`grid gap-2 sm:grid-cols-2 ${titulo ? "mt-3" : ""}`}>
        {QUADRANTES.map((q) => (
          <li key={q} className="flex items-center justify-between gap-3 rounded-[10px] border border-white/10 bg-background/40 px-3 py-2 text-sm">
            <span className="min-w-0">{QUADRANTES_CRUZAMENTO[q]}</span>
            <span className={`shrink-0 font-bold ${compacto ? "" : "text-lg"} ${n(q) ? "text-menta-300" : "text-muted-foreground"}`}>{n(q)}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
