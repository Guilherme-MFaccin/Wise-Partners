import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Eye, MousePointerClick, Plus, Search } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { ok } from "@/lib/erros";
import { data } from "@/lib/formato";
import { ESTADOS_PEDIDO_RFP } from "@/lib/rotulos";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Cabecalho } from "@/components/comum/Cabecalho";
import { Carregando, ErroCarga, Vazio } from "@/components/comum/Estados";
import { Pilula, SeloEstado } from "@/components/comum/Selos";
import { useCandidatos, useCategorias } from "@/components/rfp/dados";
import type { SemFornecedor } from "@/components/rfp/tipos";

type Linha = {
  id: string;
  cliente_nome: string;
  consultor_id: string;
  estado: string;
  created_at: string;
  sem_fornecedor: SemFornecedor[];
  necessidade_resumida: string | null;
  consultor: { nome: string } | null;
  empresa: { nome: string } | null;
  pagina: Pagina | Pagina[] | null;
};
type Pagina = { id: string; publicada_em: string | null; expira_em: string | null; revogada: boolean; aberturas: number };

export default function Rfps() {
  const { perfil, isParcerias } = useAuth();
  const podeCriar = isParcerias || perfil?.papel === "consultor";
  const [busca, setBusca] = useState("");
  const [meus, setMeus] = useState(perfil?.papel === "consultor");

  const pedidosQ = useQuery({
    queryKey: ["pedidos-rfp"],
    queryFn: async () =>
      ok<any>(await supabase.from("pedidos_rfp")
        .select("id, cliente_nome, consultor_id, estado, created_at, sem_fornecedor, necessidade_resumida, consultor:perfis!pedidos_rfp_consultor_id_fkey(nome), empresa:empresas_grupo(nome), pagina:paginas_rfp(id, publicada_em, expira_em, revogada, aberturas)")
        .order("created_at", { ascending: false })) as Linha[],
  });
  const cliquesQ = useQuery({
    queryKey: ["eventos-rfp-cliques"],
    queryFn: async () =>
      ok<any>(await supabase.from("eventos_rfp").select("pagina_id").in("tipo", ["clique_whatsapp", "clique_email"])) as { pagina_id: string }[],
  });

  const cliquesPorPagina = useMemo(() => {
    const m = new Map<string, number>();
    for (const e of cliquesQ.data ?? []) m.set(e.pagina_id, (m.get(e.pagina_id) ?? 0) + 1);
    return m;
  }, [cliquesQ.data]);

  const lista = (pedidosQ.data ?? []).filter((p) =>
    (!meus || p.consultor_id === perfil?.id) && (!busca || p.cliente_nome.toLowerCase().includes(busca.toLowerCase())));

  return (
    <div>
      <Cabecalho
        titulo="Pedidos de RFP"
        descricao="Pedidos de clientes por fornecedores fora do escopo da Wise, com recomendação de parceiros assinados e página exclusiva."
        acoes={podeCriar && <Button asChild><Link to="/app/rfp/novo"><Plus /> Novo pedido</Link></Button>}
      />
      <Tabs defaultValue="pedidos">
        <TabsList className="mb-4 h-auto flex-wrap justify-start">
          <TabsTrigger value="pedidos">Pedidos</TabsTrigger>
          <TabsTrigger value="prospectar">Categorias a prospectar</TabsTrigger>
        </TabsList>
        <TabsContent value="pedidos" className="space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input className="pl-9" placeholder="Buscar por cliente" value={busca} onChange={(e) => setBusca(e.target.value)} />
            </div>
            <div className="flex items-center gap-2">
              <Switch id="meus" checked={meus} onCheckedChange={setMeus} />
              <Label htmlFor="meus">Só os meus</Label>
            </div>
          </div>
          {pedidosQ.isLoading ? <Carregando /> : pedidosQ.error ? <ErroCarga erro={pedidosQ.error} /> : lista.length === 0 ? (
            <Vazio titulo="Nenhum pedido encontrado">{podeCriar ? "Registre um novo pedido quando um cliente precisar de um fornecedor." : null}</Vazio>
          ) : (
            <ul className="grid gap-3">
              {lista.map((p) => {
                const pg = Array.isArray(p.pagina) ? p.pagina[0] : p.pagina;
                return (
                  <li key={p.id}>
                    <Link to={`/app/rfp/${p.id}`} className="block rounded-[14px] border border-white/10 bg-card p-4 transition-colors hover:border-menta-500/40">
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="font-semibold">{p.cliente_nome}</p>
                          <p className="text-sm text-muted-foreground">
                            {data(p.created_at)} · {p.consultor?.nome ?? "Consultor"} · {p.empresa?.nome}
                          </p>
                          {p.necessidade_resumida && <p className="mt-1 text-sm text-neutro-100">{p.necessidade_resumida}</p>}
                        </div>
                        <SeloEstado estado={p.estado} mapa={ESTADOS_PEDIDO_RFP} />
                      </div>
                      {pg?.publicada_em && (
                        <div className="mt-3 flex flex-wrap items-center gap-2 text-sm">
                          <SituacaoLink pagina={pg} />
                          <span className="inline-flex items-center gap-1 text-muted-foreground"><Eye className="h-4 w-4" /> {pg.aberturas}</span>
                          <span className="inline-flex items-center gap-1 text-muted-foreground">
                            <MousePointerClick className="h-4 w-4" /> {cliquesPorPagina.get(pg.id) ?? 0}
                          </span>
                        </div>
                      )}
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </TabsContent>
        <TabsContent value="prospectar">
          <CategoriasProspectar pedidos={pedidosQ.data ?? []} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function SituacaoLink({ pagina }: { pagina: Pagina }) {
  if (pagina.revogada) return <Pilula tom="perigo">Link revogado</Pilula>;
  if (pagina.expira_em && new Date(pagina.expira_em) < new Date()) return <Pilula tom="alerta">Expirou em {data(pagina.expira_em)}</Pilula>;
  return <Pilula tom="menta">Publicada, expira em {data(pagina.expira_em)}</Pilula>;
}

// Relatório de categorias a prospectar (FR-088): necessidades sem fornecedor dos pedidos
// e categorias comerciais ativas sem nenhum parceiro elegível.
function CategoriasProspectar({ pedidos }: { pedidos: Linha[] }) {
  const { data: candidatos = [], isLoading: l1 } = useCandidatos();
  const { data: categorias = [], isLoading: l2 } = useCategorias();
  if (l1 || l2) return <Carregando />;

  const necessidades = pedidos.flatMap((p) => (p.sem_fornecedor ?? []).map((s) => ({ ...s, pedido: p })));
  const agrupadas = new Map<string, typeof necessidades>();
  for (const n of necessidades) {
    const k = n.categoria_sugerida?.trim() || "Sem categoria definida";
    agrupadas.set(k, [...(agrupadas.get(k) ?? []), n]);
  }
  const vazias = categorias.filter((c) => c.tipo === "comercial" && c.ativa
    && !candidatos.some((k) => (k.categorias ?? []).some((x) => x.categoria_id === c.id)));

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Necessidades sem fornecedor</h2>
        {agrupadas.size === 0 ? <Vazio titulo="Nenhuma necessidade registrada" /> : (
          [...agrupadas.entries()].sort((a, b) => b[1].length - a[1].length).map(([cat, itens]) => (
            <div key={cat} className="rounded-[14px] border border-white/10 bg-card p-4">
              <div className="flex items-center justify-between gap-2">
                <p className="font-semibold">{cat}</p>
                <Pilula tom="alerta">{itens.length} {itens.length === 1 ? "pedido" : "pedidos"}</Pilula>
              </div>
              <ul className="mt-2 space-y-1 text-sm">
                {itens.map((n, i) => (
                  <li key={i} className="text-muted-foreground">
                    {n.necessidade} <Link to={`/app/rfp/${n.pedido.id}`} className="text-menta-400 hover:underline">({n.pedido.cliente_nome}, {data(n.pedido.created_at)})</Link>
                  </li>
                ))}
              </ul>
            </div>
          ))
        )}
      </section>
      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Categorias sem parceiro elegível</h2>
        <p className="text-sm text-muted-foreground">Categorias comerciais ativas sem nenhum parceiro assinado com ficha publicada.</p>
        {vazias.length === 0 ? <Vazio titulo="Todas as categorias têm parceiro elegível" /> : (
          <ul className="flex flex-wrap gap-2">
            {vazias.map((c) => <li key={c.id}><Pilula>{c.nome}</Pilula></li>)}
          </ul>
        )}
      </section>
    </div>
  );
}
