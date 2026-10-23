import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Loader2, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { valorCampoTexto, type CampoDef } from "@/components/comum/CampoDinamico";
import { arquivoParaBase64, chamarIA, type ResultadoDossie } from "@/lib/ia";
import { toastErro, mensagemErro } from "@/lib/erros";
import { data as fmtData, hojeISO, semTravessao } from "@/lib/formato";
import { PAPEIS_CONTATO } from "@/lib/rotulos";
import {
  invalidarParceiro, normalizar, preenchido, useCampos, useCategorias, useParceiroCampos, useParceiroCategorias, type Parceiro,
} from "../dados";
import { converterValor, gruposDoParceiro } from "./campos";

type Documento = { id: string; nome: string; caminho: string };

const CAMPOS_EMPRESA: { chave: keyof ResultadoDossie["empresa"]; rotulo: string }[] = [
  { chave: "nome_fantasia", rotulo: "Nome fantasia" },
  { chave: "razao_social", rotulo: "Razão social" },
  { chave: "cnpj", rotulo: "CNPJ" },
  { chave: "site", rotulo: "Site" },
  { chave: "cidade", rotulo: "Cidade" },
  { chave: "uf", rotulo: "UF" },
  { chave: "endereco", rotulo: "Endereço" },
];

function maisSeteDias() {
  const d = new Date(`${hojeISO()}T12:00:00`);
  d.setDate(d.getDate() + 7);
  return d.toISOString().slice(0, 10);
}

