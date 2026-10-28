import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { CheckCircle2, Download, FileText, Loader2, Lock, Mail, Upload, XCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Carregando } from "@/components/comum/Estados";
import { Pilula } from "@/components/comum/Selos";
import { toastErro } from "@/lib/erros";
import { data as fmtData, dataHora, hojeISO } from "@/lib/formato";
import { ETAPAS, ETAPAS_FUNIL, ETAPAS_PERDA } from "@/lib/rotulos";
import { camposVisiveis, gerarMinuta, validarQuadro, type DadosQuadro, type TipoContrato } from "@/lib/contrato";
import { convidarUsuario } from "@/lib/convite";
import { gerarSenha } from "@/lib/senha";
import { CredenciaisCriadas } from "@/components/usuarios/SenhaProvisoria";
import { cn } from "@/lib/utils";

// Aba "Negociação e contrato" da ficha (História 4): funil, aprovação do Diretor, Quadro de
// Identificação, minuta em Word e PDF, contrato assinado, onboarding com convite e perdas.

function Secao({ titulo, children, acoes }: { titulo: string; children: React.ReactNode; acoes?: React.ReactNode }) {
  return (
    <section className="rounded-[14px] border border-white/10 bg-card p-4 sm:p-5">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-base font-semibold">{titulo}</h3>
        {acoes}
      </div>
      {children}
    </section>
  );
}

async function baixarDoStorage(bucket: string, caminho: string) {
  const { data, error } = await supabase.storage.from(bucket).createSignedUrl(caminho, 300);
  if (error) return toastErro(error);
  window.open(data.signedUrl, "_blank", "noopener");
}

export function AbaContrato({ parceiroId }: { parceiroId: string }) {
  const { perfil, isParcerias, veComissao } = useAuth();
  const qc = useQueryClient();

  const { data: ctx, isLoading } = useQuery({
    queryKey: ["contrato", parceiroId],
    queryFn: async () => {
      const [p, apr, quadros, contratos, assinados, cats, contatos] = await Promise.all([
        supabase.from("parceiros").select("*, responsavel:perfis!parceiros_responsavel_id_fkey(nome)").eq("id", parceiroId).single(),
        supabase.from("aprovacoes").select("*, autor:perfis!aprovacoes_aprovado_por_fkey(nome)").eq("parceiro_id", parceiroId).order("created_at"),
        supabase.from("quadros_identificacao").select("*").eq("parceiro_id", parceiroId).order("versao", { ascending: false }),
        supabase.from("contratos_gerados").select("*").eq("parceiro_id", parceiroId).order("versao", { ascending: false }),
        supabase.from("documentos").select("*").eq("parceiro_id", parceiroId).eq("tipo", "contrato_assinado").order("created_at", { ascending: false }),
        supabase.from("parceiro_categorias").select("principal, categoria:categorias(nome)").eq("parceiro_id", parceiroId),
        supabase.from("parceiro_contatos").select("papeis, principal, contato:contatos(id, nome, email)").eq("parceiro_id", parceiroId),
      ]);
      if (p.error) throw p.error;
      let instrumento: any = null;
      if (veComissao) {
        instrumento = (await supabase.from("parceiros_instrumento").select("*").eq("parceiro_id", parceiroId).maybeSingle()).data;
      }
      return {
        parceiro: p.data as any,
        aprovacoes: (apr.data ?? []) as any[],
        quadros: (quadros.data ?? []) as any[],
        contratos: (contratos.data ?? []) as any[],
        assinados: (assinados.data ?? []) as any[],
        categorias: (cats.data ?? []) as any[],
        contatos: (contatos.data ?? []) as any[],
        instrumento,
      };
    },
  });

  const invalidar = () => {
    qc.invalidateQueries({ queryKey: ["contrato", parceiroId] });
    qc.invalidateQueries({ queryKey: ["parceiro", parceiroId] });
    qc.invalidateQueries({ queryKey: ["timeline", parceiroId] });
  };

  if (isLoading || !ctx) return <Carregando />;
  const { parceiro, aprovacoes } = ctx;
  const aprovado = aprovacoes.length > 0;
  const tipo: TipoContrato = parceiro.tipo_parceria === "institucional" ? "institucional" : "comercial";

  return (
    <div className="space-y-4">
      <Funil parceiro={parceiro} aprovado={aprovado} podeEditar={isParcerias} onMudou={invalidar} />
      <Aprovacao parceiro={parceiro} aprovacoes={aprovacoes} isDiretor={!!perfil?.is_diretor} onMudou={invalidar} />
      {(isParcerias || ctx.quadros.length > 0) && (
        <Quadro tipo={tipo} ctx={ctx} podeEditar={isParcerias} nomeWise={perfil?.nome ?? ""} onMudou={invalidar} />
      )}
      <ContratoAssinado parceiro={parceiro} assinados={ctx.assinados} aprovado={aprovado} contatos={ctx.contatos}
        podeEditar={isParcerias} onMudou={invalidar} />
    </div>
  );
}

