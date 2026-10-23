import { supabase } from "@/integrations/supabase/client";
import { hojeISO } from "@/lib/formato";
import type { LinhaImportacao } from "./validacao";

export type ResultadoLinha = { numero: number; nome: string; ok: boolean; mensagem: string; parceiroId?: string };

function maisDias(iso: string, dias: number) {
  const d = new Date(iso + "T12:00:00");
  d.setDate(d.getDate() + dias);
  return d.toISOString().slice(0, 10);
}

function falhou(r: { error: any }) {
  if (r.error) throw r.error;
}

// Grava uma linha válida: parceiro, categorias, contato, próximo passo e anotações internas.
// Se algum passo falhar, desfaz o parceiro (exclusão em cascata) e o contato criado.
export async function gravarLinha(l: LinhaImportacao, responsavelId: string): Promise<ResultadoLinha> {
  const d = l.dados;
  let parceiroId: string | null = null;
  let contatoId: string | null = null;
  try {
    const p = await supabase.from("parceiros").insert({
      nome_fantasia: d.nome_fantasia, tipo_parceria: d.tipo_parceria, etapa: d.etapa, nivel: d.nivel, pacote: d.pacote,
      cidade: d.cidade, uf: d.uf, origem: d.origem, perfil_institucional: d.perfil_institucional,
      responsavel_id: responsavelId, created_by: responsavelId,
    }).select("id").single();
    falhou(p);
    parceiroId = p.data!.id as string;

    const categorias = [
      d.categoria_principal_id && { parceiro_id: parceiroId, categoria_id: d.categoria_principal_id, principal: true },
      d.categoria_secundaria_id && { parceiro_id: parceiroId, categoria_id: d.categoria_secundaria_id, principal: false },
    ].filter(Boolean);
    if (categorias.length) falhou(await supabase.from("parceiro_categorias").insert(categorias));

    if (d.contato) {
      const c = await supabase.from("contatos").insert(d.contato).select("id").single();
      falhou(c);
      contatoId = c.data!.id as string;
      falhou(await supabase.from("parceiro_contatos").insert({ parceiro_id: parceiroId, contato_id: contatoId, papeis: ["interlocutor"], principal: true }));
    }

    if (d.proximo_passo) {
      falhou(await supabase.from("proximos_passos").insert({
        parceiro_id: parceiroId, descricao: d.proximo_passo, data: maisDias(hojeISO(), 7), responsavel_id: responsavelId,
      }));
    }

    // A linha de dados internos é criada pelo gatilho do banco ao inserir o parceiro
    if (d.observacoes) falhou(await supabase.from("parceiros_interno").update({ anotacoes: d.observacoes }).eq("parceiro_id", parceiroId));

    return { numero: l.numero, nome: d.nome_fantasia, ok: true, mensagem: "Importado.", parceiroId };
  } catch (e: any) {
    if (parceiroId) await supabase.from("parceiros").delete().eq("id", parceiroId);
    if (contatoId) await supabase.from("contatos").delete().eq("id", contatoId);
    return { numero: l.numero, nome: d.nome_fantasia, ok: false, mensagem: e?.message ?? String(e) };
  }
}
