import { useEffect, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ArrowDown, ArrowUp, ChevronDown, Loader2, Plus, Save, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { ok, toastErro } from "@/lib/erros";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Carregando, ErroCarga } from "@/components/comum/Estados";

export type Opcao = { valor: string; rotulo: string };

export type ColunaConfig = {
  chave: string;
  rotulo: string;
  tipo: "texto" | "textarea" | "numero" | "booleano" | "select" | "linhas" | "multi" | "json" | "data";
  opcoes?: Opcao[];
  fixaAposCriar?: boolean; // códigos e chaves: definidos na criação, depois só leitura
  somenteLeitura?: boolean;
  vazioNulo?: boolean; // múltipla escolha vazia grava nulo (ex.: "todos os níveis")
  visivel?: (linha: Record<string, any>) => boolean;
  ajuda?: string;
  larga?: boolean;
  obrigatoria?: boolean;
};

type Props = {
  tabela: string;
  pk: string[];
  colunas: ColunaConfig[];
  ordem?: string;
  filtro?: Record<string, any>;
  novo?: Record<string, any> | null; // valores iniciais de um registro novo; nulo = sem criação
  podeExcluir?: boolean;
  reordenar?: boolean;
  recolhido?: boolean; // cartões fechados por padrão (cadastros com muitos campos)
  tituloItem: (linha: Record<string, any>) => string;
  somenteLeitura: boolean;
  vazio?: string;
};

// Converte o valor do banco para o estado de edição (listas e JSON viram texto)
function paraEdicao(colunas: ColunaConfig[], linha: Record<string, any>) {
  const r: Record<string, any> = { ...linha };
  for (const c of colunas) {
    const v = linha[c.chave];
    if (c.tipo === "linhas") r[c.chave] = Array.isArray(v) ? v.join("\n") : "";
    if (c.tipo === "json") r[c.chave] = v === null || v === undefined ? "" : JSON.stringify(v, null, 2);
    if (c.tipo === "numero") r[c.chave] = v ?? "";
  }
  return r;
}

function paraBanco(colunas: ColunaConfig[], estado: Record<string, any>) {
  const r: Record<string, any> = {};
  for (const c of colunas) {
    if (c.somenteLeitura) continue;
    const v = estado[c.chave];
    switch (c.tipo) {
      case "linhas": r[c.chave] = String(v ?? "").split("\n").map((l) => l.trim()).filter(Boolean); break;
      case "json":
        try { r[c.chave] = String(v ?? "").trim() ? JSON.parse(v) : null; } catch { throw new Error(`${c.rotulo}: JSON inválido.`); }
        break;
      case "numero": r[c.chave] = v === "" || v === null || v === undefined ? null : Number(v); break;
      case "multi": r[c.chave] = Array.isArray(v) && v.length ? v : c.vazioNulo ? null : []; break;
      case "texto": case "textarea": r[c.chave] = typeof v === "string" ? (v.trim() === "" ? null : v) : v ?? null; break;
      default: r[c.chave] = v ?? null;
    }
  }
  return r;
}

