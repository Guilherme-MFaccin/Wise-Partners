import { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { CalendarDays, CheckCircle2, Copy, Loader2, MessageCircle, UserCheck } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { ok, toastErro } from "@/lib/erros";
import { convidarUsuario } from "@/lib/convite";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Carregando, ErroCarga } from "@/components/comum/Estados";

type Cadastro = {
  id: string; created_at: string; parceiro_id: string | null; empresa: string; nome: string; email: string; whatsapp: string; cargo: string | null;
  site: string | null; categoria_nome: string | null; clientes_ativos: number | null; utm_campaign: string | null; utm_content: string | null;
  status: string; observacao: string | null; aprovado_em: string | null;
};

const NA_FILA = ["fila", "contatado", "reuniao_marcada"];
const SITUACAO: Record<string, string> = {
  fila: "Na fila", contatado: "Contatado", reuniao_marcada: "Reunião marcada", descartado: "Descartado",
  aprovado: "Aprovado", criado: "Acesso criado na hora", falhou: "Falhou",
};
const data = (s: string) => new Date(s).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" }).replace(".", "");
const primeiroNome = (n: string) => n.trim().split(/\s+/)[0];

function linkWhats(numero: string, texto: string) {
  const d = numero.replace(/\D/g, "");
  const fone = d.length === 10 || d.length === 11 ? `55${d}` : d;
  return `https://wa.me/${fone}?text=${encodeURIComponent(texto)}`;
}

function senhaProvisoria() {
  const letras = "abcdefghjkmnpqrstuvwxyzABCDEFGHJKMNPQRSTUVWXYZ23456789";
  const v = new Uint32Array(10);
  crypto.getRandomValues(v);
  return Array.from(v, (n) => letras[n % letras.length]).join("");
}

async function copiar(texto: string) {
  try {
    await navigator.clipboard.writeText(texto);
    toast.success("Mensagem copiada.");
  } catch {
    toast.error("Não foi possível copiar. Selecione o texto e copie manualmente.");
  }
}

