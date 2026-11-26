// Comunidade Wise Partners (23/11/2026): cadastro com conta na hora, classificação, vitrine do catálogo,
// confirmação do cliente do grupo, lead de parceiro pela fila e lead da consultoria
import { beforeAll, describe, expect, it } from "vitest";
import { P, U, prepararDados, transacao, type Q } from "./ajuda";

beforeAll(prepararDados);

const NOVO = "20000000-0000-4000-a000-0000000000c1";

function dados(extra: Record<string, unknown> = {}) {
  return JSON.stringify({
    nome: "Marina Costa", cargo: "Diretora", email: "marina@metalnorte.com.br", whatsapp: "44999990000",
    empresa: "Metal Norte", cnpj: "12.345.678/0001-95", cidade: "Maringá", uf: "pr", segmento: "Indústria metalúrgica",
    faturamento: "500k_1m", vendedores: "6", aceite_uso: true, aceite_privacidade: true, interesses: ["comprar"], ...extra,
  }).replace(/'/g, "''");
}

// Faz o que a Edge Function faz: prepara o membro e cria a conta (o gatilho do Auth cria o perfil a partir do convite)
async function cadastrar(q: Q, extra: Record<string, unknown> = {}, id = NOVO, email = "marina@metalnorte.com.br") {
  await q.sistema();
  // O cadastro com conta na hora está fechado desde a entrada única (migração 35); aqui ele é reaberto só para testar as regras
  await q.sql("update public.config_comunidade set publicada = true");
  const r = (await q.um(`select public.preparar_membro_comunidade('${dados({ email, ...extra })}'::jsonb) r`)).r;
  await q.sql("insert into auth.users (id, email) values ($1, $2)", [id, email]);
  await q.sql(`update public.membros_comunidade set perfil_id = '${id}' where id = '${r.membro_id}'`);
  return r as { parceiro_id: string; membro_id: string; fila_id: string | null };
}

async function ofertaElitePublicada(q: Q) {
  await q.sistema();
  await q.sql(`update public.parceiros set nivel = 'A', nivel_ajuste_motivo = 'Teste da comunidade',
    data_assinatura = coalesce(data_assinatura, public.hoje() - 30) where id = '${P.A}'`);
  await q.como(U.parcerias);
  return (await q.um(`insert into public.ofertas_hub (parceiro_id, titulo, descricao, condicao, estado)
    values ('${P.A}', 'Implantação de CRM', 'CRM implantado em 30 dias com treinamento.', '20% de desconto', 'publicada') returning id`)).id;
}

describe("Cadastro pela página da comunidade", () => {
  it("cria a empresa, o membro e a conta; a empresa vê o catálogo em vitrine até a Wise confirmar o cliente", () =>
    transacao(async (q) => {
      const oferta = await ofertaElitePublicada(q);
      const grupo = (await q.um("select id from public.empresas_grupo where codigo = 'triade'")).id;
      const r = await cadastrar(q, { cliente_grupo: true, empresas_grupo: [grupo] });
      expect(await q.um(`select tipo_parceria, cliente_grupo, uf, origem from public.parceiros where id = '${r.parceiro_id}'`))
        .toMatchObject({ tipo_parceria: "cliente", cliente_grupo: false, uf: "PR", origem: "comunidade" });
      expect(await q.um(`select papel, parceiro_id, is_responsavel_parceiro from public.perfis where id = '${NOVO}'`))
        .toMatchObject({ papel: "parceiro", parceiro_id: r.parceiro_id, is_responsavel_parceiro: true });

      await q.como(NOVO);
      const a = (await q.um("select public.acesso_comunidade() a")).a;
      expect(a).toMatchObject({ empresa: true, parceiro_programa: false, ver_condicoes: false, indicar: false, vinculo_cliente: "a_confirmar" });
      expect(a.empresas_grupo).toHaveLength(1);
      const vitrine = await q.sql("select titulo, condicao, liberada from public.catalogo_hub()");
      expect(vitrine).toContainEqual({ titulo: "Implantação de CRM", condicao: null, liberada: false });
      await q.falha(`select public.pedir_condicao('${oferta}')`);
      await q.falha(`select public.garantir_link_cliente('${r.parceiro_id}')`);

      await q.sistema();
      expect((await q.sql(`select tipo from public.excecoes_abertas() where ref_id = '${r.membro_id}'`)).map((x: any) => x.tipo)).toEqual(["membro_vinculo"]);

      await q.como(U.consultor);
      await q.sql(`select public.decidir_vinculo_cliente('${r.membro_id}', true)`);
      await q.como(NOVO);
      expect((await q.um("select public.acesso_comunidade() a")).a).toMatchObject({ ver_condicoes: true, ofertar: true, indicar: true, cliente_grupo: true });
      expect((await q.um("select condicao, liberada from public.catalogo_hub() limit 1"))).toMatchObject({ condicao: "20% de desconto", liberada: true });
      expect((await q.um(`select public.pedir_condicao('${oferta}') p`)).p).toMatch(/^WP-/);
      expect((await q.um(`select public.garantir_link_cliente('${r.parceiro_id}') c`)).c).toMatch(/^[a-z0-9]{10}$/);
      await q.sistema();
      expect(await q.sql(`select 1 from public.excecoes_abertas() where ref_id = '${r.membro_id}'`)).toEqual([]);
    }));

  it("recusa e-mail ou CNPJ já cadastrados e não aceita chamada de fora da Edge Function", () =>
    transacao(async (q) => {
      await cadastrar(q);
      await q.falha(`select public.preparar_membro_comunidade('${dados({ cnpj: "98765432000198" })}'::jsonb)`);
      await q.falha(`select public.preparar_membro_comunidade('${dados({ email: "outra@metalnorte.com.br" })}'::jsonb)`);
      await q.falha(`select public.preparar_membro_comunidade('${dados({ email: "x@y.com", cnpj: "98765432000198", aceite_uso: false })}'::jsonb)`);
      await q.como(U.parcerias);
      await q.falha(`select public.preparar_membro_comunidade('${dados({ email: "x@y.com", cnpj: "98765432000198" })}'::jsonb)`);
    }));

  it("desfazer apaga tudo quando a conta não pode ser criada", () =>
    transacao(async (q) => {
      await q.sistema();
      await q.sql("update public.config_comunidade set publicada = true");
      await q.falha(`select public.preparar_membro_comunidade('${dados({ interesses: ["ser_parceiro"], aceite_termo_parceiro: true })}'::jsonb)`);
      const ok = (await q.um(`select public.preparar_membro_comunidade('${dados()}'::jsonb) r`)).r;
      await q.sql(`select public.desfazer_membro_comunidade('${ok.parceiro_id}')`);
      expect(await q.sql(`select 1 from public.parceiros where id = '${ok.parceiro_id}'`)).toEqual([]);
      expect(await q.sql("select 1 from public.convites where email = 'marina@metalnorte.com.br'")).toEqual([]);
    }));

  it("membro não lê o cadastro de outra empresa", () =>
    transacao(async (q) => {
      await cadastrar(q);
      await cadastrar(q, { empresa: "Plásticos Sul", cnpj: "24681357000140" }, "20000000-0000-4000-a000-0000000000c2", "ana@plasticossul.com.br");
      await q.como(NOVO);
      expect((await q.sql("select empresa from public.membros_comunidade")).map((x: any) => x.empresa)).toEqual(["Metal Norte"]);
      await q.como(U.parceiroA);
      expect(await q.sql("select 1 from public.membros_comunidade")).toEqual([]);
    }));
});

describe("Leads que saem do cadastro", () => {
  it("quem quer ser parceiro entra na fila; a aprovação reaproveita a empresa e a conta", () =>
    transacao(async (q) => {
      await q.sistema();
      const cat = (await q.um("select id from public.categorias where tipo = 'comercial' and ativa limit 1")).id;
      const r = await cadastrar(q, { interesses: ["ser_parceiro", "indicar"], categoria_id: cat, aceite_termo_parceiro: true, clientes_ativos: "120" });
      expect(r.fila_id).toBeTruthy();
      expect(await q.um(`select origem, status, clientes_ativos from public.cadastros_landing where id = '${r.fila_id}'`))
        .toMatchObject({ origem: "comunidade", status: "fila", clientes_ativos: 120 });
      expect((await q.sql(`select detalhe from public.excecoes_abertas() where ref_id = '${r.fila_id}'`))[0].detalhe).toContain("pela Comunidade");
      await q.como(U.parcerias);
      const ap = (await q.um(`select public.aprovar_cadastro_landing('${r.fila_id}') a`)).a;
      expect(ap).toMatchObject({ parceiro_id: r.parceiro_id, ja_tem_acesso: true });
      expect(await q.um(`select tipo_parceria, etapa, nivel from public.parceiros where id = '${r.parceiro_id}'`))
        .toMatchObject({ tipo_parceria: "comercial", etapa: "onboarding", nivel: "C" });
      await q.como(NOVO);
      expect((await q.um("select public.acesso_comunidade() a")).a).toMatchObject({ parceiro_programa: true, nivel: "select", indicar: true });
    }));

  it("membro pede para ser parceiro por dentro do portal", () =>
    transacao(async (q) => {
      await q.sistema();
      const cat = (await q.um("select id from public.categorias where tipo = 'comercial' and ativa limit 1")).id;
      await cadastrar(q);
      await q.como(NOVO);
      await q.falha(`select public.pedir_parceria_comunidade('{"categoria_id": "${cat}"}'::jsonb)`);
      const id = (await q.um(`select public.pedir_parceria_comunidade('{"categoria_id": "${cat}", "aceite_termo_parceiro": true, "clientes_ativos": 40}'::jsonb) id`)).id;
      expect((await q.um("select public.acesso_comunidade() a")).a.pedido_parceria).toBe("fila");
      await q.falha(`select public.pedir_parceria_comunidade('{"categoria_id": "${cat}", "aceite_termo_parceiro": true}'::jsonb)`);
      expect(id).toBeTruthy();
      await q.como(U.parceiroA);
      await q.falha(`select public.pedir_parceria_comunidade('{"categoria_id": "${cat}", "aceite_termo_parceiro": true}'::jsonb)`);
    }));

  it("quem quer conhecer a consultoria vira tarefa até alguém marcar o atendimento", () =>
    transacao(async (q) => {
      const r = await cadastrar(q, { interesses: ["conhecer_consultoria"] });
      expect((await q.sql(`select tipo from public.excecoes_abertas() where ref_id = '${r.membro_id}'`)).map((x: any) => x.tipo)).toEqual(["lead_comunidade"]);
      await q.como(NOVO);
      await q.falha(`select public.marcar_lead_atendido('${r.membro_id}')`);
      await q.como(U.comercial);
      await q.sql(`select public.marcar_lead_atendido('${r.membro_id}')`);
      await q.sistema();
      expect(await q.sql(`select 1 from public.excecoes_abertas() where ref_id = '${r.membro_id}'`)).toEqual([]);
    }));

  it("não confirmar o cliente exige motivo e mantém a vitrine; o cadastro pela CS confirma o membro", () =>
    transacao(async (q) => {
      const grupo = (await q.um("select id from public.empresas_grupo where codigo = 'wise'")).id;
      const r = await cadastrar(q, { cliente_grupo: true, empresas_grupo: [grupo] });
      await q.como(U.consultor);
      await q.falha(`select public.decidir_vinculo_cliente('${r.membro_id}', false)`);
      await q.sql(`select public.decidir_vinculo_cliente('${r.membro_id}', false, null, 'Não encontramos contrato ativo com este CNPJ.')`);
      await q.como(NOVO);
      expect((await q.um("select public.acesso_comunidade() a")).a).toMatchObject({ ver_condicoes: false, vinculo_cliente: "nao_confirmado" });
      await q.como(U.consultor);
      await q.sql(`select public.cadastrar_cliente_grupo('{"nome": "Metal Norte", "cnpj": "12345678000195", "empresa_grupo_id": "${grupo}"}'::jsonb)`);
      expect((await q.um(`select vinculo_cliente from public.membros_comunidade where id = '${r.membro_id}'`)).vinculo_cliente).toBe("confirmado");
    }));
});

describe("Página pública", () => {
  it("o resumo só mostra contagens e categorias, e só a Edge Function lê a configuração e o resumo", () =>
    transacao(async (q) => {
      await ofertaElitePublicada(q);
      await q.sistema();
      const r = (await q.um("select public.resumo_comunidade() r")).r;
      expect(r.ofertas).toBeGreaterThanOrEqual(1);
      expect(Object.keys(r).sort()).toEqual(["categorias", "empresas_ofertando", "membros", "ofertas"]);
      await q.como(U.parceiroA);
      await q.falha("select public.resumo_comunidade()");
      expect(await q.sql("select 1 from public.config_comunidade")).toEqual([]);
      await q.como(U.parcerias);
      expect((await q.sql("select publicada from public.config_comunidade")).length).toBe(1);
      await q.sql("update public.config_comunidade set publicada = true");
      expect((await q.um("select publicada from public.config_comunidade")).publicada).toBe(false);
      await q.como(U.admin);
      await q.falha(`update public.config_comunidade set conteudo = '{"secoes": {"topo": {"titulo": "A ${String.fromCharCode(8212)} B"}}}'`);
    }));
});

describe("Conhecer a Wise Makers", () => {
  it("a empresa da comunidade vê só o minicurso de como vender a Wise Makers", () =>
    transacao(async (q) => {
      await cadastrar(q);
      await q.sistema();
      await q.sql(`insert into public.trilhas (chave, titulo, publicada, versao, nota_minima) values ('outra_trilha_teste', 'Outra trilha', true, 1, 70)
        on conflict (chave) do update set publicada = true`);
      await q.sql("update public.trilhas set publicada = true where chave = 'como_vender'");
      await q.como(NOVO);
      expect((await q.sql("select chave from public.trilhas")).map((t: any) => t.chave)).toEqual(["como_vender"]);
      await q.como(U.parceiroA);
      expect((await q.sql("select chave from public.trilhas order by chave")).map((t: any) => t.chave)).toContain("outra_trilha_teste");
    }));
});
