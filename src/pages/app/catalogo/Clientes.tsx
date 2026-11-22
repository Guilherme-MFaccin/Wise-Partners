import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Copy, KeyRound, Loader2, MessageCircle, Plus, UserMinus } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Cabecalho } from "@/components/comum/Cabecalho";
import { Carregando, ErroCarga, Vazio } from "@/components/comum/Estados";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { convidarUsuario } from "@/lib/convite";
import { toastErro } from "@/lib/erros";
import { formatarCnpj, somenteDigitos } from "@/lib/formato";
import { gerarSenha } from "@/lib/senha";

// Clientes do Grupo Tríade no catálogo (FO-19): a CS da Tríade e os consultores da Wise cadastram a empresa cliente,
// criam o acesso (senha provisória) e mandam a mensagem com os benefícios. A empresa vê o catálogo e também pode oferecer.
type Cliente = {
  id: string; nome_fantasia: string; cnpj: string | null; tipo_parceria: string;
  empresa: { nome: string } | null; consultor: { nome: string } | null; usuarios: { id: string; nome: string; email: string; ativo: boolean }[];
};

export default function ClientesGrupo() {
  const { perfil } = useAuth();
  const pode = !!perfil && ["admin", "parcerias", "consultor", "comercial"].includes(perfil.papel);
  const qc = useQueryClient();
  const [novo, setNovo] = useState(false);
  const [acessoPara, setAcessoPara] = useState<Cliente | null>(null);
  const [mensagem, setMensagem] = useState<{ nome: string; texto: string; whatsapp?: string } | null>(null);
  const lista = useQuery({
    queryKey: ["clientes-grupo"],
    enabled: pode,
    queryFn: async () => {
      const { data, error } = await (supabase.from("parceiros" as any) as any)
        .select("id, nome_fantasia, cnpj, tipo_parceria, empresa:empresas_grupo!parceiros_empresa_grupo_cliente_id_fkey(nome), consultor:perfis!parceiros_consultor_cliente_id_fkey(nome), usuarios:perfis!perfis_parceiro_fk(id, nome, email, ativo)")
        .eq("cliente_grupo", true).order("nome_fantasia");
      if (error) throw error;
      return (data ?? []) as unknown as Cliente[];
    },
  });
  const encerrar = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.rpc("encerrar_cliente_grupo" as any, { p_parceiro: id });
      if (error) throw error;
    },
    onSuccess: () => { toast.success("A empresa saiu do catálogo como cliente do grupo."); qc.invalidateQueries({ queryKey: ["clientes-grupo"] }); },
    onError: toastErro,
  });

  if (!pode) return (<div><Cabecalho titulo="Clientes do grupo" /><Vazio titulo="Sem permissão">Esta tela é do time da Wise e da CS da Tríade.</Vazio></div>);
  const clientes = lista.data ?? [];
  return (
    <div>
      <Cabecalho titulo="Clientes do grupo"
        descricao="Quais clientes do Grupo Tríade já entraram no catálogo de parceiros e quem ainda precisa do acesso?"
        acoes={<Button onClick={() => setNovo(true)}><Plus /> Cadastrar cliente</Button>} />
      {lista.isLoading && <Carregando />}
      {lista.error && <ErroCarga erro={lista.error} />}
      {lista.isSuccess && clientes.length === 0 && <Vazio titulo="Nenhum cliente do grupo ainda">Cadastre a empresa, crie o acesso e mande a mensagem com os benefícios.</Vazio>}
      <ul className="space-y-3">
        {clientes.map((c) => {
          const ativos = c.usuarios.filter((u) => u.ativo);
          return (
            <li key={c.id} className="rounded-[14px] border border-white/10 bg-card p-4 sm:p-5">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <p className="font-semibold">{c.nome_fantasia}</p>
                  <p className="text-sm text-neutro-300">
                    {c.cnpj ? formatarCnpj(c.cnpj) : "Sem CNPJ"} · cliente {c.empresa?.nome ?? "do grupo"}{c.consultor ? ` · ${c.consultor.nome}` : ""}
                    {c.tipo_parceria !== "cliente" ? " · também é parceiro do programa" : ""}
                  </p>
                  <p className="mt-1 text-sm">{ativos.length ? ativos.map((u) => `${u.nome} (${u.email})`).join(", ") : <span className="text-warning">Ainda sem acesso</span>}</p>
                </div>
                <div className="flex shrink-0 flex-wrap gap-2">
                  <Button size="sm" variant={ativos.length ? "outline" : "default"} onClick={() => setAcessoPara(c)}><KeyRound /> {ativos.length ? "Novo acesso" : "Criar acesso"}</Button>
                  <Button size="sm" variant="ghost" className="text-red-300 hover:text-red-200" disabled={encerrar.isPending}
                    onClick={() => window.confirm(`Tirar ${c.nome_fantasia} do catálogo como cliente do grupo? O acesso continua se a empresa também for parceira.`) && encerrar.mutate(c.id)}>
                    <UserMinus /> Encerrar
                  </Button>
                </div>
              </div>
            </li>
          );
        })}
      </ul>
      <NovoCliente aberto={novo} fechar={() => setNovo(false)} />
      <NovoAcesso cliente={acessoPara} fechar={() => setAcessoPara(null)} aoCriar={(m) => { setAcessoPara(null); setMensagem(m); qc.invalidateQueries({ queryKey: ["clientes-grupo"] }); }} />
      <Dialog open={!!mensagem} onOpenChange={(v) => !v && setMensagem(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Acesso criado</DialogTitle>
            <DialogDescription>Mande a mensagem abaixo para {mensagem?.nome}. A senha não fica guardada: copie antes de fechar.</DialogDescription>
          </DialogHeader>
          <p className="whitespace-pre-line break-words rounded-[10px] border border-white/10 bg-white/5 p-3 text-sm">{mensagem?.texto}</p>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => { navigator.clipboard?.writeText(mensagem?.texto ?? ""); toast.success("Mensagem copiada."); }}><Copy /> Copiar</Button>
            <Button asChild><a href={`https://wa.me/${mensagem?.whatsapp ?? ""}?text=${encodeURIComponent(mensagem?.texto ?? "")}`} target="_blank" rel="noreferrer"><MessageCircle /> Enviar pelo WhatsApp</a></Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function NovoCliente({ aberto, fechar }: { aberto: boolean; fechar: () => void }) {
  const qc = useQueryClient();
  const { perfil } = useAuth();
  const [f, setF] = useState({ nome: "", cnpj: "", site: "", empresa_grupo_id: "" });
  const empresas = useQuery({
    queryKey: ["empresas-grupo"], staleTime: 60 * 60_000,
    queryFn: async () => {
      const { data, error } = await supabase.from("empresas_grupo").select("id, nome, codigo").order("nome");
      if (error) throw error;
      return (data ?? []) as { id: string; nome: string; codigo: string }[];
    },
  });
  const criar = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.rpc("cadastrar_cliente_grupo" as any, { p: { ...f, cnpj: somenteDigitos(f.cnpj), consultor_id: perfil?.id } });
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Cliente cadastrado. Agora crie o acesso."); qc.invalidateQueries({ queryKey: ["clientes-grupo"] }); setF({ nome: "", cnpj: "", site: "", empresa_grupo_id: "" }); fechar(); },
    onError: toastErro,
  });
  const valido = f.nome.trim() && somenteDigitos(f.cnpj).length === 14 && f.empresa_grupo_id;
  return (
    <Dialog open={aberto} onOpenChange={(v) => !v && fechar()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Cadastrar cliente do grupo</DialogTitle>
          <DialogDescription>Se a empresa já for parceira do programa, ela ganha também o papel de cliente, com o mesmo login.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5 sm:col-span-2"><Label htmlFor="cg-nome">Empresa</Label><Input id="cg-nome" value={f.nome} onChange={(e) => setF({ ...f, nome: e.target.value })} /></div>
          <div className="space-y-1.5"><Label htmlFor="cg-cnpj">CNPJ</Label><Input id="cg-cnpj" inputMode="numeric" value={f.cnpj} onChange={(e) => setF({ ...f, cnpj: e.target.value })} placeholder="00.000.000/0000-00" /></div>
          <div className="space-y-1.5">
            <Label htmlFor="cg-emp">Cliente de qual empresa do grupo</Label>
            <Select value={f.empresa_grupo_id} onValueChange={(v) => setF({ ...f, empresa_grupo_id: v })}>
              <SelectTrigger id="cg-emp"><SelectValue placeholder="Escolher" /></SelectTrigger>
              <SelectContent>{(empresas.data ?? []).map((e) => <SelectItem key={e.id} value={e.id}>{e.nome}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5 sm:col-span-2"><Label htmlFor="cg-site">Site (opcional)</Label><Input id="cg-site" value={f.site} onChange={(e) => setF({ ...f, site: e.target.value })} /></div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={fechar}>Cancelar</Button>
          <Button disabled={!valido || criar.isPending} onClick={() => criar.mutate()}>{criar.isPending && <Loader2 className="animate-spin" />}Cadastrar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function NovoAcesso({ cliente, fechar, aoCriar }: { cliente: Cliente | null; fechar: () => void; aoCriar: (m: { nome: string; texto: string; whatsapp?: string }) => void }) {
  const [f, setF] = useState({ nome: "", email: "", whatsapp: "" });
  const [enviando, setEnviando] = useState(false);
  async function criar() {
    if (!cliente) return;
    setEnviando(true);
    const senha = gerarSenha(10);
    try {
      await convidarUsuario({ email: f.email.trim().toLowerCase(), nome: f.nome.trim(), papel: "parceiro", parceiro_id: cliente.id, is_responsavel_parceiro: cliente.usuarios.length === 0, senha });
      const portal = window.location.origin;
      const primeiro = f.nome.trim().split(" ")[0];
      aoCriar({
        nome: f.nome.trim(), whatsapp: (() => { const d = somenteDigitos(f.whatsapp); return d ? (d.length <= 11 ? "55" + d : d) : undefined; })(),
        texto: `${primeiro}, a ${cliente.nome_fantasia} agora faz parte do ecossistema de parceiros do Grupo Tríade. No Catálogo de parceiros você encontra empresas que atendem indústrias, com condições especiais só para clientes do grupo, e também pode oferecer os produtos e serviços da sua empresa aos outros membros.\n\nEntre em ${portal}/entrar com o e-mail ${f.email.trim().toLowerCase()} e a senha provisória ${senha}. No primeiro acesso, o portal pede para você criar uma senha sua.`,
      });
      setF({ nome: "", email: "", whatsapp: "" });
    } catch (e) { toastErro(e); } finally { setEnviando(false); }
  }
  const valido = f.nome.trim() && /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(f.email.trim());
  return (
    <Dialog open={!!cliente} onOpenChange={(v) => !v && fechar()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Acesso para {cliente?.nome_fantasia}</DialogTitle>
          <DialogDescription>O portal cria a conta com senha provisória e monta a mensagem para você mandar ao cliente.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5 sm:col-span-2"><Label htmlFor="na-nome">Nome da pessoa</Label><Input id="na-nome" value={f.nome} onChange={(e) => setF({ ...f, nome: e.target.value })} /></div>
          <div className="space-y-1.5"><Label htmlFor="na-email">E-mail</Label><Input id="na-email" type="email" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} /></div>
          <div className="space-y-1.5"><Label htmlFor="na-wpp">WhatsApp (opcional)</Label><Input id="na-wpp" type="tel" value={f.whatsapp} onChange={(e) => setF({ ...f, whatsapp: e.target.value })} /></div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={fechar}>Cancelar</Button>
          <Button disabled={!valido || enviando} onClick={criar}>{enviando && <Loader2 className="animate-spin" />}Criar acesso</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
