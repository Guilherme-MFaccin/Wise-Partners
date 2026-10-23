import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { CalendarClock, Check, ChevronDown, FileText, Handshake, History, MessageSquare, Paperclip, Plus } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Pilula, SeloEstado } from "@/components/comum/Selos";
import { Carregando, ErroCarga, Vazio } from "@/components/comum/Estados";
import { toastErro } from "@/lib/erros";
import { data, dataHora, hojeISO, moeda } from "@/lib/formato";
import { ETAPAS_INDICACAO, SENTIDOS, TIPOS_CONTATO, TIPOS_DOCUMENTO, rotulo } from "@/lib/rotulos";
import { cn } from "@/lib/utils";
import { Campo, Secao } from "../ui";
import {
  abrirArquivo, invalidarParceiro, nomePerfil, passoAtivo, perfisInternos, usePerfis, useProximosPassos, type Parceiro, type PerfilResumo,
} from "../dados";
import {
  carregarTimeline, montarTimeline, rotuloCampoHistorico, rotuloTabela, valorHistorico, type ItemTimeline, type PontoContato,
} from "./timeline";

const ESTADOS_PASSO: Record<string, string> = { aberto: "Aberto", feito: "Feito", vencido: "Vencido", substituido: "Substituído" };

export function AbaLinhaTempo({ parceiro: p }: { parceiro: Parceiro }) {
  const { data: perfis = [] } = usePerfis();
  const q = useQuery({ queryKey: ["timeline", p.id], queryFn: () => carregarTimeline(p.id) });
  const itens = q.data ? montarTimeline(q.data) : [];

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_340px]">
      <div className="order-2 min-w-0 lg:order-1">
        {q.isLoading ? <Carregando /> : q.error ? <ErroCarga erro={q.error} /> : !itens.length ? (
          <Vazio titulo="Nenhum registro na linha do tempo." />
        ) : (
          <ol className="relative space-y-3 border-l border-white/10 pl-5">
            {itens.map((i) => <ItemLinha key={i.chave} item={i} perfis={perfis} tipoParceria={p.tipo_parceria} />)}
          </ol>
        )}
      </div>
      <div className="order-1 min-w-0 lg:order-2">
        <ProximosPassos parceiro={p} perfis={perfis} />
      </div>
    </div>
  );
}

function Marcador({ icone: Icone, tom }: { icone: any; tom?: string }) {
  return (
    <span className={cn("absolute -left-[31px] flex h-5 w-5 items-center justify-center rounded-full border border-white/15 bg-background", tom)}>
      <Icone className="h-3 w-3" />
    </span>
  );
}

function ItemLinha({ item, perfis, tipoParceria }: { item: ItemTimeline; perfis: PerfilResumo[]; tipoParceria: string }) {
  switch (item.tipo) {
    case "ponto":
      return <ItemPonto ponto={item.ponto} perfis={perfis} />;
    case "historico": {
      const h = item.hist;
      const autor = h.autor_id ? nomePerfil(perfis, h.autor_id) || "Usuário" : "Sistema";
      return (
        <li className="relative text-sm">
          <Marcador icone={History} />
          <p className="text-xs text-muted-foreground">{dataHora(h.created_at)} · {autor}</p>
          <p className="break-words">
            <span className="text-muted-foreground">{rotuloTabela(h.tabela)}: </span>
            {h.campo === "criado" ? (
              <>registro criado{h.valor_novo ? ` (${h.valor_novo})` : ""}</>
            ) : h.campo === "excluido" ? (
              <>registro excluído{h.valor_anterior ? ` (${h.valor_anterior})` : ""}</>
            ) : (
              <>
                <strong className="font-semibold">{rotuloCampoHistorico(h.campo)}</strong>{" "}
                <span className="text-muted-foreground">de</span> {valorHistorico(h, h.valor_anterior, perfis, tipoParceria)}{" "}
                <span className="text-muted-foreground">para</span> {valorHistorico(h, h.valor_novo, perfis, tipoParceria)}
              </>
            )}
          </p>
        </li>
      );
    }
    case "documento":
      return (
        <li className="relative text-sm">
          <Marcador icone={FileText} />
          <p className="text-xs text-muted-foreground">{dataHora(item.doc.created_at)} · {nomePerfil(perfis, item.doc.autor_id) || "Sistema"}</p>
          <p className="break-words">Documento adicionado: {rotulo(TIPOS_DOCUMENTO, item.doc.tipo)} · {item.doc.nome} (versão {item.doc.versao})</p>
        </li>
      );
    case "indicacao":
      return (
        <li className="relative text-sm">
          <Marcador icone={Handshake} tom="text-menta-400" />
          <p className="text-xs text-muted-foreground">{data(item.ind.data)} · Indicação</p>
          <p className="break-words">
            {item.ind.clientes?.razao_social ?? "Cliente"} · {item.ind.empresas_grupo?.nome} · {rotulo(SENTIDOS, item.ind.sentido)}{" "}
            <Pilula className="ml-1">{rotulo(ETAPAS_INDICACAO, item.ind.etapa)}</Pilula>
            {item.ind.valor_base ? <span className="text-muted-foreground"> · {moeda(item.ind.valor_base)}</span> : null}
          </p>
        </li>
      );
  }
}

