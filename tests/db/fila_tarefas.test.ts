// Portal v3 (20/11/2026): fila de tarefas (P-09), diagnósticos com consultor (P-95) e candidatos por origem (P-98, P-101).
import { beforeAll, describe, expect, it } from "vitest";
import { P, U, prepararDados, transacao } from "./ajuda";

beforeAll(prepararDados);

const CANDIDATO = `insert into public.cadastros_landing (nome, email, whatsapp, empresa, cnpj, categoria_nome, termo_versao, privacidade_versao, status, utm_source, utm_campaign)
  values ('Ana', 'ana@x.com', '44999990000', 'Empresa Candidata', '11222333000181', 'ERP', 'v1', 'v1', 'fila', 'meta', 'lancamento')`;

describe("Fila de tarefas", () => {
  it("o time interno vê o candidato na fila, com o link certo; o parceiro não vê nada", () =>
    transacao(async (q) => {
      await q.sistema();
      await q.sql(CANDIDATO);
      await q.como(U.parcerias);
      const t = await q.sql("select tipo, grupo, prioridade, titulo, link from public.fila_tarefas() where tipo = 'candidato'");
      expect(t).toHaveLength(1);
      expect(t[0]).toMatchObject({ grupo: "responder", prioridade: 1, titulo: "Falar com o candidato pelo WhatsApp" });
      expect(t[0].link).toMatch(/^\/app\/candidatos\?id=/);
      await q.como(U.parceiroA);
      expect(await q.sql("select * from public.fila_tarefas()")).toEqual([]);
    }));

  it("candidato contatado há pouco não vira tarefa (segue a regra)", () =>
    transacao(async (q) => {
      await q.sistema();
      await q.sql(CANDIDATO.replace("'fila', 'meta'", "'contatado', 'meta'"));
      await q.sql("update public.cadastros_landing set atualizado_em = now()");
      await q.como(U.admin);
      expect(await q.sql("select 1 from public.fila_tarefas() where tipo = 'candidato'")).toEqual([]);
    }));

  it("próximo passo atrasado entra como acompanhar, com o responsável", () =>
    transacao(async (q) => {
      await q.sistema();
      await q.sql(`insert into public.proximos_passos (parceiro_id, descricao, data, responsavel_id, estado)
        values ('${P.A}', 'Ligar para o parceiro', public.hoje() - 3, '${U.parcerias}', 'aberto')`);
      await q.como(U.parcerias);
      const t = await q.um("select grupo, responsavel_id, prazo < public.hoje() as atrasado from public.fila_tarefas() where tipo = 'proximo_passo'");
      expect(t).toMatchObject({ grupo: "acompanhar", responsavel_id: U.parcerias, atrasado: true });
    }));
});

describe("Candidatos por origem", () => {
  it("conta por origem e campanha; só o time de parcerias vê", () =>
    transacao(async (q) => {
      await q.sistema();
      await q.sql(CANDIDATO);
      await q.como(U.admin);
      const r = await q.um("select origem, campanha, cadastros, em_conversa from public.candidatos_por_origem()");
      expect(r).toMatchObject({ origem: "meta", campanha: "lancamento", cadastros: 1, em_conversa: 1 });
      await q.como(U.consultor);
      expect(await q.sql("select * from public.candidatos_por_origem()")).toEqual([]);
    }));
});

describe("Diagnósticos do cliente do parceiro", () => {
  it("o consultor lê e registra a reunião; o comercial não vê", () =>
    transacao(async (q) => {
      await q.sistema();
      await q.sql(`insert into public.cadastros_cliente (parceiro_id, nome, email, whatsapp, empresa, cnpj, cargo, faturamento_faixa, vendedores,
        segmento, desafio, privacidade_versao, icp, caminho, chave)
        values ('${P.A}', 'Rui', 'rui@x.com', '44999990000', 'Cliente SA', '11222333000181', 'Diretor', '250k_500k', 5, 'Indústria', 'Vender mais', 'v1', true, 'agenda', 'k')`);
      await q.como(U.consultor);
      await q.sql(`update public.cadastros_cliente set consultor_id = '${U.consultor}', status = 'reuniao_feita', reuniao_em = now() where empresa = 'Cliente SA'`);
      expect((await q.um("select status from public.cadastros_cliente where empresa = 'Cliente SA'")).status).toBe("reuniao_feita");
      const t = await q.um("select titulo, responsavel_id from public.fila_tarefas() where tipo = 'diagnostico'");
      expect(t).toMatchObject({ titulo: "Enviar o plano de ação", responsavel_id: U.consultor });
      await q.como(U.comercial);
      expect(await q.sql("select id from public.cadastros_cliente")).toEqual([]);
    }));
});
