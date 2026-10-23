import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

export type Perfil = {
  id: string;
  nome: string;
  email: string;
  telefone: string | null;
  papel: "admin" | "parcerias" | "consultor" | "comercial" | "financeiro" | "parceiro";
  empresa_grupo_id: string | null;
  parceiro_id: string | null;
  is_diretor: boolean;
  is_responsavel_parceiro: boolean;
  ativo: boolean;
  alertas_desativados: string[];
};

type AuthCtx = {
  session: Session | null;
  perfil: Perfil | null;
  carregando: boolean;
  recarregarPerfil: () => Promise<void>;
  sair: () => Promise<void>;
  // Atalhos de papel (a interface só esconde; a proteção real é a RLS)
  isAdmin: boolean;
  isParcerias: boolean; // admin ou time de parcerias
  veComissao: boolean;
  isInterno: boolean;
  isParceiro: boolean;
};

const Ctx = createContext<AuthCtx | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [perfil, setPerfil] = useState<Perfil | null>(null);
  const [carregando, setCarregando] = useState(true);

  async function carregarPerfil(s: Session | null) {
    if (!s) {
      setPerfil(null);
      return;
    }
    const { data } = await supabase.from("perfis").select("*").eq("id", s.user.id).maybeSingle();
    setPerfil(data && data.ativo ? (data as Perfil) : null);
  }

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((_ev, s) => {
      setSession(s);
      // Evita chamar o Supabase dentro do callback de autenticação
      setTimeout(() => carregarPerfil(s).finally(() => setCarregando(false)), 0);
    });
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      carregarPerfil(data.session).finally(() => setCarregando(false));
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  const papel = perfil?.papel;
  const value: AuthCtx = {
    session,
    perfil,
    carregando,
    recarregarPerfil: () => carregarPerfil(session),
    sair: async () => {
      await supabase.auth.signOut();
      setPerfil(null);
    },
    isAdmin: papel === "admin",
    isParcerias: papel === "admin" || papel === "parcerias",
    veComissao: papel === "admin" || papel === "parcerias",
    isInterno: !!papel && papel !== "parceiro",
    isParceiro: papel === "parceiro",
  };
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAuth() {
  const c = useContext(Ctx);
  if (!c) throw new Error("useAuth fora do AuthProvider");
  return c;
}