function ItemPonto({ ponto: p, perfis }: { ponto: PontoContato; perfis: PerfilResumo[] }) {
  const [aberto, setAberto] = useState(false);
  const r = p.resumo;
  const longo = (p.texto ?? "").length > 280;
  const lista = (titulo: string, itens?: string[]) =>
    itens?.length ? (
      <div>
        <p className="text-xs font-semibold text-neutro-300">{titulo}</p>
        <ul className="ml-4 list-disc text-sm">{itens.map((x, i) => <li key={i}>{x}</li>)}</ul>
      </div>
    ) : null;
  return (
    <li className="relative">
      <Marcador icone={MessageSquare} tom="text-menta-400" />
      <div className="min-w-0 rounded-[14px] border border-white/10 bg-card p-3 sm:p-4">
        <div className="flex flex-wrap items-center gap-2">
          <Pilula tom="menta">{rotulo(TIPOS_CONTATO, p.tipo)}</Pilula>
          <span className="text-xs text-muted-foreground">{dataHora(p.data)} · {nomePerfil(perfis, p.autor_id) || "Autor"}</span>
        </div>
        {p.participantes && <p className="mt-1 text-xs text-muted-foreground">Participantes: {p.participantes}</p>}
        {r && (
          <div className="mt-3 space-y-2 rounded-[10px] bg-white/5 p-3">
            {r.resumo && <p className="whitespace-pre-wrap break-words text-sm">{r.resumo}</p>}
            {lista("Decisões", r.decisoes)}
            {lista("Pendências da Wise", r.pendencias_wise)}
            {lista("Pendências do parceiro", r.pendencias_parceiro)}
            {r.proximo_passo?.descricao && (
              <p className="text-sm"><span className="text-xs font-semibold text-neutro-300">Próximo passo sugerido: </span>
                {r.proximo_passo.descricao}{r.proximo_passo.data ? ` até ${data(r.proximo_passo.data)}` : ""}</p>
            )}
          </div>
        )}
        {p.texto && (
          <div className="mt-3">
            <p className={cn("whitespace-pre-wrap break-words text-sm text-neutro-100", !aberto && longo && "line-clamp-4")}>{p.texto}</p>
            {longo && (
              <button type="button" onClick={() => setAberto(!aberto)} className="mt-1 inline-flex items-center gap-1 text-xs text-menta-400">
                <ChevronDown className={cn("h-3 w-3 transition-transform", aberto && "rotate-180")} />
                {aberto ? "Mostrar menos" : r ? "Ver texto original completo" : "Ver texto completo"}
              </button>
            )}
          </div>
        )}
        {(p.anexos ?? []).length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
            {(p.anexos ?? []).map((a) => (
              <Button key={a.caminho} size="sm" variant="outline" className="max-w-full" onClick={() => abrirArquivo("anexos", a.caminho)}>
                <Paperclip /> <span className="truncate">{a.nome}</span>
              </Button>
            ))}
          </div>
        )}
      </div>
    </li>
  );
}

