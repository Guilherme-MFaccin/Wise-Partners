import { useState } from "react";
import { Link, NavLink, Outlet, useNavigate } from "react-router-dom";
import {
  Award, Bell, BookOpen, FileSearch, GraduationCap, Handshake, Home, IdCard, LogOut, Megaphone, Menu, MessageSquareHeart,
  Rocket, Scale, Send, Shuffle, Sparkles, Trophy, Users, CalendarCheck,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useNaoLidas } from "@/hooks/useNotificacoes";
import { Logo } from "@/components/comum/Logo";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { useMeuParceiro } from "@/components/portal/dados";
import { useComunicadosNaoLidos, usePlanoOnboarding } from "@/components/portal/dadosV2";

type Item = {
  to: string;
  rotulo: string;
  icone: any;
  fim?: boolean;
  responsavel?: boolean;   // só o responsável do parceiro
  onboarding?: boolean;    // só enquanto existe plano de onboarding
  comercial?: boolean;     // só parceria comercial
  contador?: "comunicados";
};

const ITENS: Item[] = [
  { to: "/parceiro", rotulo: "Início", icone: Home, fim: true },
  { to: "/parceiro/nivel", rotulo: "Meu nível", icone: Award },
  { to: "/parceiro/parceria", rotulo: "Nossa parceria", icone: Sparkles },
  { to: "/parceiro/onboarding", rotulo: "Onboarding", icone: Rocket, onboarding: true },
  { to: "/parceiro/capacitacao", rotulo: "Capacitação", icone: GraduationCap },
  { to: "/parceiro/indicar", rotulo: "Indicar", icone: Send },
  { to: "/parceiro/indicacoes", rotulo: "Indicações", icone: Handshake },
  { to: "/parceiro/acoes", rotulo: "Ações conjuntas", icone: CalendarCheck },
  { to: "/parceiro/rfps", rotulo: "Pedidos de RFP", icone: FileSearch },
  { to: "/parceiro/ficha", rotulo: "Ficha de apresentação", icone: IdCard },
  { to: "/parceiro/materiais", rotulo: "Materiais e agenda", icone: BookOpen },
  { to: "/parceiro/regras", rotulo: "Regras do programa", icone: Scale },
  { to: "/parceiro/comunicados", rotulo: "Comunicados", icone: Megaphone, contador: "comunicados" },
  { to: "/parceiro/ranking", rotulo: "Ranking", icone: Trophy },
  { to: "/parceiro/pesquisa", rotulo: "Pesquisa", icone: MessageSquareHeart },
  { to: "/parceiro/cruzamento", rotulo: "Cruzamento", icone: Shuffle, comercial: true },
  { to: "/parceiro/usuarios", rotulo: "Usuários", icone: Users, responsavel: true },
];

function Navegacao({ onNavegar }: { onNavegar?: () => void }) {
  const { perfil } = useAuth();
  const parceiroQ = useMeuParceiro();
  const onboardingQ = usePlanoOnboarding();
  const { data: naoLidos = 0 } = useComunicadosNaoLidos();
  const temPlano = !!onboardingQ.data?.plano;
  const comercial = parceiroQ.data?.tipo_parceria === "comercial";
  const itens = ITENS.filter((i) =>
    (!i.responsavel || perfil?.is_responsavel_parceiro) && (!i.onboarding || temPlano) && (!i.comercial || comercial));
  return (
    <nav className="flex flex-col gap-0.5">
      {itens.map((i) => (
        <NavLink key={i.to} to={i.to} end={i.fim} onClick={onNavegar}
          className={({ isActive }) => cn(
            "flex items-center gap-3 rounded-[8px] px-3 py-2 text-sm font-medium text-neutro-300 hover:bg-white/5 hover:text-white",
            isActive && "bg-menta-500/10 text-menta-400")}>
          <i.icone className="h-4 w-4 shrink-0" />
          <span className="min-w-0 flex-1 truncate">{i.rotulo}</span>
          {i.contador === "comunicados" && naoLidos > 0 && (
            <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-menta-500 px-1 text-[11px] font-bold text-neutro-900"
              aria-label={`${naoLidos} não lidos`}>{naoLidos}</span>
          )}
        </NavLink>
      ))}
    </nav>
  );
}

export function ParceiroLayout() {
  const { perfil, sair } = useAuth();
  const navigate = useNavigate();
  const [menu, setMenu] = useState(false);
  const { data: n = 0 } = useNaoLidas();
  const rodape = (
    <div className="shrink-0 border-t border-white/10 pt-4">
      <p className="truncate px-2 text-sm font-semibold">{perfil?.nome}</p>
      <p className="truncate px-2 text-xs text-muted-foreground">{perfil?.email}</p>
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
          <p className="mt-1 text-xs font-semibold uppercase tracking-wider text-menta-500">Portal do parceiro</p>
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
        <main className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6"><Outlet /></main>
      </div>
    </div>
  );
}
