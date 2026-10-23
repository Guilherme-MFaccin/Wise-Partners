import { useState } from "react";
import { Link, NavLink, Outlet, useNavigate } from "react-router-dom";
import {
  Bell, BarChart3, Building2, Handshake, Wallet, FileSearch, Users2, Clock, Inbox, Upload, Settings, UserCog, Menu, LogOut, Plus, UserCircle,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useNaoLidas } from "@/hooks/useNotificacoes";
import { RegistroRapidoProvider, useRegistroRapido } from "@/hooks/useRegistroRapido";
import { Logo } from "@/components/comum/Logo";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { PAPEIS } from "@/lib/rotulos";

type Item = { to: string; rotulo: string; icone: any; papeis?: string[]; fim?: boolean };

const ITENS: Item[] = [
  { to: "/app", rotulo: "Painel", icone: BarChart3, fim: true },
  { to: "/app/parceiros", rotulo: "Parceiros", icone: Building2, papeis: ["admin", "parcerias", "consultor", "comercial", "financeiro"] },
  { to: "/app/indicacoes", rotulo: "Indicações", icone: Handshake, papeis: ["admin", "parcerias", "consultor", "comercial", "financeiro"] },
  { to: "/app/comissoes", rotulo: "Comissões", icone: Wallet, papeis: ["admin", "parcerias", "financeiro"] },
  { to: "/app/rfp", rotulo: "Pedidos de RFP", icone: FileSearch, papeis: ["admin", "parcerias", "consultor", "comercial"] },
  { to: "/app/base-ativa", rotulo: "Base Ativa", icone: Users2, papeis: ["admin", "parcerias", "consultor", "comercial"] },
  { to: "/app/atividades", rotulo: "Atividades", icone: Clock, papeis: ["admin", "parcerias", "consultor", "comercial"] },
  { to: "/app/pendencias", rotulo: "Pendências", icone: Inbox, papeis: ["admin", "parcerias"] },
  { to: "/app/importar", rotulo: "Importação", icone: Upload, papeis: ["admin"] },
  { to: "/app/configuracoes", rotulo: "Configurações", icone: Settings, papeis: ["admin", "parcerias"] },
  { to: "/app/usuarios", rotulo: "Usuários", icone: UserCog, papeis: ["admin", "parcerias"] },
];

function Navegacao({ onNavegar }: { onNavegar?: () => void }) {
  const { perfil } = useAuth();
  const itens = ITENS.filter((i) => !i.papeis || (perfil && i.papeis.includes(perfil.papel)));
  return (
    <nav className="flex flex-col gap-1">
      {itens.map((i) => (
        <NavLink
          key={i.to}
          to={i.to}
          end={i.fim}
          onClick={onNavegar}
          className={({ isActive }) =>
            cn(
              "flex items-center gap-3 rounded-[8px] px-3 py-2 text-sm font-medium text-neutro-300 transition-colors hover:bg-white/5 hover:text-white",
              isActive && "bg-menta-500/10 text-menta-400",
            )
          }
        >
          <i.icone className="h-4 w-4" />
          {i.rotulo}
        </NavLink>
      ))}
    </nav>
  );
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
        <main className="mx-auto w-full max-w-7xl px-4 py-6 pb-24 sm:px-6">
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
