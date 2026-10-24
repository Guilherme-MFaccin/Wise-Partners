import { ETAPAS, PERFIS_INSTITUCIONAIS } from "@/lib/rotulos";

// Validação das linhas da planilha de importação (formato de dados-iniciais/parceiros.csv).
// Nada é gravado aqui: o resultado alimenta a prévia, e a gravação só acontece na confirmação.

export const CABECALHO = [
  "nome", "tipo_parceria", "categoria_principal", "categoria_secundaria", "etapa", "nivel_preliminar", "pacote_previsto",
  "cidade_uf", "contato_principal", "cargo", "email", "telefone", "origem", "proximo_passo", "observacoes",
];

export type Referencias = {
  categorias: { id: string; nome: string; tipo: string }[];
  pacotes: { codigo: string; nome: string; niveis_permitidos: string[] }[];
  nomesExistentes: Set<string>; // nomes fantasia normalizados já cadastrados
};

export type LinhaImportacao = {
  numero: number; // linha da planilha (cabeçalho = 1)
  original: Record<string, string>;
  erros: string[];
  avisos: string[];
  dados: {
    nome_fantasia: string;
    tipo_parceria: "comercial" | "institucional";
    etapa: string;
    nivel: string | null;
    pacote: string | null;
    cidade: string | null;
    uf: string | null;
    origem: string | null;
    perfil_institucional: string | null;
    categoria_principal_id: string | null;
    categoria_secundaria_id: string | null;
    contato: { nome: string; cargo: string | null; email: string | null; telefone: string | null } | null;
    proximo_passo: string | null;
    observacoes: string | null;
  };
};

