import { supabase } from "@/integrations/supabase/client";

// Chama a Edge Function ai-gateway. A IA nunca grava nada: o resultado volta para revisão do usuário.
export type TarefaIA =
  | "resumir_contato"
  | "ler_print"
  | "extrair_dossie"
  | "recomendar_rfp"
  | "montar_pagina_rfp"
  | "pauta_semanal";

export async function chamarIA<T = any>(tarefa: TarefaIA, entrada: Record<string, any>): Promise<T> {
  const { data, error } = await supabase.functions.invoke("ai-gateway", { body: { tarefa, entrada } });
  if (error) {
    let msg = error.message;
    try {
      const corpo = await (error as any).context?.json?.();
      if (corpo?.erro) msg = corpo.erro;
    } catch {
      /* mantém a mensagem original */
    }
    throw new Error(msg || "Falha ao chamar a IA.");
  }
  if (data?.erro) throw new Error(data.erro);
  return data.resultado as T;
}

// Converte um arquivo em base64 (sem o prefixo data:), para imagens e PDFs enviados à IA.
export function arquivoParaBase64(arquivo: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result).split(",")[1] ?? "");
    r.onerror = reject;
    r.readAsDataURL(arquivo);
  });
}

// ---------------------------------------------------------------------------
// Formatos de entrada e saída de cada tarefa (validados por zod na Edge Function)
// ---------------------------------------------------------------------------

// resumir_contato: entrada { texto, parceiro: { nome, etapa, nivel, pacote, proximo_passo, campos }, hoje: "AAAA-MM-DD" }
export type ResultadoResumo = {
  resumo: string;
  decisoes: string[];
  pendencias_wise: string[];
  pendencias_parceiro: string[];
  proximo_passo: { descricao: string; data: string | null } | null; // data AAAA-MM-DD
  sugestoes_ficha: { campo: string; valor: string; motivo: string }[]; // campo = rótulo legível (ex.: "Carteira no ICP")
  tipo_contato_sugerido: string | null; // um dos códigos de TIPOS_CONTATO
};

// ler_print: entrada { imagem_base64, mime }
export type ResultadoPrint = {
  mensagens: { autor: string; data: string | null; texto: string }[];
  texto_corrido: string;
};

// extrair_dossie: entrada { pdf_base64?, texto?, campos_disponiveis: { chave, rotulo }[] }
export type ResultadoDossie = {
  resumo: string;
  empresa: { razao_social: string | null; nome_fantasia: string | null; cnpj: string | null; site: string | null; cidade: string | null; uf: string | null; endereco: string | null };
  contatos: { nome: string; cargo: string | null; email: string | null; telefone: string | null; papel: string | null }[];
  linha_do_tempo: { data: string | null; descricao: string }[];
  pendencias: string[];
  campos: Record<string, string>; // chave do campo -> valor sugerido
};

// recomendar_rfp: entrada { necessidade, porte, regiao, prazo, restricoes, categorias: {id, nome}[], candidatos: rfp_candidatos() }
export type ResultadoRecomendacao = {
  necessidade_resumida: string; // frase curta usada na mensagem do WhatsApp ("preciso resolver ...")
  categorias: { categoria_id: string; motivo: string; parceiros: { parceiro_id: string; aderencia: number; justificativa: string }[] }[];
  sem_fornecedor: { necessidade: string; categoria_sugerida: string | null }[];
};

// Blocos padronizados da página de RFP
export type BlocoRfp =
  | { tipo: "abertura"; titulo: string; texto: string }
  | { tipo: "categoria"; categoria_id: string; titulo: string; texto: string; parceiros: { parceiro_id: string; nome: string; texto: string; destaques: string[] }[] }
  | { tipo: "aviso"; texto: string }
  | { tipo: "consultor"; nome: string; email: string | null; telefone: string | null; texto: string };

// montar_pagina_rfp: entrada { pedido: { cliente_nome, necessidade, necessidade_resumida }, consultor: { nome, email, telefone },
//   categorias: { categoria_id, nome, parceiros: { parceiro_id, nome, visao_wise, o_que_faz, diferenciais, para_quem, cases }[] }[], aviso }
export type ResultadoPagina = { blocos: BlocoRfp[] };

// pauta_semanal: entrada { painel: resultado de painel_semanal() }
export type ResultadoPauta = { pauta: string };
