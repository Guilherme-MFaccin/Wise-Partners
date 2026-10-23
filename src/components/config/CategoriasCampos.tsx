import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ok } from "@/lib/erros";
import { PERFIS_INSTITUCIONAIS, TIPOS_CAMPO, TIPOS_PARCERIA } from "@/lib/rotulos";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TabelaConfig, type ColunaConfig, type Opcao } from "./TabelaConfig";

const op = (m: Record<string, string>): Opcao[] => Object.entries(m).map(([valor, rotulo]) => ({ valor, rotulo }));

const COL_CATEGORIAS: ColunaConfig[] = [
  { chave: "nome", rotulo: "Nome", tipo: "texto", obrigatoria: true },
  { chave: "tipo", rotulo: "Tipo", tipo: "select", opcoes: op(TIPOS_PARCERIA), obrigatoria: true },
  { chave: "perfil_institucional", rotulo: "Perfil institucional", tipo: "select", opcoes: op(PERFIS_INSTITUCIONAIS), visivel: (l) => l.tipo === "institucional" },
  { chave: "ordem", rotulo: "Ordem", tipo: "numero" },
  { chave: "ativa", rotulo: "Ativa", tipo: "booleano" },
];
const NOVA_CATEGORIA = { nome: "", tipo: "comercial", perfil_institucional: null, ordem: 99, ativa: true };

const COM_OPCOES = ["faixa", "lista", "multipla"];
const COL_CAMPOS: ColunaConfig[] = [
  { chave: "rotulo", rotulo: "Rótulo", tipo: "texto", obrigatoria: true },
  { chave: "chave", rotulo: "Chave", tipo: "texto", fixaAposCriar: true, obrigatoria: true, ajuda: "Sem espaços. Definida na criação." },
  { chave: "tipo", rotulo: "Tipo", tipo: "select", opcoes: op(TIPOS_CAMPO), obrigatoria: true },
  { chave: "opcoes", rotulo: "Opções (uma por linha)", tipo: "linhas", visivel: (l) => COM_OPCOES.includes(l.tipo) },
  { chave: "observacao", rotulo: "Observação", tipo: "texto", larga: true },
  { chave: "obrigatorio", rotulo: "Obrigatório", tipo: "booleano" },
  { chave: "uso_rfp", rotulo: "Usado na recomendação de RFP", tipo: "booleano" },
  { chave: "interno", rotulo: "Interno (nunca aparece ao parceiro)", tipo: "booleano" },
  { chave: "parceiro_edita", rotulo: "Parceiro pode propor alteração", tipo: "booleano" },
  { chave: "ativo", rotulo: "Ativo", tipo: "booleano" },
];

type Escopo = "comum_comercial" | "comum_institucional" | "perfil" | "categoria";
const ESCOPOS: Record<Escopo, string> = {
  comum_comercial: "Perfil comum comercial",
  comum_institucional: "Perfil comum institucional",
  perfil: "Por perfil institucional",
  categoria: "Por categoria",
};

// Categorias e campos configuráveis da ficha (categorias-campos.md). Campos não são excluídos:
// desativar preserva os valores já preenchidos.
export function CategoriasCampos({ somenteLeitura }: { somenteLeitura: boolean }) {
  const [escopo, setEscopo] = useState<Escopo>("comum_comercial");
  const [perfil, setPerfil] = useState("ecossistema");
  const [categoria, setCategoria] = useState<string>("");
  const { data: categorias = [] } = useQuery({
    queryKey: ["config", "categorias", null],
    queryFn: async () => ok<any>(await supabase.from("categorias").select("*").order("ordem")) as { id: string; nome: string; tipo: string }[],
  });

  const filtro = useMemo(() => {
    if (escopo === "perfil") return { escopo, categoria_id: null, perfil_institucional: perfil };
    if (escopo === "categoria") return { escopo, categoria_id: categoria || "00000000-0000-0000-0000-000000000000", perfil_institucional: null };
    return { escopo, categoria_id: null, perfil_institucional: null };
  }, [escopo, perfil, categoria]);
  const novo = useMemo(() => ({
    ...filtro, chave: "", rotulo: "", tipo: "texto_curto", opcoes: [], observacao: null, obrigatorio: false, uso_rfp: false,
    interno: false, parceiro_edita: true, ordem: 999, ativo: true,
  }), [filtro]);

  return (
    <div className="space-y-8">
      <section>
        <h3 className="mb-2 font-semibold">Categorias</h3>
        <TabelaConfig tabela="categorias" pk={["id"]} colunas={COL_CATEGORIAS} novo={NOVA_CATEGORIA} recolhido
          tituloItem={(l) => `${l.ativa ? "" : "(inativa) "}${l.nome} · ${TIPOS_PARCERIA[l.tipo] ?? l.tipo}`} somenteLeitura={somenteLeitura} />
      </section>

      <section className="space-y-3">
        <h3 className="font-semibold">Campos da ficha</h3>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label>Escopo</Label>
            <Select value={escopo} onValueChange={(v) => setEscopo(v as Escopo)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {Object.entries(ESCOPOS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          {escopo === "perfil" && (
            <div className="space-y-1.5">
              <Label>Perfil institucional</Label>
              <Select value={perfil} onValueChange={setPerfil}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(PERFIS_INSTITUCIONAIS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          )}
          {escopo === "categoria" && (
            <div className="space-y-1.5">
              <Label>Categoria</Label>
              <Select value={categoria} onValueChange={setCategoria}>
                <SelectTrigger><SelectValue placeholder="Selecione a categoria" /></SelectTrigger>
                <SelectContent>
                  {categorias.map((c) => <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>
        {escopo === "categoria" && !categoria ? (
          <p className="text-sm text-muted-foreground">Escolha uma categoria para ver os campos.</p>
        ) : (
          <TabelaConfig key={JSON.stringify(filtro)} tabela="campos_categoria" pk={["id"]} colunas={COL_CAMPOS} filtro={filtro} novo={novo}
            reordenar recolhido somenteLeitura={somenteLeitura} vazio="Nenhum campo neste escopo."
            tituloItem={(l) => `${l.ativo ? "" : "(inativo) "}${l.rotulo} · ${TIPOS_CAMPO[l.tipo] ?? l.tipo}${l.interno ? " · interno" : ""}`} />
        )}
      </section>
    </div>
  );
}
