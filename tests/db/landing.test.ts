// Landing page dos parceiros SaaS (06/11/2026): cadastro com aceite eletrônico, onboarding e convite de acesso.
import { beforeAll, describe, expect, it } from "vitest";
import { U, prepararDados, transacao, type Q } from "./ajuda";

beforeAll(prepararDados);

async function categoriaErp(q: Q) {
  return (await q.um("select id from public.categorias where tipo = 'comercial' and nome = 'ERP'")).id as string;
}

function dados(categoria: string, extra: Record<string, unknown> = {}) {
  return {
    nome: "Ana Souza", email: "ana@softexemplo.com.br", whatsapp: "(44) 99999-0000", empresa: "Soft Exemplo",
    cnpj: "11.222.333/0001-81", categoria_id: categoria, clientes_ativos: "120", site: "softexemplo.com.br", cargo: "Diretora",
    utm_source: "meta", utm_medium: "paid", utm_campaign: "saas-crm-erp", utm_content: "video-2",
    aceite_termo: true, aceite_privacidade: true, ...extra,
  };
}

describe("Cadastro pela landing page", () => {
  it("cria parceiro em onboarding, com aceite eletrônico, categoria, contato, convite e registro com UTM", () =>
    transacao(async (q) => {
      await q.sistema();
      const cat = await categoriaErp(q);
      const r = await q.um("select public.cadastrar_parceiro_landing($1::jsonb) as r", [JSON.stringify(dados(cat))]);
      const id = r.r.parceiro_id as string;
      const p = await q.um("select etapa, nivel, pacote, origem, data_assinatura is not null as assinado, cnpj from public.parceiros where id = $1", [id]);
      expect(p).toMatchObject({ etapa: "onboarding", nivel: "C", pacote: "C", origem: "landing_saas", assinado: true, cnpj: "11222333000181" });
      expect((await q.um("select tipo, aprovado_por from public.aprovacoes where parceiro_id = $1", [id]))).toMatchObject({ tipo: "aceite_eletronico", aprovado_por: null });
      expect((await q.um("select count(*)::int n from public.parceiro_categorias where parceiro_id = $1 and principal", [id])).n).toBe(1);
      expect((await q.um("select count(*)::int n from public.tarefas_onboarding where parceiro_id = $1", [id])).n).toBeGreaterThan(0);
      const c = await q.um("select papel, parceiro_id, is_responsavel_parceiro from public.convites where email = 'ana@softexemplo.com.br'");
      expect(c).toMatchObject({ papel: "parceiro", parceiro_id: id, is_responsavel_parceiro: true });
      const cad = await q.um("select utm_content, categoria_nome, clientes_ativos, status from public.cadastros_landing where parceiro_id = $1", [id]);
      expect(cad).toMatchObject({ utm_content: "video-2", categoria_nome: "ERP", clientes_ativos: 120, status: "criado" });
    }));

  it("recusa sem aceite, CNPJ inválido, e-mail já com acesso e empresa repetida", () =>
    transacao(async (q) => {
      await q.sistema();
      const cat = await categoriaErp(q);
      expect(await q.falha("select public.cadastrar_parceiro_landing($1::jsonb)", [JSON.stringify(dados(cat, { aceite_termo: false }))])).toMatch(/aceitar o termo/);
      expect(await q.falha("select public.cadastrar_parceiro_landing($1::jsonb)", [JSON.stringify(dados(cat, { cnpj: "123" }))])).toMatch(/CNPJ inválido/);
      const email = (await q.um("select email from public.perfis where id = $1", [U.parcerias])).email;
      expect(await q.falha("select public.cadastrar_parceiro_landing($1::jsonb)", [JSON.stringify(dados(cat, { email }))])).toMatch(/já tem acesso/);
      await q.sql("select public.cadastrar_parceiro_landing($1::jsonb)", [JSON.stringify(dados(cat))]);
      expect(await q.falha("select public.cadastrar_parceiro_landing($1::jsonb)", [JSON.stringify(dados(cat, { email: "outra@soft.com.br" }))])).toMatch(/já está cadastrada/);
    }));

  it("desfazer remove parceiro e convite e marca o registro como falho", () =>
    transacao(async (q) => {
      await q.sistema();
      const cat = await categoriaErp(q);
      const r = (await q.um("select public.cadastrar_parceiro_landing($1::jsonb) as r", [JSON.stringify(dados(cat))])).r;
      await q.sql("select public.desfazer_cadastro_landing($1, 'teste')", [r.cadastro_id]);
      expect((await q.um("select count(*)::int n from public.parceiros where id = $1", [r.parceiro_id])).n).toBe(0);
      expect((await q.um("select count(*)::int n from public.convites where email = 'ana@softexemplo.com.br'")).n).toBe(0);
      expect((await q.um("select status from public.cadastros_landing where id = $1", [r.cadastro_id])).status).toBe("falhou");
    }));

  it("só a service_role chama o cadastro; time de parcerias lê os registros; só admin muda a configuração", () =>
    transacao(async (q) => {
      await q.como(null);
      await q.falha("select public.cadastrar_parceiro_landing('{}'::jsonb)");
      await q.como(U.parceiroA);
      await q.falha("select public.cadastrar_parceiro_landing('{}'::jsonb)");
      expect((await q.sql("select * from public.config_landing")).length).toBe(0);
      await q.como(U.parcerias);
      expect((await q.sql("select id from public.config_landing")).length).toBe(1);
      expect(await q.sql("select id from public.cadastros_landing")).toBeDefined();
      await q.sql("update public.config_landing set pixel_meta_id = '123456789' where id = 1");
      expect((await q.um("select pixel_meta_id from public.config_landing")).pixel_meta_id).toBeNull();
      await q.como(U.admin);
      await q.sql("update public.config_landing set pixel_meta_id = '123456789', ga4_id = 'G-ABC1234' where id = 1");
      expect((await q.um("select pixel_meta_id from public.config_landing")).pixel_meta_id).toBe("123456789");
      expect(await q.falha("update public.config_landing set ga4_id = 'UA-1' where id = 1")).toMatch(/ga4_id/);
    }));

  it("aprovação de assinatura comum continua exigindo quem aprovou", () =>
    transacao(async (q) => {
      await q.sistema();
      const p = (await q.um("insert into public.parceiros (nome_fantasia, tipo_parceria) values ('X', 'comercial') returning id")).id;
      expect(await q.falha("insert into public.aprovacoes (parceiro_id, tipo, aprovado_por) values ($1, 'assinatura', null)", [p])).toMatch(/aprovador_obrigatorio/);
    }));
});