// Editor genérico de cadastros de configuração (princípio III). Admin edita; os demais só leem.
export function TabelaConfig({
  tabela, pk, colunas, ordem = "ordem", filtro, novo = null, podeExcluir = false, reordenar = false, recolhido = false,
  tituloItem, somenteLeitura, vazio = "Nenhum registro.",
}: Props) {
  const qc = useQueryClient();
  const chaveQuery = ["config", tabela, filtro ?? null];
  const q = useQuery({
    queryKey: chaveQuery,
    queryFn: async () => {
      let consulta = supabase.from(tabela).select("*");
      for (const [k, v] of Object.entries(filtro ?? {})) consulta = v === null ? consulta.is(k, null) : consulta.eq(k, v);
      return ok<any>(await consulta.order(ordem)) as Record<string, any>[];
    },
  });
  const [criando, setCriando] = useState(false);
  const recarregar = () => qc.invalidateQueries({ queryKey: ["config", tabela] });

  async function mover(i: number, delta: number) {
    const linhas = q.data ?? [];
    const a = linhas[i];
    const b = linhas[i + delta];
    if (!a || !b) return;
    try {
      // Troca as posições; se as duas tiverem a mesma ordem, usa o índice
      const oa = a.ordem === b.ordem ? i : a.ordem;
      const ob = a.ordem === b.ordem ? i + delta : b.ordem;
      const r1 = await filtrarPk(supabase.from(tabela).update({ ordem: ob }), pk, a);
      if (r1.error) throw r1.error;
      const r2 = await filtrarPk(supabase.from(tabela).update({ ordem: oa }), pk, b);
      if (r2.error) throw r2.error;
      recarregar();
    } catch (e) {
      toastErro(e);
    }
  }

  if (q.isLoading) return <Carregando />;
  if (q.error) return <ErroCarga erro={q.error} />;
  const linhas = q.data ?? [];

  return (
    <div className="space-y-3">
      {!somenteLeitura && novo && (
        criando ? (
          <LinhaConfig linha={novo} nova colunas={colunas} tabela={tabela} pk={pk} titulo="Novo registro" somenteLeitura={false}
            podeExcluir={false} aberta onSalvo={() => { setCriando(false); recarregar(); }} onCancelar={() => setCriando(false)} />
        ) : (
          <Button variant="outline" size="sm" onClick={() => setCriando(true)}><Plus /> Adicionar</Button>
        )
      )}
      {linhas.length === 0 && <p className="text-sm text-muted-foreground">{vazio}</p>}
      {linhas.map((l, i) => (
        <LinhaConfig key={pk.map((k) => l[k]).join("|")} linha={l} colunas={colunas} tabela={tabela} pk={pk} titulo={tituloItem(l)}
          somenteLeitura={somenteLeitura} podeExcluir={podeExcluir} aberta={!recolhido} onSalvo={recarregar}
          mover={reordenar && !somenteLeitura ? { cima: i > 0 ? () => mover(i, -1) : undefined, baixo: i < linhas.length - 1 ? () => mover(i, 1) : undefined } : undefined} />
      ))}
    </div>
  );
}

function filtrarPk(consulta: any, pk: string[], linha: Record<string, any>) {
  let c = consulta;
  for (const k of pk) c = c.eq(k, linha[k]);
  return c;
}

