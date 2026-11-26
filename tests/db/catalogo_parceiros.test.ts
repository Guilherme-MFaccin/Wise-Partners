// Catálogo de parceiros (FO-19, 22/11/2026): quem vê, quem oferece, validação pela Wise, pedidos e nível que sobe sozinho
import { beforeAll, describe, expect, it } from "vitest";
import { P, U, prepararDados, transacao } from "./ajuda";

beforeAll(prepararDados);

const OFERTA = (pid: string, estado = "em_validacao") => `insert into public.ofertas_hub (parceiro_id, titulo, descricao, condicao, estado)
  values ('${pid}', 'Implantação de CRM', 'CRM implantado em 30 dias com treinamento.', '20% de desconto', '${estado}') returning id`;
const nivel = (pid: string, n: string) => `update public.parceiros set nivel = '${n}', nivel_ajuste_motivo = 'Teste do catálogo',
  data_assinatura = coalesce(data_assinatura, public.hoje() - 30) where id = '${pid}'`;

describe("Quem vê e quem oferece", () => {
  it("Elite oferece; a oferta só aparece depois da validação; Select não vê o catálogo; Premium vê", () =>
    transacao(async (q) => {
      await q.sistema();
      await q.sql(nivel(P.A, "A"));
      await q.sql(nivel(P.B, "C"));
      await q.como(U.parceiroA);
      const oferta = (await q.um(OFERTA(P.A))).id;
      await q.falha(`update public.ofertas_hub set estado = 'publicada' where id = '${oferta}'`);
      await q.como(U.parcerias);
      await q.sql(`update public.ofertas_hub set estado = 'publicada' where id = '${oferta}'`);
      await q.como(U.parceiroB);
      // Select vê a vitrine (empresa e oferta), sem a condição
      expect(await q.sql("select titulo, condicao, liberada from public.catalogo_hub()")).toEqual([{ titulo: "Implantação de CRM", condicao: null, liberada: false }]);
      await q.sistema();
      await q.sql(nivel(P.B, "B"));
      await q.como(U.parceiroB);
      expect((await q.sql("select titulo from public.catalogo_hub()")).map((r: any) => r.titulo)).toContain("Implantação de CRM");
      await q.falha(OFERTA(P.B));
    }));

  it("editar o texto de uma oferta publicada volta para validação", () =>
    transacao(async (q) => {
      await q.sistema();
      await q.sql(nivel(P.A, "A"));
      await q.como(U.parcerias);
      const oferta = (await q.um(OFERTA(P.A, "publicada"))).id;
      await q.como(U.parceiroA);
      await q.sql(`update public.ofertas_hub set condicao = '30% de desconto' where id = '${oferta}'`);
      expect((await q.um(`select estado from public.ofertas_hub where id = '${oferta}'`)).estado).toBe("em_validacao");
    }));
});

describe("Empresa cliente do grupo", () => {
  it("o consultor cadastra; a empresa vê e oferece; o comercial também cadastra; o parceiro não", () =>
    transacao(async (q) => {
      await q.como(U.consultor);
      const grupo = (await q.um("select id from public.empresas_grupo where codigo = 'triade'")).id;
      const id = (await q.um(`select public.cadastrar_cliente_grupo('{"nome": "Metalúrgica Teste", "cnpj": "11.222.333/0001-81", "empresa_grupo_id": "${grupo}"}'::jsonb) id`)).id;
      expect(await q.um(`select tipo_parceria, cliente_grupo from public.parceiros where id = '${id}'`)).toMatchObject({ tipo_parceria: "cliente", cliente_grupo: true });
      expect(await q.um(`select public.pode_ver_catalogo('${id}') v, public.pode_ofertar('${id}') o`)).toMatchObject({ v: true, o: true });
      await q.como(U.parceiroA);
      await q.falha(`select public.cadastrar_cliente_grupo('{"nome": "X", "cnpj": "45723174000110", "empresa_grupo_id": "${grupo}"}'::jsonb)`);
    }));
});

describe("Pedidos", () => {
  it("o pedido sai com protocolo; quem oferece vê o contato e marca se fechou; outro parceiro não vê", () =>
    transacao(async (q) => {
      await q.sistema();
      await q.sql(nivel(P.A, "A"));
      await q.sql(nivel(P.B, "B"));
      await q.como(U.parcerias);
      const oferta = (await q.um(OFERTA(P.A, "publicada"))).id;
      await q.como(U.parceiroB);
      const prot = (await q.um(`select public.pedir_condicao('${oferta}', 'Queremos começar') p`)).p;
      expect(prot).toMatch(/^WP-\d{4}-\d{5}$/);
      await q.como(U.parceiroA);
      const pedido = (await q.um(`select id from public.pedidos_hub where protocolo = '${prot}'`)).id;
      expect((await q.sql(`select * from public.contato_do_pedido('${pedido}')`)).length).toBe(1);
      await q.sql(`select public.marcar_pedido('${pedido}', 'fechado')`);
      await q.como(U.parceiroB);
      await q.falha(`select public.marcar_pedido('${pedido}', 'nao_avancou')`);
      expect(await q.sql(`select * from public.contato_do_pedido('${pedido}')`)).toEqual([]);
      await q.falha(`select public.pedir_condicao('${oferta}')`.replace(oferta, "00000000-0000-0000-0000-000000000000"));
    }));
});

describe("Nível que sobe sozinho", () => {
  it("diagnóstico feito de cliente no perfil leva a Premium; indicação fechada leva a Elite", () =>
    transacao(async (q) => {
      await q.sistema();
      await q.sql(nivel(P.A, "C"));
      const c = (await q.um(`insert into public.cadastros_cliente (parceiro_id, nome, email, whatsapp, empresa, cnpj, cargo, faturamento_faixa, vendedores,
        segmento, desafio, privacidade_versao, icp, caminho, chave) values ('${P.A}', 'Rui', 'r@x.com', '44999990000', 'Cliente', '11222333000181', 'Diretor',
        '250k_500k', 5, 'Indústria', 'Vender', 'v1', true, 'agenda', 'k') returning id`)).id;
      await q.sql(`update public.cadastros_cliente set status = 'diagnostico_feito' where id = '${c}'`);
      const fechada = (await q.um(`select exists (select 1 from public.indicacoes where parceiro_id = '${P.A}' and sentido = 'parceiro_para_grupo' and etapa = 'fechada') e`)).e;
      expect((await q.um(`select nivel from public.parceiros where id = '${P.A}'`)).nivel).toBe(fechada ? "A" : "B");
    }));
});
