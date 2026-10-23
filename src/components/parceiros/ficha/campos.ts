import type { CampoDef } from "@/components/comum/CampoDinamico";
import { PERFIS_INSTITUCIONAIS } from "@/lib/rotulos";
import type { Categoria, Parceiro, ParceiroCategoria } from "../dados";

// Campos da ficha de apresentação (perfil comum com marcação RFP), na ordem da página do cliente.
export const CHAVES_APRESENTACAO = [
  "o_que_faz", "diferenciais", "visao_wise", "para_quem", "segmentos", "porte_cliente", "regioes", "atendimento",
  "cases", "materiais", "whatsapp_comercial", "email_comercial",
];

export type GrupoCampos = { chave: string; titulo: string; principal?: boolean; campos: CampoDef[] };

// Agrupa os campos que valem para o parceiro: comercial = perfil comum + cada categoria (principal
// primeiro); institucional = perfil comum institucional + campos do perfil institucional.
export function gruposDoParceiro(
  parceiro: Pick<Parceiro, "tipo_parceria" | "perfil_institucional">,
  campos: CampoDef[],
  vinculos: ParceiroCategoria[],
  categorias: Categoria[],
): GrupoCampos[] {
  const ordenar = (l: CampoDef[]) => [...l].sort((a, b) => a.ordem - b.ordem);
  if (parceiro.tipo_parceria === "institucional") {
    const grupos: GrupoCampos[] = [
      { chave: "comum_institucional", titulo: "Perfil comum institucional", campos: ordenar(campos.filter((c) => c.escopo === "comum_institucional")) },
    ];
    if (parceiro.perfil_institucional) {
      grupos.push({
        chave: `perfil_${parceiro.perfil_institucional}`,
        titulo: `Perfil ${PERFIS_INSTITUCIONAIS[parceiro.perfil_institucional] ?? parceiro.perfil_institucional}`,
        campos: ordenar(campos.filter((c) => c.escopo === "perfil" && c.perfil_institucional === parceiro.perfil_institucional)),
      });
    }
    return grupos;
  }
  const grupos: GrupoCampos[] = [
    { chave: "comum_comercial", titulo: "Perfil comum", campos: ordenar(campos.filter((c) => c.escopo === "comum_comercial")) },
  ];
  const ordenados = [...vinculos].sort((a, b) => Number(b.principal) - Number(a.principal));
  for (const v of ordenados) {
    const cat = categorias.find((c) => c.id === v.categoria_id);
    grupos.push({
      chave: v.categoria_id,
      titulo: cat?.nome ?? "Categoria",
      principal: v.principal,
      campos: ordenar(campos.filter((c) => c.escopo === "categoria" && c.categoria_id === v.categoria_id)),
    });
  }
  return grupos;
}

// Converte um texto sugerido (IA) no formato do campo
export function converterValor(campo: CampoDef, texto: string): any {
  const t = (texto ?? "").trim();
  if (!t) return null;
  switch (campo.tipo) {
    case "numero":
    case "valor": {
      const n = Number(t.replace(/[^\d,.-]/g, "").replace(/\.(?=\d{3})/g, "").replace(",", "."));
      return Number.isFinite(n) ? n : null;
    }
    case "sim_nao":
      return /^(s|sim|yes|true)/i.test(t);
    case "multipla": {
      const partes = t.split(/[;,\n]/).map((x) => x.trim()).filter(Boolean);
      // Usa a grafia das opções configuradas quando houver correspondência
      return partes.map((p) => campo.opcoes.find((o) => o.toLowerCase() === p.toLowerCase()) ?? p);
    }
    case "lista":
    case "faixa":
      return campo.opcoes.find((o) => o.toLowerCase() === t.toLowerCase()) ?? t;
    default:
      return t;
  }
}
