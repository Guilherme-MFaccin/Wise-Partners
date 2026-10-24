import { useEffect, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Campo } from "@/components/parceiros/ui";
import { perfisInternos, usePerfis } from "@/components/parceiros/dados";
import { useEmpresasGrupo } from "@/components/indicacoes/dados";
import { mensagemErro, toastErro } from "@/lib/erros";
import { hojeISO, semTravessao } from "@/lib/formato";
import { QUADRANTES_CRUZAMENTO, SENTIDOS, TIPOS_ACAO } from "@/lib/rotulos";
import type { Coincidencia } from "./dados";

export type Decisao = { tipo: "indicacao" | "acao" | "descartar"; c: Coincidencia; parceiroNome: string };

async function decidir(id: string, virou: string, referencia: string | null, observacao: string) {
  const { error } = await supabase.rpc("decidir_coincidencia", {
    p_id: id, p_virou: virou, p_referencia: referencia, p_observacao: observacao.trim() || null,
  });
  if (error) throw error;
}

function sentidoDoQuadrante(q: Coincidencia["quadrante"]) {
  return q === "wise_apresenta" ? "grupo_para_parceiro" : "parceiro_para_grupo";
}

// As três decisões sobre uma coincidência: virar indicação, virar ação conjunta ou descartar.
export function DecisaoDialog({ decisao, onFechar }: { decisao: Decisao | null; onFechar: () => void }) {
  const titulo = decisao?.tipo === "indicacao" ? "Virar indicação" : decisao?.tipo === "acao" ? "Virar ação conjunta" : "Descartar coincidência";
  return (
    <Dialog open={!!decisao} onOpenChange={(v) => !v && onFechar()}>
      <DialogContent className="max-h-[92vh] w-[calc(100vw-1rem)] max-w-lg overflow-y-auto rounded-[14px] p-4 sm:p-6">
        <DialogHeader>
          <DialogTitle>{titulo}</DialogTitle>
          <DialogDescription>
            {decisao ? `${decisao.c.base?.razao_social ?? "Empresa"} · ${decisao.parceiroNome} · ${QUADRANTES_CRUZAMENTO[decisao.c.quadrante] ?? decisao.c.quadrante}` : ""}
          </DialogDescription>
        </DialogHeader>
        {decisao?.tipo === "indicacao" && <FormIndicacao decisao={decisao} onFechar={onFechar} />}
        {decisao?.tipo === "acao" && <FormAcao decisao={decisao} onFechar={onFechar} />}
        {decisao?.tipo === "descartar" && <FormDescartar decisao={decisao} onFechar={onFechar} />}
      </DialogContent>
    </Dialog>
  );
}

function useConcluir(onFechar: () => void, mensagem: string) {
  const qc = useQueryClient();
  return () => {
    toast.success(mensagem);
    qc.invalidateQueries({ queryKey: ["cruzamento"] });
    onFechar();
  };
}

