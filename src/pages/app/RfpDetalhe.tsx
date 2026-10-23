import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ArrowLeft, Check } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import type { BlocoRfp } from "@/lib/ia";
import { ok, toastErro } from "@/lib/erros";
import { dataHora } from "@/lib/formato";
import { ESTADOS_PEDIDO_RFP } from "@/lib/rotulos";
import { cn } from "@/lib/utils";
import { Cabecalho } from "@/components/comum/Cabecalho";
import { Carregando, ErroCarga } from "@/components/comum/Estados";
import { SeloEstado } from "@/components/comum/Selos";
import { FormPedido, type DadosPedido } from "@/components/rfp/FormPedido";
import { EtapaRecomendacao } from "@/components/rfp/EtapaRecomendacao";
import { EditorBlocos } from "@/components/rfp/EditorBlocos";
import { EtapaPublicar } from "@/components/rfp/EtapaPublicar";
import { useCandidatos, useCategorias, useConfiguracao, useOpcoes, usePagina, usePedido } from "@/components/rfp/dados";
import { categoriasDaSelecao, type ContextoPagina } from "@/components/rfp/montarBlocos";
import { AVISO_PADRAO } from "@/components/rfp/tipos";

const ETAPAS = ["Pedido", "Recomendação", "Página", "Publicar"];
const chaveRascunho = (id: string) => `rfp-rascunho-${id}`;
const NENHUM: any[] = []; // referência estável enquanto os dados carregam

export default function RfpDetalhe() {
  const { id = "novo" } = useParams();
  return id === "novo" ? <NovoPedido /> : <DetalhePedido id={id} />;
}

function NovoPedido() {
  const { perfil, isParcerias } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [salvando, setSalvando] = useState(false);
  const podeCriar = isParcerias || perfil?.papel === "consultor";
  const inicial: DadosPedido = {
    cliente_nome: "", necessidade: "", porte: "", regiao: "", prazo: "", restricoes: "",
    empresa_grupo_id: perfil?.empresa_grupo_id ?? "",
  };

  async function criar(d: DadosPedido) {
    setSalvando(true);
    try {
      const novo = ok<any>(await supabase.from("pedidos_rfp").insert({
        ...limpar(d), consultor_id: perfil!.id,
      }).select("id").single()) as { id: string };
      toast.success("Pedido registrado. Agora peça a recomendação.");
      qc.invalidateQueries({ queryKey: ["pedidos-rfp"] });
      navigate(`/app/rfp/${novo.id}?etapa=2`, { replace: true });
    } catch (e) {
      toastErro(e);
    } finally {
      setSalvando(false);
    }
  }

  return (
    <div>
      <VoltarLista />
      <Cabecalho titulo="Novo pedido de RFP" descricao="Registre o que o cliente precisa. Depois a IA sugere as categorias e os parceiros assinados." />
      {podeCriar ? (
        <div className="rounded-[14px] border border-white/10 bg-card p-4 sm:p-6">
          <FormPedido inicial={inicial} onSalvar={criar} salvando={salvando} rotuloSalvar="Registrar pedido" />
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">Seu papel permite apenas consultar os pedidos de RFP.</p>
      )}
    </div>
  );
}

function limpar(d: DadosPedido) {
  return {
    cliente_nome: d.cliente_nome.trim(),
    necessidade: d.necessidade.trim(),
    porte: d.porte?.trim() || null,
    regiao: d.regiao?.trim() || null,
    prazo: d.prazo?.trim() || null,
    restricoes: d.restricoes?.trim() || null,
    empresa_grupo_id: d.empresa_grupo_id,
  };
}

function VoltarLista() {
  return (
    <Link to="/app/rfp" className="mb-3 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-white">
      <ArrowLeft className="h-4 w-4" /> Pedidos de RFP
    </Link>
  );
}

