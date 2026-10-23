import { useEffect, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2, ShieldAlert } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { ParceiroBusca } from "@/components/comum/ParceiroBusca";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { mensagemErro, toastErro } from "@/lib/erros";
import { hojeISO } from "@/lib/formato";
import { ORIGENS_INDICACAO, SENTIDOS } from "@/lib/rotulos";
import { useCriteriosIcp, useEmpresasGrupo, usePerfisInternos } from "./dados";

// Origens que a equipe interna escolhe (portal do parceiro e RFP são preenchidas pelo sistema).
const ORIGENS_INTERNAS = Object.keys(ORIGENS_INDICACAO).filter((o) => o !== "portal_parceiro" && o !== "rfp");
const RESPONSAVEL_PADRAO = "__padrao";

type Form = {
  sentido: string;
  parceiro_id: string | null;
  empresa_grupo_id: string;
  cliente_razao_social: string;
  cliente_cnpj: string;
  contato_nome: string;
  contato_email: string;
  contato_telefone: string;
  consentimento: boolean;
  origem: string;
  origem_detalhe: string;
  data: string;
  responsavel_id: string;
  aderencia: Record<string, boolean>;
  cliente_existente: boolean;
  observacoes: string;
};

function vazio(parceiroId: string | null): Form {
  return {
    sentido: "parceiro_para_grupo", parceiro_id: parceiroId, empresa_grupo_id: "", cliente_razao_social: "", cliente_cnpj: "",
    contato_nome: "", contato_email: "", contato_telefone: "", consentimento: false, origem: "grupo_whatsapp", origem_detalhe: "",
    data: hojeISO(), responsavel_id: RESPONSAVEL_PADRAO, aderencia: {}, cliente_existente: false, observacoes: "",
  };
}

