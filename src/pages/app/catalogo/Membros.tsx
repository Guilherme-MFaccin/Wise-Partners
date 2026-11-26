import { useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, Loader2, MessageCircle, Search, XCircle } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Cabecalho } from "@/components/comum/Cabecalho";
import { ErroCarga, Vazio } from "@/components/comum/Estados";
import { Pilula } from "@/components/comum/Selos";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import { FAIXAS_FATURAMENTO } from "@/lib/diagnostico";
import { toastErro } from "@/lib/erros";
import { data, formatarCnpj, haQuanto, semTravessao, somenteDigitos } from "@/lib/formato";
import { cn } from "@/lib/utils";

// Empresas da Comunidade Wise Partners: quem já entrou (adicionada pelo gerente a partir da fila de cadastros), o que declarou
// e o que ainda espera da Wise.
// Ações: confirmar (ou não) o cliente do grupo, marcar o lead da consultoria como atendido e seguir para a fila de candidatos.
// Cada pendência também vira tarefa (membro_vinculo e lead_comunidade) até ser resolvida.
type Membro = {
  id: string; parceiro_id: string; nome: string; cargo: string | null; email: string; whatsapp: string; empresa: string; cnpj: string;
  site: string | null; cidade: string | null; uf: string | null; segmento: string | null; faturamento: string | null; vendedores: number | null;
  vinculo_cliente: "nao_declarado" | "a_confirmar" | "confirmado" | "nao_confirmado"; empresas_grupo: string[]; interesses: string[];
  como_conheceu: string | null; vinculo_motivo: string | null; vinculo_decidido_em: string | null; lead_atendido_em: string | null; created_at: string;
  parceiro: { tipo_parceria: string; cliente_grupo: boolean } | null; fila: { id: string; status: string } | null;
};
type Filtro = "pendentes" | "confirmar" | "consultoria" | "parceria" | "todas";

const INTERESSE: Record<string, string> = {
  comprar: "Usar condições", oferecer: "Oferecer", indicar: "Indicar a Wise", conhecer_consultoria: "Conhecer a consultoria", ser_parceiro: "Ser parceiro",
};
const VINCULO: Record<Membro["vinculo_cliente"], { rotulo: string; tom: "neutro" | "menta" | "alerta" | "perigo" }> = {
  nao_declarado: { rotulo: "Não é cliente", tom: "neutro" }, a_confirmar: { rotulo: "Cliente a confirmar", tom: "alerta" },
  confirmado: { rotulo: "Cliente confirmado", tom: "menta" }, nao_confirmado: { rotulo: "Cliente não confirmado", tom: "perigo" },
};
const FILA_ABERTA = ["fila", "contatado", "reuniao_marcada"];
const faixa = (v: string | null) => FAIXAS_FATURAMENTO.find((f) => f.valor === v)?.rotulo ?? null;
const pendConfirmar = (m: Membro) => m.vinculo_cliente === "a_confirmar";
const pendConsultoria = (m: Membro) => m.interesses.includes("conhecer_consultoria") && !m.lead_atendido_em;
const pendParceria = (m: Membro) => !!m.fila && FILA_ABERTA.includes(m.fila.status);
// O que a Wise precisa fazer agora com a empresa (o mesmo critério do filtro "Com pendência")
const proximoPasso = (m: Membro) => pendConfirmar(m) ? "Confirmar cliente" : pendConsultoria(m) ? "Falar sobre a consultoria" : pendParceria(m) ? "Conversa de parceria" : null;

function useMembros(ativo: boolean) {
  return useQuery({
    queryKey: ["membros-comunidade"],
    enabled: ativo,
    queryFn: async () => {
      const [m, g] = await Promise.all([
        (supabase.from("membros_comunidade" as any) as any)
          .select("*, parceiro:parceiros!membros_comunidade_parceiro_id_fkey(tipo_parceria, cliente_grupo), fila:cadastros_landing!membros_comunidade_cadastro_parceiro_id_fkey(id, status)")
          .order("created_at", { ascending: false }).limit(1000),
        supabase.from("empresas_grupo").select("id, nome").order("ordem"),
      ]);
      if (m.error) throw m.error;
      if (g.error) throw g.error;
      return { membros: (m.data ?? []) as Membro[], grupo: (g.data ?? []) as { id: string; nome: string }[] };
    },
  });
}

