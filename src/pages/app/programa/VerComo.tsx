import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Eye, ExternalLink, Info, Loader2, Lock, Search } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Cabecalho } from "@/components/comum/Cabecalho";
import { ErroCarga, Vazio } from "@/components/comum/Estados";
import { Pilula } from "@/components/comum/Selos";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useLinkExemplo } from "@/components/paginas/dados";
import { data } from "@/lib/formato";
import { cn } from "@/lib/utils";

// Ver como (26/11/2026): o administrador e o gerente da comunidade escolhem uma conta e abrem o portal como ela, numa aba
// separada, para conferir o que cada tipo de acesso vê e se está funcionando. A lista vem do banco (contas_para_ver_como);
// a abertura passa pela Edge Function ver-como, que registra cada uso. Administradores não entram na lista.
type Conta = {
  perfil_id: string; nome: string; email: string; papel: string; responsavel: boolean; ativo: boolean; parceiro_id: string | null; empresa: string | null;
  tipo: string; ultimo_acesso: string | null; ultima_visualizacao: string | null; demonstracao: boolean;
};

// Tipos de acesso, na ordem da hierarquia do portal
const TIPOS: { id: string; rotulo: string; grupo: Grupo; descricao: string }[] = [
  { id: "cliente_grupo", rotulo: "Cliente do Grupo Tríade", grupo: "empresas", descricao: "Comunidade primeiro, com as condições; ofertas, pedidos, indicar, notificações" },
  { id: "membro", rotulo: "Empresa da comunidade", grupo: "empresas", descricao: "Comunidade em vitrine, Conhecer a Wise Makers e notificações" },
  { id: "parceiro_elite", rotulo: "Parceiro Elite", grupo: "parceiros", descricao: "Área do parceiro completa; oferece no catálogo" },
  { id: "parceiro_premium", rotulo: "Parceiro Premium", grupo: "parceiros", descricao: "Área do parceiro; usa as condições do catálogo" },
  { id: "parceiro_select", rotulo: "Parceiro Select", grupo: "parceiros", descricao: "Área do parceiro; catálogo em vitrine" },
  { id: "parceiro_entrada", rotulo: "Parceiro em entrada", grupo: "parceiros", descricao: "Ainda sem contrato assinado" },
  { id: "parcerias", rotulo: "Gerente de parcerias", grupo: "wise", descricao: "Área da Wise: gestão do programa e da comunidade" },
  { id: "consultor", rotulo: "Consultor", grupo: "wise", descricao: "Área da Wise: diagnósticos, carteira e clientes do grupo" },
  { id: "comercial", rotulo: "Comercial", grupo: "wise", descricao: "Área da Wise: indicações e clientes do grupo" },
  { id: "financeiro", rotulo: "Financeiro", grupo: "wise", descricao: "Área da Wise: comissões" },
];
type Grupo = "todos" | "empresas" | "parceiros" | "wise";
const GRUPOS: { id: Grupo; rotulo: string }[] = [
  { id: "todos", rotulo: "Todos" }, { id: "empresas", rotulo: "Clientes e empresas" }, { id: "parceiros", rotulo: "Parceiros" }, { id: "wise", rotulo: "Time da Wise" },
];
const tipoDe = (id: string) => TIPOS.find((t) => t.id === id);

// Abre a aba antes de esperar a resposta (o navegador bloqueia abas abertas depois de uma espera) e depois leva ao link
async function abrirComo(c: Conta, setAbrindo: (id: string | null) => void) {
  const aba = window.open("about:blank", "_blank");
  if (!aba) return toast.error("O navegador bloqueou a aba nova. Libere as janelas pop-up deste site e tente de novo.");
  setAbrindo(c.perfil_id);
  try {
    const { data: r, error } = await supabase.functions.invoke("ver-como", { body: { perfil_id: c.perfil_id } });
    if (error) {
      const corpo = await (error as { context?: Response }).context?.json?.().catch(() => null);
      throw new Error(corpo?.erro ?? error.message);
    }
    aba.opener = null;
    aba.location.href = `${window.location.origin}/ver-como#t=${encodeURIComponent((r as { token_hash: string }).token_hash)}`;
  } catch (e) {
    aba.close();
    toast.error(e instanceof Error ? e.message : "Não foi possível abrir a visualização.");
  } finally {
    setAbrindo(null);
  }
}