// Registro de indicação: a única porta é a função registrar_indicacao, que aplica a regra do primeiro registro e o consentimento.
export function NovaIndicacaoDialog({ aberto, onOpenChange, parceiroInicial, onCriada }: {
  aberto: boolean;
  onOpenChange: (v: boolean) => void;
  parceiroInicial?: string | null;
  onCriada?: (id: string) => void;
}) {
  const { isAdmin } = useAuth();
  const qc = useQueryClient();
  const { data: empresas = [] } = useEmpresasGrupo();
  const { data: criterios = [] } = useCriteriosIcp();
  const { data: perfis = [] } = usePerfisInternos();
  const [f, setF] = useState<Form>(() => vazio(parceiroInicial ?? null));
  // Cliente duplicado: mensagem do banco e justificativa da exceção (só administrador)
  const [duplicado, setDuplicado] = useState<string | null>(null);
  const [justificativa, setJustificativa] = useState("");

  useEffect(() => {
    if (aberto) {
      setF(vazio(parceiroInicial ?? null));
      setDuplicado(null);
      setJustificativa("");
    }
  }, [aberto, parceiroInicial]);

  const set = <K extends keyof Form>(k: K, v: Form[K]) => setF((x) => ({ ...x, [k]: v }));
  const empresa = empresas.find((e) => e.id === f.empresa_grupo_id);
  const mostraClienteExistente = empresa?.codigo === "triade" || empresa?.codigo === "swallow";
  const temDadoPessoal = !!(f.contato_nome.trim() || f.contato_email.trim() || f.contato_telefone.trim());
  const valido = !!f.parceiro_id && !!f.empresa_grupo_id && !!f.cliente_razao_social.trim() && (!temDadoPessoal || f.consentimento);

  const registrar = useMutation({
    mutationFn: async (excecao: string | null) => {
      // Aderência só vai quando algum critério foi marcado; sem marcação, fica "não avaliada"
      const avaliou = Object.values(f.aderencia).some(Boolean);
      const aderencia_icp = avaliou ? Object.fromEntries(criterios.map((c) => [c.chave, !!f.aderencia[c.chave]])) : {};
      const p = {
        sentido: f.sentido,
        parceiro_id: f.parceiro_id,
        empresa_grupo_id: f.empresa_grupo_id,
        cliente_razao_social: f.cliente_razao_social.trim(),
        cliente_cnpj: f.cliente_cnpj.trim(),
        contato_nome: f.contato_nome.trim(),
        contato_email: f.contato_email.trim(),
        contato_telefone: f.contato_telefone.trim(),
        consentimento: temDadoPessoal ? f.consentimento : false,
        origem: f.origem,
        origem_detalhe: f.origem_detalhe.trim(),
        data: f.data,
        responsavel_id: f.responsavel_id === RESPONSAVEL_PADRAO ? "" : f.responsavel_id,
        aderencia_icp,
        cliente_existente: mostraClienteExistente ? f.cliente_existente : false,
        observacoes: f.observacoes.trim(),
        excecao_justificativa: excecao ?? "",
      };
      const { data, error } = await supabase.rpc("registrar_indicacao", { p });
      if (error) throw error;
      return data as string;
    },
    onSuccess: (id) => {
      toast.success("Indicação registrada.");
      qc.invalidateQueries({ queryKey: ["indicacoes"] });
      qc.invalidateQueries({ queryKey: ["painel"] });
      onOpenChange(false);
      onCriada?.(id);
    },
    onError: (e: any) => {
      if (e?.hint === "duplicado") {
        setDuplicado(mensagemErro(e));
        if (!isAdmin) toastErro(e);
        return;
      }
      toastErro(e);
    },
  });

  return (
    <Dialog open={aberto} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] w-[calc(100vw-1rem)] max-w-2xl overflow-y-auto rounded-[14px] p-4 sm:p-6">
        <DialogHeader>
          <DialogTitle>Nova indicação</DialogTitle>
          <DialogDescription>Vale o primeiro registro de cada cliente por empresa do grupo.</DialogDescription>
        </DialogHeader>

        <form
          className="space-y-5"
          onSubmit={(e) => {
            e.preventDefault();
            if (valido) registrar.mutate(null);
          }}
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <Campo rotulo="Sentido">
              <Select value={f.sentido} onValueChange={(v) => set("sentido", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(SENTIDOS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                </SelectContent>
              </Select>
            </Campo>
            <Campo rotulo="Parceiro">
              <ParceiroBusca valor={f.parceiro_id} onChange={(v) => set("parceiro_id", v)} />
            </Campo>
            <Campo rotulo={f.sentido === "parceiro_para_grupo" ? "Empresa do grupo que recebe" : "Empresa do grupo que indica"}>
              <Select value={f.empresa_grupo_id} onValueChange={(v) => set("empresa_grupo_id", v)}>
                <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>
                  {empresas.map((e) => <SelectItem key={e.id} value={e.id}>{e.nome}</SelectItem>)}
                </SelectContent>
              </Select>
            </Campo>
            <Campo rotulo="Data">
              <Input type="date" value={f.data} onChange={(e) => set("data", e.target.value)} />
            </Campo>
          </div>

          <fieldset className="space-y-3">
            <legend className="mb-2 text-sm font-semibold">Cliente</legend>
            <div className="grid gap-4 sm:grid-cols-2">
              <Campo rotulo="Razão social ou nome da empresa">
                <Input value={f.cliente_razao_social} onChange={(e) => set("cliente_razao_social", e.target.value)} required />
              </Campo>
              <Campo rotulo="CNPJ (opcional)">
                <Input value={f.cliente_cnpj} inputMode="numeric" onChange={(e) => set("cliente_cnpj", e.target.value)} />
              </Campo>
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              <Campo rotulo="Contato (opcional)">
                <Input value={f.contato_nome} onChange={(e) => set("contato_nome", e.target.value)} />
              </Campo>
              <Campo rotulo="E-mail do contato">
                <Input type="email" value={f.contato_email} onChange={(e) => set("contato_email", e.target.value)} />
              </Campo>
              <Campo rotulo="Telefone do contato">
                <Input type="tel" value={f.contato_telefone} onChange={(e) => set("contato_telefone", e.target.value)} />
              </Campo>
            </div>
            {temDadoPessoal && (
              <label className="flex items-start gap-3 rounded-[8px] border border-menta-500/30 bg-menta-500/5 p-3 text-sm">
                <Checkbox className="mt-0.5" checked={f.consentimento} onCheckedChange={(c) => set("consentimento", !!c)} />
                <span>
                  Declaro que o cliente consentiu em compartilhar estes dados para esta indicação.
                  <span className="block text-xs text-muted-foreground">Obrigatório pela LGPD quando há dados pessoais do contato.</span>
                </span>
              </label>
            )}
            {mostraClienteExistente && (
              <label className="flex items-start gap-3 text-sm">
                <Checkbox className="mt-0.5" checked={f.cliente_existente} onCheckedChange={(c) => set("cliente_existente", !!c)} />
                <span>Já é cliente desta empresa: sem comissão</span>
              </label>
            )}
          </fieldset>

          <div className="grid gap-4 sm:grid-cols-2">
            <Campo rotulo="Origem">
              <Select value={f.origem} onValueChange={(v) => set("origem", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {ORIGENS_INTERNAS.map((o) => <SelectItem key={o} value={o}>{ORIGENS_INDICACAO[o]}</SelectItem>)}
                </SelectContent>
              </Select>
            </Campo>
            <Campo rotulo="Detalhe da origem (opcional)">
              <Input value={f.origem_detalhe} placeholder="Ex.: nome do evento" onChange={(e) => set("origem_detalhe", e.target.value)} />
            </Campo>
            <Campo rotulo="Responsável Wise">
              <Select value={f.responsavel_id} onValueChange={(v) => set("responsavel_id", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value={RESPONSAVEL_PADRAO}>Responsável pelo parceiro</SelectItem>
                  {perfis.map((p) => <SelectItem key={p.id} value={p.id}>{p.nome}</SelectItem>)}
                </SelectContent>
              </Select>
            </Campo>
          </div>

          {criterios.length > 0 && (
            <fieldset>
              <legend className="text-sm font-semibold">Aderência ao ICP</legend>
              <p className="mb-2 text-xs text-muted-foreground">Marque os critérios que o cliente atende. Deixe em branco se ainda não avaliou.</p>
              <div className="grid gap-2 sm:grid-cols-2">
                {criterios.map((c) => (
                  <label key={c.chave} className="flex items-start gap-2 text-sm">
                    <Checkbox className="mt-0.5" checked={!!f.aderencia[c.chave]}
                      onCheckedChange={(v) => set("aderencia", { ...f.aderencia, [c.chave]: !!v })} />
                    <span>{c.descricao}</span>
                  </label>
                ))}
              </div>
            </fieldset>
          )}

          <Campo rotulo="Observações">
            <Textarea rows={3} value={f.observacoes} onChange={(e) => set("observacoes", e.target.value)} />
          </Campo>

          {duplicado && (
            <div className="space-y-3 rounded-[14px] border border-warning/50 bg-warning/10 p-4 text-sm">
              <p className="flex items-start gap-2 font-semibold text-warning"><ShieldAlert className="mt-0.5 h-4 w-4 shrink-0" /> {duplicado}</p>
              {isAdmin ? (
                <>
                  <p className="text-muted-foreground">
                    Como administrador, você pode registrar uma exceção justificada. Ela só vale para contato sem interação há 6 meses ou mais.
                  </p>
                  <Textarea rows={2} placeholder="Justificativa da exceção" value={justificativa} onChange={(e) => setJustificativa(e.target.value)} />
                  <Button type="button" variant="outline" disabled={!justificativa.trim() || registrar.isPending}
                    onClick={() => registrar.mutate(justificativa.trim())}>
                    Registrar com exceção
                  </Button>
                </>
              ) : (
                <p className="text-muted-foreground">Só um administrador pode registrar exceção ao primeiro registro.</p>
              )}
            </div>
          )}

          <DialogFooter className="gap-2">
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>Cancelar</Button>
            <Button type="submit" disabled={!valido || registrar.isPending}>
              {registrar.isPending && <Loader2 className="animate-spin" />} Registrar indicação
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function Campo({ rotulo, children }: { rotulo: string; children: React.ReactNode }) {
  return (
    <div className="min-w-0 space-y-1.5">
      <Label className="text-xs text-muted-foreground">{rotulo}</Label>
      {children}
    </div>
  );
}
