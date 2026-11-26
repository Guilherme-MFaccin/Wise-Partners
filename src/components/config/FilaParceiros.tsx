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
import { Pilula } from "@/components/comum/Selos";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useAuth } from "@/hooks/useAuth";

type Cadastro = {
  id: string; created_at: string; parceiro_id: string | null; empresa: string; nome: string; email: string; whatsapp: string; cargo: string | null;
  site: string | null; origem?: string | null; categoria_nome: string | null; clientes_ativos: number | null; utm_campaign: string | null; utm_content: string | null;
  status: string; observacao: string | null; aprovado_em: string | null;
  cliente_grupo?: boolean; empresas_grupo?: string[]; interesses?: string[]; segmento?: string | null; cidade?: string | null; uf?: string | null;
  vendedores?: number | null; termo_versao?: string | null;
};
type Perfil = "cliente_grupo" | "parceiro" | "comunidade";
type Modo = "cliente" | "comunidade" | "parceiro";
// Perfil que a empresa declarou no cadastro (o mesmo critério de perfil_cadastro no banco)
const perfilDe = (c: Cadastro): Perfil => c.cliente_grupo ? "cliente_grupo"
  : (c.interesses ?? []).includes("ser_parceiro") || !(c.interesses ?? []).length ? "parceiro" : "comunidade";