// Próximo passo ativo (um por parceiro) e anteriores (FR-023)
function ProximosPassos({ parceiro: p, perfis }: { parceiro: Parceiro; perfis: PerfilResumo[] }) {
  const { perfil, isParcerias } = useAuth();
  const qc = useQueryClient();
  const { data: passos = [] } = useProximosPassos(p.id);
  const ativo = passoAtivo(passos);
  const anteriores = passos.filter((x) => x !== ativo);
  const [novo, setNovo] = useState(false);
  const [f, setF] = useState({ descricao: "", data: "", responsavel_id: "" });
  const [salvando, setSalvando] = useState(false);
  const podeCriar = isParcerias || perfil?.papel === "consultor";
  const podeConcluir = !!ativo && (isParcerias || ativo.responsavel_id === perfil?.id);

  async function concluir() {
    if (!ativo) return;
    const { error } = await supabase.from("proximos_passos").update({ estado: "feito" }).eq("id", ativo.id);
    if (error) return toastErro(error);
    toast.success("Próximo passo concluído.");
    invalidarParceiro(qc, p.id);
  }

  async function criar() {
    if (!f.descricao.trim() || !f.data) {
      toast.error("Informe a descrição e a data.");
      return;
    }
    setSalvando(true);
    const { error } = await supabase.from("proximos_passos").insert({
      parceiro_id: p.id, descricao: f.descricao.trim(), data: f.data, responsavel_id: f.responsavel_id || p.responsavel_id || null,
    });
    setSalvando(false);
    if (error) return toastErro(error);
    toast.success("Próximo passo registrado.");
    setNovo(false);
    setF({ descricao: "", data: "", responsavel_id: "" });
    invalidarParceiro(qc, p.id);
  }

  return (
    <Secao titulo="Próximo passo" className="lg:sticky lg:top-20">
      {ativo ? (
        <div className={cn("rounded-[10px] border p-3", ativo.estado === "vencido" ? "border-destructive/40 bg-destructive/10" : "border-white/10")}>
          <div className="flex items-center gap-2">
            <CalendarClock className="h-4 w-4 shrink-0" />
            <span className="text-sm font-semibold">{data(ativo.data)}</span>
            <SeloEstado estado={ativo.estado} mapa={ESTADOS_PASSO} />
          </div>
          <p className="mt-2 whitespace-pre-wrap break-words text-sm">{ativo.descricao}</p>
          <p className="mt-1 text-xs text-muted-foreground">Responsável: {nomePerfil(perfis, ativo.responsavel_id) || "não definido"}</p>
          {podeConcluir && <Button size="sm" className="mt-3" onClick={concluir}><Check /> Marcar como feito</Button>}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">Nenhum próximo passo ativo.</p>
      )}

      {podeCriar && !novo && (
        <Button size="sm" variant="outline" className="mt-3" onClick={() => setNovo(true)}><Plus /> Novo próximo passo</Button>
      )}
      {novo && (
        <div className="mt-3 space-y-3 rounded-[10px] border border-white/10 p-3">
          <Campo rotulo="Descrição" obrigatorio>
            <Input value={f.descricao} onChange={(e) => setF((x) => ({ ...x, descricao: e.target.value }))} placeholder="Ex.: enviar minuta revisada" autoFocus />
          </Campo>
          <Campo rotulo="Data" obrigatorio>
            <Input type="date" value={f.data} min={hojeISO()} onChange={(e) => setF((x) => ({ ...x, data: e.target.value }))} />
          </Campo>
          <Campo rotulo="Responsável">
            <Select value={f.responsavel_id || p.responsavel_id || ""} onValueChange={(v) => setF((x) => ({ ...x, responsavel_id: v }))}>
              <SelectTrigger><SelectValue placeholder="Responsável do parceiro" /></SelectTrigger>
              <SelectContent>{perfisInternos(perfis).map((x) => <SelectItem key={x.id} value={x.id}>{x.nome}</SelectItem>)}</SelectContent>
            </Select>
          </Campo>
          {ativo && <p className="text-xs text-muted-foreground">O novo próximo passo substitui o atual.</p>}
          <div className="flex justify-end gap-2">
            <Button size="sm" variant="outline" onClick={() => setNovo(false)}>Cancelar</Button>
            <Button size="sm" onClick={criar} disabled={salvando}>Salvar</Button>
          </div>
        </div>
      )}

      {anteriores.length > 0 && (
        <details className="mt-4">
          <summary className="cursor-pointer text-sm text-muted-foreground">Anteriores ({anteriores.length})</summary>
          <ul className="mt-2 space-y-2">
            {anteriores.map((x) => (
              <li key={x.id} className="rounded-[8px] border border-white/10 p-2 text-sm">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs text-muted-foreground">{data(x.data)}</span>
                  <SeloEstado estado={x.estado === "substituido" ? "pendente" : x.estado} mapa={{ ...ESTADOS_PASSO, pendente: "Substituído" }} />
                </div>
                <p className="mt-1 break-words">{x.descricao}</p>
                {x.concluido_em && <p className="text-xs text-muted-foreground">Feito em {dataHora(x.concluido_em)}</p>}
              </li>
            ))}
          </ul>
        </details>
      )}
    </Secao>
  );
}
