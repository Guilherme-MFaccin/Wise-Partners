// Gateway único de IA (briefing técnico, seção 5). Recebe { tarefa, entrada }, chama o provedor
// configurado (AI_PROVIDER, AI_API_KEY, AI_MODEL) e devolve JSON validado por zod.
// A IA nunca grava nada: o resultado volta para revisão do usuário.
import { z } from "npm:zod@3";
import { extractText, getDocumentProxy } from "npm:unpdf@1.9.1";
import { cors, erro, json } from "../_shared/cors.ts";
import { perfilDaRequisicao } from "../_shared/supabase.ts";
import { limparProfundo } from "../_shared/texto.ts";

const REGRAS = `Você trabalha para o programa Wise Partners, da Wise Makers, consultoria de estruturação comercial de Maringá/PR.
Regras obrigatórias:
- Responda apenas com um objeto JSON válido, exatamente no formato pedido, sem texto fora do JSON.
- Escreva em português do Brasil, claro e direto.
- Nunca use travessão nem meia-risca. Use vírgula, dois-pontos ou ponto.
- Diga "mentoria mensal", nunca "webinário". Níveis pelo nome: Elite, Premium, Select.
- Não invente fatos. Quando não souber, use null ou lista vazia.`;

const curto = z.string().max(4000);
const ESQUEMAS = {
  resumir_contato: z.object({
    resumo: curto,
    decisoes: z.array(curto).default([]),
    pendencias_wise: z.array(curto).default([]),
    pendencias_parceiro: z.array(curto).default([]),
    proximo_passo: z.object({ descricao: curto, data: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable() }).nullable().default(null),
    sugestoes_ficha: z.array(z.object({ campo: curto, valor: curto, motivo: curto })).default([]),
    tipo_contato_sugerido: z.enum(["reuniao_presencial", "reuniao_online", "ligacao", "whatsapp", "email", "evento", "documento_enviado", "outro"]).nullable().default(null),
  }),
  ler_print: z.object({
    mensagens: z.array(z.object({ autor: curto, data: z.string().nullable(), texto: z.string() })).default([]),
    texto_corrido: z.string(),
  }),
  extrair_dossie: z.object({
    resumo: z.string(),
    empresa: z.object({
      razao_social: z.string().nullable(), nome_fantasia: z.string().nullable(), cnpj: z.string().nullable(),
      site: z.string().nullable(), cidade: z.string().nullable(), uf: z.string().nullable(), endereco: z.string().nullable(),
    }),
    contatos: z.array(z.object({ nome: z.string(), cargo: z.string().nullable(), email: z.string().nullable(), telefone: z.string().nullable(), papel: z.string().nullable() })).default([]),
    linha_do_tempo: z.array(z.object({ data: z.string().nullable(), descricao: z.string() })).default([]),
    pendencias: z.array(z.string()).default([]),
    campos: z.record(z.string()).default({}),
  }),
  recomendar_rfp: z.object({
    necessidade_resumida: z.string().max(200),
    categorias: z.array(z.object({
      categoria_id: z.string(),
      motivo: z.string(),
      parceiros: z.array(z.object({ parceiro_id: z.string(), aderencia: z.number().min(0).max(100), justificativa: z.string() })),
    })),
    sem_fornecedor: z.array(z.object({ necessidade: z.string(), categoria_sugerida: z.string().nullable() })).default([]),
  }),
  montar_pagina_rfp: z.object({
    blocos: z.array(z.discriminatedUnion("tipo", [
      z.object({ tipo: z.literal("abertura"), titulo: z.string(), texto: z.string() }),
      z.object({
        tipo: z.literal("categoria"), categoria_id: z.string(), titulo: z.string(), texto: z.string(),
        parceiros: z.array(z.object({ parceiro_id: z.string(), nome: z.string(), texto: z.string(), destaques: z.array(z.string()).default([]) })),
      }),
      z.object({ tipo: z.literal("aviso"), texto: z.string() }),
      z.object({ tipo: z.literal("consultor"), nome: z.string(), email: z.string().nullable(), telefone: z.string().nullable(), texto: z.string() }),
    ])),
  }),
  pauta_semanal: z.object({ pauta: z.string() }),
} as const;
type Tarefa = keyof typeof ESQUEMAS;

