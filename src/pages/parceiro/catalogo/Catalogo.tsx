import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Clock, Info, Lock, Search, ShieldAlert } from "lucide-react";
import { Cabecalho } from "@/components/comum/Cabecalho";
import { ErroCarga, Vazio } from "@/components/comum/Estados";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  CartaoEmpresa, CartaoOferta, DialogoParceria, DialogoPedido, FichaEmpresa, FiltroCategorias, agruparEmpresas,
} from "@/components/catalogo/Componentes";
import { useAcessoHub, useCatalogo, type OfertaCatalogo } from "@/components/catalogo/dados";

// Catálogo de parceiros, a primeira aba das empresas da Comunidade Wise Partners (FO-19 e 23/11/2026).
// Oferecem: parceiros Elite e clientes do Grupo Tríade. Usam as condições: clientes do grupo confirmados e parceiros Premium e Elite.
// As demais empresas veem a vitrine (empresas e ofertas, sem a condição), com o que falta para liberar.
const PERGUNTA = "Que empresas do ecossistema podem atender a sua, e com que condição especial?";

function EsqueletoCatalogo() {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3" aria-busy="true" aria-label="Carregando o catálogo">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="space-y-3 rounded-[14px] border border-white/10 bg-card p-5 motion-safe:animate-pulse">
          <div className="flex items-center gap-3"><div className="h-11 w-11 rounded-[10px] bg-white/10" /><div className="h-4 w-1/2 rounded bg-white/10" /></div>
          <div className="h-5 w-3/4 rounded bg-white/10" />
          <div className="h-4 w-full rounded bg-white/5" />
          <div className="h-4 w-5/6 rounded bg-white/5" />
          <div className="h-10 w-full rounded-[10px] bg-white/5" />
        </div>
      ))}
    </div>
  );
}

// O que falta para usar as condições, conforme a situação da empresa (acesso_comunidade)
function AvisoAcesso({ aoPedirParceria }: { aoPedirParceria: () => void }) {
  const { data: a } = useAcessoHub();
  if (!a || a.ver) return null;
  const caixa = "mb-5 flex flex-col gap-3 rounded-[14px] border p-4 sm:flex-row sm:items-start sm:p-5";
  if (a.vinculo_cliente === "a_confirmar") {
    return (
      <section className={`${caixa} border-warning/30 bg-warning/5`}>
        <Clock className="h-5 w-5 shrink-0 text-warning" aria-hidden />
        <div className="min-w-0 text-sm">
          <p className="font-semibold">Estamos confirmando que a sua empresa é cliente {a.empresas_grupo?.length ? `da ${a.empresas_grupo.join(" e da ")}` : "do Grupo Tríade"}</p>
          <p className="mt-1 text-neutro-300">A Wise confirma em até 2 dias úteis e avisa você aqui. Depois disso, as condições, os pedidos e o seu link de indicação aparecem.</p>
        </div>
      </section>
    );
  }
  if (a.vinculo_cliente === "nao_confirmado") {
    return (
      <section className={`${caixa} border-white/10 bg-card`}>
        <ShieldAlert className="h-5 w-5 shrink-0 text-neutro-300" aria-hidden />
        <div className="min-w-0 text-sm">
          <p className="font-semibold">Não confirmamos o vínculo de cliente do grupo</p>
          {a.vinculo_motivo && <p className="mt-1 text-neutro-300">{a.vinculo_motivo}</p>}
          <p className="mt-1 text-neutro-300">Se a sua empresa é cliente, fale com o seu consultor ou com a CS da empresa do grupo para revisar.</p>
        </div>
      </section>
    );
  }
  if (a.parceiroPrograma) {
    return (
      <section className={`${caixa} border-white/10 bg-card`}>
        <Lock className="h-5 w-5 shrink-0 text-neutro-300" aria-hidden />
        <div className="min-w-0 text-sm">
          <p className="font-semibold">As condições abrem no nível Premium</p>
          <p className="mt-1 text-neutro-300">Sua empresa passa a Premium quando um cliente seu, dentro do perfil, faz o diagnóstico com a Wise. Até lá, você vê as empresas e as ofertas.</p>
        </div>
        <Button asChild size="sm" variant="outline" className="sm:ml-auto"><Link to="/parceiro/indicar">Indicar um cliente</Link></Button>
      </section>
    );
  }
  const naFila = !!a.pedido_parceria && ["fila", "contatado", "reuniao_marcada"].includes(a.pedido_parceria);
  return (
    <section className={`${caixa} border-white/10 bg-card`}>
      <Info className="h-5 w-5 shrink-0 text-neutro-300" aria-hidden />
      <div className="min-w-0 text-sm">
        <p className="font-semibold">Você vê as empresas e o que cada uma oferece</p>
        <p className="mt-1 text-neutro-300">
          As condições especiais são para clientes do Grupo Tríade e para parceiros Premium e Elite.
          {naFila ? " O seu pedido para ser parceiro já está com a Wise, que fala com você pelo WhatsApp." : ""}
        </p>
      </div>
      {!naFila && <Button size="sm" variant="outline" className="sm:ml-auto" onClick={aoPedirParceria}>Quero ser parceiro</Button>}
    </section>
  );
}