// Fila de espera dos parceiros que se cadastraram pela landing page (pedido do Igor, 07/11/2026):
// o Igor fala com cada um pelo WhatsApp, manda o link da agenda e, depois da conversa, aprova e cria o acesso.
export function FilaParceiros({ agendaUrl }: { agendaUrl: string | null }) {
  const qc = useQueryClient();
  const [aprovar, setAprovar] = useState<Cadastro | null>(null);
  const [aprovando, setAprovando] = useState(false);
  const [acesso, setAcesso] = useState<{ nome: string; email: string; whatsapp: string; senha: string; parceiro_id: string; erro?: string } | null>(null);
  const [verHistorico, setVerHistorico] = useState(false);

  const cad = useQuery({
    queryKey: ["config", "landing", "cadastros"],
    queryFn: async () => ok<any>(await supabase.from("cadastros_landing")
      .select("id, created_at, parceiro_id, empresa, nome, email, whatsapp, cargo, site, categoria_nome, clientes_ativos, utm_campaign, utm_content, status, observacao, aprovado_em")
      .order("created_at", { ascending: false }).limit(300)) as Cadastro[],
  });
  const recarregar = () => qc.invalidateQueries({ queryKey: ["config", "landing", "cadastros"] });

  async function mudar(id: string, campos: Partial<Pick<Cadastro, "status" | "observacao">>) {
    const { error } = await supabase.from("cadastros_landing").update({ ...campos, atualizado_em: new Date().toISOString() }).eq("id", id);
    if (error) return toastErro(error);
    recarregar();
  }

  async function confirmarAprovacao() {
    if (!aprovar) return;
    setAprovando(true);
    const c = aprovar;
    const { data: r, error } = await supabase.rpc("aprovar_cadastro_landing", { p_id: c.id });
    if (error) {
      setAprovando(false);
      return toastErro(error);
    }
    const senha = senhaProvisoria();
    const parceiroId = (r as { parceiro_id: string }).parceiro_id;
    try {
      await convidarUsuario({ email: c.email, nome: c.nome, papel: "parceiro", parceiro_id: parceiroId, is_responsavel_parceiro: true, senha });
      setAcesso({ nome: c.nome, email: c.email, whatsapp: c.whatsapp, senha, parceiro_id: parceiroId });
    } catch (e) {
      setAcesso({ nome: c.nome, email: c.email, whatsapp: c.whatsapp, senha: "", parceiro_id: parceiroId, erro: e instanceof Error ? e.message : String(e) });
    }
    setAprovando(false);
    setAprovar(null);
    recarregar();
  }

  if (cad.isLoading) return <Carregando />;
  if (cad.error) return <ErroCarga erro={cad.error} />;
  const lista = cad.data ?? [];
  const fila = lista.filter((c) => NA_FILA.includes(c.status));
  const historico = lista.filter((c) => !NA_FILA.includes(c.status));
  const portal = window.location.origin;

  const msgContato = (c: Cadastro) =>
    `Oi, ${primeiroNome(c.nome)}! Aqui é o Igor, diretor da Wise Makers. Vi que a ${c.empresa} se cadastrou no Programa Wise Partners. Posso te explicar rapidinho como funciona?`;
  const msgAgenda = (c: Cadastro) =>
    `${primeiroNome(c.nome)}, escolhe aqui o melhor horário pra gente conversar sobre o Wise Partners: ${agendaUrl}`;
  const msgAcesso = (a: NonNullable<typeof acesso>) =>
    `${primeiroNome(a.nome)}, seu acesso ao Portal Wise Partners está pronto! Entre em ${portal}/entrar com o e-mail ${a.email} e a senha provisória ${a.senha}. No primeiro acesso, o portal pede pra você criar uma senha sua. Lá você encontra o seu link, a mensagem pronta e o treinamento.`;

  return (
    <div className="space-y-4">
      {!fila.length ? (
        <p className="text-sm text-neutro-300">Ninguém na fila agora. Cada cadastro feito na página aparece aqui, e os administradores recebem um aviso no portal.</p>
      ) : (
        <div className="overflow-x-auto">
          <Table className="text-[13px]">
            <TableHeader>
              <TableRow>
                <TableHead>Data</TableHead><TableHead>Empresa</TableHead><TableHead>Contato</TableHead><TableHead>Origem</TableHead>
                <TableHead>Situação</TableHead><TableHead>Observação</TableHead><TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {fila.map((c) => (
                <TableRow key={c.id} className="align-top">
                  <TableCell className="whitespace-nowrap tabular-nums">{data(c.created_at)}</TableCell>
                  <TableCell className="min-w-[170px]">
                    <span className="font-medium">{c.empresa}</span>
                    <span className="block text-xs text-neutro-300">{c.categoria_nome ?? "Sem tipo"} · {c.clientes_ativos ?? "?"} clientes</span>
                    {c.site && <span className="block text-xs text-neutro-300">{c.site}</span>}
                  </TableCell>
                  <TableCell className="min-w-[170px]">
                    {c.nome}{c.cargo && <span className="block text-xs text-neutro-300">{c.cargo}</span>}
                    <span className="block text-xs text-neutro-300">{c.whatsapp}</span>
                    <span className="block break-all text-xs text-neutro-300">{c.email}</span>
                  </TableCell>
                  <TableCell className="text-xs text-neutro-300">{c.utm_campaign ?? "Sem campanha"}<span className="block">{c.utm_content ?? "Sem anúncio"}</span></TableCell>
                  <TableCell className="min-w-[150px]">
                    <Select value={c.status} onValueChange={(v) => mudar(c.id, { status: v })}>
                      <SelectTrigger className="h-8 text-xs" aria-label={`Situação de ${c.empresa}`}><SelectValue /></SelectTrigger>
                      <SelectContent>{["fila", "contatado", "reuniao_marcada", "descartado"].map((k) => <SelectItem key={k} value={k}>{SITUACAO[k]}</SelectItem>)}</SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell className="min-w-[180px]">
                    <Textarea defaultValue={c.observacao ?? ""} rows={2} className="min-h-[56px] text-xs" aria-label={`Observação sobre ${c.empresa}`}
                      onBlur={(e) => e.target.value !== (c.observacao ?? "") && mudar(c.id, { observacao: e.target.value.trim() || null })} />
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col items-end gap-1.5">
                      <Button asChild size="sm" variant="outline" className="h-8 w-full justify-start text-xs">
                        <a href={linkWhats(c.whatsapp, msgContato(c))} target="_blank" rel="noreferrer"
                          onClick={() => c.status === "fila" && mudar(c.id, { status: "contatado" })}><MessageCircle className="h-3.5 w-3.5" /> Chamar no WhatsApp</a>
                      </Button>
                      {agendaUrl && (
                        <Button asChild size="sm" variant="outline" className="h-8 w-full justify-start text-xs">
                          <a href={linkWhats(c.whatsapp, msgAgenda(c))} target="_blank" rel="noreferrer"><CalendarDays className="h-3.5 w-3.5" /> Mandar a agenda</a>
                        </Button>
                      )}
                      <Button size="sm" className="h-8 w-full justify-start text-xs" onClick={() => setAprovar(c)}><UserCheck className="h-3.5 w-3.5" /> Aprovar e criar acesso</Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {!agendaUrl && <p className="text-xs text-neutro-300">Para aparecer o botão "Mandar a agenda", cole o link da sua agenda do Google no campo "Agenda para os parceiros", acima.</p>}

      {historico.length > 0 && (
        <div>
          <Button variant="ghost" size="sm" onClick={() => setVerHistorico((v) => !v)}>{verHistorico ? "Esconder" : "Ver"} os {historico.length} já resolvidos</Button>
          {verHistorico && (
            <div className="mt-2 overflow-x-auto">
              <Table className="text-[13px]">
                <TableHeader><TableRow><TableHead>Data</TableHead><TableHead>Empresa</TableHead><TableHead>Contato</TableHead><TableHead>Origem</TableHead><TableHead>Situação</TableHead></TableRow></TableHeader>
                <TableBody>
                  {historico.map((c) => (
                    <TableRow key={c.id}>
                      <TableCell className="whitespace-nowrap tabular-nums">{data(c.created_at)}</TableCell>
                      <TableCell>{c.parceiro_id ? <Link className="text-menta-300 hover:underline" to={`/app/parceiros/${c.parceiro_id}`}>{c.empresa}</Link> : c.empresa}</TableCell>
                      <TableCell>{c.nome}<span className="block text-xs text-neutro-300">{c.email}</span></TableCell>
                      <TableCell className="text-xs text-neutro-300">{c.utm_campaign ?? "Sem campanha"}<span className="block">{c.utm_content ?? "Sem anúncio"}</span></TableCell>
                      <TableCell className={c.status === "falhou" ? "text-destructive" : ""}>{SITUACAO[c.status] ?? c.status}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
      )}

      <Dialog open={!!aprovar} onOpenChange={(v) => !v && !aprovando && setAprovar(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Aprovar {aprovar?.empresa}?</DialogTitle>
            <DialogDescription>
              Cria o parceiro no portal (nível C, pacote Prateleira, em onboarding, com o aceite do termo feito na página) e uma conta para {aprovar?.nome} com senha provisória. A senha aparece na próxima tela, para você mandar pelo WhatsApp.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAprovar(null)} disabled={aprovando}>Cancelar</Button>
            <Button onClick={confirmarAprovacao} disabled={aprovando}>{aprovando ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Aprovando...</> : "Aprovar e criar acesso"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!acesso} onOpenChange={(v) => !v && setAcesso(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {acesso?.erro ? "Parceiro criado, sem acesso" : <><CheckCircle2 className="h-5 w-5 text-menta-400" /> Acesso criado</>}
            </DialogTitle>
            <DialogDescription>
              {acesso?.erro
                ? `O parceiro foi criado, mas a conta não: ${acesso.erro} Crie o acesso pela ficha do parceiro, em Usuários.`
                : "Mande a mensagem abaixo pelo WhatsApp. A senha não fica guardada em lugar nenhum: se fechar esta janela sem copiar, gere outra pela ficha do parceiro."}
            </DialogDescription>
          </DialogHeader>
          {acesso && !acesso.erro && (
            <>
              <p className="whitespace-pre-line rounded-[10px] border border-white/10 bg-white/5 p-3 text-sm">{msgAcesso(acesso)}</p>
              <div className="flex flex-wrap gap-2">
                <Button asChild><a href={linkWhats(acesso.whatsapp, msgAcesso(acesso))} target="_blank" rel="noreferrer"><MessageCircle /> Enviar pelo WhatsApp</a></Button>
                <Button variant="outline" onClick={() => copiar(msgAcesso(acesso))}><Copy /> Copiar mensagem</Button>
              </div>
            </>
          )}
          <DialogFooter>
            {acesso && <Button asChild variant="ghost"><Link to={`/app/parceiros/${acesso.parceiro_id}`}>Abrir a ficha do parceiro</Link></Button>}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