// Quem pode usar cada tarefa
const PAPEIS: Record<Tarefa, string[]> = {
  resumir_contato: ["admin", "parcerias", "consultor"],
  ler_print: ["admin", "parcerias", "consultor"],
  extrair_dossie: ["admin", "parcerias"],
  recomendar_rfp: ["admin", "parcerias", "consultor"],
  montar_pagina_rfp: ["admin", "parcerias", "consultor"],
  pauta_semanal: ["admin", "parcerias", "consultor", "comercial", "financeiro"],
};

type Anexo = { tipo: "imagem" | "pdf"; mime: string; base64: string };
type Pedido = { instrucao: string; dados: unknown; anexo?: Anexo };

function montarPedido(tarefa: Tarefa, e: any): Pedido {
  switch (tarefa) {
    case "resumir_contato":
      return {
        instrucao: `Resuma o registro de um ponto de contato com um parceiro (texto colado ou transcrição de reunião). Hoje é ${e.hoje}.
Devolva: {"resumo": string (até 6 frases), "decisoes": string[], "pendencias_wise": string[], "pendencias_parceiro": string[],
"proximo_passo": {"descricao": string, "data": "AAAA-MM-DD" ou null} ou null, "sugestoes_ficha": [{"campo": rótulo legível do dado da ficha que mudou (ex.: "Carteira no ICP", "Etapa", "Contato"), "valor": novo valor, "motivo": trecho que justifica}],
"tipo_contato_sugerido": um de reuniao_presencial, reuniao_online, ligacao, whatsapp, email, evento, documento_enviado, outro, ou null}.
Aponte mudanças relevantes como "parceiro pediu minuta" ou "carteira informada: 60 clientes". Datas relativas ("semana que vem") viram datas absolutas a partir de hoje.`,
        dados: { parceiro: e.parceiro, texto: String(e.texto ?? "").slice(0, 60000) },
      };
    case "ler_print":
      return {
        instrucao: `Leia o print de conversa (WhatsApp, e-mail ou rede social) e transcreva as mensagens na ordem, com autor e data quando visíveis.
Devolva: {"mensagens": [{"autor": string, "data": string ou null, "texto": string}], "texto_corrido": string com as mensagens no formato "[data] autor: texto", uma por linha}.`,
        dados: {},
        anexo: { tipo: "imagem", mime: e.mime ?? "image/png", base64: e.imagem_base64 },
      };
    case "extrair_dossie":
      return {
        instrucao: `Extraia de um dossiê de parceiro os dados para revisão humana.
Devolva: {"resumo": string, "empresa": {"razao_social", "nome_fantasia", "cnpj", "site", "cidade", "uf", "endereco"} (null quando não houver),
"contatos": [{"nome", "cargo", "email", "telefone", "papel": um de decisor, interlocutor, responsavel_parceria, comercial_clientes, ponte ou null}],
"linha_do_tempo": [{"data": "AAAA-MM-DD" ou null, "descricao"}], "pendencias": string[],
"campos": objeto com chave igual à "chave" de campos_disponiveis e valor em texto, só para campos que o dossiê informa}.`,
        dados: { campos_disponiveis: e.campos_disponiveis ?? [], texto: e.texto ?? null },
        anexo: e.pdf_base64 ? { tipo: "pdf", mime: "application/pdf", base64: e.pdf_base64 } : undefined,
      };
    case "recomendar_rfp":
      return {
        instrucao: `Um consultor registrou o pedido de um cliente que precisa de um fornecedor fora do escopo da Wise. Identifique as categorias envolvidas (uma necessidade pode cruzar várias) usando apenas as categorias da lista, e recomende, em cada uma, parceiros da lista de candidatos ordenados por aderência (0 a 100), com justificativa curta.
Considere os campos de cada candidato, o tipo e o porte de cliente atendido, a região e os diferenciais. Use somente parceiro_id presentes em "candidatos" e somente candidatos que pertencem à categoria. Inclua todos os candidatos aderentes de cada categoria, no mínimo 3 quando houver, e nunca indique um nome único como a escolha certa.
Devolva: {"necessidade_resumida": frase curta que completa "preciso resolver ..." (sem ponto final, até 12 palavras), "categorias": [{"categoria_id", "motivo", "parceiros": [{"parceiro_id", "aderencia", "justificativa"}]}],
"sem_fornecedor": [{"necessidade": parte da necessidade sem categoria ou sem candidato, "categoria_sugerida": nome sugerido ou null}]}.`,
        dados: {
          pedido: { necessidade: e.necessidade, porte: e.porte, regiao: e.regiao, prazo: e.prazo, restricoes: e.restricoes },
          categorias: e.categorias ?? [],
          candidatos: e.candidatos ?? [],
        },
      };
    case "montar_pagina_rfp":
      return {
        instrucao: `Monte a página exclusiva que o cliente vai abrir, em blocos padronizados, na perspectiva da Wise Makers.
Use somente estes blocos, nesta ordem: um "abertura" ({"tipo":"abertura","titulo","texto"}: cumprimenta a empresa cliente e retoma a necessidade em 2 ou 3 frases), um "categoria" por categoria ({"tipo":"categoria","categoria_id","titulo","texto": por que essa frente importa, em 1 ou 2 frases,"parceiros":[{"parceiro_id","nome","texto": 2 a 4 frases baseadas na "visão da Wise" e no que a empresa faz,"destaques": 2 ou 3 diferenciais curtos}]}), um "aviso" ({"tipo":"aviso","texto"} com o texto de aviso recebido, sem alterar o sentido) e um "consultor" ({"tipo":"consultor","nome","email","telefone","texto": convite curto para falar com o consultor}).
Mantenha todos os parceiros recebidos, na ordem recebida. Não classifique ninguém como o melhor, não recomende nome único, não prometa resultado e não cite comissões, níveis, pacotes ou dados internos.
Devolva: {"blocos": [...]}.`,
        dados: { pedido: e.pedido, consultor: e.consultor, categorias: e.categorias, aviso: e.aviso },
      };
    case "pauta_semanal":
      return {
        instrucao: `Com os indicadores do painel do programa, escreva a pauta da reunião semanal entre o Gerente de Parcerias e o Diretor: tópicos numerados, objetivos, com os nomes dos parceiros que pedem ação (follow-ups vencidos, parceiros esfriando, negociações paradas, aprovações pendentes, contrapartidas atrasadas, categorias sem 3 opções, fila do Base Ativa), a distância até a meta de assinados e, quando vierem nos dados, o número principal (clientes no ICP via parceiros), os indicadores em destaque por etapa da jornada, parceiros em risco, régua atrasada, indicações com prazo vencido e onboarding sem ativação. Não cite custos, salários nem ROI.
Devolva: {"pauta": string em texto simples, pronto para copiar}.`,
        dados: e.painel,
      };
  }
}

