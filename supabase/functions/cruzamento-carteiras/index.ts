// Cruzamento de carteiras (História 14). Recebe do parceiro autenticado só raízes de CNPJ e tipo,
// compara em memória com a base da Wise e grava apenas coincidências e totais.
// IMPORTANTE: nunca registrar o corpo da requisição em log nem gravar a lista em tabela ou Storage.
import { cors, erro, json } from "../_shared/cors.ts";
import { admin, doUsuario, perfilDaRequisicao } from "../_shared/supabase.ts";
import { compararCarteiras, normalizarItens, type LinhaBase } from "../_shared/cruzamento.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return erro("Método não permitido.", 405);
  try {
    const quem = await perfilDaRequisicao(req);
    if (!quem || quem.papel !== "parceiro" || !quem.parceiro_id) return erro("Somente o parceiro faz o cruzamento.", 403);

    let corpo: any = await req.json().catch(() => null);
    const aceite = String(corpo?.aceite_id ?? "");
    let { itens, invalidos } = normalizarItens(corpo?.itens);
    corpo = null; // solta a referência à lista original

    // Condições (contrato, assinatura, intervalo) conferidas pelo banco com a identidade de quem chamou
    const { data: sit, error: e1 } = await doUsuario(req).rpc("situacao_cruzamento", { p_parceiro: quem.parceiro_id });
    if (e1) return erro("Não foi possível conferir o cruzamento.", 500);
    if (!sit?.pode) return erro(sit?.motivo ?? "Cruzamento indisponível.", 409);
    if (invalidos > 0) return erro("O envio tem linhas inválidas. Envie só a raiz do CNPJ e o tipo.", 400);
    if (itens.length < sit.minimo || itens.length > sit.maximo) {
      return erro(`O envio precisa ter entre ${sit.minimo} e ${sit.maximo} CNPJs válidos.`, 400);
    }

    const sb = admin();
    const base: LinhaBase[] = [];
    for (let de = 0; ; de += 1000) {
      const { data, error } = await sb.from("base_wise_cruzamento").select("id, cnpj_raiz, tipo").range(de, de + 999);
      if (error) return erro("Não foi possível ler a base da Wise.", 500);
      base.push(...(data as LinhaBase[]));
      if (!data || data.length < 1000) break;
    }
    const r = compararCarteiras(itens, base);
    itens = [];
    base.length = 0;

    const { data, error } = await sb.rpc("registrar_coincidencias", {
      p_parceiro: quem.parceiro_id,
      p_aceite: aceite,
      p_coincidencias: r.coincidencias,
      p_totais: { total_enviado: r.total_enviado },
    });
    if (error) return erro(error.message, 400);
    // Ao parceiro, só os totais por quadrante
    return json({ totais: data?.totais ?? null });
  } catch {
    return erro("Não foi possível concluir o cruzamento.", 500);
  }
});
