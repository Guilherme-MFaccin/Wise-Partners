import { useMemo, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Eye, Loader2, Lock, Pencil, Plus, Send, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Cabecalho } from "@/components/comum/Cabecalho";
import { Carregando, ErroCarga, Vazio } from "@/components/comum/Estados";
import { Pilula } from "@/components/comum/Selos";
import { Button } from "@/components/ui/button";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CLASSE_CARD, Barra } from "@/components/painel/Blocos";
import { nomePerfil, useCategorias, usePacotes, usePerfis } from "@/components/parceiros/dados";
import { TIPOS_COMUNICADO, resumoRecorte, useComunicados, type Comunicado } from "@/components/comunicados/dados";
import { ComunicadoDialog } from "@/components/comunicados/ComunicadoDialog";
import { LeiturasDialog } from "@/components/comunicados/LeiturasDialog";
import { toastErro } from "@/lib/erros";
import { dataHora } from "@/lib/formato";
import { rotulo } from "@/lib/rotulos";
import { cn } from "@/lib/utils";

type Aba = "todos" | "rascunhos" | "enviados";

// Comunicados aos parceiros: parcerias cria, edita rascunhos e envia; o consultor acompanha.
export default function Comunicados() {
  const { perfil, isParcerias } = useAuth();
  const papel = perfil?.papel;
  if (papel && !["admin", "parcerias", "consultor"].includes(papel)) {
    return (
      <div>
        <Cabecalho titulo="Comunicados" />
        <Vazio titulo="Sem permissão">
          <span className="inline-flex items-center gap-1"><Lock className="h-4 w-4" /> Comunicados são geridos pelo time de parcerias.</span>
        </Vazio>
      </div>
    );
  }
  return <TelaComunicados podeEditar={isParcerias} />;
}

