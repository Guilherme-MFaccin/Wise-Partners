import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { Loader2, Lock, Save } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Cabecalho } from "@/components/comum/Cabecalho";
import { Carregando } from "@/components/comum/Estados";
import { TrocarSenha } from "@/components/conta/TrocarSenha";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toastErro } from "@/lib/erros";
import { PAPEIS } from "@/lib/rotulos";
import { cn } from "@/lib/utils";

type Alerta = { tipo: string; rotulo: string };

// Itens do e-mail diário (pendencias_diarias) e avisos imediatos (notificar), pelos códigos do banco.
const ALERTAS_DIARIOS: Alerta[] = [
  { tipo: "followups_vencidos", rotulo: "Follow-ups vencidos" },
  { tipo: "status_atividade", rotulo: "Mudanças de status de atividade dos parceiros" },
  { tipo: "negociacoes_paradas", rotulo: "Negociações paradas" },
  { tipo: "contrapartidas_atrasadas", rotulo: "Contrapartidas atrasadas" },
  { tipo: "indicacoes_paradas", rotulo: "Indicações sem atualização há 30 dias" },
  { tipo: "propostas_ficha", rotulo: "Propostas de alteração de ficha" },
];
const ALERTAS_IMEDIATOS: Alerta[] = [
  { tipo: "indicacao_nova", rotulo: "Nova indicação pelo portal do parceiro" },
  { tipo: "indicacao_atualizada", rotulo: "Parceiro atualizou uma indicação recebida" },
  { tipo: "proposta_ficha", rotulo: "Proposta de alteração de ficha" },
  { tipo: "comprovacao_enviada", rotulo: "Comprovação de contrapartida enviada" },
  { tipo: "rfp_clique", rotulo: "Cliente clicou para falar com um parceiro na página de RFP" },
  { tipo: "base_ativa_suspensa", rotulo: "Ciclo do Base Ativa suspenso" },
];
// Papéis que recebem o e-mail diário de pendências
const RECEBEM_DIARIO = ["admin", "parcerias", "consultor", "comercial"];

