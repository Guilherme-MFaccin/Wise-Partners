import { lazy, Suspense, type ReactNode } from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/hooks/useAuth";
import { AppLayout } from "@/components/layout/AppLayout";
import { ParceiroLayout } from "@/components/layout/ParceiroLayout";
import { Carregando } from "@/components/comum/Estados";
import Entrar from "@/pages/Entrar";
import SemAcesso from "@/pages/SemAcesso";
import NaoEncontrada from "@/pages/NaoEncontrada";

const Painel = lazy(() => import("@/pages/app/Painel"));
const Parceiros = lazy(() => import("@/pages/app/Parceiros"));
const FichaParceiro = lazy(() => import("@/pages/app/FichaParceiro"));
const Indicacoes = lazy(() => import("@/pages/app/Indicacoes"));
const Comissoes = lazy(() => import("@/pages/app/Comissoes"));
const Rfps = lazy(() => import("@/pages/app/Rfps"));
const RfpDetalhe = lazy(() => import("@/pages/app/RfpDetalhe"));
const BaseAtiva = lazy(() => import("@/pages/app/BaseAtiva"));
const Atividades = lazy(() => import("@/pages/app/Atividades"));
const Pendencias = lazy(() => import("@/pages/app/Pendencias"));
const Importar = lazy(() => import("@/pages/app/Importar"));
const Configuracoes = lazy(() => import("@/pages/app/Configuracoes"));
const Usuarios = lazy(() => import("@/pages/app/Usuarios"));
const Conta = lazy(() => import("@/pages/Conta"));
const Notificacoes = lazy(() => import("@/pages/Notificacoes"));

const PInicio = lazy(() => import("@/pages/parceiro/Inicio"));
const PContrapartidas = lazy(() => import("@/pages/parceiro/Contrapartidas"));
const PIndicacoes = lazy(() => import("@/pages/parceiro/Indicacoes"));
const PRfps = lazy(() => import("@/pages/parceiro/Rfps"));
const PFicha = lazy(() => import("@/pages/parceiro/Ficha"));
const PMateriais = lazy(() => import("@/pages/parceiro/Materiais"));
const PUsuarios = lazy(() => import("@/pages/parceiro/Usuarios"));

const PaginaRfp = lazy(() => import("@/pages/publico/PaginaRfp"));

const queryClient = new QueryClient({ defaultOptions: { queries: { staleTime: 30_000, retry: 1, refetchOnWindowFocus: false } } });

// A interface só direciona; a proteção dos dados é a RLS do banco.
function Protegida({ publico, children }: { publico: "interno" | "parceiro"; children: ReactNode }) {
  const { session, perfil, carregando } = useAuth();
  if (carregando) return <Carregando />;
  if (!session) return <Navigate to="/entrar" replace />;
  if (!perfil) return <SemAcesso />;
  if (publico === "interno" && perfil.papel === "parceiro") return <Navigate to="/parceiro" replace />;
  if (publico === "parceiro" && perfil.papel !== "parceiro") return <Navigate to="/app" replace />;
  return <>{children}</>;
}

function Inicio() {
  const { session, perfil, carregando } = useAuth();
  if (carregando) return <Carregando />;
  if (!session) return <Navigate to="/entrar" replace />;
  if (!perfil) return <SemAcesso />;
  return <Navigate to={perfil.papel === "parceiro" ? "/parceiro" : "/app"} replace />;
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          <BrowserRouter>
            <Suspense fallback={<Carregando />}>
              <Routes>
                <Route path="/" element={<Inicio />} />
                <Route path="/entrar" element={<Entrar />} />
                <Route path="/r/:token" element={<PaginaRfp />} />
                <Route path="/app" element={<Protegida publico="interno"><AppLayout /></Protegida>}>
                  <Route index element={<Painel />} />
                  <Route path="parceiros" element={<Parceiros />} />
                  <Route path="parceiros/:id" element={<FichaParceiro />} />
                  <Route path="indicacoes" element={<Indicacoes />} />
                  <Route path="comissoes" element={<Comissoes />} />
                  <Route path="rfp" element={<Rfps />} />
                  <Route path="rfp/:id" element={<RfpDetalhe />} />
                  <Route path="base-ativa" element={<BaseAtiva />} />
                  <Route path="atividades" element={<Atividades />} />
                  <Route path="pendencias" element={<Pendencias />} />
                  <Route path="importar" element={<Importar />} />
                  <Route path="configuracoes" element={<Configuracoes />} />
                  <Route path="usuarios" element={<Usuarios />} />
                  <Route path="conta" element={<Conta />} />
                  <Route path="notificacoes" element={<Notificacoes />} />
                </Route>
                <Route path="/parceiro" element={<Protegida publico="parceiro"><ParceiroLayout /></Protegida>}>
                  <Route index element={<PInicio />} />
                  <Route path="contrapartidas" element={<PContrapartidas />} />
                  <Route path="indicacoes" element={<PIndicacoes />} />
                  <Route path="rfps" element={<PRfps />} />
                  <Route path="ficha" element={<PFicha />} />
                  <Route path="materiais" element={<PMateriais />} />
                  <Route path="usuarios" element={<PUsuarios />} />
                  <Route path="notificacoes" element={<Notificacoes />} />
                </Route>
                <Route path="*" element={<NaoEncontrada />} />
              </Routes>
            </Suspense>
          </BrowserRouter>
          <Toaster richColors position="top-center" />
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}
