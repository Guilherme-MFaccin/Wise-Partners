import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Loader2, Plus, Save, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { ok, toastErro } from "@/lib/erros";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Carregando, ErroCarga } from "@/components/comum/Estados";

type Linha = { chave: string; valor: any; descricao: string | null };

// Listas com editor estruturado: cada item tem estes campos
const LISTAS: Record<string, { chave: string; rotulo: string; tipo: "date" | "text" | "url" }[]> = {
  calendario_mentoria: [
    { chave: "data", rotulo: "Data", tipo: "date" }, { chave: "titulo", rotulo: "Título", tipo: "text" }, { chave: "link", rotulo: "Link", tipo: "url" },
  ],
  calendario_eventos: [
    { chave: "data", rotulo: "Data", tipo: "date" }, { chave: "titulo", rotulo: "Título", tipo: "text" },
    { chave: "local", rotulo: "Local", tipo: "text" }, { chave: "link", rotulo: "Link", tipo: "url" },
  ],
  materiais_parceiro: [{ chave: "titulo", rotulo: "Título", tipo: "text" }, { chave: "link", rotulo: "Link", tipo: "url" }],
};

type Forma = "numero" | "texto" | "textoLongo" | "linhas" | "lista" | "json";
function formaDo(l: Linha): Forma {
  if (LISTAS[l.chave]) return "lista";
  if (typeof l.valor === "number") return "numero";
  if (typeof l.valor === "string") return l.valor.length > 80 || /texto|mensagem/.test(l.chave) ? "textoLongo" : "texto";
  if (Array.isArray(l.valor) && l.valor.every((x) => typeof x === "string")) return "linhas";
  return "json";
}

// Parâmetros do programa (tabela configuracoes), com o editor adequado a cada valor.
export function Parametros({ somenteLeitura }: { somenteLeitura: boolean }) {
  const q = useQuery({
    queryKey: ["config", "configuracoes"],
    queryFn: async () => ok<any>(await supabase.from("configuracoes").select("chave, valor, descricao").order("chave")) as Linha[],
  });
  if (q.isLoading) return <Carregando />;
  if (q.error) return <ErroCarga erro={q.error} />;
  return (
    <div className="space-y-3">
      {(q.data ?? []).map((l) => <Parametro key={l.chave} linha={l} somenteLeitura={somenteLeitura} />)}
    </div>
  );
}

function Parametro({ linha, somenteLeitura }: { linha: Linha; somenteLeitura: boolean }) {
  const qc = useQueryClient();
  const forma = formaDo(linha);
  const paraEstado = () =>
    forma === "linhas" ? (linha.valor as string[]).join("\n")
      : forma === "json" ? JSON.stringify(linha.valor, null, 2)
      : forma === "lista" ? (Array.isArray(linha.valor) ? linha.valor : [])
      : linha.valor;
  const [valor, setValor] = useState<any>(paraEstado);
  const [salvando, setSalvando] = useState(false);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => setValor(paraEstado()), [JSON.stringify(linha.valor)]);
  const alterado = JSON.stringify(valor) !== JSON.stringify(paraEstado());

  async function salvar() {
    let novo: any;
    try {
      if (forma === "numero") novo = valor === "" ? null : Number(valor);
      else if (forma === "linhas") novo = String(valor).split("\n").map((s) => s.trim()).filter(Boolean);
      else if (forma === "json") novo = JSON.parse(valor);
      else if (forma === "lista") novo = (valor as any[]).filter((item) => Object.values(item).some((v) => String(v ?? "").trim()));
      else novo = valor ?? "";
    } catch {
      toast.error("JSON inválido.");
      return;
    }
    if (novo === null) {
      toast.error("Informe um valor.");
      return;
    }
    setSalvando(true);
    try {
      const { error } = await supabase.from("configuracoes").update({ valor: novo }).eq("chave", linha.chave);
      if (error) throw error;
      toast.success("Parâmetro salvo.");
      qc.invalidateQueries({ queryKey: ["config", "configuracoes"] });
      qc.invalidateQueries({ queryKey: ["configuracao", linha.chave] });
    } catch (e) {
      toastErro(e);
    } finally {
      setSalvando(false);
    }
  }

  return (
    <div className="rounded-[14px] border border-white/10 bg-card p-3 sm:p-4">
      <p className="font-semibold">{linha.descricao || linha.chave}</p>
      <p className="mb-2 font-mono text-xs text-muted-foreground">{linha.chave}</p>
      {forma === "numero" && <Input type="number" className="sm:w-48" value={valor ?? ""} disabled={somenteLeitura} onChange={(e) => setValor(e.target.value)} />}
      {forma === "texto" && <Input value={valor ?? ""} disabled={somenteLeitura} onChange={(e) => setValor(e.target.value)} />}
      {forma === "textoLongo" && <Textarea rows={3} value={valor ?? ""} disabled={somenteLeitura} onChange={(e) => setValor(e.target.value)} />}
      {forma === "linhas" && <Textarea rows={4} value={valor} disabled={somenteLeitura} onChange={(e) => setValor(e.target.value)} placeholder="Um item por linha" />}
      {forma === "json" && <Textarea rows={4} className="font-mono text-xs" value={valor} disabled={somenteLeitura} onChange={(e) => setValor(e.target.value)} />}
      {forma === "lista" && <EditorLista campos={LISTAS[linha.chave]} itens={valor} onChange={setValor} disabled={somenteLeitura} />}
      {!somenteLeitura && (
        <div className="mt-3 flex justify-end">
          <Button size="sm" onClick={salvar} disabled={!alterado || salvando}>{salvando ? <Loader2 className="animate-spin" /> : <Save />} Salvar</Button>
        </div>
      )}
    </div>
  );
}

function EditorLista({
  campos, itens, onChange, disabled,
}: { campos: (typeof LISTAS)[string]; itens: Record<string, string>[]; onChange: (v: Record<string, string>[]) => void; disabled: boolean }) {
  return (
    <div className="space-y-2">
      {itens.length === 0 && <p className="text-sm text-muted-foreground">Nenhum item.</p>}
      {itens.map((item, i) => (
        <div key={i} className="flex gap-2 rounded-[10px] border border-white/10 p-2">
          <div className="grid min-w-0 flex-1 gap-2 sm:grid-cols-2 lg:grid-cols-4">
            {campos.map((c) => (
              <Input key={c.chave} type={c.tipo} placeholder={c.rotulo} aria-label={c.rotulo} value={item[c.chave] ?? ""} disabled={disabled}
                onChange={(e) => onChange(itens.map((x, j) => (j === i ? { ...x, [c.chave]: e.target.value } : x)))} />
            ))}
          </div>
          {!disabled && (
            <Button variant="ghost" size="icon" className="h-9 w-9 shrink-0" aria-label="Remover" onClick={() => onChange(itens.filter((_, j) => j !== i))}>
              <X />
            </Button>
          )}
        </div>
      ))}
      {!disabled && (
        <Button variant="outline" size="sm" onClick={() => onChange([...itens, Object.fromEntries(campos.map((c) => [c.chave, ""]))])}>
          <Plus /> Adicionar item
        </Button>
      )}
    </div>
  );
}