function PaginasPublicas() {
  const link = useLinkExemplo();
  const item = (rotulo: string, quem: string, url: string | null, aviso?: string) => (
    <li className="flex flex-col gap-2 rounded-[14px] border border-white/10 bg-card p-4 sm:flex-row sm:items-center">
      <div className="min-w-0 flex-1">
        <p className="font-semibold">{rotulo}</p>
        <p className="text-sm text-neutro-300">{aviso ?? quem}</p>
      </div>
      {url && (
        <Button asChild variant="outline" size="sm">
          <a href={url} target="_blank" rel="noopener noreferrer"><ExternalLink className="mr-1.5 h-4 w-4" aria-hidden />Abrir<span className="sr-only"> {rotulo} (abre em outra aba)</span></a>
        </Button>
      )}
    </li>
  );
  return (
    <ul className="grid gap-3 lg:grid-cols-2">
      {item("Página do portal", "Visitante: qualquer empresa que conhece o portal e se cadastra", "/parceiros")}
      {item("Página do cliente do parceiro", "Cliente que recebe o link de um parceiro", link.data ? `/c/${link.data}` : null,
        link.isLoading ? "Procurando um link de parceiro..." : link.data ? undefined : "Nenhum parceiro tem link ativo ainda.")}
    </ul>
  );
}