function Detalhe({ m, grupo, fechar }: { m: Membro; grupo: { id: string; nome: string }[]; fechar: () => void }) {
  const qc = useQueryClient();
  const [empresa, setEmpresa] = useState(m.empresas_grupo[0] ?? "");
  const [recusando, setRecusando] = useState(false);
  const [motivo, setMotivo] = useState("");
  const atualizar = () => qc.invalidateQueries({ queryKey: ["membros-comunidade"] });
  const decidir = useMutation({
    mutationFn: async (confirmar: boolean) => {
      const { error } = await supabase.rpc("decidir_vinculo_cliente" as any, {
        p_membro: m.id, p_confirmar: confirmar, p_empresa_grupo: confirmar ? empresa || null : null, p_motivo: confirmar ? null : semTravessao(motivo.trim()),
      });
      if (error) throw error;
    },
    onSuccess: (_, confirmar) => { toast.success(confirmar ? "Cliente confirmado. A empresa já vê as condições." : "Registrado. A empresa recebeu o motivo."); atualizar(); fechar(); },
    onError: toastErro,
  });
  const atendido = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.rpc("marcar_lead_atendido" as any, { p_membro: m.id });
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Lead marcado como atendido."); atualizar(); },
    onError: toastErro,
  });
  const nomes = m.empresas_grupo.map((id) => grupo.find((g) => g.id === id)?.nome).filter(Boolean).join(", ");
  const fone = somenteDigitos(m.whatsapp);
  const linha = (rotulo: string, valor: React.ReactNode) => valor ? <div className="grid grid-cols-[8rem_1fr] gap-2 py-1.5 text-sm"><dt className="text-neutro-300">{rotulo}</dt><dd className="min-w-0 break-words">{valor}</dd></div> : null;

  return (
    <div className="space-y-6">
      <dl className="divide-y divide-white/5">
        {linha("CNPJ", formatarCnpj(m.cnpj))}
        {linha("O que faz", m.segmento)}
        {linha("Local", [m.cidade, m.uf].filter(Boolean).join(", "))}
        {linha("Faturamento", faixa(m.faturamento))}
        {linha("Vendedores", m.vendedores !== null ? <span className="tabular-nums">{m.vendedores}</span> : null)}
        {linha("Site", m.site ? <a href={/^https?:/.test(m.site) ? m.site : `https://${m.site}`} target="_blank" rel="noopener noreferrer" className="underline underline-offset-2">{m.site}<span className="sr-only"> (abre em outra aba)</span></a> : null)}
        {linha("Contato", <>{m.nome}{m.cargo ? `, ${m.cargo}` : ""}<br /><span className="text-neutro-300">{m.email}</span></>)}
        {linha("Conheceu por", m.como_conheceu)}
        {linha("Cadastro", `${data(m.created_at)} (${haQuanto(m.created_at)})`)}
      </dl>
      {fone.length >= 10 && (
        <Button asChild variant="outline" className="w-full sm:w-auto">
          <a href={`https://wa.me/55${fone}`} target="_blank" rel="noopener noreferrer"><MessageCircle className="mr-1.5 h-4 w-4" aria-hidden />Falar no WhatsApp</a>
        </Button>
      )}

      {m.vinculo_cliente !== "nao_declarado" && (
        <section className="rounded-[14px] border border-white/10 bg-card p-4">
          <h3 className="font-semibold">Cliente do Grupo Tríade</h3>
          <p className="mt-1 text-sm text-neutro-300">Declarou ser cliente de: {nomes || "empresa do grupo"}.</p>
          {m.vinculo_cliente === "a_confirmar" ? (
            recusando ? (
              <div className="mt-3 space-y-2">
                <Label htmlFor="motivo">Motivo para a empresa</Label>
                <Textarea id="motivo" rows={3} value={motivo} onChange={(e) => setMotivo(e.target.value)} placeholder="Ex.: não encontramos contrato ativo com este CNPJ" />
                <div className="flex flex-wrap gap-2">
                  <Button variant="ghost" onClick={() => setRecusando(false)}>Voltar</Button>
                  <Button variant="destructive" disabled={!motivo.trim() || decidir.isPending} onClick={() => decidir.mutate(false)}>
                    {decidir.isPending && <Loader2 className="animate-spin" />}Não confirmar
                  </Button>
                </div>
              </div>
            ) : (
              <div className="mt-3 space-y-3">
                <div className="space-y-1.5">
                  <Label htmlFor="emp-grupo">Cliente de</Label>
                  <Select value={empresa} onValueChange={setEmpresa}>
                    <SelectTrigger id="emp-grupo"><SelectValue placeholder="Empresa do grupo" /></SelectTrigger>
                    <SelectContent>{grupo.map((g) => <SelectItem key={g.id} value={g.id}>{g.nome}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button disabled={!empresa || decidir.isPending} onClick={() => decidir.mutate(true)}>
                    {decidir.isPending ? <Loader2 className="animate-spin" /> : <CheckCircle2 />}Confirmar cliente
                  </Button>
                  <Button variant="outline" onClick={() => setRecusando(true)}><XCircle />Não é cliente</Button>
                </div>
              </div>
            )
          ) : (
            <p className="mt-2 text-sm"><Pilula tom={VINCULO[m.vinculo_cliente].tom}>{VINCULO[m.vinculo_cliente].rotulo}</Pilula>
              {m.vinculo_motivo && <span className="mt-2 block text-neutro-300">{m.vinculo_motivo}</span>}</p>
          )}
        </section>
      )}

      {m.interesses.includes("conhecer_consultoria") && (
        <section className="rounded-[14px] border border-white/10 bg-card p-4">
          <h3 className="font-semibold">Quer conhecer a consultoria</h3>
          {m.lead_atendido_em ? <p className="mt-1 text-sm text-neutro-300">Atendido em {data(m.lead_atendido_em)}.</p> : (
            <>
              <p className="mt-1 text-sm text-neutro-300">Fale com a empresa e marque aqui quando o contato for feito. A tarefa some sozinha.</p>
              <Button className="mt-3" variant="outline" disabled={atendido.isPending} onClick={() => atendido.mutate()}>
                {atendido.isPending && <Loader2 className="animate-spin" />}Marcar como atendido
              </Button>
            </>
          )}
        </section>
      )}

      {m.fila && (
        <section className="rounded-[14px] border border-white/10 bg-card p-4">
          <h3 className="font-semibold">Quer ser parceira</h3>
          <p className="mt-1 text-sm text-neutro-300">O pedido está na fila de candidatos. A conversa de entrada e a aprovação seguem por lá, e a conta da empresa é reaproveitada.</p>
          <Button asChild className="mt-3" variant="outline"><Link to={`/app/candidatos?id=${m.fila.id}`}>Abrir na fila de candidatos</Link></Button>
        </section>
      )}
    </div>
  );
}

export default function MembrosComunidade() {
  const { perfil } = useAuth();
  const pode = !!perfil && ["admin", "parcerias", "consultor", "comercial"].includes(perfil.papel);
  const q = useMembros(pode);
  const [params, setParams] = useSearchParams();
  const [filtro, setFiltro] = useState<Filtro>(() => (["pendentes", "confirmar", "consultoria", "parceria", "todas"].includes(params.get("filtro") ?? "") ? params.get("filtro") as Filtro : "pendentes"));
  const [busca, setBusca] = useState("");
  const membros = useMemo(() => q.data?.membros ?? [], [q.data]);
  const aberto = membros.find((m) => m.id === params.get("id")) ?? null;
  const contagem = {
    confirmar: membros.filter(pendConfirmar).length, consultoria: membros.filter(pendConsultoria).length, parceria: membros.filter(pendParceria).length,
  };
  const pendentes = (m: Membro) => pendConfirmar(m) || pendConsultoria(m) || pendParceria(m);
  const termo = busca.trim().toLowerCase();
  const lista = membros.filter((m) => ({
    pendentes: pendentes(m), confirmar: pendConfirmar(m), consultoria: pendConsultoria(m), parceria: pendParceria(m), todas: true,
  })[filtro] && (!termo || `${m.empresa} ${m.nome} ${m.email} ${m.segmento ?? ""} ${m.cnpj}`.toLowerCase().includes(termo)));
  const abrir = (id: string | null) => setParams(id ? { id } : {}, { replace: true });

  const cab = <Cabecalho titulo="Empresas da comunidade" descricao="Quem entrou na Comunidade Wise Partners, e o que cada empresa espera da Wise agora?" />;
  if (!pode) return <div>{cab}<Vazio titulo="Sem permissão">Esta tela é do time da Wise: gestão, consultores e comercial.</Vazio></div>;

  const atalhos: { id: Filtro; rotulo: string; n?: number }[] = [
    { id: "pendentes", rotulo: "Com pendência", n: membros.filter(pendentes).length },
    { id: "confirmar", rotulo: "Cliente a confirmar", n: contagem.confirmar },
    { id: "consultoria", rotulo: "Querem a consultoria", n: contagem.consultoria },
    { id: "parceria", rotulo: "Querem ser parceiras", n: contagem.parceria },
    { id: "todas", rotulo: "Todas", n: membros.length },
  ];

  return (
    <div>
      {cab}
      <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center">
        <div className="flex gap-1.5 overflow-x-auto pb-1 [scrollbar-width:none]" role="group" aria-label="Filtrar empresas">
          {atalhos.map((a) => (
            <button key={a.id} type="button" aria-pressed={filtro === a.id} onClick={() => setFiltro(a.id)}
              className={cn("flex min-h-9 shrink-0 items-center gap-2 rounded-full border border-white/10 px-3 text-sm text-neutro-300 hover:text-white",
                filtro === a.id && "border-menta-500/50 bg-menta-500/10 text-white")}>
              {a.rotulo}<span className={cn("tabular-nums", !a.n && "text-neutro-300")}>{q.isLoading ? "" : a.n ?? 0}</span>
            </button>
          ))}
        </div>
        <div className="relative lg:ml-auto lg:w-72">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutro-300" aria-hidden />
          <Input type="search" value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Empresa, pessoa, e-mail ou CNPJ" aria-label="Buscar empresa" className="pl-9" />
        </div>
      </div>

      {q.isLoading && (
        <div className="space-y-2" aria-busy="true" aria-label="Carregando as empresas">
          {Array.from({ length: 5 }).map((_, i) => <div key={i} className="h-16 rounded-[14px] border border-white/10 bg-card motion-safe:animate-pulse" />)}
        </div>
      )}
      {q.error && <ErroCarga erro={q.error} aoTentar={() => q.refetch()} />}
      {q.isSuccess && lista.length === 0 && (
        <Vazio titulo={membros.length === 0 ? "Nenhuma empresa na comunidade ainda" : filtro === "pendentes" ? "Nada pendente" : "Nenhuma empresa neste filtro"}>
          {membros.length === 0 ? "As empresas aparecem aqui quando você as adiciona pela fila de cadastros."
            : filtro === "pendentes" ? "Todas as empresas da comunidade estão em dia." : "Mude o filtro ou a busca."}
        </Vazio>
      )}
      {q.isSuccess && membros.length >= 1000 && (
        <p className="mb-3 rounded-[10px] border border-white/10 bg-white/5 px-3 py-2 text-sm">Mostrando as 1.000 empresas mais recentes. Use a busca para achar as mais antigas.</p>
      )}
      {q.isSuccess && lista.length > 0 && (
        <ul className="overflow-hidden rounded-[14px] border border-white/10 bg-card">
          {lista.map((m) => (
            <li key={m.id} className="border-b border-white/5 last:border-0">
              <button type="button" onClick={() => abrir(m.id)}
                className="grid w-full gap-2 px-4 py-3 text-left hover:bg-white/5 focus-visible:bg-white/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring md:grid-cols-[1.4fr_1fr_1.4fr_7rem] md:items-center">
                <span className="min-w-0">
                  <span className="block truncate font-semibold">{m.empresa}</span>
                  <span className="block truncate text-xs text-neutro-300">{[m.segmento, [m.cidade, m.uf].filter(Boolean).join(", ")].filter(Boolean).join(" · ")}</span>
                </span>
                <span className="min-w-0 text-sm">
                  <span className="block truncate">{m.nome}</span>
                  <span className="block truncate text-xs text-neutro-300">{m.vendedores !== null ? `${m.vendedores} vendedores` : ""}{faixa(m.faturamento) ? ` · ${faixa(m.faturamento)}` : ""}</span>
                </span>
                <span className="flex flex-wrap gap-1.5">
                  {proximoPasso(m) && <Pilula tom="alerta">{proximoPasso(m)}</Pilula>}
                  {m.vinculo_cliente !== "nao_declarado" && m.vinculo_cliente !== "a_confirmar" && <Pilula tom={VINCULO[m.vinculo_cliente].tom}>{VINCULO[m.vinculo_cliente].rotulo}</Pilula>}
                  {m.parceiro && m.parceiro.tipo_parceria !== "cliente" && <Pilula tom="menta">Parceira</Pilula>}
                  {m.interesses.filter((i) => i !== "comprar").map((i) => <span key={i} className="text-xs text-neutro-300">{INTERESSE[i]}</span>)}
                </span>
                <span className="text-xs text-neutro-300 md:text-right">{data(m.created_at)}</span>
              </button>
            </li>
          ))}
        </ul>
      )}

      <Sheet open={!!aberto} onOpenChange={(v) => !v && abrir(null)}>
        <SheetContent className="w-full overflow-y-auto sm:max-w-lg">
          {aberto && (
            <>
              <SheetHeader className="mb-4 text-left">
                <SheetTitle>{aberto.empresa}</SheetTitle>
                <SheetDescription>{aberto.interesses.map((i) => INTERESSE[i]).join(", ") || "Cadastro na comunidade"}</SheetDescription>
              </SheetHeader>
              <Detalhe key={aberto.id} m={aberto} grupo={q.data?.grupo ?? []} fechar={() => abrir(null)} />
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