function DetalhePedido({ id }: { id: string }) {
  const { perfil, isParcerias } = useAuth();
  const qc = useQueryClient();
  const pedidoQ = usePedido(id);
  const opcoesQ = useOpcoes(id);
  const paginaQ = usePagina(id);
  const candidatosQ = useCandidatos();
  const categoriasQ = useCategorias();
  const avisoQ = useConfiguracao<string>("texto_aviso_relacao_comercial");
  const pedido = pedidoQ.data;
  const consultorQ = useQuery({
    enabled: !!pedido?.consultor_id,
    queryKey: ["perfil-contato", pedido?.consultor_id],
    queryFn: async () => ok<any>(await supabase.from("perfis").select("nome, email, telefone").eq("id", pedido!.consultor_id).maybeSingle()) as
      { nome: string; email: string; telefone: string | null } | null,
  });

  const etapaUrl = Number(new URLSearchParams(window.location.search).get("etapa")) || 0;
  const [etapa, setEtapa] = useState<number | null>(etapaUrl ? etapaUrl - 1 : null);
  const [selecaoPendente, setSelecaoPendente] = useState(false);
  const [salvandoPedido, setSalvandoPedido] = useState(false);
  const [blocos, setBlocosEstado] = useState<BlocoRfp[] | null>(null);
  const [rascunhoCarregado, setRascunhoCarregado] = useState(false);

  // Rascunho dos blocos: guardado no navegador por pedido; sem rascunho, parte da página publicada
  useEffect(() => {
    if (rascunhoCarregado || paginaQ.isLoading) return;
    let inicial: BlocoRfp[] | null = null;
    try {
      const salvo = localStorage.getItem(chaveRascunho(id));
      if (salvo) inicial = JSON.parse(salvo);
    } catch { /* sem armazenamento local */ }
    if (!inicial && paginaQ.data?.blocos?.length) inicial = paginaQ.data.blocos;
    setBlocosEstado(inicial);
    setRascunhoCarregado(true);
  }, [id, paginaQ.isLoading, paginaQ.data, rascunhoCarregado]);

  const setBlocos = useCallback((b: BlocoRfp[] | null) => {
    setBlocosEstado(b);
    try {
      if (b) localStorage.setItem(chaveRascunho(id), JSON.stringify(b));
      else localStorage.removeItem(chaveRascunho(id));
    } catch { /* sem armazenamento local */ }
  }, [id]);

  const candidatos = candidatosQ.data ?? NENHUM;
  const categorias = categoriasQ.data ?? NENHUM;
  const opcoes = opcoesQ.data ?? NENHUM;
  const nomeCategoria = useCallback((cid: string) => categorias.find((c) => c.id === cid)?.nome ?? "Categoria", [categorias]);

  const categoriasPagina = useMemo(() => categoriasDaSelecao(
    opcoes, pedido?.categorias_sugeridas ?? [], nomeCategoria,
    (pid) => candidatos.find((c) => c.parceiro_id === pid)?.nome ?? opcoes.find((o) => o.parceiro_id === pid)?.parceiro?.nome_fantasia ?? "Parceiro",
  ), [opcoes, pedido, nomeCategoria, candidatos]);

  const ctx: ContextoPagina | null = pedido ? {
    clienteNome: pedido.cliente_nome,
    necessidade: pedido.necessidade,
    necessidadeResumida: pedido.necessidade_resumida ?? "",
    consultor: { nome: consultorQ.data?.nome ?? "", email: consultorQ.data?.email ?? null, telefone: consultorQ.data?.telefone ?? null },
    aviso: (typeof avisoQ.data === "string" && avisoQ.data.trim()) || AVISO_PADRAO,
    categorias: categoriasPagina,
    candidatos,
  } : null;

  if (pedidoQ.isLoading || opcoesQ.isLoading || candidatosQ.isLoading || categoriasQ.isLoading || paginaQ.isLoading) return <Carregando />;
  if (pedidoQ.error) return <ErroCarga erro={pedidoQ.error} />;
  if (!pedido || !ctx) return <ErroCarga erro="Pedido não encontrado." />;

  // Consultor gere os próprios pedidos; parcerias e admin gerem todos; os demais só consultam.
  const podeGerir = isParcerias || (perfil?.papel === "consultor" && pedido.consultor_id === perfil.id);
  const publicado = !!paginaQ.data?.publicada_em;
  const etapaPadrao = publicado ? 3 : opcoes.length ? 2 : 1;
  const atual = etapa ?? etapaPadrao;

  function irPara(i: number) {
    if (atual === 1 && selecaoPendente && i !== 1) {
      toast.error("Salve a seleção antes de continuar.");
      return;
    }
    setEtapa(i);
  }

  async function salvarPedido(d: DadosPedido) {
    setSalvandoPedido(true);
    try {
      const r = await supabase.from("pedidos_rfp").update(limpar(d)).eq("id", id);
      if (r.error) throw r.error;
      toast.success("Pedido atualizado.");
      await qc.invalidateQueries({ queryKey: ["pedido-rfp", id] });
    } catch (e) {
      toastErro(e);
    } finally {
      setSalvandoPedido(false);
    }
  }

  return (
    <div>
      <VoltarLista />
      <Cabecalho
        titulo={pedido.cliente_nome}
        descricao={<>Registrado em {dataHora(pedido.created_at)}{consultorQ.data?.nome ? ` por ${consultorQ.data.nome}` : ""}</>}
        acoes={<SeloEstado estado={pedido.estado} mapa={ESTADOS_PEDIDO_RFP} />}
      />

      <ol className="mb-6 grid grid-cols-2 gap-2 sm:grid-cols-4">
        {ETAPAS.map((nome, i) => (
          <li key={nome}>
            <button type="button" onClick={() => irPara(i)}
              className={cn(
                "flex w-full items-center gap-2 rounded-full border px-3 py-2 text-left text-sm font-semibold transition-colors",
                i === atual ? "border-menta-500 bg-menta-500/10 text-menta-300" : "border-white/10 text-neutro-300 hover:bg-white/5",
              )}>
              <span className={cn("flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs",
                i === atual ? "bg-menta-500 text-neutro-900" : "bg-white/10")}>
                {i === 3 && publicado ? <Check className="h-3.5 w-3.5" /> : i + 1}
              </span>
              <span className="truncate">{nome}</span>
            </button>
          </li>
        ))}
      </ol>

      {!podeGerir && (
        <p className="mb-4 rounded-[10px] bg-white/5 px-3 py-2 text-sm text-muted-foreground">
          Você está consultando um pedido de outro consultor. Só quem registrou o pedido e o time de parcerias podem alterá-lo.
        </p>
      )}

      {atual === 0 && (
        <div className="rounded-[14px] border border-white/10 bg-card p-4 sm:p-6">
          <FormPedido key={(pedido as any).updated_at ?? pedido.id} inicial={pedido} onSalvar={salvarPedido}
            salvando={salvandoPedido} somenteLeitura={!podeGerir} />
        </div>
      )}
      {/* A etapa de recomendação fica montada para não perder ajustes ao trocar de etapa */}
      <div className={atual === 1 ? "" : "hidden"}>
        <EtapaRecomendacao pedido={pedido} opcoesSalvas={opcoes} candidatos={candidatos} categorias={categorias}
          podeGerir={podeGerir} onAlterado={setSelecaoPendente} />
      </div>
      {atual === 2 && (
        <EditorBlocos ctx={ctx} blocos={blocos} onChange={setBlocos} candidatos={candidatos} podeGerir={podeGerir} />
      )}
      {atual === 3 && (
        <EtapaPublicar pedido={pedido} opcoes={opcoes} candidatos={candidatos} categoriasPagina={categoriasPagina}
          nomeCategoria={nomeCategoria} pagina={paginaQ.data ?? null} blocos={blocos} podeGerir={podeGerir}
          selecaoPendente={selecaoPendente}
          onPublicado={() => {
            // Publicado: o rascunho local deixa de ser necessário (a página publicada é a referência)
            try { localStorage.removeItem(chaveRascunho(id)); } catch { /* sem armazenamento local */ }
          }} />
      )}
    </div>
  );
}
