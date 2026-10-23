// Ajuda para os testes de banco: conexão, troca de identidade (como no Supabase) e dados fictícios.
import pg from "pg";

export const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL, max: 4 });

export type Q = {
  // Executa como o usuário (perfil) informado, papel "authenticated"; null = anônimo
  como: (usuario: string | null) => Promise<void>;
  // Volta a ser o superusuário (equivale à service_role / migrações)
  sistema: () => Promise<void>;
  sql: <T = any>(texto: string, params?: any[]) => Promise<T[]>;
  um: <T = any>(texto: string, params?: any[]) => Promise<T>;
  // Espera que o comando falhe; devolve a mensagem
  falha: (texto: string, params?: any[]) => Promise<string>;
};

// Roda o bloco numa transação que sempre é desfeita: cada teste começa do mesmo estado.
export async function transacao(fn: (q: Q) => Promise<void>) {
  const c = await pool.connect();
  let ponto = 0;
  const q: Q = {
    como: async (usuario) => {
      await c.query(`set local role ${usuario ? "authenticated" : "anon"}`);
      await c.query("select set_config('request.jwt.claims', $1, true)", [
        JSON.stringify(usuario ? { sub: usuario, role: "authenticated" } : { role: "anon" }),
      ]);
    },
    sistema: async () => {
      await c.query("reset role");
      await c.query("select set_config('request.jwt.claims', '', true)");
    },
    sql: async (texto, params) => (await c.query(texto, params)).rows,
    um: async (texto, params) => (await c.query(texto, params)).rows[0],
    falha: async (texto, params) => {
      const nome = `p${++ponto}`;
      await c.query(`savepoint ${nome}`);
      try {
        await c.query(texto, params);
      } catch (e: any) {
        await c.query(`rollback to savepoint ${nome}`);
        return String(e.message);
      }
      await c.query(`release savepoint ${nome}`);
      throw new Error(`Era esperado erro em: ${texto}`);
    },
  };
  try {
    await c.query("begin");
    await fn(q);
  } finally {
    await c.query("rollback").catch(() => {});
    c.release();
  }
}

// Identificadores fixos dos dados fictícios
export const U = {
  admin: "00000000-0000-4000-a000-000000000001",
  diretor: "00000000-0000-4000-a000-000000000002",
  parcerias: "00000000-0000-4000-a000-000000000003",
  consultor: "00000000-0000-4000-a000-000000000004",
  consultor2: "00000000-0000-4000-a000-000000000005",
  comercial: "00000000-0000-4000-a000-000000000006",
  financeiro: "00000000-0000-4000-a000-000000000007",
  parceiroA: "00000000-0000-4000-a000-000000000008",
  parceiroA2: "00000000-0000-4000-a000-000000000009",
  parceiroB: "00000000-0000-4000-a000-000000000010",
  inativo: "00000000-0000-4000-a000-000000000011",
};
export const P = {
  A: "10000000-0000-4000-a000-00000000000a",
  B: "10000000-0000-4000-a000-00000000000b",
  C: "10000000-0000-4000-a000-00000000000c", // ERP, assinado
  D: "10000000-0000-4000-a000-00000000000d", // ERP, sem contrato
  E: "10000000-0000-4000-a000-00000000000e", // ERP, assinado
};

let preparado = false;

