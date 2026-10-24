import { useEffect, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { AlertTriangle, ArrowLeft, CheckCircle2, ExternalLink, FileText, Loader2, Pencil, Plus, Trash2, Upload } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Carregando, ErroCarga, Vazio } from "@/components/comum/Estados";
import { Pilula } from "@/components/comum/Selos";
import { Button } from "@/components/ui/button";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Secao } from "@/components/parceiros/ui";
import { useEmpresasGrupo } from "@/components/indicacoes/dados";
import { toastErro } from "@/lib/erros";
import { dataHora } from "@/lib/formato";
import { TIPOS_MODULO, rotulo } from "@/lib/rotulos";
import { cn } from "@/lib/utils";
import { BUCKET_TRILHAS, abrirArquivoTrilha, useGabarito, useModulos, usePerguntas, type Modulo, type Pergunta, type Trilha } from "./dados";
import { TrilhaDialog } from "./TrilhaDialog";
import { ModuloDialog } from "./ModuloDialog";
import { PerguntaDialog } from "./PerguntaDialog";

function semConteudo(m: Modulo) {
  if (m.tipo === "texto") return !m.texto?.trim();
  if (m.tipo === "video_link") return !m.link;
  return !m.caminho;
}

// Detalhe da trilha: dados, módulos, teste e publicação.
export function DetalheTrilha({ trilha, onVoltar }: { trilha: Trilha; onVoltar: () => void }) {
  const { isAdmin } = useAuth();
  const qc = useQueryClient();
  const { data: empresas = [] } = useEmpresasGrupo();
  const modulos = useModulos(trilha.id);
  const perguntas = usePerguntas(trilha.id);
  const ids = (perguntas.data ?? []).map((p) => p.id);
  const gabarito = useGabarito(ids, isAdmin);

  const [editarTrilha, setEditarTrilha] = useState(false);
  const [modulo, setModulo] = useState<{ m: Modulo | null } | null>(null);
  const [pergunta, setPergunta] = useState<{ p: Pergunta | null } | null>(null);
  const [excluir, setExcluir] = useState<{ tipo: "modulo"; m: Modulo } | { tipo: "pergunta"; p: Pergunta } | null>(null);
  const [publicar, setPublicar] = useState(false);
  const [despublicar, setDespublicar] = useState(false);

  const listaModulos = modulos.data ?? [];
  const listaPerguntas = perguntas.data ?? [];
  const vazios = listaModulos.filter(semConteudo).length;
  const semGabarito = isAdmin && gabarito.isSuccess ? listaPerguntas.filter((p) => !gabarito.data?.has(p.id)).length : 0;
  const empresa = empresas.find((e) => e.id === trilha.empresa_grupo_id)?.nome;

  const exclusao = useMutation({
    mutationFn: async () => {
      if (!excluir) return;
      if (excluir.tipo === "modulo") {
        const { error } = await supabase.from("trilha_modulos").delete().eq("id", excluir.m.id);
        if (error) throw error;
        if (excluir.m.caminho) await supabase.storage.from(BUCKET_TRILHAS).remove([excluir.m.caminho]);
      } else {
        const { error } = await supabase.from("trilha_perguntas").delete().eq("id", excluir.p.id);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success(excluir?.tipo === "modulo" ? "Módulo excluído." : "Pergunta excluída.");
      qc.invalidateQueries({ queryKey: ["capacitacao"] });
      setExcluir(null);
    },
    onError: toastErro,
  });

  const despublicacao = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("trilhas").update({ publicada: false }).eq("id", trilha.id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Trilha voltou para rascunho e saiu do portal do parceiro.");
      qc.invalidateQueries({ queryKey: ["capacitacao", "trilhas"] });
      setDespublicar(false);
    },
    onError: toastErro,
  });

  return (
    <div className="space-y-4">
      <Button variant="ghost" size="sm" onClick={onVoltar}><ArrowLeft /> Todas as trilhas</Button>

      <Secao
        titulo={<span className="break-words">{trilha.titulo}</span>}
        descricao={trilha.descricao}
        acoes={isAdmin && (
          <>
            <Button size="sm" variant="outline" onClick={() => setEditarTrilha(true)}><Pencil /> Editar</Button>
            {trilha.publicada && <Button size="sm" variant="ghost" onClick={() => setDespublicar(true)}>Voltar para rascunho</Button>}
            <Button size="sm" onClick={() => setPublicar(true)}><Upload /> {trilha.publicada ? "Publicar alterações" : "Publicar"}</Button>
          </>
        )}
      >
        <div className="flex flex-wrap items-center gap-2 text-sm">
          {trilha.publicada ? <Pilula tom="menta">Publicada</Pilula> : <Pilula tom="alerta">Rascunho</Pilula>}
          <Pilula>Versão {trilha.versao}</Pilula>
          <Pilula>Nota mínima {trilha.nota_minima}%</Pilula>
          <Pilula>{empresa ?? "Todas as empresas"}</Pilula>
          <span className="text-xs text-muted-foreground">Atualizada em {dataHora(trilha.updated_at)}</span>
        </div>
      </Secao>

      <Secao
        titulo={`Módulos (${listaModulos.length})`}
        descricao="A pessoa conclui cada módulo antes de liberar o teste."
        acoes={isAdmin && (
          <Button size="sm" onClick={() => setModulo({ m: null })}><Plus /> Módulo</Button>
        )}
      >
        {modulos.isLoading && <Carregando />}
        {modulos.error && <ErroCarga erro={modulos.error} />}
        {modulos.isSuccess && !listaModulos.length && <Vazio titulo="Nenhum módulo." />}
        {vazios > 0 && (
          <p className="mb-3 flex items-start gap-2 text-sm text-warning">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" /> {vazios} módulo(s) ainda sem conteúdo.
          </p>
        )}
        <ol className="space-y-2">
          {listaModulos.map((m) => (
            <li key={m.id} className="flex min-w-0 flex-col gap-2 rounded-[10px] border border-white/10 p-3 sm:flex-row sm:items-start">
              <span className="w-8 shrink-0 text-sm font-semibold text-muted-foreground">{m.ordem}</span>
              <div className="min-w-0 flex-1 space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="break-words font-medium">{m.titulo}</span>
                  <Pilula tom="info">{rotulo(TIPOS_MODULO, m.tipo)}</Pilula>
                  {semConteudo(m) && <Pilula tom="alerta">Sem conteúdo</Pilula>}
                </div>
                {m.tipo === "texto" && m.texto && <p className="line-clamp-2 whitespace-pre-wrap break-words text-xs text-muted-foreground">{m.texto}</p>}
              </div>
              <div className="flex flex-wrap gap-1">
                {m.caminho && (m.tipo === "pdf" || m.tipo === "video_arquivo") && (
                  <Button size="sm" variant="outline" onClick={() => abrirArquivoTrilha(m.caminho!)}><FileText /> Abrir</Button>
                )}
                {m.link && m.tipo === "video_link" && (
                  <Button size="sm" variant="outline" asChild>
                    <a href={m.link} target="_blank" rel="noreferrer"><ExternalLink /> Abrir</a>
                  </Button>
                )}
                {isAdmin && (
                  <>
                    <Button size="icon" variant="ghost" aria-label="Editar módulo" onClick={() => setModulo({ m })}><Pencil /></Button>
                    <Button size="icon" variant="ghost" aria-label="Excluir módulo" onClick={() => setExcluir({ tipo: "modulo", m })}><Trash2 /></Button>
                  </>
                )}
              </div>
            </li>
          ))}
        </ol>
      </Secao>

      <Secao
        titulo={`Teste final (${listaPerguntas.length} pergunta(s))`}
        descricao={`Múltipla escolha, aprovação com ${trilha.nota_minima}% ou mais. Reprovado pode refazer após 24 horas.`}
        acoes={isAdmin && (
          <Button size="sm" onClick={() => setPergunta({ p: null })}><Plus /> Pergunta</Button>
        )}
      >
        {perguntas.isLoading && <Carregando />}
        {perguntas.error && <ErroCarga erro={perguntas.error} />}
        {perguntas.isSuccess && !listaPerguntas.length && (
          <Vazio titulo="Nenhuma pergunta.">
            {trilha.chave === "como_vender" ? "O roteiro prevê 10 perguntas com nota mínima de 70%." : "Sem perguntas, o teste não pode ser feito."}
          </Vazio>
        )}
        {semGabarito > 0 && (
          <p className="mb-3 flex items-start gap-2 text-sm text-warning">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" /> {semGabarito} pergunta(s) sem resposta correta marcada; elas não contam na nota.
          </p>
        )}
        <ol className="space-y-2">
          {listaPerguntas.map((p) => {
            const certa = gabarito.data?.get(p.id);
            return (
              <li key={p.id} className="flex min-w-0 flex-col gap-2 rounded-[10px] border border-white/10 p-3 sm:flex-row sm:items-start">
                <span className="w-8 shrink-0 text-sm font-semibold text-muted-foreground">{p.ordem}</span>
                <div className="min-w-0 flex-1">
                  <p className="whitespace-pre-wrap break-words font-medium">{p.enunciado}</p>
                  <ul className="mt-1 space-y-0.5 text-sm">
                    {p.opcoes.map((o, i) => (
                      <li key={i} className={cn("flex items-start gap-1.5", certa === i ? "text-menta-300" : "text-muted-foreground")}>
                        {certa === i ? <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0" /> : <span className="w-3.5 shrink-0 text-center">·</span>}
                        <span className="break-words">{o}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                {isAdmin && (
                  <div className="flex gap-1">
                    <Button size="icon" variant="ghost" aria-label="Editar pergunta" onClick={() => setPergunta({ p })}><Pencil /></Button>
                    <Button size="icon" variant="ghost" aria-label="Excluir pergunta" onClick={() => setExcluir({ tipo: "pergunta", p })}><Trash2 /></Button>
                  </div>
                )}
              </li>
            );
          })}
        </ol>
      </Secao>

      <TrilhaDialog aberto={editarTrilha} trilha={trilha} onFechar={() => setEditarTrilha(false)} />
      <ModuloDialog
        aberto={!!modulo} trilhaId={trilha.id} modulo={modulo?.m ?? null} onFechar={() => setModulo(null)}
        proximaOrdem={Math.max(0, ...listaModulos.map((m) => m.ordem)) + 1}
      />
      <PerguntaDialog
        aberto={!!pergunta} trilhaId={trilha.id} pergunta={pergunta?.p ?? null} onFechar={() => setPergunta(null)}
        correta={pergunta?.p ? gabarito.data?.get(pergunta.p.id) : undefined}
        proximaOrdem={Math.max(0, ...listaPerguntas.map((p) => p.ordem)) + 1}
      />
      <PublicarDialog
        aberto={publicar} trilha={trilha} onFechar={() => setPublicar(false)}
        avisos={[
          !listaModulos.length && "A trilha não tem módulos.",
          vazios > 0 && `${vazios} módulo(s) sem conteúdo.`,
          !listaPerguntas.length && "A trilha não tem perguntas: ninguém conseguirá fazer o teste.",
          semGabarito > 0 && `${semGabarito} pergunta(s) sem resposta correta.`,
        ].filter(Boolean) as string[]}
      />

      <AlertDialog open={!!excluir} onOpenChange={(v) => !v && setExcluir(null)}>
        <AlertDialogContent className="w-[calc(100vw-1rem)] rounded-[14px]">
          <AlertDialogHeader>
            <AlertDialogTitle>{excluir?.tipo === "modulo" ? "Excluir módulo?" : "Excluir pergunta?"}</AlertDialogTitle>
            <AlertDialogDescription className="break-words">
              {excluir?.tipo === "modulo"
                ? `"${excluir.m.titulo}". O progresso registrado neste módulo também é apagado, e o arquivo, se houver, é removido.`
                : excluir?.tipo === "pergunta" ? `"${excluir.p.enunciado}". A resposta correta é apagada junto.` : ""}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2">
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={exclusao.isPending}
              onClick={(e) => {
                e.preventDefault();
                exclusao.mutate();
              }}
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={despublicar} onOpenChange={setDespublicar}>
        <AlertDialogContent className="w-[calc(100vw-1rem)] rounded-[14px]">
          <AlertDialogHeader>
            <AlertDialogTitle>Voltar para rascunho?</AlertDialogTitle>
            <AlertDialogDescription>
              A trilha sai do portal do parceiro até ser publicada de novo. Progresso e certificados já emitidos são mantidos.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2">
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              disabled={despublicacao.isPending}
              onClick={(e) => {
                e.preventDefault();
                despublicacao.mutate();
              }}
            >
              Voltar para rascunho
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function PublicarDialog({ aberto, trilha, avisos, onFechar }: { aberto: boolean; trilha: Trilha; avisos: string[]; onFechar: () => void }) {
  const qc = useQueryClient();
  const [modo, setModo] = useState<"mesma" | "nova">("mesma");
  useEffect(() => {
    if (aberto) setModo("mesma");
  }, [aberto]);
  const publicacao = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.rpc("publicar_trilha", { p_trilha: trilha.id, p_nova_versao: modo === "nova" });
      if (error) throw error;
      return Number(data);
    },
    onSuccess: (v) => {
      toast.success(`Trilha publicada na versão ${v || trilha.versao}.`);
      qc.invalidateQueries({ queryKey: ["capacitacao"] });
      onFechar();
    },
    onError: toastErro,
  });

  return (
    <Dialog open={aberto} onOpenChange={(v) => !v && onFechar()}>
      <DialogContent className="max-h-[92vh] w-[calc(100vw-1rem)] max-w-lg overflow-y-auto rounded-[14px] p-4 sm:p-6">
        <DialogHeader>
          <DialogTitle>Publicar trilha</DialogTitle>
          <DialogDescription>A trilha publicada aparece no portal para as pessoas dos parceiros assinados.</DialogDescription>
        </DialogHeader>
        {avisos.length > 0 && (
          <ul className="space-y-1 rounded-[10px] border border-warning/40 bg-warning/10 p-3 text-sm">
            {avisos.map((a) => <li key={a} className="flex gap-2"><AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-warning" /> {a}</li>)}
          </ul>
        )}
        <RadioGroup value={modo} onValueChange={(v) => setModo(v as "mesma" | "nova")} className="gap-3">
          <label className="flex cursor-pointer gap-3 rounded-[10px] border border-white/10 p-3">
            <RadioGroupItem value="mesma" className="mt-1" />
            <span className="text-sm">
              <span className="block font-semibold">Manter a versão {trilha.versao}</span>
              <span className="text-muted-foreground">
                {trilha.publicada ? "Para correções pequenas. Certificados e progresso continuam como estão." : "Primeira publicação ou republicação sem mudar o conteúdo avaliado."}
              </span>
            </span>
          </label>
          <label className="flex cursor-pointer gap-3 rounded-[10px] border border-white/10 p-3">
            <RadioGroupItem value="nova" className="mt-1" />
            <span className="text-sm">
              <span className="block font-semibold">Publicar como versão {trilha.versao + 1}</span>
              <span className="text-muted-foreground">
                Para mudanças de conteúdo ou do teste. Quem quiser o certificado da versão nova precisa fazer o teste de novo e receber
                um novo certificado. Os certificados já emitidos continuam válidos e mostram a versão em que foram obtidos.
              </span>
            </span>
          </label>
        </RadioGroup>
        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onFechar}>Cancelar</Button>
          <Button onClick={() => publicacao.mutate()} disabled={publicacao.isPending}>
            {publicacao.isPending ? <Loader2 className="animate-spin" /> : <Upload />} Publicar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
