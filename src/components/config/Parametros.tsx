import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Loader2, Plus, Save, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { ok, toastErro } from "@/lib/erros";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
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

// Chaves numéricas que podem ficar vazias (valor nulo = "não informado")
const NULAVEIS = new Set(["ciclo_venda_direta_dias"]);

// Rótulos dos objetos de números (ex.: pontos do ranking por evento, Apêndice K)
const ROTULOS_OBJETO: Record<string, Record<string, string>> = {
  pontos_ranking: {
    indicacao_qualificada: "Indicação qualificada", reuniao: "Indicação que virou reunião", cliente_icp: "Cliente fechado no ICP",
    pessoa_certificada: "Pessoa certificada", acao_comprovada: "Ação conjunta comprovada no prazo",
  },
};

type Forma = "numero" | "texto" | "textoLongo" | "linhas" | "lista" | "json" | "booleano" | "numeros";
function formaDo(l: Linha): Forma {
  if (LISTAS[l.chave]) return "lista";
  if (l.valor === null && NULAVEIS.has(l.chave)) return "numero";
  if (typeof l.valor === "boolean") return "booleano";
  if (typeof l.valor === "number") return "numero";
  if (l.valor && typeof l.valor === "object" && !Array.isArray(l.valor) && Object.values(l.valor).every((v) => typeof v === "number")) return "numeros";
  if (typeof l.valor === "string") return l.valor.length > 80 || /texto|mensagem/.test(l.chave) ? "textoLongo" : "texto";
  if (Array.isArray(l.valor) && l.valor.every((x) => typeof x === "string")) return "linhas";
  return "json";
}

// Parâmetros do programa (tabela configuracoes), com o editor adequado a cada valor.
// `chaves` mostra só essas chaves (seções temáticas); `excluir` esconde as que já têm seção própria.
export function Parametros({ somenteLeitura, chaves, excluir }: { somenteLeitura: boolean; chaves?: string[]; excluir?: string[] }) {
  const q = useQuery({
    queryKey: ["config", "configuracoes"],
    queryFn: async () => ok<any>(await supabase.from("configuracoes").select("chave, valor, descricao").order("chave")) as Linha[],
  });
  if (q.isLoading) return <Carregando />;
  if (q.error) return <ErroCarga erro={q.error} />;
  const linhas = (q.data ?? []).filter((l) => (!chaves || chaves.includes(l.chave)) && !excluir?.includes(l.chave))
    .sort((a, b) => (chaves ? chaves.indexOf(a.chave) - chaves.indexOf(b.chave) : 0));
  return (
    <div className="space-y-3">
      {linhas.length === 0 && <p className="text-sm text-muted-foreground">Nenhum parâmetro.</p>}
      {linhas.map((l) => <Parametro key={l.chave} linha={l} somenteLeitura={somenteLeitura} />)}
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
      : forma === "numeros" ? Object.fromEntries(Object.entries(linha.valor ?? {}).map(([k, v]) => [k, String(v)]))
      : forma === "numero" ? (linha.valor === null ? "" : linha.valor)
      : linha.valor;
  const [valor, setValor] = useState<any>(paraEstado);
  const [salvando, setSalvando] = useState(false);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => setValor(paraEstado()), [JSON.stringify(linha.valor)]);
  const alterado = JSON.stringify(valor) !== JSON.stringify(paraEstado());

  async function salvar() {
    let novo: any;
    try {
      if (forma === "numero") novo = valor === "" || valor === null ? null : Number(valor);
      else if (forma === "booleano") novo = !!valor;
      else if (forma === "numeros") {
        novo = Object.fromEntries(Object.entries(valor as Record<string, string>).map(([k, v]) => [k, Number(v)]));
        if (Object.values(novo).some((n) => !Number.isFinite(n as number))) throw new Error("número inválido");
      }
      else if (forma === "linhas") novo = String(valor).split("\n").map((s) => s.trim()).filter(Boolean);
      else if (forma === "json") novo = JSON.parse(valor);
      else if (forma === "lista") novo = (valor as any[]).filter((item) => Object.values(item).some((v) => String(v ?? "").trim()));
      else novo = valor ?? "";
    } catch {
      toast.error(forma === "numeros" ? "Informe números válidos." : "JSON inválido.");
      return;
    }
    if (forma === "numero" && novo !== null && !Number.isFinite(novo)) {
      toast.error("Informe um número.");
      return;
    }
    if (novo === null && !NULAVEIS.has(linha.chave)) {
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
      {forma === "numero" && <Input type="number" className="sm:w-48" placeholder={NULAVEIS.has(linha.chave) ? "Não informado" : undefined} value={valor ?? ""} disabled={somenteLeitura} onChange={(e) => setValor(e.target.value)} />}
      {forma === "texto" && <Input value={valor ?? ""} disabled={somenteLeitura} onChange={(e) => setValor(e.target.value)} />}
      {forma === "booleano" && (
        <label className="flex items-center gap-2 text-sm">
          <Switch checked={!!valor} disabled={somenteLeitura} onCheckedChange={setValor} /> {valor ? "Ligado" : "Desligado"}
        </label>
      )}
      {forma === "numeros" && (
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {Object.entries(valor as Record<string, string>).map(([k, v]) => (
            <label key={k} className="space-y-1">
              <span className="block text-xs text-muted-foreground">{ROTULOS_OBJETO[linha.chave]?.[k] ?? k}</span>
              <Input type="number" inputMode="decimal" value={v} disabled={somenteLeitura}
                onChange={(e) => setValor({ ...(valor as Record<string, string>), [k]: e.target.value })} />
            </label>
          ))}
        </div>
      )}
      {forma === "textoLongo" && <Textarea rows={Math.min(16, Math.max(3, Math.ceil(String(valor ?? "").length / 90) + String(valor ?? "").split("\n").length))} value={valor ?? ""} disabled={somenteLeitura} onChange={(e) => setValor(e.target.value)} />}
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
