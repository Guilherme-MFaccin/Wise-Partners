import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { KeyRound, Loader2, UserPlus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { ok, toastErro } from "@/lib/erros";
import { data } from "@/lib/formato";
import { Button } from "@/components/ui/button";
import { Cabecalho } from "@/components/comum/Cabecalho";
import { Carregando, ErroCarga, Vazio } from "@/components/comum/Estados";
import { Pilula } from "@/components/comum/Selos";
import { ConvidarParceiroDialog } from "@/components/usuarios/ConvidarParceiroDialog";
import { RedefinirSenhaDialog } from "@/components/usuarios/RedefinirSenhaDialog";

type Usuario = { id: string; nome: string; email: string; ativo: boolean; is_responsavel_parceiro: boolean; created_at: string };

// Usuários da própria empresa: o responsável do parceiro cria o acesso (e-mail e senha provisória), desativa,
// reativa e redefine a senha (FR-072).
export default function Usuarios() {
  const { perfil } = useAuth();
  const qc = useQueryClient();
  const pid = perfil?.parceiro_id;
  const [convidando, setConvidando] = useState(false);
  const [alterando, setAlterando] = useState<string | null>(null);
  const [senhaDe, setSenhaDe] = useState<Usuario | null>(null);

  const usuariosQ = useQuery({
    enabled: !!pid && !!perfil?.is_responsavel_parceiro,
    queryKey: ["portal-usuarios", pid],
    queryFn: async () => ok<any>(await supabase.from("perfis").select("id, nome, email, ativo, is_responsavel_parceiro, created_at")
      .eq("parceiro_id", pid).order("nome")) as Usuario[],
  });
  const convitesQ = useQuery({
    enabled: !!pid && !!perfil?.is_responsavel_parceiro,
    queryKey: ["portal-convites", pid],
    queryFn: async () => ok<any>(await supabase.from("convites").select("email, nome, created_at").eq("parceiro_id", pid).order("created_at")) as
      { email: string; nome: string | null; created_at: string }[],
  });

  if (!perfil?.is_responsavel_parceiro) {
    return <Vazio titulo="Acesso restrito">Só o responsável pela parceria gerencia os usuários da empresa.</Vazio>;
  }

  async function definirAcesso(u: Usuario, ativo: boolean) {
    setAlterando(u.id);
    try {
      const { error } = await supabase.rpc("definir_acesso_usuario_parceiro", { p_perfil: u.id, p_ativo: ativo });
      if (error) throw error;
      toast.success(ativo ? "Acesso reativado." : "Acesso desativado. O histórico do usuário é mantido.");
      qc.invalidateQueries({ queryKey: ["portal-usuarios", pid] });
    } catch (e) {
      toastErro(e);
    } finally {
      setAlterando(null);
    }
  }

  const convites = convitesQ.data ?? [];

  return (
    <div className="space-y-6">
      <Cabecalho titulo="Usuários" descricao="Pessoas da sua empresa com acesso ao portal."
        acoes={<Button onClick={() => setConvidando(true)}><UserPlus /> Criar acesso</Button>} />
      {usuariosQ.isLoading ? <Carregando /> : usuariosQ.error ? <ErroCarga erro={usuariosQ.error} /> : (
        <ul className="grid gap-3">
          {(usuariosQ.data ?? []).map((u) => (
            <li key={u.id} className="flex flex-col gap-3 rounded-[14px] border border-white/10 bg-card p-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-semibold">{u.nome}</p>
                  {u.is_responsavel_parceiro && <Pilula tom="menta">Responsável</Pilula>}
                  {!u.ativo && <Pilula tom="perigo">Desativado</Pilula>}
                  {u.id === perfil.id && <Pilula>Você</Pilula>}
                </div>
                <p className="break-all text-sm text-muted-foreground">{u.email}</p>
              </div>
              {u.id !== perfil.id && (
                <div className="flex shrink-0 flex-wrap gap-2">
                  {u.ativo && <Button size="sm" variant="outline" onClick={() => setSenhaDe(u)}><KeyRound /> Redefinir senha</Button>}
                  <Button size="sm" variant="outline" disabled={alterando === u.id} onClick={() => definirAcesso(u, !u.ativo)}>
                    {alterando === u.id && <Loader2 className="animate-spin" />} {u.ativo ? "Desativar" : "Reativar"}
                  </Button>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
      {convites.length > 0 && (
        <section>
          <h2 className="mb-2 font-semibold">Acessos sem conta</h2>
          <ul className="grid gap-2">
            {convites.map((c) => (
              <li key={c.email} className="rounded-[10px] bg-white/5 px-3 py-2 text-sm">
                <span className="font-medium">{c.nome ?? c.email}</span>
                <span className="break-all text-muted-foreground"> · {c.email} · preparado em {data(c.created_at)}</span>
              </li>
            ))}
          </ul>
        </section>
      )}
      <ConvidarParceiroDialog aberto={convidando} parceiroId={pid!} onClose={() => setConvidando(false)}
        onConvidado={() => {
          qc.invalidateQueries({ queryKey: ["portal-convites", pid] });
          qc.invalidateQueries({ queryKey: ["portal-usuarios", pid] });
        }} />
      <RedefinirSenhaDialog usuario={senhaDe} onClose={() => setSenhaDe(null)} />
    </div>
  );
}
