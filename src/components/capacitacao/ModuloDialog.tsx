import { useEffect, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { FileText, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Campo } from "@/components/parceiros/ui";
import { nomeArquivoSeguro } from "@/components/parceiros/dados";
import { toastErro } from "@/lib/erros";
import { semTravessao } from "@/lib/formato";
import { TIPOS_MODULO } from "@/lib/rotulos";
import { BUCKET_TRILHAS, abrirArquivoTrilha, type Modulo } from "./dados";

const ACEITA: Record<string, string> = { video_arquivo: "video/*", pdf: "application/pdf,.pdf" };

function nomeDoCaminho(c: string | null) {
  if (!c) return "";
  return c.split("/").pop()!.replace(/^[0-9a-f-]{36}-/, "");
}

// Módulo da trilha: vídeo (arquivo no bucket privado ou link), PDF ou texto.
export function ModuloDialog({ aberto, trilhaId, modulo, proximaOrdem, onFechar }: {
  aberto: boolean; trilhaId: string; modulo: Modulo | null; proximaOrdem: number; onFechar: () => void;
}) {
  const qc = useQueryClient();
  const [titulo, setTitulo] = useState("");
  const [ordem, setOrdem] = useState("1");
  const [tipo, setTipo] = useState<Modulo["tipo"]>("texto");
  const [link, setLink] = useState("");
  const [texto, setTexto] = useState("");
  const [arquivo, setArquivo] = useState<File | null>(null);

  useEffect(() => {
    if (aberto) {
      setTitulo(modulo?.titulo ?? "");
      setOrdem(String(modulo?.ordem ?? proximaOrdem));
      setTipo(modulo?.tipo ?? "texto");
      setLink(modulo?.link ?? "");
      setTexto(modulo?.texto ?? "");
      setArquivo(null);
    }
  }, [aberto, modulo, proximaOrdem]);

  const comArquivo = tipo === "video_arquivo" || tipo === "pdf";
  // Arquivo atual só serve se o tipo continua sendo de arquivo
  const caminhoAtual = comArquivo && modulo?.caminho && (modulo.tipo === tipo) ? modulo.caminho : null;

  const salvar = useMutation({
    mutationFn: async () => {
      if (tipo === "video_link" && !/^https?:\/\//i.test(link.trim())) throw new Error("Informe o link do vídeo começando com https://.");
      if (tipo === "texto" && !texto.trim()) throw new Error("Escreva o texto do módulo.");
      if (comArquivo && !arquivo && !caminhoAtual) throw new Error("Escolha o arquivo do módulo.");
      if (tipo === "pdf" && arquivo && !/\.pdf$/i.test(arquivo.name) && arquivo.type !== "application/pdf") {
        throw new Error("O arquivo precisa ser PDF.");
      }
      if (tipo === "video_arquivo" && arquivo && !arquivo.type.startsWith("video/")) throw new Error("O arquivo precisa ser de vídeo.");

      let novoCaminho: string | null = null;
      if (comArquivo && arquivo) {
        novoCaminho = `${trilhaId}/${crypto.randomUUID()}-${nomeArquivoSeguro(arquivo.name)}`;
        const up = await supabase.storage.from(BUCKET_TRILHAS).upload(novoCaminho, arquivo, { contentType: arquivo.type || undefined });
        if (up.error) throw up.error;
      }
      const dados = {
        trilha_id: trilhaId,
        titulo: semTravessao(titulo.trim()),
        ordem: Number(ordem) || 0,
        tipo,
        caminho: comArquivo ? novoCaminho ?? caminhoAtual : null,
        link: tipo === "video_link" ? link.trim() : null,
        texto: tipo === "texto" ? semTravessao(texto) : null,
      };
      const r = modulo
        ? await supabase.from("trilha_modulos").update(dados).eq("id", modulo.id)
        : await supabase.from("trilha_modulos").insert(dados);
      if (r.error) {
        if (novoCaminho) await supabase.storage.from(BUCKET_TRILHAS).remove([novoCaminho]);
        throw r.error;
      }
      // Arquivo anterior que deixou de ser usado
      if (modulo?.caminho && modulo.caminho !== dados.caminho) {
        await supabase.storage.from(BUCKET_TRILHAS).remove([modulo.caminho]);
      }
    },
    onSuccess: () => {
      toast.success(modulo ? "Módulo atualizado." : "Módulo criado.");
      qc.invalidateQueries({ queryKey: ["capacitacao", "modulos", trilhaId] });
      onFechar();
    },
    onError: toastErro,
  });

  return (
    <Dialog open={aberto} onOpenChange={(v) => !v && !salvar.isPending && onFechar()}>
      <DialogContent className="max-h-[92vh] w-[calc(100vw-1rem)] max-w-xl overflow-y-auto rounded-[14px] p-4 sm:p-6">
        <DialogHeader>
          <DialogTitle>{modulo ? "Editar módulo" : "Novo módulo"}</DialogTitle>
          <DialogDescription>Arquivos ficam no armazenamento privado e são servidos por link temporário.</DialogDescription>
        </DialogHeader>
        <form
          className="space-y-3"
          onSubmit={(e) => {
            e.preventDefault();
            if (titulo.trim()) salvar.mutate();
          }}
        >
          <div className="grid gap-3 sm:grid-cols-[90px_1fr]">
            <Campo rotulo="Ordem">
              <Input type="number" value={ordem} onChange={(e) => setOrdem(e.target.value)} />
            </Campo>
            <Campo rotulo="Título" obrigatorio>
              <Input value={titulo} onChange={(e) => setTitulo(e.target.value)} />
            </Campo>
          </div>
          <Campo rotulo="Tipo">
            <Select value={tipo} onValueChange={(v) => { setTipo(v as Modulo["tipo"]); setArquivo(null); }}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {Object.entries(TIPOS_MODULO).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
              </SelectContent>
            </Select>
          </Campo>

          {comArquivo && (
            <Campo rotulo={tipo === "pdf" ? "Arquivo PDF" : "Arquivo de vídeo"} obrigatorio={!caminhoAtual}
              dica={caminhoAtual ? "Escolha um arquivo só para substituir o atual." : undefined}>
              {caminhoAtual && (
                <button type="button" onClick={() => abrirArquivoTrilha(caminhoAtual)}
                  className="mb-1 inline-flex max-w-full items-center gap-1 break-all text-left text-sm text-menta-400 hover:underline">
                  <FileText className="h-4 w-4 shrink-0" /> {nomeDoCaminho(caminhoAtual)}
                </button>
              )}
              <Input key={tipo} type="file" accept={ACEITA[tipo]} onChange={(e) => setArquivo(e.target.files?.[0] ?? null)} />
            </Campo>
          )}
          {tipo === "video_link" && (
            <Campo rotulo="Link do vídeo" obrigatorio dica="Use link não listado ou privado: o conteúdo não pode ficar no Wise Hub.">
              <Input type="url" inputMode="url" placeholder="https://" value={link} onChange={(e) => setLink(e.target.value)} />
            </Campo>
          )}
          {tipo === "texto" && (
            <Campo rotulo="Texto" obrigatorio>
              <Textarea rows={10} value={texto} onChange={(e) => setTexto(e.target.value)} />
            </Campo>
          )}

          <DialogFooter className="gap-2">
            <Button type="button" variant="outline" onClick={onFechar} disabled={salvar.isPending}>Cancelar</Button>
            <Button type="submit" disabled={!titulo.trim() || salvar.isPending}>
              {salvar.isPending && <Loader2 className="animate-spin" />} {salvar.isPending && arquivo ? "Enviando..." : "Salvar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
