import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { AlertTriangle, CheckCircle2, FileUp, Loader2, Search, Trash2, XCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Carregando, ErroCarga, Vazio } from "@/components/comum/Estados";
import { Pilula } from "@/components/comum/Selos";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Secao } from "@/components/parceiros/ui";
import { useEmpresasGrupo } from "@/components/indicacoes/dados";
import { toastErro } from "@/lib/erros";
import { dataHora } from "@/lib/formato";
import { ROTULO_TIPO_EMPRESA, formatarRaiz, lerPlanilha, useContagensBase, validarBase, type BaseWise as LinhaTabela, type LinhaBase } from "./dados";

const TODAS = "__todas";
const NENHUMA = "__nenhuma";
const LOTE = 500;

type Previa = { arquivo: string; itens: LinhaBase[]; problemas: string[]; repetidas: number; lidas: number };

// Base da Wise para o cruzamento: administradores importam; o time de parcerias consulta.
export function BaseWise() {
  const { isAdmin, perfil } = useAuth();
  const qc = useQueryClient();
  const { data: empresas = [] } = useEmpresasGrupo();
  const contagens = useContagensBase(empresas);
  const [empresaPadrao, setEmpresaPadrao] = useState(NENHUMA);
  const [lendo, setLendo] = useState(false);
  const [previa, setPrevia] = useState<Previa | null>(null);
  const [gravando, setGravando] = useState(false);
  const [progresso, setProgresso] = useState(0);
  const [limpar, setLimpar] = useState<string | null>(null);
  const [limpando, setLimpando] = useState(false);

  const total = [...(contagens.data?.values() ?? [])].reduce((a, b) => a + b, 0);
  const nomeEmpresa = (id: string) => empresas.find((e) => e.id === id)?.nome ?? "";

  async function ler(f: File) {
    setLendo(true);
    setPrevia(null);
    try {
      const linhas = await lerPlanilha(f);
      const r = validarBase(linhas, empresas, empresaPadrao === NENHUMA ? null : empresaPadrao);
      setPrevia({ arquivo: f.name, ...r });
    } catch (e) {
      toastErro(e);
    } finally {
      setLendo(false);
    }
  }

  async function importar() {
    if (!previa) return;
    setGravando(true);
    setProgresso(0);
    try {
      const agora = new Date().toISOString();
      for (let i = 0; i < previa.itens.length; i += LOTE) {
        const lote = previa.itens.slice(i, i + LOTE).map((x) => ({ ...x, importado_em: agora, importado_por: perfil?.id }));
        const { error } = await supabase.from("base_wise_cruzamento").upsert(lote, { onConflict: "cnpj_raiz,empresa_grupo_id" });
        if (error) throw error;
        setProgresso(Math.min(i + LOTE, previa.itens.length));
      }
      toast.success(`${previa.itens.length} empresas importadas ou atualizadas.`);
      setPrevia(null);
    } catch (e) {
      toastErro(e);
    } finally {
      setGravando(false);
      qc.invalidateQueries({ queryKey: ["cruzamento"] });
    }
  }

  async function confirmarLimpeza() {
    if (!limpar) return;
    setLimpando(true);
    const q = supabase.from("base_wise_cruzamento").delete();
    const { error } = limpar === TODAS ? await q.not("id", "is", null) : await q.eq("empresa_grupo_id", limpar);
    setLimpando(false);
    if (error) return toastErro(error);
    toast.success(limpar === TODAS ? "Base da Wise apagada." : `Base de ${nomeEmpresa(limpar)} apagada.`);
    setLimpar(null);
    qc.invalidateQueries({ queryKey: ["cruzamento"] });
  }

  return (
    <div className="space-y-4">
      <Secao titulo="Empresas na base" descricao="Só a raiz do CNPJ (8 dígitos), a razão social e o tipo. Visível só a administradores e ao time de parcerias.">
        {contagens.isLoading && <Carregando />}
        {contagens.error && <ErroCarga erro={contagens.error} />}
        {contagens.isSuccess && (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Empresa</TableHead>
                  <TableHead className="text-right">Clientes</TableHead>
                  <TableHead className="text-right">Prospects</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  {isAdmin && <TableHead className="w-24" />}
                </TableRow>
              </TableHeader>
              <TableBody>
                {empresas.map((e) => {
                  const c = contagens.data.get(`${e.id}:cliente`) ?? 0;
                  const p = contagens.data.get(`${e.id}:prospect`) ?? 0;
                  return (
                    <TableRow key={e.id}>
                      <TableCell className="font-medium">{e.nome}</TableCell>
                      <TableCell className="text-right">{c}</TableCell>
                      <TableCell className="text-right">{p}</TableCell>
                      <TableCell className="text-right font-semibold">{c + p}</TableCell>
                      {isAdmin && (
                        <TableCell>
                          {c + p > 0 && <Button size="sm" variant="ghost" onClick={() => setLimpar(e.id)}><Trash2 /> Limpar</Button>}
                        </TableCell>
                      )}
                    </TableRow>
                  );
                })}
                <TableRow>
                  <TableCell className="font-semibold">Total</TableCell>
                  <TableCell colSpan={2} />
                  <TableCell className="text-right font-bold">{total}</TableCell>
                  {isAdmin && (
                    <TableCell>
                      {total > 0 && <Button size="sm" variant="ghost" onClick={() => setLimpar(TODAS)}><Trash2 /> Limpar tudo</Button>}
                    </TableCell>
                  )}
                </TableRow>
              </TableBody>
            </Table>
          </div>
        )}
      </Secao>

      {isAdmin && (
        <Secao
          titulo="Importar planilha"
          descricao="CSV ou XLSX com as colunas CNPJ, Razão social, Tipo (cliente ou prospect) e Empresa (wise, triade ou swallow). Empresas já na base são atualizadas."
        >
          <div className="grid gap-3 md:grid-cols-[260px_1fr] md:items-end">
            <div className="space-y-1.5">
              <p className="text-xs font-semibold text-neutro-300">Empresa quando a coluna faltar ou vier vazia</p>
              <Select value={empresaPadrao} onValueChange={setEmpresaPadrao}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value={NENHUMA}>Exigir a coluna Empresa</SelectItem>
                  {empresas.map((e) => <SelectItem key={e.id} value={e.id}>{e.nome}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <Input type="file" accept=".csv,.xlsx,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" className="sm:max-w-sm"
                disabled={lendo || gravando}
                onChange={(e) => { const f = e.target.files?.[0]; if (f) ler(f); e.target.value = ""; }} />
              {lendo && <span className="inline-flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> Lendo arquivo</span>}
            </div>
          </div>

          {previa && (
            <div className="mt-4 space-y-3">
              <p className="break-all text-sm text-muted-foreground">{previa.arquivo}: {previa.lidas} linha(s) lidas</p>
              <div className="flex flex-wrap gap-2">
                <Pilula tom="menta"><CheckCircle2 className="mr-1 h-3 w-3" /> {previa.itens.length} prontas</Pilula>
                <Pilula tom="info">{previa.itens.filter((x) => x.tipo === "cliente").length} clientes</Pilula>
                <Pilula tom="info">{previa.itens.filter((x) => x.tipo === "prospect").length} prospects</Pilula>
                {previa.repetidas > 0 && <Pilula tom="alerta">{previa.repetidas} repetidas (contadas uma vez)</Pilula>}
                {previa.problemas.length > 0 && <Pilula tom="perigo"><XCircle className="mr-1 h-3 w-3" /> {previa.problemas.length} com problema</Pilula>}
              </div>
              {previa.problemas.length > 0 && (
                <ul className="max-h-48 space-y-0.5 overflow-y-auto rounded-[10px] border border-destructive/30 bg-destructive/5 p-3 text-xs text-red-200">
                  {previa.problemas.slice(0, 200).map((p) => <li key={p} className="flex gap-1"><AlertTriangle className="mt-0.5 h-3 w-3 shrink-0" /> {p}</li>)}
                  {previa.problemas.length > 200 && <li>e mais {previa.problemas.length - 200}</li>}
                </ul>
              )}
              {previa.itens.length > 0 && (
                <div className="overflow-x-auto rounded-[10px] border border-white/10">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Raiz do CNPJ</TableHead>
                        <TableHead>Razão social</TableHead>
                        <TableHead>Tipo</TableHead>
                        <TableHead>Empresa</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {previa.itens.slice(0, 10).map((x) => (
                        <TableRow key={`${x.cnpj_raiz}:${x.empresa_grupo_id}`}>
                          <TableCell className="whitespace-nowrap">{formatarRaiz(x.cnpj_raiz)}</TableCell>
                          <TableCell>{x.razao_social}</TableCell>
                          <TableCell>{ROTULO_TIPO_EMPRESA[x.tipo]}</TableCell>
                          <TableCell>{nomeEmpresa(x.empresa_grupo_id)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  {previa.itens.length > 10 && <p className="p-2 text-xs text-muted-foreground">Mostrando 10 de {previa.itens.length}.</p>}
                </div>
              )}
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-end">
                {gravando && <span className="text-sm text-muted-foreground">Gravando {progresso} de {previa.itens.length}...</span>}
                <Button variant="outline" onClick={() => setPrevia(null)} disabled={gravando}>Descartar</Button>
                <Button onClick={importar} disabled={!previa.itens.length || gravando}>
                  {gravando ? <Loader2 className="animate-spin" /> : <FileUp />} Importar ({previa.itens.length})
                </Button>
              </div>
            </div>
          )}
        </Secao>
      )}

      <BuscaBase nomeEmpresa={nomeEmpresa} />

      <AlertDialog open={!!limpar} onOpenChange={(v) => !v && !limpando && setLimpar(null)}>
        <AlertDialogContent className="w-[calc(100vw-1rem)] rounded-[14px]">
          <AlertDialogHeader>
            <AlertDialogTitle>{limpar === TODAS ? "Apagar toda a base da Wise?" : `Apagar a base de ${nomeEmpresa(limpar ?? "")}?`}</AlertDialogTitle>
            <AlertDialogDescription>
              As coincidências ligadas a essas empresas também são apagadas, inclusive as que já viraram indicação ou ação
              (as indicações e ações continuam existindo). Depois, importe a planilha atualizada.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2">
            <AlertDialogCancel disabled={limpando}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={limpando}
              onClick={(e) => {
                e.preventDefault();
                confirmarLimpeza();
              }}
            >
              {limpando && <Loader2 className="animate-spin" />} Apagar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function BuscaBase({ nomeEmpresa }: { nomeEmpresa: (id: string) => string }) {
  const [texto, setTexto] = useState("");
  const [busca, setBusca] = useState("");
  const q = useQuery({
    queryKey: ["cruzamento", "base", "busca", busca],
    enabled: busca.length >= 2,
    queryFn: async () => {
      const limpo = busca.replace(/[,()%*\\]/g, " ").trim();
      const dig = limpo.replace(/\D/g, "");
      let consulta = supabase.from("base_wise_cruzamento").select("*").order("razao_social").limit(50);
      consulta = dig.length >= 2 && dig.length === limpo.replace(/[.\-/\s]/g, "").length
        ? consulta.like("cnpj_raiz", `${dig.slice(0, 8)}%`)
        : consulta.ilike("razao_social", `%${limpo}%`);
      const { data, error } = await consulta;
      if (error) throw error;
      return (data ?? []) as LinhaTabela[];
    },
  });

  return (
    <Secao titulo="Consultar a base">
      <form
        className="flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          setBusca(texto.trim());
        }}
      >
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input className="pl-8" placeholder="Razão social ou raiz do CNPJ" value={texto} onChange={(e) => setTexto(e.target.value)} />
        </div>
        <Button type="submit" variant="outline" disabled={texto.trim().length < 2}>Buscar</Button>
      </form>
      {q.isFetching && <Carregando />}
      {q.error && <ErroCarga erro={q.error} />}
      {q.isSuccess && !q.isFetching && !q.data.length && <div className="mt-3"><Vazio titulo="Nada encontrado." /></div>}
      {q.isSuccess && q.data.length > 0 && (
        <ul className="mt-3 divide-y divide-white/5 text-sm">
          {q.data.map((b) => (
            <li key={b.id} className="flex flex-col gap-1 py-2 sm:flex-row sm:items-center sm:justify-between">
              <span className="min-w-0">
                <span className="block break-words font-medium">{b.razao_social}</span>
                <span className="text-xs text-muted-foreground">{formatarRaiz(b.cnpj_raiz)} · importada em {dataHora(b.importado_em)}</span>
              </span>
              <span className="flex flex-wrap gap-2">
                <Pilula tom={b.tipo === "cliente" ? "menta" : "info"}>{ROTULO_TIPO_EMPRESA[b.tipo]}</Pilula>
                <Pilula>{nomeEmpresa(b.empresa_grupo_id)}</Pilula>
              </span>
            </li>
          ))}
          {q.data.length === 50 && <li className="pt-2 text-xs text-muted-foreground">Mostrando as 50 primeiras. Refine a busca.</li>}
        </ul>
      )}
    </Secao>
  );
}
