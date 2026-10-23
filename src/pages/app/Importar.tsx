import { useState } from "react";
import { Link } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import Papa from "papaparse";
import { toast } from "sonner";
import { AlertTriangle, CheckCircle2, FileUp, Loader2, ShieldAlert, XCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toastErro } from "@/lib/erros";
import { ETAPAS, PERFIS_INSTITUCIONAIS, nomeNivel, rotulo } from "@/lib/rotulos";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Cabecalho } from "@/components/comum/Cabecalho";
import { Vazio } from "@/components/comum/Estados";
import { Pilula } from "@/components/comum/Selos";
import { CABECALHO, normalizar, validarLinhas, type LinhaImportacao } from "@/components/importacao/validacao";
import { gravarLinha, type ResultadoLinha } from "@/components/importacao/gravar";
import { EnvioDossie } from "@/components/importacao/EnvioDossie";

// Importação inicial (FR-092): prévia com validação por linha; nada é gravado antes da confirmação.
export default function Importar() {
  const { isAdmin, perfil } = useAuth();
  const qc = useQueryClient();
  const [arquivo, setArquivo] = useState<string>("");
  const [lendo, setLendo] = useState(false);
  const [linhas, setLinhas] = useState<LinhaImportacao[] | null>(null);
  const [nomesCategoria, setNomesCategoria] = useState<Map<string, string>>(new Map());
  const [gravando, setGravando] = useState(false);
  const [progresso, setProgresso] = useState(0);
  const [resultado, setResultado] = useState<ResultadoLinha[] | null>(null);

  if (!isAdmin) return <Vazio titulo="Acesso restrito">Só administradores importam dados.</Vazio>;

  async function ler(f: File) {
    setLendo(true);
    setLinhas(null);
    setResultado(null);
    setArquivo(f.name);
    try {
      const texto = await f.text();
      const r = Papa.parse<Record<string, string>>(texto, { header: true, skipEmptyLines: "greedy", transformHeader: (h) => h.trim() });
      const campos = r.meta.fields ?? [];
      if (campos.join(",") !== CABECALHO.join(",")) {
        toast.error(`Cabeçalho diferente do modelo. Use exatamente: ${CABECALHO.join(",")}`);
        return;
      }
      // Referências para validar: categorias, pacotes e nomes já cadastrados
      const [cats, pacs, parcs] = await Promise.all([
        supabase.from("categorias").select("id, nome, tipo"),
        supabase.from("pacotes").select("codigo, nome, niveis_permitidos"),
        supabase.from("parceiros").select("nome_fantasia"),
      ]);
      for (const x of [cats, pacs, parcs]) if (x.error) throw x.error;
      setNomesCategoria(new Map((cats.data ?? []).map((c: any) => [c.id, c.nome])));
      setLinhas(validarLinhas(r.data, {
        categorias: cats.data as any,
        pacotes: pacs.data as any,
        nomesExistentes: new Set((parcs.data ?? []).map((p: any) => normalizar(p.nome_fantasia))),
      }));
    } catch (e) {
      toastErro(e);
    } finally {
      setLendo(false);
    }
  }

  async function confirmar() {
    const validas = (linhas ?? []).filter((l) => !l.erros.length);
    setGravando(true);
    setProgresso(0);
    const res: ResultadoLinha[] = [];
    for (const l of validas) {
      res.push(await gravarLinha(l, perfil!.id));
      setProgresso(res.length);
    }
    setResultado(res);
    setLinhas(null);
    setGravando(false);
    qc.invalidateQueries({ queryKey: ["parceiros-resumo"] });
    const ok = res.filter((r) => r.ok).length;
    if (ok === res.length) toast.success(`${ok} parceiros importados.`);
    else toast.error(`${ok} importados e ${res.length - ok} com falha. Veja o resultado.`);
  }

  const validas = (linhas ?? []).filter((l) => !l.erros.length);
  const comErro = (linhas ?? []).length - validas.length;
  const comAviso = validas.filter((l) => l.avisos.length).length;

  return (
    <div className="space-y-8">
      <Cabecalho titulo="Importação" descricao="Parceiros atuais por planilha e dossiês em PDF." />

      <div className="flex gap-2 rounded-[14px] border border-warning/40 bg-warning/10 p-4 text-sm">
        <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0 text-warning" />
        <p>Antes de importar parceiros reais, teste as regras de acesso com dados fictícios: cada público só pode ver o que é seu.</p>
      </div>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold">Planilha de parceiros</h2>
        <p className="text-sm text-muted-foreground">
          CSV com o cabeçalho exato: <code className="break-all rounded bg-white/5 px-1 text-xs">{CABECALHO.join(",")}</code>
        </p>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <Input type="file" accept=".csv,text/csv" className="sm:max-w-sm" disabled={lendo || gravando}
            onChange={(e) => { const f = e.target.files?.[0]; if (f) ler(f); e.target.value = ""; }} />
          {lendo && <span className="inline-flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> Validando {arquivo}</span>}
        </div>

        {linhas && (
          <div className="space-y-3">
            <div className="flex flex-wrap gap-2">
              <Pilula tom="menta">{validas.length} prontas para importar</Pilula>
              {comAviso > 0 && <Pilula tom="alerta">{comAviso} com avisos</Pilula>}
              {comErro > 0 && <Pilula tom="perigo">{comErro} com erros (não serão importadas)</Pilula>}
            </div>
            <div className="rounded-[14px] border border-white/10 bg-card">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">Linha</TableHead>
                    <TableHead>Parceiro</TableHead>
                    <TableHead>Classificação</TableHead>
                    <TableHead>Contato e próximo passo</TableHead>
                    <TableHead className="min-w-[240px]">Validação</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {linhas.map((l) => {
                    const d = l.dados;
                    return (
                      <TableRow key={l.numero} className={l.erros.length ? "bg-destructive/5" : ""}>
                        <TableCell className="align-top text-muted-foreground">{l.numero}</TableCell>
                        <TableCell className="align-top">
                          <p className="font-semibold">{d.nome_fantasia || "(sem nome)"}</p>
                          <p className="text-xs text-muted-foreground">{[d.cidade, d.uf].filter(Boolean).join("/")}</p>
                        </TableCell>
                        <TableCell className="min-w-[200px] align-top text-xs">
                          <p>{d.tipo_parceria === "institucional" ? `Institucional · ${rotulo(PERFIS_INSTITUCIONAIS, d.perfil_institucional) || "sem perfil"}` : [
                            nomesCategoria.get(d.categoria_principal_id ?? "") ?? "Sem categoria",
                            d.categoria_secundaria_id && nomesCategoria.get(d.categoria_secundaria_id),
                          ].filter(Boolean).join(" + ")}</p>
                          <p className="text-muted-foreground">
                            {rotulo(ETAPAS, d.etapa)} · {d.nivel ? nomeNivel(d.tipo_parceria, d.nivel) : "sem nível"}{d.pacote ? ` · pacote ${d.pacote}` : ""}
                          </p>
                        </TableCell>
                        <TableCell className="min-w-[200px] align-top text-xs">
                          {d.contato ? <p>{d.contato.nome}{d.contato.cargo ? `, ${d.contato.cargo}` : ""}</p> : <p className="text-muted-foreground">Sem contato</p>}
                          {d.proximo_passo && <p className="text-muted-foreground">Próximo passo: {d.proximo_passo}</p>}
                        </TableCell>
                        <TableCell className="align-top text-xs">
                          {l.erros.map((e) => <p key={e} className="flex gap-1 text-red-300"><XCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" /> {e}</p>)}
                          {l.avisos.map((a) => <p key={a} className="flex gap-1 text-warning"><AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" /> {a}</p>)}
                          {!l.erros.length && !l.avisos.length && <p className="flex gap-1 text-menta-400"><CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0" /> Pronta</p>}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-end">
              {gravando && <span className="text-sm text-muted-foreground">Gravando {progresso} de {validas.length}...</span>}
              <Button variant="outline" onClick={() => setLinhas(null)} disabled={gravando}>Descartar</Button>
              <Button onClick={confirmar} disabled={!validas.length || gravando}>
                {gravando ? <Loader2 className="animate-spin" /> : <FileUp />} Confirmar importação ({validas.length})
              </Button>
            </div>
          </div>
        )}

        {resultado && (
          <div className="space-y-2 rounded-[14px] border border-white/10 bg-card p-4">
            <p className="font-semibold">Resultado: {resultado.filter((r) => r.ok).length} importados, {resultado.filter((r) => !r.ok).length} com falha</p>
            <ul className="divide-y divide-white/5 text-sm">
              {resultado.map((r) => (
                <li key={r.numero} className="flex flex-col gap-1 py-2 sm:flex-row sm:items-center sm:justify-between">
                  <span className="flex items-center gap-2">
                    {r.ok ? <CheckCircle2 className="h-4 w-4 shrink-0 text-menta-400" /> : <XCircle className="h-4 w-4 shrink-0 text-red-300" />}
                    Linha {r.numero}: {r.nome}
                  </span>
                  {r.ok ? (
                    <Link to={`/app/parceiros/${r.parceiroId}`} className="text-menta-400 hover:underline">Abrir ficha</Link>
                  ) : <span className="text-red-300">{r.mensagem}</span>}
                </li>
              ))}
            </ul>
          </div>
        )}
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold">Dossiês</h2>
        <p className="text-sm text-muted-foreground">
          Anexe o PDF à ficha do parceiro. A IA propõe dados, contatos, linha do tempo e pendências na aba de documentos, e nada é gravado sem a sua revisão.
        </p>
        <EnvioDossie />
      </section>
    </div>
  );
}