// Minha conta (interna e do parceiro): nome, telefone, senha e preferências de alerta.
// Papel e acesso são protegidos por gatilho no banco.
export default function Conta() {
  const { perfil, recarregarPerfil } = useAuth();
  const location = useLocation();
  const [nome, setNome] = useState("");
  const [telefone, setTelefone] = useState("");
  const [desativados, setDesativados] = useState<string[]>([]);

  useEffect(() => {
    if (!perfil) return;
    setNome(perfil.nome ?? "");
    setTelefone(perfil.telefone ?? "");
    setDesativados(perfil.alertas_desativados ?? []);
  }, [perfil]);

  // Link "Troque agora" do aviso de senha provisória: leva direto à seção de senha
  useEffect(() => {
    if (perfil && location.hash === "#senha") document.getElementById("senha")?.scrollIntoView({ block: "start" });
  }, [perfil, location.hash]);

  // Alertas obrigatórios do papel: sempre recebidos
  const obrigatoriosDiarios: Alerta[] = perfil?.is_diretor ? [{ tipo: "aprovacoes_pendentes", rotulo: "Aprovações de assinatura pendentes" }] : [];
  const obrigatoriosImediatos: Alerta[] = [
    ...(perfil?.is_diretor ? [{ tipo: "aprovacao_pendente", rotulo: "Aprovação de assinatura pendente" }] : []),
    ...(perfil?.papel === "financeiro" ? [{ tipo: "comissao_a_pagar", rotulo: "Comissão a pagar" }] : []),
  ];
  const obrigatorios = new Set([...obrigatoriosDiarios, ...obrigatoriosImediatos].map((a) => a.tipo));

  const salvar = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("perfis")
        .update({
          nome: nome.trim(),
          telefone: telefone.trim() || null,
          alertas_desativados: desativados.filter((t) => !obrigatorios.has(t)),
        })
        .eq("id", perfil!.id);
      if (error) throw error;
    },
    onSuccess: async () => {
      await recarregarPerfil();
      toast.success("Dados salvos.");
    },
    onError: toastErro,
  });

  if (!perfil) return <Carregando />;

  const alternar = (tipo: string, receber: boolean) =>
    setDesativados((atual) => (receber ? atual.filter((t) => t !== tipo) : [...new Set([...atual, tipo])]));

  return (
    <div className="mx-auto max-w-3xl">
      <Cabecalho titulo="Minha conta" descricao={`${PAPEIS[perfil.papel]}${perfil.is_diretor ? " · Diretor" : ""}`} />

      <form
        className="space-y-6"
        onSubmit={(e) => {
          e.preventDefault();
          if (nome.trim()) salvar.mutate();
        }}
      >
        <section className="space-y-4 rounded-[14px] border border-white/10 bg-card p-4 sm:p-5">
          <h2 className="font-semibold">Dados pessoais</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="nome" className="text-xs text-muted-foreground">Nome</Label>
              <Input id="nome" value={nome} onChange={(e) => setNome(e.target.value)} required />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="telefone" className="text-xs text-muted-foreground">Telefone</Label>
              <Input id="telefone" type="tel" value={telefone} onChange={(e) => setTelefone(e.target.value)} />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label className="text-xs text-muted-foreground">E-mail de acesso</Label>
              <Input value={perfil.email} disabled />
              <p className="text-xs text-muted-foreground">Para trocar o e-mail ou o papel, fale com um administrador.</p>
            </div>
          </div>
        </section>

        {RECEBEM_DIARIO.includes(perfil.papel) && (
          <GrupoAlertas
            titulo="E-mail diário de pendências"
            descricao="Enviado nos dias úteis de manhã, só quando há itens. Desmarque o que não quer receber."
            alertas={ALERTAS_DIARIOS}
            obrigatorios={obrigatoriosDiarios}
            desativados={desativados}
            onAlternar={alternar}
          />
        )}

        <GrupoAlertas
          titulo="Avisos imediatos por e-mail"
          descricao="Enviados quando o evento acontece. Desmarcados, continuam aparecendo nas notificações do portal."
          alertas={perfil.papel === "financeiro" || perfil.papel === "parceiro" ? [] : ALERTAS_IMEDIATOS}
          obrigatorios={obrigatoriosImediatos}
          desativados={desativados}
          onAlternar={alternar}
        />

        <div className="flex justify-end">
          <Button type="submit" disabled={!nome.trim() || salvar.isPending}>
            {salvar.isPending ? <Loader2 className="animate-spin" /> : <Save />} Salvar
          </Button>
        </div>
      </form>

      <div className="mt-6">
        <TrocarSenha />
      </div>
    </div>
  );
}

function GrupoAlertas({ titulo, descricao, alertas, obrigatorios, desativados, onAlternar }: {
  titulo: string;
  descricao: string;
  alertas: Alerta[];
  obrigatorios: Alerta[];
  desativados: string[];
  onAlternar: (tipo: string, receber: boolean) => void;
}) {
  if (!alertas.length && !obrigatorios.length) return null;
  return (
    <section className="rounded-[14px] border border-white/10 bg-card p-4 sm:p-5">
      <h2 className="font-semibold">{titulo}</h2>
      <p className="mb-4 mt-1 text-sm text-muted-foreground">{descricao}</p>
      <ul className="space-y-3">
        {obrigatorios.map((a) => (
          <li key={a.tipo}>
            <label className="flex items-start gap-3 text-sm">
              <Checkbox className="mt-0.5" checked disabled />
              <span className="flex flex-wrap items-center gap-2">
                {a.rotulo}
                <span className="inline-flex items-center gap-1 text-xs text-muted-foreground"><Lock className="h-3 w-3" /> Obrigatório para o seu papel</span>
              </span>
            </label>
          </li>
        ))}
        {alertas.map((a) => {
          const recebe = !desativados.includes(a.tipo);
          return (
            <li key={a.tipo}>
              <label className={cn("flex cursor-pointer items-start gap-3 text-sm", !recebe && "text-muted-foreground")}>
                <Checkbox className="mt-0.5" checked={recebe} onCheckedChange={(c) => onAlternar(a.tipo, !!c)} />
                <span>{a.rotulo}</span>
              </label>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