// ---------------------------------------------------------------------------
// Provedores
// ---------------------------------------------------------------------------
async function textoDoPdf(base64: string) {
  const bytes = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));
  const pdf = await getDocumentProxy(bytes);
  const { text } = await extractText(pdf, { mergePages: true });
  return String(text).slice(0, 120000);
}

async function chamarProvedor(sistema: string, usuario: string, anexo?: Anexo): Promise<string> {
  const provedor = (Deno.env.get("AI_PROVIDER") ?? "lovable").toLowerCase();
  const chave = Deno.env.get("AI_API_KEY") ?? (provedor === "lovable" ? Deno.env.get("LOVABLE_API_KEY") : undefined);
  if (!chave) throw new Error("IA não configurada: defina AI_PROVIDER e AI_API_KEY nas variáveis das Edge Functions.");

  if (provedor === "anthropic") {
    const conteudo: any[] = [];
    if (anexo?.tipo === "imagem") conteudo.push({ type: "image", source: { type: "base64", media_type: anexo.mime, data: anexo.base64 } });
    if (anexo?.tipo === "pdf") conteudo.push({ type: "document", source: { type: "base64", media_type: "application/pdf", data: anexo.base64 } });
    conteudo.push({ type: "text", text: usuario });
    const r = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "x-api-key": chave, "anthropic-version": "2023-06-01", "content-type": "application/json" },
      body: JSON.stringify({
        model: Deno.env.get("AI_MODEL") ?? "claude-sonnet-5-5",
        max_tokens: 8000,
        system: sistema,
        messages: [{ role: "user", content: conteudo }],
      }),
    });
    if (!r.ok) throw new Error(`Provedor de IA respondeu ${r.status}: ${(await r.text()).slice(0, 300)}`);
    const d = await r.json();
    return (d.content ?? []).filter((c: any) => c.type === "text").map((c: any) => c.text).join("");
  }

  // Provedores compatíveis com a API de chat da OpenAI (Lovable AI, OpenAI, Gemini)
  const urls: Record<string, string> = {
    lovable: "https://ai.gateway.lovable.dev/v1/chat/completions",
    openai: "https://api.openai.com/v1/chat/completions",
    gemini: "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions",
  };
  const url = Deno.env.get("AI_BASE_URL") ?? urls[provedor];
  if (!url) throw new Error(`AI_PROVIDER desconhecido: ${provedor}`);
  const modelo = Deno.env.get("AI_MODEL") ?? (provedor === "lovable" ? "google/gemini-2.5-flash" : "");
  if (!modelo) throw new Error("Defina AI_MODEL para este provedor de IA.");

  let textoUsuario = usuario;
  const partes: any[] = [];
  if (anexo?.tipo === "pdf") {
    textoUsuario += `\n\nTexto do documento:\n${await textoDoPdf(anexo.base64)}`;
  }
  partes.push({ type: "text", text: textoUsuario });
  if (anexo?.tipo === "imagem") partes.push({ type: "image_url", image_url: { url: `data:${anexo.mime};base64,${anexo.base64}` } });

  const r = await fetch(url, {
    method: "POST",
    headers: { Authorization: `Bearer ${chave}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: modelo,
      messages: [{ role: "system", content: sistema }, { role: "user", content: partes }],
      response_format: { type: "json_object" },
    }),
  });
  if (r.status === 429) throw new Error("Limite de uso da IA atingido. Tente de novo em alguns minutos.");
  if (r.status === 402) throw new Error("Créditos de IA esgotados no provedor.");
  if (!r.ok) throw new Error(`Provedor de IA respondeu ${r.status}: ${(await r.text()).slice(0, 300)}`);
  const d = await r.json();
  return d.choices?.[0]?.message?.content ?? "";
}

function extrairJson(t: string) {
  const ini = t.indexOf("{");
  const fim = t.lastIndexOf("}");
  if (ini < 0 || fim < ini) throw new Error("Resposta da IA sem JSON.");
  return JSON.parse(t.slice(ini, fim + 1));
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  try {
    const perfil = await perfilDaRequisicao(req);
    if (!perfil) return erro("Não autenticado.", 401);
    const { tarefa, entrada } = await req.json();
    if (!(tarefa in ESQUEMAS)) return erro("Tarefa de IA desconhecida.");
    if (!PAPEIS[tarefa as Tarefa].includes(perfil.papel)) return erro("Sem permissão para esta tarefa.", 403);

    const pedido = montarPedido(tarefa as Tarefa, entrada ?? {});
    const usuario = `${pedido.instrucao}\n\nDados:\n${JSON.stringify(pedido.dados)}`;
    const esquema = ESQUEMAS[tarefa as Tarefa];

    // Uma nova tentativa quando a resposta não segue o formato
    let ultimoErro = "";
    for (let tentativa = 0; tentativa < 2; tentativa++) {
      const extra = ultimoErro ? `\n\nA resposta anterior não seguiu o formato (${ultimoErro}). Corrija e devolva só o JSON.` : "";
      const bruto = await chamarProvedor(REGRAS, usuario + extra, pedido.anexo);
      try {
        const valido = esquema.parse(extrairJson(bruto));
        return json({ resultado: limparProfundo(valido) });
      } catch (e) {
        ultimoErro = e instanceof z.ZodError ? e.issues.slice(0, 3).map((i) => `${i.path.join(".")}: ${i.message}`).join("; ") : String(e);
      }
    }
    return erro(`A IA não devolveu um resultado válido: ${ultimoErro}`, 502);
  } catch (e) {
    return erro(e instanceof Error ? e.message : String(e), 500);
  }
});