export default function VerComoAdmin() {
  const { isParcerias, carregando } = useAuth();
  const contas = useQuery({
    queryKey: ["ver-como", "contas"],
    enabled: isParcerias,
    queryFn: async () => {
      const { data: d, error } = await supabase.rpc("contas_para_ver_como" as any);
      if (error) throw error;
      return (d ?? []) as Conta[];
    },
  });
  const [grupo, setGrupo] = useState<Grupo>("todos");
  const [busca, setBusca] = useState("");
  const [abrindo, setAbrindo] = useState<string | null>(null);
  const lista = useMemo(() => contas.data ?? [], [contas.data]);
  const termo = busca.trim().toLowerCase();
  const filtradas = lista.filter((c) => (grupo === "todos" || tipoDe(c.tipo)?.grupo === grupo)
    && (!termo || `${c.nome} ${c.email} ${c.empresa ?? ""}`.toLowerCase().includes(termo)));
  const porTipo = TIPOS.filter((t) => grupo === "todos" || t.grupo === grupo).map((t) => ({ ...t, contas: filtradas.filter((c) => c.tipo === t.id) }));

  const cab = <Cabecalho titulo="Ver como" descricao="Como o portal aparece para cada tipo de acesso, e está tudo funcionando?" />;
  if (carregando) return <div>{cab}</div>;
  if (!isParcerias) {
    return <div>{cab}<Vazio titulo="Sem permissão"><span className="inline-flex items-center gap-1"><Lock className="h-4 w-4" aria-hidden />Ver como é do administrador e do gerente da comunidade.</span></Vazio></div>;
  }

  return (
    <div className="space-y-8">
      {cab}
      <p className="flex gap-2 rounded-[10px] border border-warning/30 bg-warning/5 px-3 py-2 text-sm">
        <Info className="mt-0.5 h-4 w-4 shrink-0 text-warning" aria-hidden />
        <span>A conta abre numa aba nova, com uma faixa de aviso, e você continua com o seu acesso nesta aba. O que você fizer lá vale como se fosse a pessoa, e cada visualização fica registrada no histórico. As contas marcadas como Demonstração são fictícias: ficam fora dos números, das listas e dos e-mails do time.</span>
      </p>

      <section aria-labelledby="publicas" className="space-y-3">
        <h2 id="publicas" className="text-lg font-semibold">Sem login</h2>
        <PaginasPublicas />
      </section>

      <section aria-labelledby="contas" className="space-y-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <h2 id="contas" className="text-lg font-semibold">Contas do portal</h2>
          <div className="flex gap-1.5 overflow-x-auto pb-1 [scrollbar-width:none] lg:ml-4" role="group" aria-label="Filtrar por tipo de acesso">
            {GRUPOS.map((g) => (
              <button key={g.id} type="button" aria-pressed={grupo === g.id} onClick={() => setGrupo(g.id)}
                className={cn("min-h-9 shrink-0 rounded-full border border-white/10 px-3 text-sm text-neutro-300 hover:text-white", grupo === g.id && "border-menta-500/50 bg-menta-500/10 text-white")}>
                {g.rotulo}
              </button>
            ))}
          </div>
          <div className="relative lg:ml-auto lg:w-72">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutro-300" aria-hidden />
            <Input type="search" value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Pessoa, e-mail ou empresa" aria-label="Buscar conta" className="pl-9" />
          </div>
        </div>

        {contas.isLoading && (
          <div className="space-y-2" aria-busy="true" aria-label="Carregando as contas">
            {Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-24 rounded-[14px] border border-white/10 bg-card motion-safe:animate-pulse" />)}
          </div>
        )}
        {contas.error && <ErroCarga erro={contas.error} aoTentar={() => contas.refetch()} />}
        {contas.isSuccess && (
          <div className="space-y-4">
            {porTipo.filter((t) => t.contas.length > 0 || !termo).map((t) => (
              <article key={t.id} className="rounded-[14px] border border-white/10 bg-card">
                <header className="flex flex-wrap items-baseline gap-x-3 gap-y-1 border-b border-white/5 px-4 py-3">
                  <h3 className="font-semibold">{t.rotulo}</h3>
                  <span className="text-xs tabular-nums text-neutro-300">{t.contas.length} {t.contas.length === 1 ? "conta" : "contas"}</span>
                  <span className="w-full text-xs text-neutro-300 sm:w-auto sm:flex-1">{t.descricao}</span>
                </header>
                {t.contas.length === 0 ? (
                  <p className="px-4 py-3 text-sm text-neutro-300">Nenhuma conta deste tipo ainda. Quando houver, ela aparece aqui.</p>
                ) : (
                  <ul>
                    {t.contas.map((c) => (
                      <li key={c.perfil_id} className="flex flex-col gap-2 border-b border-white/5 px-4 py-3 last:border-0 sm:flex-row sm:items-center">
                        <div className="min-w-0 flex-1">
                          <p className="truncate font-medium">{c.nome}{c.demonstracao && <span className="ml-2 align-middle"><Pilula tom="info">Demonstração</Pilula></span>}{c.responsavel && <span className="ml-2 align-middle"><Pilula>Responsável</Pilula></span>}{!c.ativo && <span className="ml-2 align-middle"><Pilula tom="perigo">Desativada</Pilula></span>}</p>
                          <p className="truncate text-xs text-neutro-300">{[c.empresa, c.email].filter(Boolean).join(" · ")}</p>
                          <p className="text-xs text-neutro-300">
                            {c.ultimo_acesso ? `Último acesso em ${data(c.ultimo_acesso)}` : "Ainda não entrou"}
                            {c.ultima_visualizacao ? ` · Vista pela Wise em ${data(c.ultima_visualizacao)}` : ""}
                          </p>
                        </div>
                        <Button size="sm" variant="outline" disabled={!c.ativo || abrindo === c.perfil_id} onClick={() => abrirComo(c, setAbrindo)}>
                          {abrindo === c.perfil_id ? <Loader2 className="animate-spin" /> : <Eye />}Ver como<span className="sr-only"> {c.nome}</span>
                        </Button>
                      </li>
                    ))}
                  </ul>
                )}
              </article>
            ))}
            {termo && filtradas.length === 0 && <Vazio titulo="Nenhuma conta com esta busca">Mude a busca ou o filtro.</Vazio>}
          </div>
        )}
      </section>
    </div>
  );
}
