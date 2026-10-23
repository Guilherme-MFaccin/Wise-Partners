import { useQuery, type QueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { CampoDef } from "@/components/comum/CampoDinamico";
import { toastErro } from "@/lib/erros";

// Tipos e consultas compartilhadas pelas telas de parceiros. O cliente do Supabase não tem
// tipos gerados; os nomes de colunas seguem as migrações em supabase/migrations.

export type Parceiro = {
  id: string;
  razao_social: string | null;
  nome_fantasia: string;
  cnpj: string | null;
  site: string | null;
  cidade: string | null;
  uf: string | null;
  endereco: string | null;
  redes_sociais: Record<string, string> | null;
  tipo_parceria: "comercial" | "institucional";
  natureza_juridica: string | null;
  perfil_institucional: string | null;
  categoria_empresa: string | null;
  origem: string | null;
  responsavel_id: string | null;
  etapa: string;
  etapa_desde: string;
  motivo_perda: string | null;
  carteira_icp: number | null;
  nivel: string | null;
  nivel_sugerido: string | null;
  nivel_ajuste_motivo: string | null;
  pacote: string | null;
  status_atividade: string;
  motivo_inatividade: string | null;
  pausado_ate: string | null;
  ultimo_contato: string | null;
  data_assinatura: string | null;
  data_encerramento: string | null;
  autorizacao_marca: boolean;
  created_at: string;
};

export type Categoria = {
  id: string;
  nome: string;
  tipo: "comercial" | "institucional";
  perfil_institucional: string | null;
  ordem: number;
  ativa: boolean;
};

export type Etapa = { codigo: string; nome: string; ordem: number; perda: boolean };
export type Nivel = { tipo_parceria: string; codigo: string; nome: string; faixa_min: number | null; faixa_max: number | null };
export type Pacote = { codigo: string; nome: string; niveis_permitidos: string[]; ordem: number };
export type TipoAtividade = { id: string; nome: string; minutos: number; ordem: number; ativo: boolean };
export type PerfilResumo = { id: string; nome: string; email: string; papel: string; ativo: boolean };
export type ParceiroCategoria = { parceiro_id: string; categoria_id: string; principal: boolean };
export type ProximoPasso = {
  id: string;
  parceiro_id: string;
  descricao: string;
  data: string;
  responsavel_id: string | null;
  estado: "aberto" | "feito" | "vencido" | "substituido";
  concluido_em: string | null;
  created_at: string;
};

const CFG = { staleTime: 5 * 60_000 };

async function lista<T>(q: PromiseLike<{ data: any; error: any }>): Promise<T[]> {
  const { data, error } = await q;
  if (error) throw error;
  return (data ?? []) as T[];
}

// ---------------------------------------------------------------------------
// Configuração do programa
// ---------------------------------------------------------------------------
export function useCategorias() {
  return useQuery({
    queryKey: ["cfg", "categorias"],
    ...CFG,
    queryFn: () => lista<Categoria>(supabase.from("categorias").select("*").order("tipo").order("ordem").order("nome")),
  });
}

export function useEtapas() {
  return useQuery({
    queryKey: ["cfg", "etapas"],
    ...CFG,
    queryFn: () => lista<Etapa>(supabase.from("etapas_funil").select("*").order("ordem")),
  });
}

export function useNiveis() {
  return useQuery({
    queryKey: ["cfg", "niveis"],
    ...CFG,
    queryFn: () => lista<Nivel>(supabase.from("niveis").select("tipo_parceria, codigo, nome, faixa_min, faixa_max")),
  });
}

export function usePacotes() {
  return useQuery({
    queryKey: ["cfg", "pacotes"],
    ...CFG,
    queryFn: () => lista<Pacote>(supabase.from("pacotes").select("codigo, nome, niveis_permitidos, ordem").order("ordem")),
  });
}

export function useTiposAtividade() {
  return useQuery({
    queryKey: ["cfg", "tipos-atividade"],
    ...CFG,
    queryFn: () => lista<TipoAtividade>(supabase.from("tipos_atividade").select("*").order("ordem")),
  });
}

// Campos configuráveis ativos (perfil comum, perfil institucional e campos de categoria).
export function useCampos() {
  return useQuery({
    queryKey: ["cfg", "campos"],
    ...CFG,
    queryFn: async () => {
      const rows = await lista<any>(supabase.from("campos_categoria").select("*").eq("ativo", true).order("ordem"));
      return rows.map((c) => ({ ...c, opcoes: Array.isArray(c.opcoes) ? c.opcoes : [] })) as CampoDef[];
    },
  });
}

// Perfis visíveis ao usuário (a RLS limita). Usado para nomes de responsáveis e autores.
export function usePerfis() {
  return useQuery({
    queryKey: ["perfis-resumo"],
    ...CFG,
    queryFn: () => lista<PerfilResumo>(supabase.from("perfis").select("id, nome, email, papel, ativo").order("nome")),
  });
}

export function perfisInternos(perfis: PerfilResumo[]) {
  return perfis.filter((p) => p.ativo && p.papel !== "parceiro" && p.papel !== "financeiro");
}

export function nomePerfil(perfis: PerfilResumo[] | undefined, id: string | null | undefined) {
  if (!id) return "";
  return perfis?.find((p) => p.id === id)?.nome ?? "";
}

// ---------------------------------------------------------------------------
// Regras espelhadas do banco (só para orientar o usuário; o banco decide)
// ---------------------------------------------------------------------------

// Mesma regra da função nivel_sugerido do banco: só parceria comercial.
export function calcularNivelSugerido(niveis: Nivel[], tipo: string, carteira: number | null | undefined): string | null {
  if (tipo !== "comercial" || carteira === null || carteira === undefined || Number.isNaN(carteira)) return null;
  const candidatos = niveis
    .filter((n) => n.tipo_parceria === "comercial")
    .filter((n) => carteira >= (n.faixa_min ?? 0) && (n.faixa_max === null || carteira <= n.faixa_max))
    .sort((a, b) => (b.faixa_min ?? -1) - (a.faixa_min ?? -1));
  return candidatos[0]?.codigo ?? null;
}

export function pacotesDoNivel(pacotes: Pacote[], nivel: string | null | undefined) {
  if (!nivel) return [];
  return pacotes.filter((p) => p.niveis_permitidos.includes(nivel));
}

export function etapaPerda(etapas: Etapa[] | undefined, codigo: string | null | undefined) {
  return !!etapas?.find((e) => e.codigo === codigo)?.perda;
}

// Assinado: data de assinatura registrada e etapa que não é perda (função parceiro_assinado do banco).
export function isAssinado(p: Pick<Parceiro, "data_assinatura" | "etapa">, etapas: Etapa[] | undefined) {
  return !!p.data_assinatura && !etapaPerda(etapas, p.etapa);
}

export function podeRegistrarContato(papel: string | null | undefined) {
  return !!papel && ["admin", "parcerias", "consultor"].includes(papel);
}

// Leitura de dados internos (estratégico, anotações): todos os internos menos financeiro.
export function leInterno(papel: string | null | undefined) {
  return !!papel && ["admin", "parcerias", "consultor", "comercial"].includes(papel);
}

// ---------------------------------------------------------------------------
// Parceiro e dados da ficha
// ---------------------------------------------------------------------------
export function useParceiro(id: string | null | undefined) {
  return useQuery({
    queryKey: ["parceiro", id],
    enabled: !!id,
    queryFn: async () => {
      const { data, error } = await supabase.from("parceiros").select("*").eq("id", id).maybeSingle();
      if (error) throw error;
      return (data ?? null) as Parceiro | null;
    },
  });
}

export function useParceiroCategorias(id: string | null | undefined) {
  return useQuery({
    queryKey: ["parceiro", id, "categorias"],
    enabled: !!id,
    queryFn: () => lista<ParceiroCategoria>(supabase.from("parceiro_categorias").select("*").eq("parceiro_id", id)),
  });
}

export function useParceiroCampos(id: string | null | undefined) {
  return useQuery({
    queryKey: ["parceiro", id, "campos"],
    enabled: !!id,
    queryFn: () =>
      lista<{ campo_id: string; valor: any; versao: number; updated_at: string }>(
        supabase.from("parceiro_campos").select("campo_id, valor, versao, updated_at").eq("parceiro_id", id),
      ),
  });
}

export function useProximosPassos(id: string | null | undefined) {
  return useQuery({
    queryKey: ["parceiro", id, "proximos"],
    enabled: !!id,
    queryFn: () =>
      lista<ProximoPasso>(supabase.from("proximos_passos").select("*").eq("parceiro_id", id).order("created_at", { ascending: false })),
  });
}

export function passoAtivo(passos: ProximoPasso[] | undefined) {
  return passos?.find((p) => p.estado === "aberto" || p.estado === "vencido") ?? null;
}

// Invalida tudo o que depende de um parceiro (ficha, linha do tempo e listas).
export function invalidarParceiro(qc: QueryClient, id: string | null | undefined) {
  if (id) {
    qc.invalidateQueries({ queryKey: ["parceiro", id] });
    qc.invalidateQueries({ queryKey: ["timeline", id] });
  }
  qc.invalidateQueries({ queryKey: ["parceiros"] });
  qc.invalidateQueries({ queryKey: ["parceiros-resumo"] });
}

// ---------------------------------------------------------------------------
// Arquivos
// ---------------------------------------------------------------------------
export function nomeArquivoSeguro(nome: string) {
  const limpo = nome
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9._-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
  return limpo || "arquivo";
}

// Abre um arquivo privado por URL assinada de 5 minutos.
export async function abrirArquivo(bucket: string, caminho: string) {
  const { data, error } = await supabase.storage.from(bucket).createSignedUrl(caminho, 300);
  if (error || !data?.signedUrl) {
    toastErro(error ?? new Error("Não foi possível gerar o link do arquivo."));
    return;
  }
  window.open(data.signedUrl, "_blank", "noopener");
}

// Valor de campo considerado preenchido
export function preenchido(v: any) {
  if (v === null || v === undefined) return false;
  if (typeof v === "string") return v.trim() !== "";
  if (Array.isArray(v)) return v.length > 0;
  return true;
}

// Texto sem acentos e em minúsculas, para buscas
export function normalizar(t: string | null | undefined) {
  return (t ?? "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
}

// ---------------------------------------------------------------------------
// Carteira (lista de parceiros com vínculos), carregada em poucas consultas e filtrada em memória
// ---------------------------------------------------------------------------
export type ParceiroLista = Pick<
  Parceiro,
  | "id" | "nome_fantasia" | "razao_social" | "cnpj" | "cidade" | "uf" | "tipo_parceria" | "perfil_institucional" | "natureza_juridica"
  | "etapa" | "nivel" | "pacote" | "status_atividade" | "responsavel_id" | "data_assinatura" | "ultimo_contato" | "motivo_perda"
>;

const COLUNAS_LISTA =
  "id, nome_fantasia, razao_social, cnpj, cidade, uf, tipo_parceria, perfil_institucional, natureza_juridica, etapa, nivel, pacote, status_atividade, responsavel_id, data_assinatura, ultimo_contato, motivo_perda";

export function useCarteira() {
  const parceiros = useQuery({
    queryKey: ["parceiros", "lista"],
    queryFn: () => lista<ParceiroLista>(supabase.from("parceiros").select(COLUNAS_LISTA).order("nome_fantasia")),
  });
  const vinculos = useQuery({
    queryKey: ["parceiros", "categorias"],
    queryFn: () => lista<ParceiroCategoria>(supabase.from("parceiro_categorias").select("*")),
  });
  // Contatos para a busca por nome ou e-mail (vazio para quem não pode ler contatos)
  const contatos = useQuery({
    queryKey: ["parceiros", "contatos"],
    queryFn: () =>
      lista<{ parceiro_id: string; contatos: { nome: string; email: string | null } | null }>(
        supabase.from("parceiro_contatos").select("parceiro_id, contatos(nome, email)"),
      ),
  });
  const passos = useQuery({
    queryKey: ["parceiros", "proximos-ativos"],
    queryFn: () =>
      lista<ProximoPasso>(supabase.from("proximos_passos").select("*").in("estado", ["aberto", "vencido"])),
  });
  return { parceiros, vinculos, contatos, passos };
}
