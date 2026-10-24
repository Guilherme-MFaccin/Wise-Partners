// Cruzamento de carteiras (História 14, Apêndice I): comparação pura, em memória.
// Sem dependências do Deno: o mesmo arquivo é usado pela Edge Function e pelos testes unitários.
// Nada aqui grava, registra em log ou guarda a lista do parceiro.

export type TipoEmpresa = "cliente" | "prospect";
export type ItemParceiro = { raiz: string; tipo: TipoEmpresa };
export type LinhaBase = { id: string; cnpj_raiz: string; tipo: TipoEmpresa };
export type Coincidencia = { base_wise_id: string; tipo_parceiro: TipoEmpresa };
export type Quadrante = "cliente_comum" | "wise_apresenta" | "parceiro_apresenta" | "acao_conjunta";

export function quadrante(tipoWise: TipoEmpresa, tipoParceiro: TipoEmpresa): Quadrante {
  if (tipoWise === "cliente") return tipoParceiro === "cliente" ? "cliente_comum" : "wise_apresenta";
  return tipoParceiro === "cliente" ? "parceiro_apresenta" : "acao_conjunta";
}

// Valida e normaliza o que o navegador enviou: só raízes de 8 dígitos e tipo conhecido.
// Raiz repetida conta uma vez; se aparecer como cliente e como prospect, vale cliente.
export function normalizarItens(entrada: unknown): { itens: ItemParceiro[]; invalidos: number } {
  const mapa = new Map<string, TipoEmpresa>();
  let invalidos = 0;
  if (!Array.isArray(entrada)) return { itens: [], invalidos: 0 };
  for (const e of entrada) {
    const raiz = String((e as any)?.raiz ?? "").replace(/\D/g, "");
    const tipo = (e as any)?.tipo;
    if (raiz.length !== 8 || (tipo !== "cliente" && tipo !== "prospect")) {
      invalidos++;
      continue;
    }
    if (mapa.get(raiz) !== "cliente") mapa.set(raiz, tipo);
  }
  return { itens: [...mapa].map(([raiz, tipo]) => ({ raiz, tipo })), invalidos };
}

export function compararCarteiras(itens: ItemParceiro[], base: LinhaBase[]) {
  const porRaiz = new Map<string, TipoEmpresa>();
  for (const i of itens) porRaiz.set(i.raiz, i.tipo);
  const coincidencias: Coincidencia[] = [];
  const totais: Record<Quadrante, number> = { cliente_comum: 0, wise_apresenta: 0, parceiro_apresenta: 0, acao_conjunta: 0 };
  for (const b of base) {
    const tipo = porRaiz.get(b.cnpj_raiz);
    if (!tipo) continue;
    coincidencias.push({ base_wise_id: b.id, tipo_parceiro: tipo });
    totais[quadrante(b.tipo, tipo)]++;
  }
  porRaiz.clear();
  return { coincidencias, totais, total_enviado: itens.length };
}

// ---------------------------------------------------------------------------
// Lado do navegador: extrai CNPJs válidos de uma planilha (linhas já lidas) sem guardar nomes
// ---------------------------------------------------------------------------
export function cnpjValido(cnpj: string): boolean {
  const d = cnpj.replace(/\D/g, "");
  if (d.length !== 14 || /^(\d)\1{13}$/.test(d)) return false;
  const calc = (n: number) => {
    const pesos = n === 12 ? [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2] : [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
    const soma = pesos.reduce((a, p, i) => a + Number(d[i]) * p, 0);
    const r = soma % 11;
    return r < 2 ? 0 : 11 - r;
  };
  return calc(12) === Number(d[12]) && calc(13) === Number(d[13]);
}

export function tipoDoTexto(v: unknown): TipoEmpresa | null {
  const s = String(v ?? "").trim().toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
  if (["cliente", "clientes", "c"].includes(s)) return "cliente";
  if (["prospect", "prospects", "prospeccao", "p", "lead"].includes(s)) return "prospect";
  return null;
}

// Recebe as linhas (a primeira é o cabeçalho) e devolve só raiz e tipo, com as linhas com problema.
export function extrairDaPlanilha(linhas: unknown[][], maximo = 5000) {
  if (!linhas.length) return { itens: [] as ItemParceiro[], problemas: ["Arquivo vazio."], semColuna: true };
  const cab = linhas[0].map((c) => String(c ?? "").trim().toLowerCase());
  const iCnpj = cab.findIndex((c) => c.includes("cnpj"));
  const iTipo = cab.findIndex((c) => c.includes("tipo"));
  if (iCnpj < 0 || iTipo < 0) {
    return { itens: [] as ItemParceiro[], problemas: ["O arquivo precisa ter as colunas CNPJ e Tipo (cliente ou prospect)."], semColuna: true };
  }
  const problemas: string[] = [];
  const brutos: ItemParceiro[] = [];
  linhas.slice(1).forEach((l, k) => {
    const cnpj = String(l[iCnpj] ?? "").trim();
    if (!cnpj && !String(l[iTipo] ?? "").trim()) return;
    const tipo = tipoDoTexto(l[iTipo]);
    if (!cnpjValido(cnpj)) problemas.push(`Linha ${k + 2}: CNPJ inválido`);
    else if (!tipo) problemas.push(`Linha ${k + 2}: tipo deve ser cliente ou prospect`);
    else brutos.push({ raiz: cnpj.replace(/\D/g, "").slice(0, 8), tipo });
  });
  const { itens } = normalizarItens(brutos);
  if (itens.length > maximo) problemas.unshift(`O arquivo tem ${itens.length} CNPJs válidos; o máximo é ${maximo}.`);
  return { itens, problemas, semColuna: false };
}
