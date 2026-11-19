import { useState } from "react";
import { Link, Outlet, useNavigate } from "react-router-dom";
import { Bell, Menu, LogOut, Plus, UserCircle } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { AvisoSenhaProvisoria } from "@/components/conta/AvisoSenhaProvisoria";
import { useNaoLidas } from "@/hooks/useNotificacoes";
import { RegistroRapidoProvider, useRegistroRapido } from "@/hooks/useRegistroRapido";
import { Logo } from "@/components/comum/Logo";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { PAPEIS } from "@/lib/rotulos";
import { SECOES_INTERNAS } from "@/lib/navegacao";
import { BarraAbas, MenuSecoes, filtrarSecoes } from "@/components/layout/Navegacao";

// Seções pela cadeia de valor do to-be (src/lib/navegacao.ts), filtradas pelo papel de quem entrou
function useSecoes() {
  const { perfil } = useAuth();
  return filtrarSecoes(SECOES_INTERNAS, (a) => !a.papeis || (!!perfil && a.papeis.includes(perfil.papel)));
}

function Navegacao({ onNavegar }: { onNavegar?: () => void }) {
  return <MenuSecoes secoes={useSecoes()} onNavegar={onNavegar} />;
}

function BarraUsuario() {
  const { perfil, sair } = useAuth();
  const navigate = useNavigate();
  return (
    <div className="border-t border-white/10 pt-4">
      <Link to="/app/conta" className="flex items-center gap-2 rounded-[8px] px-2 py-1 hover:bg-white/5">
        <UserCircle className="h-5 w-5 text-neutro-300" />
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold">{perfil?.nome}</p>
          <p className="truncate text-xs text-muted-foreground">{perfil ? PAPEIS[perfil.papel] : ""}{perfil?.is_diretor ? " · Diretor" : ""}</p>
        </div>
      </Link>
      <Button variant="ghost" size="sm" className="mt-2 w-full justify-start" onClick={async () => { await sair(); navigate("/entrar"); }}>
        <LogOut /> Sair
      </Button>
    </div>
  );
}

function BotaoRegistro({ className }: { className?: string }) {
  const { abrir } = useRegistroRapido();
  const { perfil } = useAuth();
  if (!perfil || !["admin", "parcerias", "consultor"].includes(perfil.papel)) return null;
  return (
    <Button onClick={() => abrir()} className={className}>
      <Plus /> Registrar contato
    </Button>
  );
}

function Sino() {
  const { data: n = 0 } = useNaoLidas();
  return (
    <Link to="/app/notificacoes" className="relative rounded-full p-2 hover:bg-white/5" aria-label="Notificações">
      <Bell className="h-5 w-5" />
      {n > 0 && (
        <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-menta-500 px-1 text-[11px] font-bold text-neutro-900">
          {n > 99 ? "99+" : n}
        </span>
      )}
    </Link>
  );
}

function AbasDaSecao() {
  return <BarraAbas secoes={useSecoes()} />;
}

function Estrutura() {
  const [menu, setMenu] = useState(false);
  const { abrir } = useRegistroRapido();
  const { perfil } = useAuth();
  const podeRegistrar = !!perfil && ["admin", "parcerias", "consultor"].includes(perfil.papel);
  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[240px_1fr]">
      <aside className="sticky top-0 hidden h-screen flex-col justify-between border-r border-white/10 bg-neutro-900 p-4 lg:flex">
        <div className="space-y-6 overflow-y-auto">
          <Link to="/app" className="block px-2 pt-1">
            <Logo />
            <p className="mt-1 text-xs font-semibold uppercase tracking-wider text-menta-500">Wise Partners</p>
          </Link>
          <BotaoRegistro className="w-full" />
          <Navegacao />
        </div>
        <BarraUsuario />
      </aside>

      <div className="min-w-0">
        <header className="sticky top-0 z-30 flex items-center justify-between gap-2 border-b border-white/10 bg-background/90 px-4 py-3 backdrop-blur lg:justify-end">
          <div className="flex items-center gap-2 lg:hidden">
            <Sheet open={menu} onOpenChange={setMenu}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" aria-label="Menu"><Menu /></Button>
              </SheetTrigger>
              <SheetContent side="left" className="flex w-72 flex-col justify-between bg-neutro-900 p-4">
                <div className="space-y-6 overflow-y-auto">
                  <SheetTitle className="sr-only">Menu</SheetTitle>
                  <Logo />
                  <Navegacao onNavegar={() => setMenu(false)} />
                </div>
                <BarraUsuario />
              </SheetContent>
            </Sheet>
            <Link to="/app"><Logo className="h-6" /></Link>
          </div>
          <Sino />
        </header>
        <AvisoSenhaProvisoria />
        <main className="mx-auto w-full max-w-7xl px-4 pb-24 pt-4 sm:px-6">
          <AbasDaSecao />
          <Outlet />
        </main>
      </div>

      {podeRegistrar && (
        <Button
          onClick={() => abrir()}
          className="fixed bottom-5 right-5 z-40 h-14 w-14 rounded-full p-0 shadow-[0_0_24px_rgba(0,225,147,0.35)] lg:hidden"
          aria-label="Registrar contato"
        >
          <Plus className="!h-6 !w-6" />
        </Button>
      )}
    </div>
  );
}

export function AppLayout() {
  return (
    <RegistroRapidoProvider>
      <Estrutura />
    </RegistroRapidoProvider>
  );
}
