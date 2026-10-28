import { useState, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectSeparator, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { mensagemErro, toastErro } from "@/lib/erros";
import { hojeISO } from "@/lib/formato";
import { ETAPAS, ETAPAS_FUNIL, ETAPAS_PAUSA, ETAPAS_PERDA, rotulo } from "@/lib/rotulos";
import { cn } from "@/lib/utils";
import { invalidarParceiro, useConfigValor } from "./dados";

export type ParceiroEtapa = { id: string; etapa: string; nome_fantasia: string; motivo_perda?: string | null };

// Troca de etapa do funil. As regras (scorecard antes da proposta, aprovação do Diretor para fechamento,
// contrato assinado para onboarding, data de retomada na nutrição) ficam no banco; aqui só pedimos os dados.
// Usado pelo seletor de etapa e pelo arrastar e soltar do quadro do funil. `aoMudar` recebe a etapa nova antes
// de gravar (para o quadro mover o cartão na hora) e `null` se o banco recusar (o cartão volta).
export function useTrocaEtapa(aoMudar?: (id: string, etapa: string | null) => void) {
  const qc = useQueryClient();
  const navigate = useNavigate();
  const { data: cadenciaPadrao } = useConfigValor<number>("nutricao_cadencia_dias");
  const [alvo, setAlvo] = useState<ParceiroEtapa | null>(null);
  const [perda, setPerda] = useState<string | null>(null);
  const [detalhe, setDetalhe] = useState("");
  const [nutricao, setNutricao] = useState(false);
  const [retomada, setRetomada] = useState("");
  const [cadencia, setCadencia] = useState("");
  const [bloqueio, setBloqueio] = useState<string | null>(null);
  const [salvando, setSalvando] = useState(false);

  async function salvar(parceiro: ParceiroEtapa, etapa: string, extras: Record<string, unknown> = {}) {
    setSalvando(true);
    aoMudar?.(parceiro.id, etapa);
    const { error } = await supabase.from("parceiros").update({ etapa, ...extras }).eq("id", parceiro.id);
    setSalvando(false);
    if (error) {
      aoMudar?.(parceiro.id, null);
      // Regra da proposta com o decisor (scorecard completo e elegibilidade): explica e leva ao scorecard
      if (etapa === "proposta_decisor" && /scorecard/i.test(error.message ?? "")) {
        setAlvo(parceiro);
        setBloqueio(mensagemErro(error));
      } else toastErro(error);
      return false;
    }
    toast.success(`${parceiro.nome_fantasia}: ${rotulo(ETAPAS, etapa)}.`);
    invalidarParceiro(qc, parceiro.id);
    return true;
  }

  function escolher(parceiro: ParceiroEtapa, etapa: string) {
    if (etapa === parceiro.etapa) return;
    if (ETAPAS_PERDA.includes(etapa)) {
      setAlvo(parceiro);
      setDetalhe(parceiro.motivo_perda ?? "");
      setPerda(etapa);
      return;
    }
    if (etapa === "nutricao") {
      setAlvo(parceiro);
      setRetomada("");
      setCadencia(cadenciaPadrao != null ? String(cadenciaPadrao) : "30");
      setNutricao(true);
      return;
    }
    salvar(parceiro, etapa);
  }

  async function confirmarNutricao() {
    if (!alvo) return;
    if (!retomada || retomada < hojeISO()) {
      toast.error("Informe a data de retomada, a partir de hoje.");
      return;
    }
    const dias = Number(cadencia);
    if (!Number.isInteger(dias) || dias < 1) {
      toast.error("A cadência de contato precisa ser um número inteiro de dias.");
      return;
    }
    if (await salvar(alvo, "nutricao", { nutricao_ate: retomada, nutricao_cadencia_dias: dias })) setNutricao(false);
  }

  const dialogos: ReactNode = (
    <>
      <AlertDialog open={!!perda} onOpenChange={(v) => !v && setPerda(null)}>
        <AlertDialogContent className="max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle>Registrar perda</AlertDialogTitle>
            <AlertDialogDescription>
              {alvo?.nome_fantasia} sai do funil ativo. O registro fica no histórico e pode ser revertido depois.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="tipo-perda" className="text-xs">Tipo de perda</Label>
              <Select value={perda ?? undefined} onValueChange={setPerda}>
                <SelectTrigger id="tipo-perda"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {ETAPAS_PERDA.map((e) => <SelectItem key={e} value={e}>{ETAPAS[e]}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="detalhe-perda" className="text-xs">Detalhe (opcional)</Label>
              <Textarea id="detalhe-perda" rows={3} value={detalhe} onChange={(e) => setDetalhe(e.target.value)}
                placeholder="Ex.: decidiu seguir só com o programa próprio" />
            </div>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              disabled={salvando}
              onClick={async (ev) => {
                ev.preventDefault();
                if (alvo && perda && (await salvar(alvo, perda, { motivo_perda: detalhe.trim() || null }))) setPerda(null);
              }}
            >
              Confirmar perda
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={nutricao} onOpenChange={(v) => !v && setNutricao(false)}>
        <AlertDialogContent className="max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle>Mover para nutrição</AlertDialogTitle>
            <AlertDialogDescription>
              Ainda não é a hora de {alvo?.nome_fantasia}. Sai do quadro ativo, não fica morno nem dormente e ganha um próximo passo
              de contato na cadência. Na data de retomada, volta para a etapa atual.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="nutricao-ate" className="text-xs">Data de retomada <span className="text-menta-400">*</span></Label>
              <Input id="nutricao-ate" type="date" min={hojeISO()} value={retomada} onChange={(e) => setRetomada(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="nutricao-cadencia" className="text-xs">Contato a cada (dias)</Label>
              <Input id="nutricao-cadencia" type="number" min={1} inputMode="numeric" value={cadencia} onChange={(e) => setCadencia(e.target.value)} />
            </div>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction disabled={salvando || !retomada} onClick={(ev) => { ev.preventDefault(); confirmarNutricao(); }}>
              Mover para nutrição
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={!!bloqueio} onOpenChange={(v) => !v && setBloqueio(null)}>
        <AlertDialogContent className="max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle>Ainda não dá para seguir para a proposta</AlertDialogTitle>
            <AlertDialogDescription className="whitespace-pre-wrap">{bloqueio}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Fechar</AlertDialogCancel>
            <AlertDialogAction onClick={() => alvo && navigate(`/app/parceiros/${alvo.id}?aba=scorecard`)}>Abrir scorecard</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );

  return { escolher, salvando, dialogos };
}

export function SeletorEtapa({ parceiro, className }: { parceiro: ParceiroEtapa; className?: string }) {
  const troca = useTrocaEtapa();
  // Etapa atual fora das listas (cadastro antigo) continua visível no seletor
  const conhecidas = [...ETAPAS_FUNIL, ...ETAPAS_PAUSA, ...ETAPAS_PERDA];

  return (
    <>
      <Select value={parceiro.etapa} onValueChange={(e) => troca.escolher(parceiro, e)} disabled={troca.salvando}>
        <SelectTrigger className={cn("h-9 rounded-full", className)} aria-label="Etapa do funil">
          <SelectValue>{rotulo(ETAPAS, parceiro.etapa)}</SelectValue>
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            <SelectLabel>Funil</SelectLabel>
            {ETAPAS_FUNIL.map((e) => <SelectItem key={e} value={e}>{ETAPAS[e]}</SelectItem>)}
            {!conhecidas.includes(parceiro.etapa) && <SelectItem value={parceiro.etapa}>{rotulo(ETAPAS, parceiro.etapa)}</SelectItem>}
          </SelectGroup>
          <SelectSeparator />
          <SelectGroup>
            <SelectLabel>Pausa</SelectLabel>
            {ETAPAS_PAUSA.map((e) => <SelectItem key={e} value={e}>{ETAPAS[e]}</SelectItem>)}
          </SelectGroup>
          <SelectSeparator />
          <SelectGroup>
            <SelectLabel>Perdas</SelectLabel>
            {ETAPAS_PERDA.map((e) => <SelectItem key={e} value={e}>{ETAPAS[e]}</SelectItem>)}
          </SelectGroup>
        </SelectContent>
      </Select>
      {troca.dialogos}
    </>
  );
}
