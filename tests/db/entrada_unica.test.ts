// Entrada única pela página do portal (26/11/2026): o mesmo formulário para qualquer empresa, aviso ao gerente com o
// perfil declarado e a decisão dele (cliente do grupo, empresa da comunidade ou parceiro)
import { beforeAll, describe, expect, it } from "vitest";
import { U, prepararDados, transacao, type Q } from "./ajuda";

beforeAll(prepararDados);

function corpo(extra: Record<string, unknown> = {}) {
  return JSON.stringify({
    nome: "Paulo Reis", cargo: "Diretor", email: "paulo@usinagemnorte.com.br", whatsapp: "44988887777", empresa: "Usinagem Norte",
    cnpj: "13.579.246/0001-01", cidade: "Maringá", uf: "pr", segmento: "Usinagem de peças", faturamento: "500k_1m", vendedores: "4",
    aceite_uso: true, aceite_privacidade: true, interesses: ["comprar"], ...extra,
  }).replace(/'/g, "''");
}
const entrar = async (q: Q, extra: Record<string, unknown> = {}) => {
  await q.sistema();
  return (await q.um(`select public.entrar_fila_landing('${corpo(extra)}'::jsonb) r`)).r as { cadastro_id: string; perfil: string };
};

describe("Formulário único da página do portal", () => {
  it("cliente do grupo entra na fila, avisa o gerente com o perfil e o gerente adiciona com o vínculo confirmado", () =>
    transacao(async (q) => {
      const grupo = (await q.um("select id from public.empresas_grupo where codigo = 'wise'")).id;
      const r = await entrar(q, { cliente_grupo: true, empresas_grupo: [grupo], interesses: ["comprar", "oferecer"] });
      expect(r.perfil).toBe("cliente_grupo");
      const aviso = await q.um(`select titulo, mensagem from public.notificacoes where usuario_id = '${U.parcerias}' and tipo = 'fila_landing' order by created_at desc limit 1`);
      expect(aviso.titulo).toBe("Cliente do Grupo Tríade quer entrar");
      expect(aviso.mensagem).toContain("Wise Makers");
      expect((await q.um(`select titulo from public.excecoes_abertas() where ref_id = '${r.cadastro_id}'`)).titulo).toBe("Confirmar o cliente do Grupo Tríade e dar o acesso");

      await q.como(U.consultor);
      await q.falha(`select public.aprovar_cadastro_comunidade('${r.cadastro_id}', true, '${grupo}')`);
      await q.como(U.parcerias);
      await q.falha(`select public.aprovar_cadastro_landing('${r.cadastro_id}')`);
      const a = (await q.um(`select public.aprovar_cadastro_comunidade('${r.cadastro_id}', true, '${grupo}') a`)).a;
      expect(await q.um(`select tipo_parceria, cliente_grupo, uf from public.parceiros where id = '${a.parceiro_id}'`))
        .toMatchObject({ tipo_parceria: "cliente", cliente_grupo: true, uf: "PR" });
      expect(await q.um(`select vinculo_cliente, interesses from public.membros_comunidade where parceiro_id = '${a.parceiro_id}'`))
        .toMatchObject({ vinculo_cliente: "confirmado", interesses: ["comprar", "oferecer"] });
      expect((await q.um(`select status from public.cadastros_landing where id = '${r.cadastro_id}'`)).status).toBe("aprovado");
      expect(await q.um(`select public.pode_ver_catalogo('${a.parceiro_id}') v, public.pode_ofertar('${a.parceiro_id}') o`)).toMatchObject({ v: true, o: true });
      await q.sistema();
      expect(await q.sql(`select 1 from public.excecoes_abertas() where ref_id = '${r.cadastro_id}'`)).toEqual([]);
    }));

  it("empresa que só quer a comunidade entra como empresa cadastrada e vê a vitrine", () =>
    transacao(async (q) => {
      const r = await entrar(q, { interesses: ["comprar", "conhecer_consultoria"] });
      expect(r.perfil).toBe("comunidade");
      expect((await q.um(`select termo_versao from public.cadastros_landing where id = '${r.cadastro_id}'`)).termo_versao).toBeNull();
      expect((await q.um(`select titulo from public.excecoes_abertas() where ref_id = '${r.cadastro_id}'`)).titulo).toBe("Avaliar a empresa e dar o acesso à comunidade");
      await q.como(U.parcerias);
      const a = (await q.um(`select public.aprovar_cadastro_comunidade('${r.cadastro_id}', false) a`)).a;
      expect(await q.um(`select public.pode_ver_catalogo('${a.parceiro_id}') v`)).toMatchObject({ v: false });
      await q.sistema();
      const m = (await q.um(`select id from public.membros_comunidade where parceiro_id = '${a.parceiro_id}'`)).id;
      expect((await q.sql(`select tipo from public.excecoes_abertas() where ref_id = '${m}'`)).map((x: any) => x.tipo)).toEqual(["lead_comunidade"]);
    }));

  it("quem quer ser parceiro precisa da categoria e do termo de adesão, e segue a aprovação de parceiro", () =>
    transacao(async (q) => {
      await q.sistema();
      const cat = (await q.um("select id from public.categorias where tipo = 'comercial' and ativa limit 1")).id;
      await q.falha(`select public.entrar_fila_landing('${corpo({ interesses: ["ser_parceiro"], categoria_id: cat })}'::jsonb)`);
      await q.falha(`select public.entrar_fila_landing('${corpo({ interesses: ["ser_parceiro"], aceite_termo: true })}'::jsonb)`);
      const r = await entrar(q, { interesses: ["ser_parceiro", "comprar"], categoria_id: cat, aceite_termo: true, clientes_ativos: "80" });
      expect(r.perfil).toBe("parceiro");
      expect((await q.um(`select titulo from public.excecoes_abertas() where ref_id = '${r.cadastro_id}'`)).titulo).toBe("Falar com o candidato pelo WhatsApp");
      await q.como(U.parcerias);
      const a = (await q.um(`select public.aprovar_cadastro_landing('${r.cadastro_id}') a`)).a;
      expect(await q.um(`select tipo_parceria, etapa from public.parceiros where id = '${a.parceiro_id}'`)).toMatchObject({ tipo_parceria: "comercial", etapa: "onboarding" });
    }));

  it("o formulário antigo da página (sem as perguntas novas) continua sendo de parceiro", () =>
    transacao(async (q) => {
      await q.sistema();
      const cat = (await q.um("select id from public.categorias where tipo = 'comercial' and ativa limit 1")).id;
      const r = await entrar(q, { aceite_uso: false, aceite_termo: true, categoria_id: cat, interesses: [] });
      expect(r.perfil).toBe("parceiro");
      expect((await q.um(`select interesses from public.cadastros_landing where id = '${r.cadastro_id}'`)).interesses).toEqual(["ser_parceiro"]);
    }));

  it("recusa CNPJ que já está no portal, cliente sem a empresa do grupo e sem os aceites", () =>
    transacao(async (q) => {
      await entrar(q);
      await q.falha(`select public.entrar_fila_landing('${corpo({ email: "outro@usinagemnorte.com.br" })}'::jsonb)`);
      await q.falha(`select public.entrar_fila_landing('${corpo({ cnpj: "98765432000198", email: "a@b.com", cliente_grupo: true })}'::jsonb)`);
      await q.falha(`select public.entrar_fila_landing('${corpo({ cnpj: "98765432000198", email: "a@b.com", aceite_privacidade: false })}'::jsonb)`);
      expect((await q.um("select publicada from public.config_comunidade")).publicada).toBe(false);
    }));
});