// Extração de dados de dossiê em PDF por IA (história 10, cenário 2). Nada é gravado sem confirmação.
export function ExtrairDossieDialog({ parceiro: p, documento, onFechar }: { parceiro: Parceiro; documento: Documento; onFechar: () => void }) {
  const { perfil } = useAuth();
  const qc = useQueryClient();
  const qCampos = useCampos();
  const qCategorias = useCategorias();
  const qVinculos = useParceiroCategorias(p.id);
  const qValores = useParceiroCampos(p.id);
  const campos = qCampos.data ?? [];
  const categorias = qCategorias.data ?? [];
  const vinculos = qVinculos.data ?? [];
  const valores = qValores.data ?? [];

  const [etapa, setEtapa] = useState<"lendo" | "revisao" | "erro">("lendo");
  const [erro, setErro] = useState("");
  const [r, setR] = useState<ResultadoDossie | null>(null);
  const [mapaCampos, setMapaCampos] = useState<Map<string, CampoDef>>(new Map());
  const [selEmpresa, setSelEmpresa] = useState<Set<string>>(new Set());
  const [selContatos, setSelContatos] = useState<Set<number>>(new Set());
  const [selLinha, setSelLinha] = useState<Set<number>>(new Set());
  const [selCampos, setSelCampos] = useState<Set<string>>(new Set());
  const [pendencia, setPendencia] = useState<string>("nenhuma");
  const [dataPendencia, setDataPendencia] = useState(maisSeteDias());
  const [salvando, setSalvando] = useState(false);

  const atualCampo = new Map(valores.map((v) => [v.campo_id, v.valor]));
  // Só chama a IA depois de carregar a configuração e a ficha atual
  const pronto = qCampos.isSuccess && qCategorias.isSuccess && qVinculos.isSuccess && qValores.isSuccess;

  useEffect(() => {
    if (!pronto) return;
    let cancelado = false;
    (async () => {
      try {
        // Chaves únicas para a IA: campos de categorias diferentes podem repetir a chave
        const lista = gruposDoParceiro(p, campos, vinculos, categorias).flatMap((g) => g.campos.map((c) => ({ c, grupo: g.titulo })));
        const contagem = new Map<string, number>();
        lista.forEach(({ c }) => contagem.set(c.chave, (contagem.get(c.chave) ?? 0) + 1));
        const mapa = new Map<string, CampoDef>();
        const disponiveis = lista.map(({ c, grupo }) => {
          const unico = contagem.get(c.chave) === 1;
          const chave = unico ? c.chave : `${c.chave}__${c.id.slice(0, 6)}`;
          mapa.set(chave, c);
          return { chave, rotulo: unico ? c.rotulo : `${c.rotulo} (${grupo})` };
        });

        const baixado = await supabase.storage.from("documentos").download(documento.caminho);
        if (baixado.error || !baixado.data) throw baixado.error ?? new Error("Não foi possível baixar o arquivo.");
        const arquivo = new File([baixado.data], documento.nome, { type: "application/pdf" });
        const pdf_base64 = await arquivoParaBase64(arquivo);
        const res = await chamarIA<ResultadoDossie>("extrair_dossie", { pdf_base64, campos_disponiveis: disponiveis });
        if (cancelado) return;
        setMapaCampos(mapa);
        setR(res);
        // Pré-seleção: só o que está vazio hoje na ficha
        setSelEmpresa(new Set(CAMPOS_EMPRESA.filter((x) => res.empresa?.[x.chave] && !preenchido((p as any)[x.chave])).map((x) => x.chave)));
        setSelContatos(new Set((res.contatos ?? []).map((_, i) => i)));
        setSelLinha(new Set((res.linha_do_tempo ?? []).map((_, i) => i)));
        setSelCampos(new Set(Object.entries(res.campos ?? {}).filter(([k, v]) => mapa.has(k) && v && !preenchido(atualCampo.get(mapa.get(k)!.id))).map(([k]) => k)));
        setEtapa("revisao");
      } catch (e) {
        if (cancelado) return;
        setErro(mensagemErro(e));
        setEtapa("erro");
      }
    })();
    return () => {
      cancelado = true;
    };
  }, [pronto]); // eslint-disable-line react-hooks/exhaustive-deps

  const alternar = <T,>(set: Set<T>, setter: (s: Set<T>) => void, v: T) => {
    const n = new Set(set);
    if (n.has(v)) n.delete(v);
    else n.add(v);
    setter(n);
  };

  async function aplicar() {
    if (!r) return;
    setSalvando(true);
    const falhas: string[] = [];
    const falhou = (o: string, e: any) => e && falhas.push(`${o}: ${mensagemErro(e)}`);

    // Empresa
    const empresa = Object.fromEntries(CAMPOS_EMPRESA.filter((x) => selEmpresa.has(x.chave)).map((x) => [x.chave, r.empresa[x.chave]]));
    if (empresa.uf) empresa.uf = String(empresa.uf).toUpperCase().slice(0, 2);
    if (Object.keys(empresa).length) falhou("Dados da empresa", (await supabase.from("parceiros").update(empresa).eq("id", p.id)).error);

    // Contatos
    for (const i of selContatos) {
      const c = r.contatos[i];
      const papel = Object.entries(PAPEIS_CONTATO).find(([k, v]) => c.papel && (normalizar(c.papel) === normalizar(v) || normalizar(c.papel) === k))?.[0];
      const ins = await supabase.from("contatos").insert({
        nome: c.nome, cargo: c.cargo, email: c.email, telefone: c.telefone,
        observacoes: c.papel && !papel ? `Papel informado no dossiê: ${c.papel}` : null,
      }).select("id").single();
      if (ins.error) {
        falhou(`Contato ${c.nome}`, ins.error);
        continue;
      }
      falhou(`Contato ${c.nome}`, (await supabase.from("parceiro_contatos").insert({ parceiro_id: p.id, contato_id: ins.data.id, papeis: papel ? [papel] : [] })).error);
    }

    // Linha do tempo: pontos de contato do tipo "outro" com a data informada
    const linhas = [...selLinha].map((i) => r.linha_do_tempo[i]).map((l) => ({
      parceiro_id: p.id, tipo: "outro", data: new Date(`${l.data && /^\d{4}-\d{2}-\d{2}/.test(l.data) ? l.data.slice(0, 10) : hojeISO()}T12:00:00`).toISOString(),
      texto: semTravessao(l.descricao), autor_id: perfil?.id,
    }));
    if (linhas.length) falhou("Linha do tempo", (await supabase.from("pontos_contato").insert(linhas)).error);

    // Pendência escolhida vira o próximo passo
    if (pendencia !== "nenhuma" && dataPendencia) {
      const desc = r.pendencias[Number(pendencia)];
      falhou("Próximo passo", (await supabase.from("proximos_passos").insert({ parceiro_id: p.id, descricao: desc, data: dataPendencia, responsavel_id: p.responsavel_id })).error);
    }

    // Campos da ficha
    const camposLinhas = [...selCampos].map((k) => {
      const c = mapaCampos.get(k)!;
      const versao = (valores.find((v) => v.campo_id === c.id)?.versao ?? 0) + 1;
      return { parceiro_id: p.id, campo_id: c.id, valor: converterValor(c, r.campos[k]), versao, updated_by: perfil?.id, updated_at: new Date().toISOString() };
    }).filter((x) => x.valor !== null);
    if (camposLinhas.length) falhou("Campos da ficha", (await supabase.from("parceiro_campos").upsert(camposLinhas, { onConflict: "parceiro_id,campo_id" })).error);

    setSalvando(false);
    invalidarParceiro(qc, p.id);
    if (falhas.length) {
      toastErro(new Error(`Parte dos dados não foi gravada. ${falhas.join(" · ")}`));
    } else {
      toast.success("Dados do dossiê aplicados à ficha.");
      onFechar();
    }
  }

  const camposSugeridos = r ? Object.entries(r.campos ?? {}).filter(([k, v]) => mapaCampos.has(k) && v) : [];
  const nada = r && !CAMPOS_EMPRESA.some((x) => r.empresa?.[x.chave]) && !r.contatos?.length && !r.linha_do_tempo?.length && !r.pendencias?.length && !camposSugeridos.length;

  return (
    <Dialog open onOpenChange={(v) => !v && !salvando && onFechar()}>
      <DialogContent className="flex h-[100dvh] max-w-3xl flex-col gap-0 p-0 sm:h-auto sm:max-h-[90vh] sm:rounded-[14px]">
        <DialogHeader className="border-b border-white/10 p-4 sm:p-6">
          <DialogTitle className="flex items-center gap-2"><Sparkles className="h-5 w-5 text-menta-400" /> Extrair dados do dossiê</DialogTitle>
          <DialogDescription className="break-words">{documento.nome}. Revise e marque o que deve ser gravado. Nada é salvo antes da confirmação.</DialogDescription>
        </DialogHeader>
        <div className="flex-1 space-y-5 overflow-y-auto p-4 sm:p-6">
          {etapa === "lendo" && (
            <p className="flex items-center gap-2 py-10 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> Lendo o dossiê com IA...</p>
          )}
          {etapa === "erro" && (
            <p className="rounded-[10px] border border-destructive/40 bg-destructive/10 p-3 text-sm text-red-200">Não foi possível extrair: {erro}</p>
          )}
          {etapa === "revisao" && r && (
            <>
              {r.resumo && <p className="whitespace-pre-wrap rounded-[10px] bg-white/5 p-3 text-sm">{r.resumo}</p>}
              {nada && <p className="text-sm text-muted-foreground">A IA não encontrou dados para sugerir.</p>}

              {CAMPOS_EMPRESA.some((x) => r.empresa?.[x.chave]) && (
                <Grupo titulo="Dados da empresa">
                  {CAMPOS_EMPRESA.filter((x) => r.empresa?.[x.chave]).map((x) => (
                    <Opcao key={x.chave} marcado={selEmpresa.has(x.chave)} onAlternar={() => alternar(selEmpresa, setSelEmpresa, x.chave)}
                      titulo={x.rotulo} valor={r.empresa[x.chave]!} atual={(p as any)[x.chave]} />
                  ))}
                </Grupo>
              )}

              {r.contatos?.length > 0 && (
                <Grupo titulo="Contatos (novos cadastros)">
                  {r.contatos.map((c, i) => (
                    <Opcao key={i} marcado={selContatos.has(i)} onAlternar={() => alternar(selContatos, setSelContatos, i)}
                      titulo={c.nome} valor={[c.cargo, c.papel, c.email, c.telefone].filter(Boolean).join(" · ")} />
                  ))}
                </Grupo>
              )}

              {r.linha_do_tempo?.length > 0 && (
                <Grupo titulo="Linha do tempo">
                  {r.linha_do_tempo.map((l, i) => (
                    <Opcao key={i} marcado={selLinha.has(i)} onAlternar={() => alternar(selLinha, setSelLinha, i)}
                      titulo={l.data ? fmtData(l.data.slice(0, 10)) : "Sem data (usa hoje)"} valor={l.descricao} />
                  ))}
                </Grupo>
              )}

              {r.pendencias?.length > 0 && (
                <Grupo titulo="Pendências: escolha uma para virar o próximo passo">
                  <RadioGroup value={pendencia} onValueChange={setPendencia} className="gap-2">
                    <label className="flex items-center gap-2 text-sm"><RadioGroupItem value="nenhuma" /> Nenhuma</label>
                    {r.pendencias.map((x, i) => (
                      <label key={i} className="flex items-start gap-2 text-sm"><RadioGroupItem value={String(i)} className="mt-0.5" /> <span className="min-w-0 break-words">{x}</span></label>
                    ))}
                  </RadioGroup>
                  {pendencia !== "nenhuma" && (
                    <div className="mt-2 flex items-center gap-2 text-sm">
                      <span className="shrink-0 text-muted-foreground">Data</span>
                      <Input type="date" className="w-44" value={dataPendencia} onChange={(e) => setDataPendencia(e.target.value)} />
                    </div>
                  )}
                </Grupo>
              )}

              {camposSugeridos.length > 0 && (
                <Grupo titulo="Campos da ficha">
                  {camposSugeridos.map(([k, v]) => {
                    const c = mapaCampos.get(k)!;
                    return (
                      <Opcao key={k} marcado={selCampos.has(k)} onAlternar={() => alternar(selCampos, setSelCampos, k)}
                        titulo={c.rotulo} valor={v} atual={valorCampoTexto(c, atualCampo.get(c.id))} />
                    );
                  })}
                </Grupo>
              )}
            </>
          )}
        </div>
        <DialogFooter className="gap-2 border-t border-white/10 p-4 sm:p-6">
          <Button variant="outline" onClick={onFechar} disabled={salvando}>Cancelar</Button>
          {etapa === "revisao" && !nada && (
            <Button onClick={aplicar} disabled={salvando}>{salvando ? "Gravando..." : "Gravar selecionados"}</Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function Grupo({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <section>
      <h3 className="mb-2 text-sm font-semibold text-menta-400">{titulo}</h3>
      <div className="space-y-2">{children}</div>
    </section>
  );
}

function Opcao({ marcado, onAlternar, titulo, valor, atual }: { marcado: boolean; onAlternar: () => void; titulo: string; valor: string; atual?: string | null }) {
  return (
    <label className="flex cursor-pointer items-start gap-3 rounded-[10px] border border-white/10 p-3 text-sm hover:bg-white/5">
      <Checkbox checked={marcado} onCheckedChange={onAlternar} className="mt-0.5" />
      <span className="min-w-0 flex-1">
        <span className="block text-xs font-semibold text-neutro-300">{titulo}</span>
        <span className="block whitespace-pre-wrap break-words">{valor}</span>
        {atual ? <span className="mt-1 block break-words text-xs text-muted-foreground">Atual: {atual}</span> : null}
      </span>
    </label>
  );
}