const INTERESSE: Record<string, string> = {
  comprar: "usar condições", oferecer: "oferecer", indicar: "indicar a Wise", conhecer_consultoria: "conhecer a consultoria", ser_parceiro: "ser parceiro",
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

// Fila de cadastros da página do portal (entrada única, 26/11/2026): qualquer empresa se cadastra e o gerente da comunidade
// confere quem é. Cliente do grupo e empresa da comunidade: confere e adiciona. Parceiro: WhatsApp, agenda e conversa de entrada.
export function FilaParceiros({ agendaUrl }: { agendaUrl: string | null }) {
  const { perfil } = useAuth();
  const qc = useQueryClient();
  const [aprovar, setAprovar] = useState<Cadastro | null>(null);
  const [aprovando, setAprovando] = useState(false);
  const [acesso, setAcesso] = useState<{ nome: string; email: string; whatsapp: string; senha: string; parceiro_id: string; erro?: string; jaTinha?: boolean } | null>(null);
  const [verHistorico, setVerHistorico] = useState(false);
  const [modo, setModo] = useState<Modo>("parceiro");
  const [empresaGrupo, setEmpresaGrupo] = useState("");
  const [tipoAcesso, setTipoAcesso] = useState<Modo>("parceiro");
  const grupoQ = useQuery({
    queryKey: ["empresas-grupo", "nomes"],
    queryFn: async () => ok<any>(await supabase.from("empresas_grupo").select("id, nome").order("ordem")) as { id: string; nome: string }[],
  });
  const nomeGrupo = (ids?: string[]) => (ids ?? []).map((id) => grupoQ.data?.find((g) => g.id === id)?.nome).filter(Boolean).join(" e ");
  function abrirAprovacao(c: Cadastro) {
    const p = perfilDe(c);
    setModo(p === "cliente_grupo" ? "cliente" : p === "comunidade" ? "comunidade" : "parceiro");
    setEmpresaGrupo(c.empresas_grupo?.[0] ?? "");
    setAprovar(c);
  }

  const cad = useQuery({
    queryKey: ["config", "landing", "cadastros"],
    queryFn: async () => ok<any>(await supabase.from("cadastros_landing")
      .select("id, created_at, parceiro_id, empresa, nome, email, whatsapp, cargo, site, categoria_nome, clientes_ativos, utm_campaign, utm_content, status, observacao, aprovado_em, origem, cliente_grupo, empresas_grupo, interesses, segmento, cidade, uf, vendedores, termo_versao")
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
    setTipoAcesso(modo);
    const { data: r, error } = modo === "parceiro"
      ? await supabase.rpc("aprovar_cadastro_landing", { p_id: c.id })
      : await supabase.rpc("aprovar_cadastro_comunidade" as any, { p_id: c.id, p_cliente_grupo: modo === "cliente", p_empresa_grupo: modo === "cliente" ? empresaGrupo : null });
    if (error) {
      setAprovando(false);
      return toastErro(error);
    }
    const senha = senhaProvisoria();
    const parceiroId = (r as { parceiro_id: string }).parceiro_id;
    // Empresa que já era da Comunidade Wise Partners: a conta existe e passa a abrir a área do parceiro
    if ((r as { ja_tem_acesso?: boolean }).ja_tem_acesso) {
      setAcesso({ nome: c.nome, email: c.email, whatsapp: c.whatsapp, senha: "", parceiro_id: parceiroId, jaTinha: true });
      setAprovando(false);
      setAprovar(null);
      recarregar();
      return;
    }
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
  const quem = perfil?.nome ? primeiroNome(perfil.nome) : "a equipe";

  const msgContato = (c: Cadastro) => perfilDe(c) === "parceiro"
    ? `Oi, ${primeiroNome(c.nome)}! Aqui é ${quem}, da Wise Makers. Vi que a ${c.empresa} se cadastrou no Programa Wise Partners. Posso te explicar rapidinho como funciona?`
    : `Oi, ${primeiroNome(c.nome)}! Aqui é ${quem}, da Wise Makers. Recebi o cadastro da ${c.empresa} no Wise Partners. Vou conferir e já te mando o acesso à Comunidade Wise Partners.`;
  const msgAgenda = (c: Cadastro) =>
    `${primeiroNome(c.nome)}, escolhe aqui o melhor horário pra gente conversar sobre o Wise Partners: ${agendaUrl}`;
  const msgAcesso = (a: NonNullable<typeof acesso>) =>
    `${primeiroNome(a.nome)}, seu acesso ao Portal Wise Partners está pronto! Entre em ${portal}/entrar com o e-mail ${a.email} e a senha provisória ${a.senha}. No primeiro acesso, o portal pede pra você criar uma senha sua. `
    + (tipoAcesso === "parceiro" ? "Lá você encontra o seu link, a mensagem pronta e o treinamento."
      : tipoAcesso === "cliente" ? "A primeira tela é a Comunidade Wise Partners: as empresas do ecossistema com condições especiais para você, e o espaço para publicar as ofertas da sua empresa."
      : "Lá você conhece as empresas da Comunidade Wise Partners e o que cada uma oferece.");

  return (
    <div className="space-y-4">
      {!fila.length ? (
        <p className="text-sm text-neutro-300">Ninguém na fila agora. Cada cadastro feito na página do portal aparece aqui, com o perfil que a empresa declarou, e o gerente recebe um aviso no portal.</p>
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
                    <span className="mt-1 block">
                      {perfilDe(c) === "cliente_grupo" ? <Pilula tom="alerta">Cliente do grupo{nomeGrupo(c.empresas_grupo) ? `: ${nomeGrupo(c.empresas_grupo)}` : ""}</Pilula>
                        : perfilDe(c) === "parceiro" ? <Pilula tom="info">Quer ser parceiro</Pilula> : <Pilula>Comunidade</Pilula>}
                    </span>
                    <span className="mt-1 block text-xs text-neutro-300">
                      {perfilDe(c) === "parceiro" ? `${c.categoria_nome ?? "Sem categoria"} · ${c.clientes_ativos ?? "?"} clientes` : [c.segmento, [c.cidade, c.uf].filter(Boolean).join(", ")].filter(Boolean).join(" · ")}
                      {c.origem === "comunidade" ? " · pela Comunidade" : ""}
                    </span>
                    {!!(c.interesses ?? []).length && <span className="block text-xs text-neutro-300">Quer: {(c.interesses ?? []).map((i) => INTERESSE[i] ?? i).join(", ")}</span>}
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
                      {agendaUrl && perfilDe(c) === "parceiro" && (
                        <Button asChild size="sm" variant="outline" className="h-8 w-full justify-start text-xs">
                          <a href={linkWhats(c.whatsapp, msgAgenda(c))} target="_blank" rel="noreferrer"><CalendarDays className="h-3.5 w-3.5" /> Mandar a agenda</a>
                        </Button>
                      )}
                      <Button size="sm" variant="outline" className="h-8 w-full justify-start border-menta-500/40 text-xs text-menta-300 hover:text-menta-200" onClick={() => abrirAprovacao(c)}><UserCheck className="h-3.5 w-3.5" /> {perfilDe(c) === "parceiro" ? "Aprovar e criar acesso" : "Adicionar e criar acesso"}</Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {!agendaUrl && <p className="text-xs text-neutro-300">Para aparecer o botão "Mandar a agenda", cole o link da sua agenda do Google em Programa, Páginas, Página dos parceiros (campo "Agenda para os parceiros").</p>}

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
            <DialogTitle>Adicionar {aprovar?.empresa}</DialogTitle>
            <DialogDescription>Confira quem é a empresa e escolha como ela entra. A conta de {aprovar?.nome} sai com senha provisória, para você mandar pelo WhatsApp.</DialogDescription>
          </DialogHeader>
          <RadioGroup value={modo} onValueChange={(v) => setModo(v as Modo)} className="space-y-2" aria-label="Como a empresa entra">
            {([
              ["cliente", "Cliente do Grupo Tríade", "Entra na Comunidade com as condições do catálogo, pode publicar ofertas e indicar a Wise Makers."],
              ["comunidade", "Empresa da comunidade", "Vê as empresas e as ofertas, sem as condições, e o minicurso da Wise Makers."],
              ["parceiro", "Parceiro do programa", "Depois da conversa de entrada: nível Select, onboarding por etapas, com o aceite do termo feito na página."],
            ] as const).map(([v, rotulo, texto]) => {
              const semTermo = v === "parceiro" && !aprovar?.termo_versao;
              return (
                <label key={v} htmlFor={`modo-${v}`} className={`flex items-start gap-3 rounded-[10px] border px-3 py-2.5 text-sm ${modo === v ? "border-menta-500/50 bg-menta-500/5" : "border-white/10"} ${semTermo ? "opacity-60" : "cursor-pointer"}`}>
                  <RadioGroupItem id={`modo-${v}`} value={v} disabled={semTermo} className="mt-0.5" />
                  <span><span className="block font-semibold">{rotulo}</span><span className="text-neutro-300">{semTermo ? "A empresa não aceitou o termo de adesão no cadastro." : texto}</span></span>
                </label>
              );
            })}
          </RadioGroup>
          {modo === "cliente" && (
            <div className="space-y-1.5">
              <Label htmlFor="empresa-grupo">Cliente de</Label>
              <Select value={empresaGrupo} onValueChange={setEmpresaGrupo}>
                <SelectTrigger id="empresa-grupo"><SelectValue placeholder="Empresa do grupo" /></SelectTrigger>
                <SelectContent>{(grupoQ.data ?? []).map((g) => <SelectItem key={g.id} value={g.id}>{g.nome}</SelectItem>)}</SelectContent>
              </Select>
              <p className="text-xs text-neutro-300">Confirme o contrato ativo antes de adicionar como cliente.</p>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setAprovar(null)} disabled={aprovando}>Cancelar</Button>
            <Button onClick={confirmarAprovacao} disabled={aprovando || (modo === "cliente" && !empresaGrupo)}>
              {aprovando ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Adicionando...</> : "Adicionar e criar acesso"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!acesso} onOpenChange={(v) => !v && setAcesso(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {acesso?.erro ? "Empresa adicionada, sem acesso" : <><CheckCircle2 className="h-5 w-5 text-menta-400" /> {acesso?.jaTinha ? "Parceiro aprovado" : "Acesso criado"}</>}
            </DialogTitle>
            <DialogDescription>
              {acesso?.erro
                ? `A empresa foi adicionada, mas a conta não: ${acesso.erro} Crie o acesso pela ficha da empresa, em Usuários.`
                : acesso?.jaTinha ? "A empresa já entrava pela Comunidade Wise Partners. O mesmo login agora abre a área do parceiro, com o onboarding. Avise pelo WhatsApp."
                : "Mande a mensagem abaixo pelo WhatsApp. A senha não fica guardada em lugar nenhum: se fechar esta janela sem copiar, gere outra pela ficha do parceiro."}
            </DialogDescription>
          </DialogHeader>
          {acesso && !acesso.erro && !acesso.jaTinha && (
            <>
              <p className="whitespace-pre-line rounded-[10px] border border-white/10 bg-white/5 p-3 text-sm">{msgAcesso(acesso)}</p>
              <div className="flex flex-wrap gap-2">
                <Button asChild><a href={linkWhats(acesso.whatsapp, msgAcesso(acesso))} target="_blank" rel="noreferrer"><MessageCircle /> Enviar pelo WhatsApp</a></Button>
                <Button variant="outline" onClick={() => copiar(msgAcesso(acesso))}><Copy /> Copiar mensagem</Button>
              </div>
            </>
          )}
          <DialogFooter>
            {acesso && (tipoAcesso === "parceiro"
              ? <Button asChild variant="ghost"><Link to={`/app/parceiros/${acesso.parceiro_id}`}>Abrir a ficha do parceiro</Link></Button>
              : <Button asChild variant="ghost"><Link to="/app/catalogo/membros?filtro=todas">Ver em Comunidade, Empresas</Link></Button>)}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