function LinhaConfig({
  linha, nova = false, colunas, tabela, pk, titulo, somenteLeitura, podeExcluir, aberta: abertaInicial, onSalvo, onCancelar, mover,
}: {
  linha: Record<string, any>; nova?: boolean; colunas: ColunaConfig[]; tabela: string; pk: string[]; titulo: string;
  somenteLeitura: boolean; podeExcluir: boolean; aberta: boolean; onSalvo: () => void; onCancelar?: () => void;
  mover?: { cima?: () => void; baixo?: () => void };
}) {
  // Recalcula só quando o registro muda de fato (evita perder a edição em novas renderizações)
  const assinatura = JSON.stringify(linha);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const inicial = useMemo(() => paraEdicao(colunas, linha), [assinatura]);
  const [estado, setEstado] = useState(inicial);
  useEffect(() => setEstado(inicial), [inicial]);
  const [aberta, setAberta] = useState(abertaInicial);
  const [salvando, setSalvando] = useState(false);
  const alterada = nova || JSON.stringify(estado) !== JSON.stringify(inicial);
  const set = (k: string, v: any) => setEstado((e) => ({ ...e, [k]: v }));

  async function salvar() {
    const faltando = colunas.find((c) => c.obrigatoria && (!c.visivel || c.visivel(estado)) && String(estado[c.chave] ?? "").trim() === "");
    if (faltando) {
      toast.error(`Preencha: ${faltando.rotulo}.`);
      return;
    }
    setSalvando(true);
    try {
      const dados = paraBanco(colunas, estado);
      if (nova) {
        const { error } = await supabase.from(tabela).insert({ ...linha, ...dados });
        if (error) throw error;
        toast.success("Registro criado.");
      } else {
        for (const c of colunas) if (c.fixaAposCriar) delete dados[c.chave];
        const { error } = await filtrarPk(supabase.from(tabela).update(dados), pk, linha);
        if (error) throw error;
        toast.success("Alteração salva.");
      }
      onSalvo();
    } catch (e) {
      toastErro(e);
    } finally {
      setSalvando(false);
    }
  }

  async function excluir() {
    if (!confirm(`Excluir "${titulo}"?`)) return;
    try {
      const { error } = await filtrarPk(supabase.from(tabela).delete(), pk, linha);
      if (error) throw error;
      toast.success("Registro excluído.");
      onSalvo();
    } catch (e) {
      toastErro(e);
    }
  }

  return (
    <div className="rounded-[14px] border border-white/10 bg-card">
      <div className="flex items-center gap-2 p-3">
        <button type="button" className="flex min-w-0 flex-1 items-center gap-2 text-left" onClick={() => setAberta(!aberta)}>
          <ChevronDown className={cn("h-4 w-4 shrink-0 text-muted-foreground transition-transform", !aberta && "-rotate-90")} />
          <span className="truncate font-semibold">{titulo || "Sem nome"}</span>
        </button>
        {mover && (
          <div className="flex shrink-0">
            <Button variant="ghost" size="icon" className="h-8 w-8" disabled={!mover.cima} onClick={mover.cima} aria-label="Subir"><ArrowUp /></Button>
            <Button variant="ghost" size="icon" className="h-8 w-8" disabled={!mover.baixo} onClick={mover.baixo} aria-label="Descer"><ArrowDown /></Button>
          </div>
        )}
      </div>
      {aberta && (
        <div className="border-t border-white/10 p-3 sm:p-4">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {colunas.filter((c) => !c.visivel || c.visivel(estado)).map((c) => (
              <div key={c.chave} className={cn("min-w-0 space-y-1.5", (c.larga || c.tipo === "textarea" || c.tipo === "linhas" || c.tipo === "json") && "sm:col-span-2 lg:col-span-3")}>
                <Label className="text-xs text-muted-foreground">{c.rotulo}</Label>
                <Editor coluna={c} valor={estado[c.chave]} onChange={(v) => set(c.chave, v)}
                  disabled={somenteLeitura || c.somenteLeitura || (c.fixaAposCriar && !nova)} />
                {c.ajuda && <p className="text-xs text-muted-foreground">{c.ajuda}</p>}
              </div>
            ))}
          </div>
          {!somenteLeitura && (
            <div className="mt-4 flex flex-wrap justify-end gap-2">
              {podeExcluir && !nova && <Button variant="ghost" size="sm" className="text-red-300" onClick={excluir}><Trash2 /> Excluir</Button>}
              {onCancelar && <Button variant="outline" size="sm" onClick={onCancelar}>Cancelar</Button>}
              <Button size="sm" onClick={salvar} disabled={!alterada || salvando}>
                {salvando ? <Loader2 className="animate-spin" /> : <Save />} Salvar
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function Editor({ coluna, valor, onChange, disabled }: { coluna: ColunaConfig; valor: any; onChange: (v: any) => void; disabled: boolean }) {
  switch (coluna.tipo) {
    case "textarea":
    case "linhas":
      return <Textarea rows={coluna.tipo === "linhas" ? 5 : 4} value={valor ?? ""} disabled={disabled} onChange={(e) => onChange(e.target.value)} />;
    case "json":
      return <Textarea rows={4} className="font-mono text-xs" value={valor ?? ""} disabled={disabled} onChange={(e) => onChange(e.target.value)} />;
    case "numero":
      return <Input type="number" inputMode="decimal" step="any" value={valor ?? ""} disabled={disabled} onChange={(e) => onChange(e.target.value)} />;
    case "data":
      return <Input type="date" value={valor ?? ""} disabled={disabled} onChange={(e) => onChange(e.target.value)} />;
    case "booleano":
      return <div className="flex h-10 items-center"><Switch checked={!!valor} disabled={disabled} onCheckedChange={onChange} /></div>;
    case "select":
      return (
        <Select value={valor ?? "__nulo"} disabled={disabled} onValueChange={(v) => onChange(v === "__nulo" ? null : v)}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="__nulo">Nenhum</SelectItem>
            {coluna.opcoes!.map((o) => <SelectItem key={o.valor} value={o.valor}>{o.rotulo}</SelectItem>)}
          </SelectContent>
        </Select>
      );
    case "multi": {
      const lista: string[] = Array.isArray(valor) ? valor : [];
      return (
        <div className="flex min-h-10 flex-wrap items-center gap-x-4 gap-y-2">
          {coluna.opcoes!.map((o) => (
            <label key={o.valor} className="flex items-center gap-2 text-sm">
              <Checkbox checked={lista.includes(o.valor)} disabled={disabled}
                onCheckedChange={(c) => onChange(c ? [...lista, o.valor] : lista.filter((x) => x !== o.valor))} />
              {o.rotulo}
            </label>
          ))}
        </div>
      );
    }
    default:
      return <Input value={valor ?? ""} disabled={disabled} onChange={(e) => onChange(e.target.value)} />;
  }
}