// ---------------------------------------------------------------------------
function Funil({ parceiro, aprovado, podeEditar, onMudou }: { parceiro: any; aprovado: boolean; podeEditar: boolean; onMudou: () => void }) {
  const [perda, setPerda] = useState<string | null>(null);
  const [detalhe, setDetalhe] = useState("");
  const mudar = useMutation({
    mutationFn: async (v: { etapa: string; motivo_perda?: string | null }) => {
      const { error } = await supabase.from("parceiros").update(v).eq("id", parceiro.id);
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Etapa atualizada"); onMudou(); },
    onError: toastErro,
  });
  const idx = ETAPAS_FUNIL.indexOf(parceiro.etapa);
  const perdido = ETAPAS_PERDA.includes(parceiro.etapa);

  return (
    <Secao titulo="Etapa da negociação" acoes={<Pilula tom={perdido ? "perigo" : "menta"}>{ETAPAS[parceiro.etapa]}</Pilula>}>
      <ol className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {ETAPAS_FUNIL.map((e, i) => {
          const bloqueada = (e === "fechamento" && !aprovado) || (e === "onboarding" && (!aprovado || !parceiro.data_assinatura))
            || (e === "parceria_ativa" && !parceiro.data_assinatura);
          return (
            <li key={e}>
              <button
                type="button"
                disabled={!podeEditar || e === parceiro.etapa || bloqueada || mudar.isPending}
                onClick={() => mudar.mutate({ etapa: e })}
                className={cn(
                  "flex w-full items-center gap-2 rounded-[8px] border px-3 py-2 text-left text-xs font-medium transition-colors",
                  e === parceiro.etapa ? "border-menta-500 bg-menta-500/10 text-menta-300" :
                    i < idx && !perdido ? "border-white/10 text-neutro-300" : "border-white/10 text-neutro-500",
                  podeEditar && e !== parceiro.etapa && !bloqueada && "hover:border-menta-500/60 hover:text-white",
                )}
                title={bloqueada ? (e === "fechamento" ? "Exige aprovação do Diretor" : "Exige aprovação e contrato assinado") : undefined}
              >
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-white/10 text-[10px]">{i + 1}</span>
                <span className="min-w-0 flex-1">{ETAPAS[e]}</span>
                {bloqueada && <Lock className="h-3 w-3 shrink-0" />}
              </button>
            </li>
          );
        })}
      </ol>
      {podeEditar && !perdido && (
        <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-white/10 pt-4">
          <span className="text-sm text-muted-foreground">Registrar perda:</span>
          {ETAPAS_PERDA.map((e) => (
            <Button key={e} size="sm" variant="outline" onClick={() => { setPerda(e); setDetalhe(""); }}>
              <XCircle /> {ETAPAS[e]}
            </Button>
          ))}
        </div>
      )}
      {perdido && parceiro.motivo_perda && <p className="mt-3 text-sm text-muted-foreground">Detalhe: {parceiro.motivo_perda}</p>}
      {podeEditar && perdido && (
        <div className="mt-4 border-t border-white/10 pt-4">
          <Button size="sm" variant="outline" onClick={() => mudar.mutate({ etapa: "sem_contato", motivo_perda: null })}>Reabrir negociação</Button>
        </div>
      )}

      <AlertDialog open={!!perda} onOpenChange={(v) => !v && setPerda(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Registrar perda: {perda ? ETAPAS[perda] : ""}</AlertDialogTitle>
            <AlertDialogDescription>
              {perda === "parceria_encerrada"
                ? "O parceiro sai das recomendações na hora e as páginas de RFP antigas passam a mostrá-lo como indisponível."
                : "O parceiro sai do funil ativo. É possível reabrir a negociação depois."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-2">
            <Label>Detalhe do motivo (opcional)</Label>
            <Textarea value={detalhe} onChange={(e) => setDetalhe(e.target.value)} rows={3} />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={() => perda && mudar.mutate({ etapa: perda, motivo_perda: detalhe.trim() || null })}>Confirmar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Secao>
  );
}

// ---------------------------------------------------------------------------
function Aprovacao({ parceiro, aprovacoes, isDiretor, onMudou }: { parceiro: any; aprovacoes: any[]; isDiretor: boolean; onMudou: () => void }) {
  const { perfil } = useAuth();
  const [obs, setObs] = useState("");
  const aprovar = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("aprovacoes").insert({ parceiro_id: parceiro.id, tipo: "assinatura", aprovado_por: perfil!.id, observacao: obs.trim() || null });
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Assinatura aprovada"); setObs(""); onMudou(); },
    onError: toastErro,
  });
  const a = aprovacoes[0];
  return (
    <Secao titulo="Aprovação do Diretor">
      {a ? (
        <p className="flex items-start gap-2 text-sm">
          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-menta-500" />
          <span>Assinatura aprovada por {a.autor?.nome ?? "Diretor"} em {dataHora(a.created_at)}.{a.observacao ? ` ${a.observacao}` : ""}</span>
        </p>
      ) : isDiretor ? (
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">A passagem para fechamento só acontece depois da sua aprovação.</p>
          <Textarea placeholder="Observação (opcional)" value={obs} onChange={(e) => setObs(e.target.value)} rows={2} />
          <Button onClick={() => aprovar.mutate()} disabled={aprovar.isPending}>
            {aprovar.isPending && <Loader2 className="animate-spin" />} Aprovar assinatura
          </Button>
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">
          Aguardando a aprovação do Diretor. {parceiro.etapa === "proposta_decisor" ? "Ele já foi avisado." : "O aviso sai quando o parceiro entra em proposta com o decisor."}
        </p>
      )}
    </Secao>
  );
}

// ---------------------------------------------------------------------------
function dadosIniciais(tipo: TipoContrato, ctx: any, nomeWise: string): DadosQuadro {
  const p = ctx.parceiro;
  const principal = ctx.categorias.find((c: any) => c.principal)?.categoria?.nome ?? "";
  const respParceiro = ctx.contatos.find((c: any) => (c.papeis ?? []).includes("responsavel_parceria"))?.contato?.nome
    ?? ctx.contatos.find((c: any) => c.principal)?.contato?.nome ?? "";
  const base = {
    cnpj: p.cnpj ?? "",
    endereco: p.endereco ?? [p.cidade, p.uf].filter(Boolean).join("/"),
    responsavel_wise: p.responsavel?.nome ?? nomeWise,
    data_inicio: hojeISO(),
  };
  if (tipo === "institucional") {
    return {
      ...base,
      nome_instituicao: p.razao_social ?? p.nome_fantasia,
      natureza_juridica: p.natureza_juridica ?? "",
      perfil: p.perfil_institucional ?? "",
      nivel: p.nivel ?? "",
      empresas_convocadas_icp: p.carteira_icp != null ? String(p.carteira_icp) : "",
      instrumento_modo: "sem",
      prazo_modo: "indeterminado",
      cadencia: "Mensal",
      responsavel_instituicao: respParceiro,
      representante: "",
      contrapartidas_instituicao: "",
      contrapartidas_wise: "",
      calendario: "",
    };
  }
  const ins = ctx.instrumento;
  return {
    ...base,
    razao_social: p.razao_social ?? p.nome_fantasia,
    nivel: p.nivel ?? "",
    carteira_icp: p.carteira_icp != null ? String(p.carteira_icp) : "",
    pacote: p.pacote ?? "",
    categoria_prateleira: principal,
    comissao_modo: ins?.programa_proprio ? "instrumento" : ins?.comissao_pct != null ? "percentual" : "",
    instrumento_parceiro: ins?.programa_proprio ? [ins.instrumento_nome, ins.comissao_pct != null ? `${ins.comissao_pct}% sobre ${ins.comissao_base ?? ""}` : null].filter(Boolean).join(", ") : "",
    comissao_parceiro_percentual: ins?.comissao_pct != null ? String(ins.comissao_pct) : "",
    comissao_parceiro_base: ins?.comissao_base ?? "",
    comissao_parceiro_condicao: ins?.comissao_condicao ?? "",
    exigencias_solucao: [ins?.exigencias, ins?.exigencias_solucao].filter(Boolean).join(". Solução: ") || "Não há",
    base_ativa_modo: p.pacote === "A" ? "fila" : "nao_se_aplica",
    ba_primeiro_encontro: "",
    ba_previsao: "",
    responsavel_parceiro: respParceiro,
  };
}

async function carregarModelo(tipo: TipoContrato): Promise<{ modelo: ArrayBuffer; modeloId: string | null }> {
  const { data } = await supabase.from("modelos_contrato").select("*").eq("tipo", tipo).eq("vigente", true).order("versao", { ascending: false }).limit(1);
  const m = data?.[0];
  if (m) {
    const { data: arq, error } = await supabase.storage.from("modelos").download(m.caminho);
    if (error) throw error;
    return { modelo: await arq.arrayBuffer(), modeloId: m.id };
  }
  // Sem modelo cadastrado: usa o modelo oficial que acompanha o portal
  const r = await fetch(`/modelos/${tipo}.docx`);
  if (!r.ok) throw new Error("Modelo de contrato não encontrado.");
  return { modelo: await r.arrayBuffer(), modeloId: null };
}

function Quadro({ tipo, ctx, podeEditar, nomeWise, onMudou }: { tipo: TipoContrato; ctx: any; podeEditar: boolean; nomeWise: string; onMudou: () => void }) {
  const ultimo = ctx.quadros[0];
  const inicial = useMemo<DadosQuadro>(
    () => (ultimo && ultimo.tipo_contrato === tipo ? { ...dadosIniciais(tipo, ctx, nomeWise), ...ultimo.dados } : dadosIniciais(tipo, ctx, nomeWise)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [ultimo?.id, tipo],
  );
  const [d, setD] = useState<DadosQuadro>(inicial);
  useEffect(() => setD(inicial), [inicial]);
  const [gerando, setGerando] = useState(false);
  const faltando = validarQuadro(tipo, d);
  const alterado = JSON.stringify(d) !== JSON.stringify(ultimo?.dados ?? null);

  async function salvarQuadro(): Promise<any> {
    if (!alterado && ultimo) return ultimo;
    const versao = (ultimo?.versao ?? 0) + 1;
    const { data, error } = await supabase.from("quadros_identificacao")
      .insert({ parceiro_id: ctx.parceiro.id, tipo_contrato: tipo, dados: d, versao }).select().single();
    if (error) throw error;
    return data;
  }

  const salvar = useMutation({
    mutationFn: salvarQuadro,
    onSuccess: () => { toast.success("Quadro de Identificação salvo"); onMudou(); },
    onError: toastErro,
  });

  async function gerar() {
    if (faltando.length) {
      toast.error(`Falta preencher: ${faltando.join("; ")}`);
      return;
    }
    setGerando(true);
    try {
      const quadro = await salvarQuadro();
      const { modelo, modeloId } = await carregarModelo(tipo);
      const { docx, pdf } = await gerarMinuta(tipo, d, modelo, hojeISO());
      const versao = (ctx.contratos[0]?.versao ?? 0) + 1;
      const base = `${ctx.parceiro.id}/contratos/v${versao}-minuta-${tipo}`;
      const tipoDocx = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
      const up1 = await supabase.storage.from("documentos").upload(`${base}.docx`, new Blob([docx], { type: tipoDocx }), { upsert: true, contentType: tipoDocx });
      if (up1.error) throw up1.error;
      const up2 = await supabase.storage.from("documentos").upload(`${base}.pdf`, new Blob([pdf], { type: "application/pdf" }), { upsert: true, contentType: "application/pdf" });
      if (up2.error) throw up2.error;
      const ins = await supabase.from("contratos_gerados").insert({
        parceiro_id: ctx.parceiro.id, quadro_id: quadro.id, modelo_id: modeloId, caminho_docx: `${base}.docx`, caminho_pdf: `${base}.pdf`, versao,
      });
      if (ins.error) throw ins.error;
      await supabase.from("documentos").insert([
        { parceiro_id: ctx.parceiro.id, tipo: "minuta", nome: `Minuta v${versao} (Word)`, versao, caminho: `${base}.docx` },
        { parceiro_id: ctx.parceiro.id, tipo: "minuta", nome: `Minuta v${versao} (PDF)`, versao, caminho: `${base}.pdf` },
      ]);
      toast.success(`Minuta v${versao} gerada em Word e PDF`);
      onMudou();
    } catch (e) {
      toastErro(e);
    } finally {
      setGerando(false);
    }
  }

  const campos = camposVisiveis(tipo, d);
  return (
    <Secao
      titulo={`Quadro de Identificação (${tipo === "comercial" ? "Parceria Comercial" : "Parceria Institucional"})`}
      acoes={ultimo && <span className="text-xs text-muted-foreground">Versão {ultimo.versao} de {fmtData(ultimo.created_at)}</span>}
    >
      <div className="grid gap-4 sm:grid-cols-2">
        {campos.map((c) => {
          const vazio = c.obrigatorio?.(d) && String(d[c.chave] ?? "").trim() === "";
          const set = (v: string) => setD((x) => ({ ...x, [c.chave]: v }));
          return (
            <div key={c.chave} className={cn("space-y-1.5", c.tipo === "texto_longo" && "sm:col-span-2")}>
              <Label className={cn(vazio && "text-warning")}>{c.rotulo}{c.obrigatorio?.(d) ? " *" : ""}</Label>
              {c.tipo === "opcao" ? (
                <Select value={d[c.chave] ?? ""} onValueChange={set} disabled={!podeEditar}>
                  <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>{c.opcoes!.map((o) => <SelectItem key={o.valor} value={o.valor}>{o.rotulo}</SelectItem>)}</SelectContent>
                </Select>
              ) : c.tipo === "texto_longo" ? (
                <Textarea value={d[c.chave] ?? ""} onChange={(e) => set(e.target.value)} rows={3} disabled={!podeEditar} />
              ) : (
                <Input type={c.tipo === "data" ? "date" : c.tipo === "numero" ? "number" : "text"} value={d[c.chave] ?? ""}
                  onChange={(e) => set(e.target.value)} disabled={!podeEditar} />
              )}
              {c.ajuda && <p className="text-xs text-muted-foreground">{c.ajuda}</p>}
            </div>
          );
        })}
      </div>
      {faltando.length > 0 && (
        <p className="mt-4 rounded-[8px] border border-warning/30 bg-warning/10 p-3 text-sm text-warning">Falta para gerar a minuta: {faltando.join("; ")}.</p>
      )}
      {podeEditar && (
        <div className="mt-4 flex flex-wrap gap-2">
          <Button variant="secondary" onClick={() => salvar.mutate()} disabled={!alterado || salvar.isPending}>Salvar Quadro</Button>
          <Button onClick={gerar} disabled={gerando}>
            {gerando ? <Loader2 className="animate-spin" /> : <FileText />} Gerar minuta em Word e PDF
          </Button>
        </div>
      )}

      {ctx.contratos.length > 0 && (
        <div className="mt-5 border-t border-white/10 pt-4">
          <p className="mb-2 text-sm font-semibold">Minutas geradas</p>
          <ul className="space-y-2">
            {ctx.contratos.map((c: any) => (
              <li key={c.id} className="flex flex-wrap items-center justify-between gap-2 rounded-[8px] bg-white/5 px-3 py-2 text-sm">
                <span>Versão {c.versao} · {dataHora(c.created_at)}{c.modelo_id ? "" : " · modelo padrão"}</span>
                <span className="flex gap-2">
                  <Button size="sm" variant="ghost" onClick={() => baixarDoStorage("documentos", c.caminho_docx)}><Download /> Word</Button>
                  {c.caminho_pdf && <Button size="sm" variant="ghost" onClick={() => baixarDoStorage("documentos", c.caminho_pdf)}><Download /> PDF</Button>}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </Secao>
  );
}

// ---------------------------------------------------------------------------
function ContratoAssinado({ parceiro, assinados, aprovado, contatos, podeEditar, onMudou }: {
  parceiro: any; assinados: any[]; aprovado: boolean; contatos: any[]; podeEditar: boolean; onMudou: () => void;
}) {
  const [arquivo, setArquivo] = useState<File | null>(null);
  const [dataAss, setDataAss] = useState<string>(parceiro.data_assinatura ?? hojeISO());
  const [enviando, setEnviando] = useState(false);
  const comEmail = contatos.filter((c) => c.contato?.email);
  const [convidado, setConvidado] = useState<string>(
    comEmail.find((c) => (c.papeis ?? []).includes("responsavel_parceria"))?.contato?.id ?? comEmail[0]?.contato?.id ?? "",
  );
  const [convidando, setConvidando] = useState(false);
  const [acessoCriado, setAcessoCriado] = useState<{ email: string; senha: string } | null>(null);

  async function anexar() {
    if (!arquivo) return toast.error("Escolha o PDF assinado no Autentique.");
    setEnviando(true);
    try {
      const nome = arquivo.name.replace(/[^\w.-]+/g, "_");
      const caminho = `${parceiro.id}/contratos/${crypto.randomUUID()}-${nome}`;
      const up = await supabase.storage.from("documentos").upload(caminho, arquivo, { contentType: arquivo.type || "application/pdf" });
      if (up.error) throw up.error;
      const doc = await supabase.from("documentos").insert({
        parceiro_id: parceiro.id, tipo: "contrato_assinado", nome: "Contrato assinado", versao: assinados.length + 1, caminho, visivel_parceiro: true,
      });
      if (doc.error) throw doc.error;
      const upd = await supabase.from("parceiros").update({ data_assinatura: dataAss }).eq("id", parceiro.id);
      if (upd.error) throw upd.error;
      toast.success("Contrato assinado anexado");
      setArquivo(null);
      onMudou();
    } catch (e) {
      toastErro(e);
    } finally {
      setEnviando(false);
    }
  }

  const onboarding = useMutation({
    mutationFn: async () => {
      if (parceiro.etapa !== "fechamento") {
        const f = await supabase.from("parceiros").update({ etapa: "fechamento" }).eq("id", parceiro.id);
        if (f.error) throw f.error;
      }
      const { error } = await supabase.from("parceiros").update({ etapa: "onboarding" }).eq("id", parceiro.id);
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Onboarding iniciado: tarefas do pacote criadas com prazo de 2 dias úteis"); onMudou(); },
    onError: toastErro,
  });

  async function convidar() {
    const c = comEmail.find((x) => x.contato.id === convidado)?.contato;
    if (!c) return toast.error("Cadastre um contato com e-mail na aba Contatos.");
    setConvidando(true);
    try {
      const senha = gerarSenha();
      const email = c.email.trim().toLowerCase();
      await convidarUsuario({ email, nome: c.nome, papel: "parceiro", parceiro_id: parceiro.id, is_responsavel_parceiro: true, senha });
      toast.success(`Acesso criado para ${email}`);
      setAcessoCriado({ email, senha });
    } catch (e) {
      toastErro(e);
    } finally {
      setConvidando(false);
    }
  }

  return (
    <Secao titulo="Contrato assinado e onboarding">
      <p className="mb-3 text-sm text-muted-foreground">A assinatura acontece no Autentique, fora do portal. Anexe aqui o PDF assinado.</p>
      {assinados.length > 0 && (
        <ul className="mb-4 space-y-2">
          {assinados.map((d) => (
            <li key={d.id} className="flex flex-wrap items-center justify-between gap-2 rounded-[8px] bg-white/5 px-3 py-2 text-sm">
              <span>{d.nome} v{d.versao} · anexado em {fmtData(d.created_at)}</span>
              <Button size="sm" variant="ghost" onClick={() => baixarDoStorage("documentos", d.caminho)}><Download /> Baixar</Button>
            </li>
          ))}
        </ul>
      )}
      {parceiro.data_assinatura && <p className="mb-3 text-sm">Data de assinatura: <strong>{fmtData(parceiro.data_assinatura)}</strong></p>}

      {podeEditar && (
        <div className="grid gap-3 sm:grid-cols-[1fr_180px_auto] sm:items-end">
          <div className="space-y-1.5">
            <Label>PDF assinado</Label>
            <Input type="file" accept="application/pdf" onChange={(e) => setArquivo(e.target.files?.[0] ?? null)} />
          </div>
          <div className="space-y-1.5">
            <Label>Data de assinatura</Label>
            <Input type="date" value={dataAss} onChange={(e) => setDataAss(e.target.value)} />
          </div>
          <Button onClick={anexar} disabled={enviando || !arquivo || !aprovado} title={!aprovado ? "Exige a aprovação do Diretor" : undefined}>
            {enviando ? <Loader2 className="animate-spin" /> : <Upload />} Anexar
          </Button>
        </div>
      )}

      {podeEditar && parceiro.data_assinatura && aprovado && !["onboarding", "parceria_ativa"].includes(parceiro.etapa) && !ETAPAS_PERDA.includes(parceiro.etapa) && (
        <div className="mt-4 border-t border-white/10 pt-4">
          <Button onClick={() => onboarding.mutate()} disabled={onboarding.isPending}>Iniciar onboarding</Button>
          <p className="mt-2 text-xs text-muted-foreground">Cria as tarefas do pacote com prazo de 2 dias úteis, as contrapartidas e, no pacote A, a entrada na fila do Base Ativa.</p>
        </div>
      )}

      {podeEditar && parceiro.etapa === "onboarding" && (
        <div className="mt-4 space-y-2 border-t border-white/10 pt-4">
          <p className="text-sm font-semibold">Acesso ao portal do parceiro</p>
          {comEmail.length === 0 ? (
            <p className="text-sm text-muted-foreground">Cadastre o responsável do parceiro, com e-mail, na aba Contatos.</p>
          ) : (
            <div className="flex flex-col gap-2 sm:flex-row">
              <Select value={convidado} onValueChange={setConvidado}>
                <SelectTrigger className="sm:w-80"><SelectValue placeholder="Escolha o contato" /></SelectTrigger>
                <SelectContent>
                  {comEmail.map((c) => <SelectItem key={c.contato.id} value={c.contato.id}>{c.contato.nome} ({c.contato.email})</SelectItem>)}
                </SelectContent>
              </Select>
              <Button variant="secondary" onClick={convidar} disabled={convidando}>
                {convidando ? <Loader2 className="animate-spin" /> : <Mail />} Criar acesso
              </Button>
            </div>
          )}
          {acessoCriado && (
            <div className="max-w-md pt-2">
              <CredenciaisCriadas email={acessoCriado.email} senha={acessoCriado.senha} />
            </div>
          )}
        </div>
      )}
    </Secao>
  );
}