export default function Catalogo() {
  const acesso = useAcessoHub();
  const cat = useCatalogo(!!acesso.data);
  const [busca, setBusca] = useState("");
  const [categoria, setCategoria] = useState("");
  const [visao, setVisao] = useState<"ofertas" | "empresas">("ofertas");
  const [pedindo, setPedindo] = useState<OfertaCatalogo | null>(null);
  const [empresaId, setEmpresaId] = useState<string | null>(null);
  const [parceria, setParceria] = useState(false);
  const lista = useMemo(() => cat.data ?? [], [cat.data]);
  const categorias = useMemo(() => [...new Set(lista.flatMap((o) => (o.categoria ? [o.categoria] : o.categorias.slice(0, 1))))].sort((a, b) => a.localeCompare(b, "pt-BR")), [lista]);
  const termo = busca.trim().toLowerCase();
  const visiveis = lista.filter((o) => (!categoria || o.categoria === categoria || o.categorias.includes(categoria))
    && (!termo || `${o.titulo} ${o.descricao} ${o.empresa} ${o.condicao ?? ""} ${o.categorias.join(" ")}`.toLowerCase().includes(termo)));
  const empresas = useMemo(() => agruparEmpresas(visiveis), [visiveis]);
  const todasEmpresas = useMemo(() => agruparEmpresas(lista), [lista]);
  const empresaAberta = todasEmpresas.find((e) => e.parceiro_id === empresaId) ?? null;
  const podeOfertar = !!acesso.data?.ofertar;

  const cab = (
    <Cabecalho titulo="Catálogo de parceiros" descricao={PERGUNTA} />
  );
  if (acesso.isLoading) return <div>{cab}<EsqueletoCatalogo /></div>;
  if (acesso.error) return <div>{cab}<ErroCarga erro={acesso.error} aoTentar={() => acesso.refetch()} /></div>;
  if (!acesso.data?.empresa) {
    return <div>{cab}<Vazio titulo="Sem empresa vinculada">O seu usuário não está ligado a uma empresa da comunidade. Fale com a Wise para revisar o acesso.</Vazio></div>;
  }

  return (
    <div>
      {cab}
      <AvisoAcesso aoPedirParceria={() => setParceria(true)} />

      <div className="mb-5 space-y-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative min-w-0 flex-1 sm:max-w-md">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutro-300" aria-hidden />
            <Input type="search" value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Buscar serviço, produto ou empresa" aria-label="Buscar no catálogo" className="pl-9" />
          </div>
          <Tabs value={visao} onValueChange={(v) => setVisao(v as typeof visao)}>
            <TabsList aria-label="Ver o catálogo por">
              <TabsTrigger value="ofertas">Por oferta</TabsTrigger>
              <TabsTrigger value="empresas">Por empresa</TabsTrigger>
            </TabsList>
          </Tabs>
          {cat.isSuccess && lista.length > 0 && (
            <p className="text-sm text-neutro-300 sm:ml-auto" aria-live="polite">
              <span className="tabular-nums">{visiveis.length}</span> {visiveis.length === 1 ? "oferta" : "ofertas"} de <span className="tabular-nums">{empresas.length}</span> {empresas.length === 1 ? "empresa" : "empresas"}
            </p>
          )}
        </div>
        <FiltroCategorias categorias={categorias} ativa={categoria} aoMudar={setCategoria} />
      </div>

      {cat.isLoading && <EsqueletoCatalogo />}
      {cat.error && <ErroCarga erro={cat.error} aoTentar={() => cat.refetch()} />}
      {cat.isSuccess && visiveis.length === 0 && (
        <Vazio titulo={lista.length ? "Nada com esta busca" : "O catálogo está começando"}>
          {lista.length ? (
            <span className="flex flex-col items-center gap-3">Mude a busca ou a categoria.
              <Button size="sm" variant="outline" onClick={() => { setBusca(""); setCategoria(""); }}>Limpar a busca</Button></span>
          ) : podeOfertar ? (
            <span className="flex flex-col items-center gap-3">As ofertas aparecem aqui depois da validação da Wise. A sua empresa pode ser uma das primeiras.
              <Button asChild size="sm"><Link to="/parceiro/ofertas">Cadastrar uma oferta</Link></Button></span>
          ) : "As ofertas aparecem aqui depois da validação da Wise. Volte em breve."}
        </Vazio>
      )}

      {cat.isSuccess && visiveis.length > 0 && (visao === "ofertas" ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {visiveis.map((o) => <CartaoOferta key={o.oferta_id} o={o} aoPedir={setPedindo} aoVerEmpresa={setEmpresaId} />)}
        </div>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {empresas.map((e) => <li key={e.parceiro_id} className="flex"><CartaoEmpresa e={e} aoAbrir={setEmpresaId} /></li>)}
        </ul>
      ))}

      <FichaEmpresa empresa={empresaAberta} aberta={!!empresaAberta} fechar={() => setEmpresaId(null)} aoPedir={(o) => { setEmpresaId(null); setPedindo(o); }} />
      <DialogoPedido oferta={pedindo} fechar={() => setPedindo(null)} />
      <DialogoParceria aberto={parceria} fechar={() => setParceria(false)} />
    </div>
  );
}
