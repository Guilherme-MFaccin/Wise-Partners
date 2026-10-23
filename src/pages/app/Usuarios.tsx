import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Loader2, Pencil, Search, UserPlus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { ok, toastErro } from "@/lib/erros";
import { data, dataHora } from "@/lib/formato";
import { PAPEIS, rotulo } from "@/lib/rotulos";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Cabecalho } from "@/components/comum/Cabecalho";
import { Carregando, ErroCarga, Vazio } from "@/components/comum/Estados";
import { Pilula } from "@/components/comum/Selos";
import { useParceirosResumo } from "@/components/comum/ParceiroBusca";
import { ConvidarUsuarioDialog } from "@/components/usuarios/ConvidarUsuarioDialog";
import { EditarUsuarioDialog, type UsuarioLinha } from "@/components/usuarios/EditarUsuarioDialog";

type Perfil = UsuarioLinha & { created_at: string; empresa: { nome: string } | null; parceiro: { nome_fantasia: string } | null };
type Convite = {
  email: string; nome: string | null; papel: string; created_at: string; is_diretor: boolean; is_responsavel_parceiro: boolean;
  empresa: { nome: string } | null; parceiro: { nome_fantasia: string } | null;
};
type Historico = { id: number; registro_id: string; campo: string; valor_anterior: string | null; valor_novo: string | null; autor_id: string | null; created_at: string };

const CAMPOS_HISTORICO: Record<string, string> = {
  criado: "Acesso criado", email: "E-mail", papel: "Papel", ativo: "Ativo", is_diretor: "Diretor",
  is_responsavel_parceiro: "Responsável do parceiro", parceiro_id: "Parceiro",
};

