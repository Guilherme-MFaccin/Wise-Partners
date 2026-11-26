import { useState } from "react";
import { Link, Outlet, useNavigate } from "react-router-dom";
import { Bell, LogOut, Menu, UserCircle } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { AvisoSenhaProvisoria } from "@/components/conta/AvisoSenhaProvisoria";
import { useNaoLidas } from "@/hooks/useNotificacoes";
import { Logo } from "@/components/comum/Logo";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { useMeuParceiro } from "@/components/portal/dados";
import { useComunicadosNaoLidos, usePlanoOnboarding } from "@/components/portal/dadosV2";
import { ORDEM_MEMBRO, SECOES_PARCEIRO, type AbaParceiro } from "@/lib/navegacao";
import { useAcessoHub, usePedidosAbertos } from "@/components/catalogo/dados";
import { BarraAbas, MenuSecoes, filtrarSecoes } from "@/components/layout/Navegacao";

// Seções da área logada (src/lib/navegacao.ts), filtradas pelo acesso que o banco devolve (acesso_comunidade):
// parceiro do programa vê as suas seções; empresa sem parceria (cliente do grupo ou cadastrada) vê Catálogo, Indicar e Conhecer.
export function useSecoes() {
  const { perfil } = useAuth();
  const onboardingQ = usePlanoOnboarding();
  const parceiroQ = useMeuParceiro();
  const hub = useAcessoHub();
  const temPlano = !!onboardingQ.data?.plano;
  const comercial = parceiroQ.data?.tipo_parceria === "comercial";
  const a = hub.data;
  const membro = !!a && !a.parceiroPrograma;
  const verHub = (x: AbaParceiro) => x.hub === "ver" ? true : x.hub === "ofertar" ? !!a?.ofertar : !!(a?.ver || a?.ofertar);
  const secoes = filtrarSecoes(SECOES_PARCEIRO, (x: AbaParceiro) => {
    if (x.hub) return verHub(x);
    if (x.indicar && !a?.indicar) return false;
    if (membro) return !!x.membro;
    return (!x.responsavel || !!perfil?.is_responsavel_parceiro) && (!x.onboarding || temPlano) && (!x.comercial || comercial);
  });
  if (!membro) return secoes;
  return secoes
    .map((s) => ({ ...s, rotulo: s.rotuloMembro ?? s.rotulo }))
    .sort((x, y) => ORDEM_MEMBRO.indexOf(x.id) - ORDEM_MEMBRO.indexOf(y.id));
}

function Contador({ n }: { n: number }) {
  if (n <= 0) return null;
  return (
    <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-menta-500 px-1 text-xs font-bold tabular-nums text-neutro-900" aria-label={`${n} novos`}>{n}</span>
  );
}

// Contadores do menu: comunicados e notificações não lidos, e pedidos recebidos ainda sem resposta
function useContadores() {
  const { data: comunicados = 0 } = useComunicadosNaoLidos();
  const { data: notificacoes = 0 } = useNaoLidas();
  const { data: pedidos = 0 } = usePedidosAbertos();
  return { comunicados, notificacoes, pedidos };
}

function Navegacao({ onNavegar }: { onNavegar?: () => void }) {
  const c = useContadores();
  return <MenuSecoes secoes={useSecoes()} onNavegar={onNavegar}
    extra={(s) => (s.id === "comunidade" ? <Contador n={c.comunicados + c.notificacoes} /> : s.id === "catalogo" ? <Contador n={c.pedidos} /> : null)} />;
}

function AbasDaSecao() {
  const c = useContadores();
  return <BarraAbas secoes={useSecoes()} rotuloExtra={(a: AbaParceiro) => (a.contador ? <Contador n={c[a.contador]} /> : null)} />;
}

export function ParceiroLayout() {
  const { perfil, sair } = useAuth();
  const navigate = useNavigate();
  const [menu, setMenu] = useState(false);
  const { data: n = 0 } = useNaoLidas();
  const rodape = (
    <div className="shrink-0 border-t border-white/10 pt-4">
      <Link to="/parceiro/conta" onClick={() => setMenu(false)} className="flex items-center gap-2 rounded-[8px] px-2 py-1 hover:bg-white/5">
        <UserCircle className="h-5 w-5 shrink-0 text-neutro-300" aria-hidden="true" />
        <span className="min-w-0">
          <span className="block truncate text-sm font-semibold">{perfil?.nome}</span>
          <span className="block truncate text-xs text-muted-foreground">Minha conta</span>
        </span>
      </Link>
      <Button variant="ghost" size="sm" className="mt-2 w-full justify-start" onClick={async () => { await sair(); navigate("/entrar"); }}>
        <LogOut /> Sair
      </Button>
    </div>
  );
  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[250px_1fr]">
      <aside className="sticky top-0 hidden h-screen flex-col gap-4 border-r border-white/10 bg-neutro-900 p-4 lg:flex">
        <Link to="/parceiro" className="block shrink-0 px-2 pt-1">
          <Logo />
          <p className="mt-1 text-xs font-semibold uppercase tracking-wider text-menta-500">Comunidade Wise Partners</p>
        </Link>
        <div className="-mx-1 min-h-0 flex-1 overflow-y-auto px-1">
          <Navegacao />
        </div>
        {rodape}
      </aside>
      <div className="min-w-0">
        <header className="sticky top-0 z-30 flex items-center justify-between gap-2 border-b border-white/10 bg-background/90 px-4 py-3 backdrop-blur lg:justify-end">
          <div className="flex items-center gap-2 lg:hidden">
            <Sheet open={menu} onOpenChange={setMenu}>
              <SheetTrigger asChild><Button variant="ghost" size="icon" aria-label="Menu"><Menu /></Button></SheetTrigger>
              <SheetContent side="left" className="flex w-72 flex-col gap-4 bg-neutro-900 p-4">
                <SheetTitle className="sr-only">Menu</SheetTitle>
                <Logo className="shrink-0" />
                <div className="-mx-1 min-h-0 flex-1 overflow-y-auto px-1">
                  <Navegacao onNavegar={() => setMenu(false)} />
                </div>
                {rodape}
              </SheetContent>
            </Sheet>
            <Logo className="h-6" />
          </div>
          <Link to="/parceiro/notificacoes" className="relative rounded-full p-2 hover:bg-white/5" aria-label="Notificações">
            <Bell className="h-5 w-5" />
            {n > 0 && <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-menta-500 px-1 text-[11px] font-bold text-neutro-900">{n}</span>}
          </Link>
        </header>
        <AvisoSenhaProvisoria />
        <main className="mx-auto w-full max-w-6xl px-4 pb-10 pt-4 sm:px-6"><AbasDaSecao /><Outlet /></main>
      </div>
    </div>
  );
}