function TelaComunicados({ podeEditar }: { podeEditar: boolean }) {
  const qc = useQueryClient();
  const consulta = useComunicados();
  const { data: perfis = [] } = usePerfis();
  const { data: pacotes = [] } = usePacotes();
  const { data: categorias = [] } = useCategorias();
  const [aba, setAba] = useState<Aba>("todos");
  const [edicao, setEdicao] = useState<{ c: Comunicado | null } | null>(null);
  const [enviar, setEnviar] = useState<Comunicado | null>(null);
  const [excluir, setExcluir] = useState<Comunicado | null>(null);
  const [leituras, setLeituras] = useState<Comunicado | null>(null);

  const nomes = useMemo(() => ({
    pacotes: new Map(pacotes.map((p) => [p.codigo, p.nome])),
    categorias: new Map(categorias.map((c) => [c.id, c.nome])),
  }), [pacotes, categorias]);

  const todos = useMemo(() => consulta.data?.comunicados ?? [], [consulta.data]);
  const contagem = consulta.data?.contagem;
  const lista = useMemo(() => {
    const l = todos.filter((c) => aba === "todos" || (aba === "rascunhos" ? !c.enviado_em : !!c.enviado_em));
    // Rascunhos primeiro, depois enviados do mais recente ao mais antigo
    return [...l].sort((a, b) => {
      if (!a.enviado_em !== !b.enviado_em) return a.enviado_em ? 1 : -1;
      return (b.enviado_em ?? b.created_at).localeCompare(a.enviado_em ?? a.created_at);
    });
  }, [todos, aba]);
  const rascunhos = todos.filter((c) => !c.enviado_em).length;

  const envio = useMutation({
    mutationFn: async (c: Comunicado) => {
      const { data, error } = await supabase.rpc("enviar_comunicado", { p_id: c.id });
      if (error) throw error;
      return Number(data ?? 0);
    },
    onSuccess: (n) => {
      toast.success(n ? `Comunicado enviado para ${n} pessoa(s).` : "Comunicado registrado como enviado, mas nenhuma pessoa estava no recorte.");
      qc.invalidateQueries({ queryKey: ["comunicados"] });
      setEnviar(null);
    },
    onError: toastErro,
  });

  const exclusao = useMutation({
    mutationFn: async (c: Comunicado) => {
      const { error } = await supabase.from("comunicados").delete().eq("id", c.id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Rascunho excluído.");
      qc.invalidateQueries({ queryKey: ["comunicados"] });
      setExcluir(null);
    },
    onError: toastErro,
  });

  return (
    <div>
      <Cabecalho
        titulo="Comunicados"
        descricao="Mudanças de regra, eventos e materiais aos parceiros, para todos ou por recorte, com confirmação de leitura."
        acoes={podeEditar && <Button onClick={() => setEdicao({ c: null })}><Plus /> Novo comunicado</Button>}
      />

      <Tabs value={aba} onValueChange={(v) => setAba(v as Aba)} className="mb-4">
        <TabsList className="h-auto flex-wrap">
          <TabsTrigger value="todos">Todos</TabsTrigger>
          <TabsTrigger value="rascunhos">Rascunhos{rascunhos ? ` (${rascunhos})` : ""}</TabsTrigger>
          <TabsTrigger value="enviados">Enviados</TabsTrigger>
        </TabsList>
      </Tabs>

      {consulta.isLoading && <Carregando />}
      {consulta.error && <ErroCarga erro={consulta.error} />}
      {consulta.isSuccess && !lista.length && (
        <Vazio titulo={aba === "rascunhos" ? "Nenhum rascunho" : "Nenhum comunicado"}>
          Ao publicar uma nova versão das regras, o rascunho do comunicado aparece aqui.
        </Vazio>
      )}

      <ul className="space-y-3">
        {lista.map((c) => {
          const k = contagem?.get(c.id) ?? { total: 0, lidos: 0 };
          return (
            <li key={c.id} className={cn(CLASSE_CARD, "flex min-w-0 flex-col gap-3 p-4 sm:flex-row sm:items-start")}>
              <div className="min-w-0 flex-1 space-y-1.5">
                <div className="flex flex-wrap items-center gap-2">
                  {c.enviado_em ? <Pilula tom="menta">Enviado</Pilula> : <Pilula tom="alerta">Rascunho</Pilula>}
                  <Pilula>{rotulo(TIPOS_COMUNICADO, c.tipo)}</Pilula>
                  {c.versao_regras_id && <Pilula tom="info">Gerado pela publicação das regras</Pilula>}
                </div>
                <p className="break-words font-semibold">{c.titulo}</p>
                <p className="line-clamp-2 whitespace-pre-wrap break-words text-sm text-muted-foreground">{c.corpo}</p>
                <p className="text-xs text-muted-foreground">
                  Recorte: {resumoRecorte(c.recorte, nomes)}
                </p>
                <p className="text-xs text-muted-foreground">
                  {c.enviado_em
                    ? `Enviado em ${dataHora(c.enviado_em)}${nomePerfil(perfis, c.enviado_por) ? ` por ${nomePerfil(perfis, c.enviado_por)}` : ""}`
                    : `Criado em ${dataHora(c.created_at)}${nomePerfil(perfis, c.created_by) ? ` por ${nomePerfil(perfis, c.created_by)}` : ""}`}
                </p>
                {c.enviado_em && (
                  <div className="max-w-sm space-y-1 pt-1">
                    <p className="text-xs">{k.lidos} de {k.total} pessoa(s) leram</p>
                    <Barra valor={k.lidos} maximo={Math.max(k.total, 1)} />
                  </div>
                )}
              </div>
              <div className="flex flex-wrap gap-2 sm:flex-col">
                {c.enviado_em ? (
                  <Button size="sm" variant="outline" onClick={() => setLeituras(c)}><Eye /> Leituras</Button>
                ) : podeEditar && (
                  <>
                    <Button size="sm" onClick={() => setEnviar(c)}><Send /> Enviar</Button>
                    <Button size="sm" variant="outline" onClick={() => setEdicao({ c })}><Pencil /> Editar</Button>
                    <Button size="sm" variant="ghost" onClick={() => setExcluir(c)}><Trash2 /> Excluir</Button>
                  </>
                )}
              </div>
            </li>
          );
        })}
      </ul>

      <ComunicadoDialog aberto={!!edicao} comunicado={edicao?.c ?? null} onFechar={() => setEdicao(null)} />
      <LeiturasDialog comunicado={leituras} onFechar={() => setLeituras(null)} />

      <AlertDialog open={!!enviar} onOpenChange={(v) => !v && !envio.isPending && setEnviar(null)}>
        <AlertDialogContent className="w-[calc(100vw-1rem)] rounded-[14px]">
          <AlertDialogHeader>
            <AlertDialogTitle>Enviar comunicado?</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-2">
                <p className="break-words font-semibold text-foreground">{enviar?.titulo}</p>
                <p>Recorte: {resumoRecorte(enviar?.recorte, nomes)}.</p>
                <p>Cada pessoa ativa dos parceiros assinados no recorte recebe e-mail e vê o comunicado no portal. Depois de enviado, não dá para editar.</p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2">
            <AlertDialogCancel disabled={envio.isPending}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              disabled={envio.isPending}
              onClick={(e) => {
                e.preventDefault();
                if (enviar) envio.mutate(enviar);
              }}
            >
              {envio.isPending ? <Loader2 className="animate-spin" /> : <Send />} Enviar agora
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={!!excluir} onOpenChange={(v) => !v && setExcluir(null)}>
        <AlertDialogContent className="w-[calc(100vw-1rem)] rounded-[14px]">
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir rascunho?</AlertDialogTitle>
            <AlertDialogDescription className="break-words">{excluir?.titulo}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2">
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={(e) => {
                e.preventDefault();
                if (excluir) exclusao.mutate(excluir);
              }}
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