// Usuários e acessos (FR-001, FR-007, FR-072). Admin gere tudo; parcerias convida e desativa usuários de parceiros.
export default function Usuarios() {
  const { isAdmin, isParcerias, perfil } = useAuth();
  const qc = useQueryClient();
  const [busca, setBusca] = useState("");
  const [convidando, setConvidando] = useState(false);
  const [editando, setEditando] = useState<UsuarioLinha | null>(null);
  const [alterando, setAlterando] = useState<string | null>(null);
  const { data: parceiros = [] } = useParceirosResumo();

  const perfisQ = useQuery({
    enabled: isParcerias,
    queryKey: ["usuarios"],
    queryFn: async () => ok<any>(await supabase.from("perfis")
      .select("id, nome, email, papel, empresa_grupo_id, parceiro_id, is_diretor, is_responsavel_parceiro, ativo, created_at, empresa:empresas_grupo(nome), parceiro:parceiros!perfis_parceiro_fk(nome_fantasia)")
      .order("nome")) as Perfil[],
  });
  const convitesQ = useQuery({
    enabled: isParcerias,
    queryKey: ["convites"],
    queryFn: async () => ok<any>(await supabase.from("convites")
      .select("email, nome, papel, created_at, is_diretor, is_responsavel_parceiro, empresa:empresas_grupo(nome), parceiro:parceiros!convites_parceiro_fk(nome_fantasia)")
      .order("created_at", { ascending: false })) as Convite[],
  });
  const historicoQ = useQuery({
    enabled: isParcerias,
    queryKey: ["historico-acessos"],
    queryFn: async () => ok<any>(await supabase.from("historico").select("id, registro_id, campo, valor_anterior, valor_novo, autor_id, created_at")
      .eq("tabela", "perfis").order("created_at", { ascending: false }).limit(300)) as Historico[],
  });

  const nomePerfil = useMemo(() => new Map((perfisQ.data ?? []).map((p) => [p.id, p.nome || p.email])), [perfisQ.data]);
  const nomeParceiro = useMemo(() => new Map(parceiros.map((p) => [p.id, p.nome_fantasia])), [parceiros]);

  if (!isParcerias) return <Vazio titulo="Acesso restrito">Só administradores e o time de parcerias gerenciam usuários.</Vazio>;

  const termo = busca.trim().toLowerCase();
  const filtrar = (p: Perfil) => !termo || `${p.nome} ${p.email} ${p.parceiro?.nome_fantasia ?? ""}`.toLowerCase().includes(termo);
  const internos = (perfisQ.data ?? []).filter((p) => p.papel !== "parceiro" && filtrar(p));
  const deParceiros = (perfisQ.data ?? []).filter((p) => p.papel === "parceiro" && filtrar(p));
  const recarregar = () => {
    qc.invalidateQueries({ queryKey: ["usuarios"] });
    qc.invalidateQueries({ queryKey: ["convites"] });
    qc.invalidateQueries({ queryKey: ["historico-acessos"] });
  };

  async function definirAcesso(p: Perfil, ativo: boolean) {
    setAlterando(p.id);
    try {
      const { error } = await supabase.rpc("definir_acesso_usuario_parceiro", { p_perfil: p.id, p_ativo: ativo });
      if (error) throw error;
      toast.success(ativo ? "Acesso reativado." : "Acesso desativado. O histórico é mantido.");
      recarregar();
    } catch (e) {
      toastErro(e);
    } finally {
      setAlterando(null);
    }
  }

  function valorHistorico(campo: string, v: string | null) {
    if (v === null) return "vazio";
    if (campo === "papel") return rotulo(PAPEIS, v);
    if (v === "true") return "Sim";
    if (v === "false") return "Não";
    if (campo === "parceiro_id") return nomeParceiro.get(v) ?? v;
    return v;
  }

  function Cartao({ p }: { p: Perfil }) {
    return (
      <li className="flex flex-col gap-3 rounded-[14px] border border-white/10 bg-card p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-semibold">{p.nome || p.email}</p>
            <Pilula tom="info">{rotulo(PAPEIS, p.papel)}</Pilula>
            {p.is_diretor && <Pilula tom="menta">Diretor</Pilula>}
            {p.is_responsavel_parceiro && <Pilula tom="menta">Responsável do parceiro</Pilula>}
            {!p.ativo && <Pilula tom="perigo">Inativo</Pilula>}
          </div>
          <p className="break-all text-sm text-muted-foreground">
            {p.email} · {p.papel === "parceiro" ? p.parceiro?.nome_fantasia : p.empresa?.nome ?? "Sem empresa"} · desde {data(p.created_at)}
          </p>
        </div>
        <div className="flex shrink-0 gap-2">
          {isAdmin && <Button size="sm" variant="outline" onClick={() => setEditando(p)}><Pencil /> Editar</Button>}
          {!isAdmin && p.papel === "parceiro" && p.id !== perfil?.id && (
            <Button size="sm" variant="outline" disabled={alterando === p.id} onClick={() => definirAcesso(p, !p.ativo)}>
              {alterando === p.id && <Loader2 className="animate-spin" />} {p.ativo ? "Desativar" : "Reativar"}
            </Button>
          )}
        </div>
      </li>
    );
  }

  return (
    <div>
      <Cabecalho titulo="Usuários" descricao={isAdmin ? "Acessos internos e de parceiros." : "Você pode convidar e desativar usuários de parceiros."}
        acoes={<Button onClick={() => setConvidando(true)}><UserPlus /> Convidar</Button>} />
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input className="pl-9" placeholder="Buscar por nome, e-mail ou parceiro" value={busca} onChange={(e) => setBusca(e.target.value)} />
      </div>
      {perfisQ.isLoading ? <Carregando /> : perfisQ.error ? <ErroCarga erro={perfisQ.error} /> : (
        <Tabs defaultValue="internos">
          <TabsList className="mb-4 h-auto flex-wrap justify-start">
            <TabsTrigger value="internos">Internos ({internos.length})</TabsTrigger>
            <TabsTrigger value="parceiros">Parceiros ({deParceiros.length})</TabsTrigger>
            <TabsTrigger value="convites">Convites pendentes ({convitesQ.data?.length ?? 0})</TabsTrigger>
            <TabsTrigger value="historico">Histórico de acesso</TabsTrigger>
          </TabsList>
          <TabsContent value="internos">
            {internos.length ? <ul className="grid gap-3">{internos.map((p) => <Cartao key={p.id} p={p} />)}</ul> : <Vazio titulo="Nenhum usuário interno" />}
          </TabsContent>
          <TabsContent value="parceiros">
            {deParceiros.length ? <ul className="grid gap-3">{deParceiros.map((p) => <Cartao key={p.id} p={p} />)}</ul> : <Vazio titulo="Nenhum usuário de parceiro" />}
          </TabsContent>
          <TabsContent value="convites">
            {!convitesQ.data?.length ? <Vazio titulo="Nenhum convite pendente">O convite some daqui quando a pessoa entra pela primeira vez.</Vazio> : (
              <ul className="grid gap-2">
                {convitesQ.data.map((c) => (
                  <li key={c.email} className="rounded-[14px] border border-white/10 bg-card p-3 text-sm">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-semibold">{c.nome ?? c.email}</span>
                      <Pilula tom="info">{rotulo(PAPEIS, c.papel)}</Pilula>
                      {c.is_diretor && <Pilula tom="menta">Diretor</Pilula>}
                      {c.is_responsavel_parceiro && <Pilula tom="menta">Responsável do parceiro</Pilula>}
                    </div>
                    <p className="break-all text-muted-foreground">
                      {c.email} · {c.parceiro?.nome_fantasia ?? c.empresa?.nome ?? ""} · convidado em {data(c.created_at)}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </TabsContent>
          <TabsContent value="historico">
            {historicoQ.isLoading ? <Carregando /> : !historicoQ.data?.length ? <Vazio titulo="Sem registros" /> : (
              <ul className="divide-y divide-white/5 rounded-[14px] border border-white/10 bg-card">
                {historicoQ.data.map((h) => (
                  <li key={h.id} className="px-4 py-3 text-sm">
                    <p>
                      <span className="font-semibold">{nomePerfil.get(h.registro_id) ?? "Usuário"}</span>
                      <span className="text-muted-foreground"> · {CAMPOS_HISTORICO[h.campo] ?? h.campo}: </span>
                      {h.campo === "criado" ? valorHistorico("email", h.valor_novo) : (
                        <>{valorHistorico(h.campo, h.valor_anterior)} para {valorHistorico(h.campo, h.valor_novo)}</>
                      )}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {dataHora(h.created_at)} · por {h.autor_id ? nomePerfil.get(h.autor_id) ?? "usuário" : "sistema"}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </TabsContent>
        </Tabs>
      )}
      <ConvidarUsuarioDialog aberto={convidando} onClose={() => setConvidando(false)} onConvidado={recarregar} />
      <EditarUsuarioDialog usuario={editando} onClose={() => setEditando(null)} onSalvo={recarregar} />
    </div>
  );
}