// Cria (uma vez, com commit) os usuários de cada papel e parceiros fictícios.
export async function prepararDados() {
  if (preparado) return;
  const c = await pool.connect();
  try {
    const existe = await c.query("select 1 from public.perfis where id = $1", [U.admin]);
    if (existe.rowCount) { preparado = true; return; }
    await c.query("begin");
    const emp = (await c.query("select codigo, id from public.empresas_grupo")).rows.reduce((a: any, r: any) => ({ ...a, [r.codigo]: r.id }), {});
    const erp = (await c.query("select id from public.categorias where nome = 'ERP'")).rows[0].id;

    const usuarios: [string, string, string, string, any][] = [
      [U.admin, "admin@teste.wise", "Admin Teste", "admin", { empresa: emp.wise }],
      [U.diretor, "diretor@teste.wise", "Diretor Teste", "admin", { empresa: emp.wise, diretor: true }],
      [U.parcerias, "parcerias@teste.wise", "Parcerias Teste", "parcerias", { empresa: emp.wise }],
      [U.consultor, "consultor@teste.wise", "Consultor Teste", "consultor", { empresa: emp.wise }],
      [U.consultor2, "consultor2@teste.wise", "Consultor Tríade", "consultor", { empresa: emp.triade }],
      [U.comercial, "comercial@teste.wise", "Comercial Teste", "comercial", { empresa: emp.swallow }],
      [U.financeiro, "financeiro@teste.wise", "Financeiro Teste", "financeiro", { empresa: emp.wise }],
      [U.inativo, "inativo@teste.wise", "Inativo Teste", "parcerias", { empresa: emp.wise, inativo: true }],
    ];
    for (const [id, email, nome, papel, o] of usuarios) {
      await c.query("insert into auth.users (id, email) values ($1, $2)", [id, email]);
      await c.query(
        "insert into public.perfis (id, nome, email, papel, empresa_grupo_id, is_diretor, ativo) values ($1,$2,$3,$4,$5,$6,$7)",
        [id, nome, email, papel, o.empresa, !!o.diretor, !o.inativo],
      );
    }

    // Parceiros: A e B assinados (Elite e Premium), C e E assinados, D sem contrato
    const parceiros: [string, string, number, string | null][] = [
      [P.A, "Parceiro Alfa", 60, "A"],
      [P.B, "Parceiro Beta", 20, "B"],
      [P.C, "Parceiro Gama", 10, "C"],
      [P.D, "Parceiro Delta", 10, null],
      [P.E, "Parceiro Épsilon", 10, "C"],
    ];
    for (const [id, nome, carteira] of parceiros) {
      await c.query(
        `insert into public.parceiros (id, nome_fantasia, razao_social, cnpj, cidade, uf, tipo_parceria, carteira_icp, responsavel_id, ultimo_contato)
         values ($1, $2, $2 || ' Ltda', null, 'Maringá', 'PR', 'comercial', $3, $4, current_date)`,
        [id, nome, carteira, U.parcerias],
      );
      await c.query("insert into public.parceiro_categorias (parceiro_id, categoria_id, principal) values ($1, $2, true)", [id, erp]);
    }
    for (const [id, , , pacote] of parceiros) {
      if (!pacote) continue;
      await c.query("insert into public.aprovacoes (parceiro_id, aprovado_por) values ($1, $2)", [id, U.diretor]);
      await c.query("update public.parceiros set pacote = $2, etapa = 'proposta_decisor' where id = $1", [id, pacote]);
      await c.query("update public.parceiros set etapa = 'fechamento', data_assinatura = current_date - 10 where id = $1", [id]);
      await c.query("update public.parceiros set etapa = 'onboarding' where id = $1", [id]);
    }
    // Ficha publicada (campos de RFP) para todos, inclusive D, que não pode aparecer por não ter contrato
    const campo = async (chave: string) => (await c.query("select id from public.campos_categoria where escopo = 'comum_comercial' and chave = $1", [chave])).rows[0].id;
    const oQueFaz = await campo("o_que_faz");
    const whats = await campo("whatsapp_comercial");
    const concorr = await campo("principais_concorrentes");
    for (const [id, nome] of parceiros) {
      await c.query("insert into public.parceiro_campos (parceiro_id, campo_id, valor) values ($1, $2, to_jsonb($3::text))", [id, oQueFaz, `${nome} implanta ERP para indústria.`]);
      await c.query("insert into public.parceiro_campos (parceiro_id, campo_id, valor) values ($1, $2, to_jsonb($3::text))", [id, whats, "(44) 99999-0000"]);
      await c.query("insert into public.parceiro_campos (parceiro_id, campo_id, valor) values ($1, $2, to_jsonb($3::text))", [id, concorr, "Concorrente secreto"]);
    }
    await c.query("update public.parceiros_interno set estrategico = true, anotacoes = 'Anotação interna sigilosa' where parceiro_id = $1", [P.A]);
    await c.query("update public.parceiros_instrumento set programa_proprio = true, comissao_pct = 10, comissao_base = 'primeira mensalidade' where parceiro_id = $1", [P.A]);

    // Usuários dos parceiros
    const usuariosParceiro: [string, string, string, boolean][] = [
      [U.parceiroA, "alfa@parceiro.com", P.A, true],
      [U.parceiroA2, "alfa2@parceiro.com", P.A, false],
      [U.parceiroB, "beta@parceiro.com", P.B, true],
    ];
    for (const [id, email, parceiro, resp] of usuariosParceiro) {
      await c.query("insert into auth.users (id, email) values ($1, $2)", [id, email]);
      await c.query(
        "insert into public.perfis (id, nome, email, papel, parceiro_id, is_responsavel_parceiro) values ($1, $2, $2, 'parceiro', $3, $4)",
        [id, email, parceiro, resp],
      );
    }

    // Uma indicação de cada parceiro para a Wise, já fechada e compensada (comissões a pagar)
    for (const [parceiro, cliente] of [[P.A, "Cliente do Alfa"], [P.B, "Cliente do Beta"]]) {
      await c.query("select set_config('request.jwt.claims', $1, true)", [JSON.stringify({ sub: U.parcerias })]);
      const id = (await c.query(
        "select public.registrar_indicacao(jsonb_build_object('sentido','parceiro_para_grupo','parceiro_id',$1::text,'empresa_grupo_id',$2::text,'cliente_razao_social',$3::text,'origem','grupo_whatsapp'))",
        [parceiro, emp.wise, cliente],
      )).rows[0].registrar_indicacao;
      await c.query("update public.indicacoes set etapa = 'fechada', valor_base = 10000, data_compensacao = current_date where id = $1", [id]);
      await c.query("select set_config('request.jwt.claims', '', true)");
    }
    // Documentos: um visível ao parceiro A, um interno
    await c.query("insert into public.documentos (parceiro_id, tipo, nome, caminho, visivel_parceiro) values ($1, 'certificado', 'Certificado', $1::uuid::text || '/cert.pdf', true)", [P.A]);
    await c.query("insert into public.documentos (parceiro_id, tipo, nome, caminho, visivel_parceiro) values ($1, 'dossie', 'Dossiê interno', $1::uuid::text || '/dossie.pdf', false)", [P.A]);
    await c.query("insert into storage.objects (bucket_id, name) values ('documentos', $1::text || '/cert.pdf'), ('documentos', $1::text || '/dossie.pdf'), ('documentos', $2::text || '/outro.pdf')", [P.A, P.B]);
    await c.query("insert into public.pontos_contato (parceiro_id, tipo, texto, autor_id) values ($1, 'whatsapp', 'Conversa interna', $2)", [P.A, U.parcerias]);
    await c.query("commit");
    preparado = true;
  } catch (e) {
    await c.query("rollback");
    throw e;
  } finally {
    c.release();
  }
}