export function normalizar(t: string | null | undefined) {
  return (t ?? "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/\s+/g, " ").trim();
}

const INDEFINIDO = ["", "a definir", "a classificar", "a confirmar"];

// Categoria pelo nome: igual (sem acento e caixa) ou, se único, nome cadastrado que começa pelo informado
function acharCategoria(nome: string, categorias: Referencias["categorias"]) {
  const n = normalizar(nome);
  const comerciais = categorias.filter((c) => c.tipo === "comercial");
  const igual = comerciais.find((c) => normalizar(c.nome) === n);
  if (igual) return igual;
  const prefixo = comerciais.filter((c) => normalizar(c.nome).startsWith(n));
  return prefixo.length === 1 ? prefixo[0] : null;
}

function nivelDe(texto: string): { nivel: string | null; ok: boolean } {
  const n = normalizar(texto).replace(/\(.*?\)/g, "").trim();
  if (INDEFINIDO.includes(n)) return { nivel: null, ok: true };
  const nomes: Record<string, string> = { elite: "A", premium: "B", select: "C" };
  if (nomes[n]) return { nivel: nomes[n], ok: true };
  const inst = n.match(/^institucional ([abc])$/);
  if (inst) return { nivel: inst[1].toUpperCase(), ok: true };
  if (/^[abc]$/.test(n)) return { nivel: n.toUpperCase(), ok: true };
  return { nivel: null, ok: false };
}

function pacoteDe(texto: string, pacotes: Referencias["pacotes"]) {
  const n = normalizar(texto);
  if (INDEFINIDO.includes(n)) return { pacote: null as Referencias["pacotes"][number] | null, ok: true };
  const p = pacotes.find((x) => normalizar(x.nome) === n || normalizar(x.codigo) === n || n.startsWith(normalizar(x.codigo) + " "));
  return { pacote: p ?? null, ok: !!p };
}

export function validarLinhas(linhas: Record<string, string>[], ref: Referencias): LinhaImportacao[] {
  const vistos = new Set<string>();
  const etapasPorRotulo = new Map(Object.entries(ETAPAS).map(([codigo, r]) => [normalizar(r), codigo]));
  const perfisPorNome = new Map(Object.entries(PERFIS_INSTITUCIONAIS).map(([codigo, r]) => [normalizar(r), codigo]));

  return linhas.map((o, i) => {
    const v = (k: string) => (o[k] ?? "").trim();
    const erros: string[] = [];
    const avisos: string[] = [];

    const nome = v("nome");
    if (!nome) erros.push("Nome vazio.");
    else if (ref.nomesExistentes.has(normalizar(nome))) erros.push("Parceiro já existe no portal.");
    else if (vistos.has(normalizar(nome))) erros.push("Nome repetido na planilha.");
    vistos.add(normalizar(nome));

    const tipoTxt = normalizar(v("tipo_parceria"));
    const tipo = tipoTxt === "comercial" ? "comercial" : tipoTxt === "institucional" ? "institucional" : null;
    if (!tipo) erros.push(`Tipo de parceria "${v("tipo_parceria")}" inválido (use Comercial ou Institucional).`);

    let etapa = "sem_contato";
    if (v("etapa")) {
      const e = etapasPorRotulo.get(normalizar(v("etapa")));
      if (e) etapa = e;
      else erros.push(`Etapa "${v("etapa")}" não reconhecida.`);
    }
    if (etapa === "fechamento" || etapa === "onboarding" || etapa === "parceria_ativa") erros.push(`Etapa "${ETAPAS[etapa]}" exige aprovação do Diretor; importe numa etapa anterior.`);

    let perfilInst: string | null = null;
    let catPrincipal: string | null = null;
    let catSecundaria: string | null = null;
    if (tipo === "institucional") {
      const perfil = perfisPorNome.get(normalizar(v("categoria_principal")));
      if (perfil) perfilInst = perfil;
      else if (INDEFINIDO.includes(normalizar(v("categoria_principal")))) avisos.push("Perfil institucional a classificar.");
      else erros.push(`Perfil institucional "${v("categoria_principal")}" não reconhecido (Ecossistema, Convocador, Viveiro ou Vitrine).`);
      if (v("categoria_secundaria")) avisos.push("Categoria secundária ignorada em parceria institucional.");
    } else if (tipo === "comercial") {
      const principal = v("categoria_principal");
      if (INDEFINIDO.includes(normalizar(principal))) avisos.push("Categoria a classificar: o parceiro entra sem categoria.");
      else {
        const c = acharCategoria(principal, ref.categorias);
        if (c) catPrincipal = c.id;
        else erros.push(`Categoria "${principal}" não encontrada.`);
      }
      const secundaria = v("categoria_secundaria");
      if (secundaria && !INDEFINIDO.includes(normalizar(secundaria))) {
        const c = acharCategoria(secundaria, ref.categorias);
        if (!c) erros.push(`Categoria secundária "${secundaria}" não encontrada.`);
        else if (c.id !== catPrincipal) catSecundaria = c.id;
      }
    }

    const nv = nivelDe(v("nivel_preliminar"));
    if (!nv.ok) erros.push(`Nível "${v("nivel_preliminar")}" não reconhecido.`);
    let pacote: string | null = null;
    const pc = pacoteDe(v("pacote_previsto"), ref.pacotes);
    if (!pc.ok) erros.push(`Pacote "${v("pacote_previsto")}" não reconhecido.`);
    else if (pc.pacote) {
      if (tipo === "institucional") avisos.push("Pacote ignorado em parceria institucional.");
      else if (!nv.nivel || !pc.pacote.niveis_permitidos.includes(nv.nivel)) avisos.push(`Pacote ${pc.pacote.nome} não disponível para o nível informado: fica sem pacote.`);
      else pacote = pc.pacote.codigo;
    }

    let cidade: string | null = null;
    let uf: string | null = null;
    const cu = v("cidade_uf");
    if (cu) {
      const m = cu.match(/^(.+)\/\s*([A-Za-z]{2})$/);
      if (m) { cidade = m[1].trim(); uf = m[2].toUpperCase(); }
      else { cidade = cu; avisos.push(`Cidade/UF "${cu}" fora do formato Cidade/UF: gravada só como cidade.`); }
    }

    const contatoNome = v("contato_principal");
    const contato = contatoNome && !INDEFINIDO.includes(normalizar(contatoNome)) ? {
      nome: contatoNome,
      cargo: INDEFINIDO.includes(normalizar(v("cargo"))) ? null : v("cargo"),
      email: v("email") || null,
      telefone: v("telefone") || null,
    } : null;
    if (!contato && (v("email") || v("telefone"))) avisos.push("E-mail ou telefone sem nome do contato: não importados.");

    return {
      numero: i + 2,
      original: o,
      erros,
      avisos,
      dados: {
        nome_fantasia: nome,
        tipo_parceria: tipo ?? "comercial",
        etapa,
        nivel: nv.nivel,
        pacote,
        cidade,
        uf,
        origem: v("origem") || null,
        perfil_institucional: perfilInst,
        categoria_principal_id: catPrincipal,
        categoria_secundaria_id: catSecundaria,
        contato,
        proximo_passo: v("proximo_passo") || null,
        observacoes: v("observacoes") || null,
      },
    };
  });
}
