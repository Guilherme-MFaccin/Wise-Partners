// Onboarding por etapas (P-94), ativação no primeiro cliente pelo link (P-30) e entrada sempre pela fila (20/11/2026)
import { beforeAll, describe, expect, it } from "vitest";
import { P, U, prepararDados, transacao } from "./ajuda";

beforeAll(prepararDados);

const plano = (pid: string) => `insert into public.planos_onboarding (parceiro_id, inicio, prazo_final) values ('${pid}', public.hoje() - 20, public.hoje() + 70)
  on conflict (parceiro_id) do update set situacao = 'em_andamento', ativado_em = null`;
const cliente = (pid: string, cnpj: string) => `insert into public.cadastros_cliente (parceiro_id, nome, email, whatsapp, empresa, cnpj, cargo,
  faturamento_faixa, vendedores, segmento, desafio, privacidade_versao, icp, caminho, chave)
  values ('${pid}', 'Rui', 'rui@x.com', '44999990000', 'Cliente SA', '${cnpj}', 'Diretor', '250k_500k', 5, 'Indústria', 'Vender mais', 'v1', true, 'agenda', 'k')`;

describe("Etapas do onboarding", () => {
  it("o parceiro vê as seis etapas e marca as duas manuais; outro parceiro não vê", () =>
    transacao(async (q) => {
      await q.sistema();
      await q.sql(plano(P.A));
      await q.como(U.parceiroA);
      const e = await q.sql(`select chave, automatica, feita from public.etapas_onboarding('${P.A}') order by ordem`);
      expect(e.map((x: any) => x.chave)).toEqual(["acesso", "minicurso", "anuncio", "link_enviado", "primeiro_cliente", "primeiro_diagnostico"]);
      expect(e.filter((x: any) => !x.automatica).map((x: any) => x.chave)).toEqual(["anuncio", "link_enviado"]);
      await q.sql(`insert into public.marcas_onboarding (parceiro_id, etapa) values ('${P.A}', 'anuncio')`);
      expect((await q.um(`select feita from public.etapas_onboarding('${P.A}') where chave = 'anuncio'`)).feita).toBe(true);
      await q.como(U.parceiroB);
      expect(await q.sql(`select * from public.etapas_onboarding('${P.A}')`)).toEqual([]);
      await q.falha(`insert into public.marcas_onboarding (parceiro_id, etapa) values ('${P.A}', 'link_enviado')`);
    }));

  it("o primeiro cliente pelo link ativa a parceria; cadastro com o CNPJ do próprio parceiro não ativa", () =>
    transacao(async (q) => {
      await q.sistema();
      await q.sql(plano(P.A));
      await q.sql(`update public.parceiros set cnpj = '45.723.174/0001-10' where id = '${P.A}'`);
      await q.sql(cliente(P.A, "45723174000110"));
      expect((await q.um(`select situacao from public.planos_onboarding where parceiro_id = '${P.A}'`)).situacao).toBe("em_andamento");
      await q.sql(cliente(P.A, "11222333000181"));
      const pl = await q.um(`select situacao, cadastro_ativacao_id is not null as com_cadastro from public.planos_onboarding where parceiro_id = '${P.A}'`);
      expect(pl).toMatchObject({ situacao: "ativado", com_cadastro: true });
      await q.como(U.parcerias);
      expect((await q.um(`select feita from public.etapas_onboarding('${P.A}') where chave = 'primeiro_cliente'`)).feita).toBe(true);
    }));

  it("parceiro parado numa etapa há 14 dias ou mais entra na fila de tarefas", () =>
    transacao(async (q) => {
      await q.sistema();
      await q.sql(plano(P.A));
      await q.sql(`update public.parceiros set data_assinatura = public.hoje() - 20 where id = '${P.A}'`);
      await q.como(U.parcerias);
      const t = await q.um(`select titulo, detalhe from public.fila_tarefas() where tipo = 'onboarding_parado' and parceiro_id = '${P.A}'`);
      expect(t.titulo).toBe("Parceiro parado no onboarding");
      expect(t.detalhe).toMatch(/^Falta: Entrar no portal/);
    }));
});

describe("Entrada do parceiro", () => {
  it("a página só aceita o modo fila", () =>
    transacao(async (q) => {
      await q.sistema();
      await q.falha("update public.config_landing set modo_cadastro = 'acesso_direto' where id = 1");
    }));
});