function FormIndicacao({ decisao, onFechar }: { decisao: Decisao; onFechar: () => void }) {
  const qc = useQueryClient();
  const { data: empresas = [] } = useEmpresasGrupo();
  const c = decisao.c;
  const [razao, setRazao] = useState(c.base?.razao_social ?? "");
  const [sentido, setSentido] = useState(sentidoDoQuadrante(c.quadrante));
  const [necessidade, setNecessidade] = useState("");
  const [obs, setObs] = useState("");
  const concluir = useConcluir(onFechar, "Indicação registrada e coincidência decidida.");
  useEffect(() => {
    setRazao(c.base?.razao_social ?? "");
    setSentido(sentidoDoQuadrante(c.quadrante));
  }, [c]);
  const empresa = empresas.find((e) => e.id === c.base?.empresa_grupo_id);

  const salvar = useMutation({
    mutationFn: async () => {
      if (!c.base?.empresa_grupo_id) throw new Error("A empresa da base não foi encontrada.");
      const { data, error } = await supabase.rpc("registrar_indicacao", {
        p: {
          sentido, parceiro_id: c.parceiro_id, empresa_grupo_id: c.base.empresa_grupo_id, cliente_razao_social: semTravessao(razao.trim()),
          origem: "cruzamento", origem_detalhe: QUADRANTES_CRUZAMENTO[c.quadrante] ?? c.quadrante, data: hojeISO(),
          necessidade: semTravessao(necessidade.trim()), observacoes: semTravessao(obs.trim()),
        },
      });
      if (error) throw error;
      const id = data as string;
      try {
        await decidir(c.id, "indicacao", id, obs);
      } catch (e) {
        qc.invalidateQueries({ queryKey: ["indicacoes"] });
        throw new Error(`A indicação foi registrada, mas a decisão não foi gravada: ${mensagemErro(e)}`);
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["indicacoes"] });
      concluir();
    },
    onError: toastErro,
  });

  return (
    <form
      className="space-y-3"
      onSubmit={(e) => {
        e.preventDefault();
        if (razao.trim()) salvar.mutate();
      }}
    >
      <Campo rotulo="Cliente (razão social)" obrigatorio>
        <Input value={razao} onChange={(e) => setRazao(e.target.value)} />
      </Campo>
      <div className="grid gap-3 sm:grid-cols-2">
        <Campo rotulo="Sentido">
          <Select value={sentido} onValueChange={setSentido}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {Object.entries(SENTIDOS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
            </SelectContent>
          </Select>
        </Campo>
        <Campo rotulo="Empresa do grupo">
          <Input value={empresa?.nome ?? ""} disabled />
        </Campo>
      </div>
      <Campo rotulo="Necessidade">
        <Textarea rows={2} value={necessidade} onChange={(e) => setNecessidade(e.target.value)} />
      </Campo>
      <Campo rotulo="Observação">
        <Textarea rows={2} value={obs} onChange={(e) => setObs(e.target.value)} />
      </Campo>
      <p className="text-xs text-muted-foreground">
        Origem: cruzamento de carteiras. Vale a regra do primeiro registro. Nenhuma das partes aborda cliente da outra sem acordo prévio.
      </p>
      <DialogFooter className="gap-2">
        <Button type="button" variant="outline" onClick={onFechar}>Cancelar</Button>
        <Button type="submit" disabled={!razao.trim() || salvar.isPending}>
          {salvar.isPending && <Loader2 className="animate-spin" />} Registrar indicação
        </Button>
      </DialogFooter>
    </form>
  );
}

const NINGUEM = "__ninguem";

function FormAcao({ decisao, onFechar }: { decisao: Decisao; onFechar: () => void }) {
  const { perfil } = useAuth();
  const { data: perfis = [] } = usePerfis();
  const c = decisao.c;
  const nomePadrao = `${c.quadrante === "cliente_comum" ? "Case conjunto" : "Ação conjunta"}: ${c.base?.razao_social ?? "empresa"}`;
  const [nome, setNome] = useState(nomePadrao);
  const [tipo, setTipo] = useState(c.quadrante === "cliente_comum" ? "relacionamento" : "marketing");
  const [data, setData] = useState("");
  const [resp, setResp] = useState(perfil?.id ?? NINGUEM);
  const [obs, setObs] = useState("");
  const concluir = useConcluir(onFechar, "Ação conjunta criada e coincidência decidida.");

  const salvar = useMutation({
    mutationFn: async () => {
      const { data: acao, error } = await supabase.from("acoes_wise").insert({
        parceiro_id: c.parceiro_id, nome: semTravessao(nome.trim()), tipo_acao: tipo, periodicidade: "por_acao",
        comprovacao_esperada: "Link ou arquivo", data_prevista: data || null, responsavel_id: resp === NINGUEM ? null : resp,
        observacao: semTravessao(obs.trim()) || null,
      }).select("id").single();
      if (error) throw error;
      try {
        await decidir(c.id, "acao", acao.id as string, obs);
      } catch (e) {
        throw new Error(`A ação foi criada, mas a decisão não foi gravada: ${mensagemErro(e)}`);
      }
    },
    onSuccess: concluir,
    onError: toastErro,
  });

  return (
    <form
      className="space-y-3"
      onSubmit={(e) => {
        e.preventDefault();
        if (nome.trim()) salvar.mutate();
      }}
    >
      <Campo rotulo="Nome da ação" obrigatorio>
        <Input value={nome} onChange={(e) => setNome(e.target.value)} />
      </Campo>
      <div className="grid gap-3 sm:grid-cols-2">
        <Campo rotulo="Tipo">
          <Select value={tipo} onValueChange={setTipo}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {Object.entries(TIPOS_ACAO).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
            </SelectContent>
          </Select>
        </Campo>
        <Campo rotulo="Data prevista">
          <Input type="date" value={data} onChange={(e) => setData(e.target.value)} />
        </Campo>
      </div>
      <Campo rotulo="Responsável na Wise">
        <Select value={resp} onValueChange={setResp}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value={NINGUEM}>Sem responsável</SelectItem>
            {perfisInternos(perfis).map((p) => <SelectItem key={p.id} value={p.id}>{p.nome}</SelectItem>)}
          </SelectContent>
        </Select>
      </Campo>
      <Campo rotulo="Observação">
        <Textarea rows={2} value={obs} onChange={(e) => setObs(e.target.value)} />
      </Campo>
      <p className="text-xs text-muted-foreground">A ação entra no plano de ações conjuntas do parceiro, no lado da Wise.</p>
      <DialogFooter className="gap-2">
        <Button type="button" variant="outline" onClick={onFechar}>Cancelar</Button>
        <Button type="submit" disabled={!nome.trim() || salvar.isPending}>
          {salvar.isPending && <Loader2 className="animate-spin" />} Criar ação
        </Button>
      </DialogFooter>
    </form>
  );
}

function FormDescartar({ decisao, onFechar }: { decisao: Decisao; onFechar: () => void }) {
  const [obs, setObs] = useState("");
  const concluir = useConcluir(onFechar, "Coincidência descartada.");
  const salvar = useMutation({
    mutationFn: () => decidir(decisao.c.id, "descartar", null, obs),
    onSuccess: concluir,
    onError: toastErro,
  });
  return (
    <div className="space-y-3">
      <Campo rotulo="Motivo (opcional)">
        <Textarea rows={3} value={obs} onChange={(e) => setObs(e.target.value)} />
      </Campo>
      <p className="text-xs text-muted-foreground">A decisão não pode ser desfeita. Coincidências descartadas são apagadas no vencimento.</p>
      <DialogFooter className="gap-2">
        <Button variant="outline" onClick={onFechar}>Cancelar</Button>
        <Button variant="destructive" onClick={() => salvar.mutate()} disabled={salvar.isPending}>
          {salvar.isPending && <Loader2 className="animate-spin" />} Descartar
        </Button>
      </DialogFooter>
    </div>
  );
}
