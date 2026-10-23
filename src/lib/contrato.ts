// Geração da minuta do contrato (FR-032, FR-033): Quadro de Identificação, Word preenchido com
// docxtemplater a partir do modelo vigente e PDF desenhado a partir do mesmo Word preenchido,
// para que o texto do PDF seja idêntico ao do Word (briefing técnico, seção 6, opção c).
import PizZip from "pizzip";
import Docxtemplater from "docxtemplater";
import { DocumentoPdf, type OpcoesPdf } from "@/lib/pdf";
import { dataExtenso, data as formatarData } from "@/lib/formato";

export type TipoContrato = "comercial" | "institucional";
export type DadosQuadro = Record<string, string>;

type Campo = {
  chave: string;
  rotulo: string;
  tipo: "texto" | "texto_longo" | "data" | "numero" | "opcao";
  opcoes?: { valor: string; rotulo: string }[];
  obrigatorio?: (d: DadosQuadro) => boolean;
  visivel?: (d: DadosQuadro) => boolean;
  ajuda?: string;
};

const sempre = () => true;

// Campos do Quadro de Identificação, na linguagem do usuário. Os marcadores {..} saem deles.
export const CAMPOS_QUADRO: Record<TipoContrato, Campo[]> = {
  comercial: [
    { chave: "razao_social", rotulo: "Razão social", tipo: "texto", obrigatorio: sempre },
    { chave: "cnpj", rotulo: "CNPJ", tipo: "texto", obrigatorio: sempre },
    { chave: "endereco", rotulo: "Endereço da sede", tipo: "texto", obrigatorio: sempre },
    { chave: "nivel", rotulo: "Nível", tipo: "opcao", obrigatorio: sempre,
      opcoes: [{ valor: "C", rotulo: "Select" }, { valor: "B", rotulo: "Premium" }, { valor: "A", rotulo: "Elite" }] },
    { chave: "carteira_icp", rotulo: "Carteira estimada no perfil de cliente da Wise", tipo: "numero", obrigatorio: sempre },
    { chave: "pacote", rotulo: "Pacote contratado", tipo: "opcao", obrigatorio: sempre,
      opcoes: [{ valor: "C", rotulo: "C · Prateleira" }, { valor: "B", rotulo: "B · Formação" }, { valor: "A", rotulo: "A · Base Ativa" }] },
    { chave: "categoria_prateleira", rotulo: "Categoria do parceiro na prateleira da Wise", tipo: "texto", obrigatorio: sempre },
    { chave: "comissao_modo", rotulo: "Comissão do parceiro à Wise", tipo: "opcao", obrigatorio: sempre,
      opcoes: [{ valor: "instrumento", rotulo: "Conforme instrumento próprio do parceiro" }, { valor: "percentual", rotulo: "Percentual registrado no Quadro" }] },
    { chave: "instrumento_parceiro", rotulo: "Instrumento próprio do parceiro", tipo: "texto",
      visivel: (d) => d.comissao_modo === "instrumento", obrigatorio: (d) => d.comissao_modo === "instrumento",
      ajuda: "Nome do programa de parceiros e a comissão que ele paga" },
    { chave: "comissao_parceiro_percentual", rotulo: "Percentual", tipo: "numero",
      visivel: (d) => d.comissao_modo === "percentual", obrigatorio: (d) => d.comissao_modo === "percentual" },
    { chave: "comissao_parceiro_base", rotulo: "Base de cálculo", tipo: "texto",
      visivel: (d) => d.comissao_modo === "percentual", obrigatorio: (d) => d.comissao_modo === "percentual" },
    { chave: "comissao_parceiro_condicao", rotulo: "Condição de pagamento", tipo: "texto",
      visivel: (d) => d.comissao_modo === "percentual", obrigatorio: (d) => d.comissao_modo === "percentual", ajuda: "Ex.: após a compensação do primeiro pagamento" },
    { chave: "exigencias_solucao", rotulo: "Exigências do instrumento do parceiro e solução adotada", tipo: "texto_longo", obrigatorio: sempre,
      ajuda: "Ex.: cadastro prévio, CNAE. Escreva \"Não há\" quando não houver" },
    { chave: "base_ativa_modo", rotulo: "Base Ativa", tipo: "opcao", obrigatorio: sempre,
      opcoes: [{ valor: "nao_se_aplica", rotulo: "Não se aplica" }, { valor: "data", rotulo: "Primeiro encontro com data" }, { valor: "fila", rotulo: "Em fila" }] },
    { chave: "ba_primeiro_encontro", rotulo: "Data do primeiro encontro", tipo: "data",
      visivel: (d) => d.base_ativa_modo === "data", obrigatorio: (d) => d.base_ativa_modo === "data" },
    { chave: "ba_previsao", rotulo: "Previsão de início", tipo: "texto",
      visivel: (d) => d.base_ativa_modo === "fila", obrigatorio: (d) => d.base_ativa_modo === "fila", ajuda: "Ex.: março de 2027" },
    { chave: "responsavel_parceiro", rotulo: "Responsável do parceiro", tipo: "texto", obrigatorio: sempre },
    { chave: "responsavel_wise", rotulo: "Responsável da Wise Makers", tipo: "texto", obrigatorio: sempre },
    { chave: "data_inicio", rotulo: "Data de início", tipo: "data", obrigatorio: sempre },
  ],
  institucional: [
    { chave: "nome_instituicao", rotulo: "Nome da instituição", tipo: "texto", obrigatorio: sempre },
    { chave: "natureza_juridica", rotulo: "Natureza jurídica", tipo: "opcao", obrigatorio: sempre,
      opcoes: [{ valor: "privada", rotulo: "Privada" }, { valor: "publica", rotulo: "Pública" }, { valor: "paraestatal", rotulo: "Paraestatal" }] },
    { chave: "cnpj", rotulo: "CNPJ", tipo: "texto", obrigatorio: sempre },
    { chave: "endereco", rotulo: "Endereço da sede", tipo: "texto", obrigatorio: sempre },
    { chave: "representante", rotulo: "Representante legal", tipo: "texto", obrigatorio: sempre },
    { chave: "perfil", rotulo: "Perfil institucional", tipo: "opcao", obrigatorio: sempre,
      opcoes: [{ valor: "ecossistema", rotulo: "Ecossistema" }, { valor: "convocador", rotulo: "Convocador" }, { valor: "viveiro", rotulo: "Viveiro" }, { valor: "vitrine", rotulo: "Vitrine" }] },
    { chave: "nivel", rotulo: "Nível da cooperação", tipo: "opcao", obrigatorio: sempre,
      opcoes: [{ valor: "A", rotulo: "Institucional A" }, { valor: "B", rotulo: "Institucional B" }, { valor: "C", rotulo: "Institucional C" }] },
    { chave: "empresas_convocadas_icp", rotulo: "Empresas convocadas no perfil de cliente da Wise (estimativa)", tipo: "numero", obrigatorio: sempre },
    { chave: "contrapartidas_instituicao", rotulo: "Contrapartidas da instituição", tipo: "texto_longo", obrigatorio: sempre },
    { chave: "contrapartidas_wise", rotulo: "Contrapartidas da Wise Makers", tipo: "texto_longo", obrigatorio: sempre },
    { chave: "calendario", rotulo: "Calendário previsto", tipo: "texto_longo", obrigatorio: sempre },
    { chave: "instrumento_modo", rotulo: "Instrumento próprio da instituição", tipo: "opcao", obrigatorio: sempre,
      opcoes: [{ valor: "sem", rotulo: "Não há" }, { valor: "com", rotulo: "Há instrumento próprio" }] },
    { chave: "instrumento_instituicao", rotulo: "Instrumento da instituição", tipo: "texto",
      visivel: (d) => d.instrumento_modo === "com", obrigatorio: (d) => d.instrumento_modo === "com" },
    { chave: "prazo_modo", rotulo: "Prazo", tipo: "opcao", obrigatorio: sempre,
      opcoes: [{ valor: "indeterminado", rotulo: "Indeterminado" }, { valor: "determinado", rotulo: "Determinado" }] },
    { chave: "prazo_meses", rotulo: "Prazo em meses", tipo: "numero",
      visivel: (d) => d.prazo_modo === "determinado", obrigatorio: (d) => d.prazo_modo === "determinado" },
    { chave: "prazo_inicio", rotulo: "Início do prazo", tipo: "data",
      visivel: (d) => d.prazo_modo === "determinado", obrigatorio: (d) => d.prazo_modo === "determinado" },
    { chave: "cadencia", rotulo: "Cadência de acompanhamento", tipo: "texto", obrigatorio: sempre },
    { chave: "responsavel_instituicao", rotulo: "Responsável da instituição", tipo: "texto", obrigatorio: sempre },
    { chave: "responsavel_wise", rotulo: "Responsável da Wise Makers", tipo: "texto", obrigatorio: sempre },
    { chave: "data_inicio", rotulo: "Data de início", tipo: "data", obrigatorio: sempre },
  ],
};

export function camposVisiveis(tipo: TipoContrato, d: DadosQuadro) {
  return CAMPOS_QUADRO[tipo].filter((c) => !c.visivel || c.visivel(d));
}

// Aponta o que falta antes de gerar a minuta (cenário 2 da História 4).
export function validarQuadro(tipo: TipoContrato, d: DadosQuadro): string[] {
  const faltando = camposVisiveis(tipo, d)
    .filter((c) => c.obrigatorio?.(d) && String(d[c.chave] ?? "").trim() === "")
    .map((c) => c.rotulo);
  if (tipo === "comercial" && d.pacote === "A" && d.base_ativa_modo === "nao_se_aplica") {
    faltando.push("Base Ativa: no pacote A informe a data do primeiro encontro ou a posição na fila");
  }
  if (tipo === "comercial" && d.pacote && d.nivel) {
    const permitidos: Record<string, string[]> = { C: ["A", "B", "C"], B: ["A", "B"], A: ["A"] };
    if (!permitidos[d.pacote]?.includes(d.nivel)) faltando.push("Pacote não disponível para o nível escolhido");
  }
  return faltando;
}

const X = "☒";
const O = "☐";
const cx = (marcado: boolean) => (marcado ? X : O);
const ou = (v: string | undefined, vazio = "___") => (v && String(v).trim() !== "" ? String(v).trim() : vazio);
const dataBr = (v: string | undefined) => (v ? formatarData(v) : "___");

const NATUREZA_TEXTO: Record<string, string> = {
  privada: "pessoa jurídica de direito privado",
  publica: "pessoa jurídica de direito público",
  paraestatal: "entidade paraestatal, pessoa jurídica de direito privado",
};

// Converte o Quadro nos marcadores do modelo (lista no briefing técnico, seção 6).
export function marcadores(tipo: TipoContrato, d: DadosQuadro, hoje: string): Record<string, string> {
  if (tipo === "comercial") {
    const percentual = d.comissao_modo === "percentual";
    return {
      razao_social: ou(d.razao_social),
      razao_social_maiusculas: ou(d.razao_social).toUpperCase(),
      cnpj: ou(d.cnpj),
      endereco: ou(d.endereco),
      cx_select: cx(d.nivel === "C"),
      cx_premium: cx(d.nivel === "B"),
      cx_elite: cx(d.nivel === "A"),
      carteira_icp: ou(d.carteira_icp) + (d.carteira_icp ? " empresas" : ""),
      cx_pacote_c: cx(d.pacote === "C"),
      cx_pacote_b: cx(d.pacote === "B"),
      cx_pacote_a: cx(d.pacote === "A"),
      categoria_prateleira: ou(d.categoria_prateleira),
      cx_instrumento_proprio: cx(!percentual),
      instrumento_parceiro: percentual ? "___" : ou(d.instrumento_parceiro),
      cx_percentual: cx(percentual),
      comissao_parceiro_percentual: percentual ? ou(d.comissao_parceiro_percentual) : "___",
      comissao_parceiro_base: percentual ? ou(d.comissao_parceiro_base) : "___",
      comissao_parceiro_condicao: percentual ? ou(d.comissao_parceiro_condicao) : "___",
      exigencias_solucao: ou(d.exigencias_solucao, "Não há"),
      cx_ba_nao_se_aplica: cx(d.base_ativa_modo === "nao_se_aplica"),
      cx_ba_data: cx(d.base_ativa_modo === "data"),
      ba_primeiro_encontro: d.base_ativa_modo === "data" ? dataBr(d.ba_primeiro_encontro) : "___",
      cx_ba_fila: cx(d.base_ativa_modo === "fila"),
      ba_previsao: d.base_ativa_modo === "fila" ? ou(d.ba_previsao) : "___",
      responsavel_parceiro: ou(d.responsavel_parceiro),
      responsavel_wise: ou(d.responsavel_wise),
      data_inicio: dataBr(d.data_inicio),
      data_extenso: dataExtenso(hoje),
    };
  }
  const determinado = d.prazo_modo === "determinado";
  const comInstrumento = d.instrumento_modo === "com";
  return {
    nome_instituicao: ou(d.nome_instituicao),
    nome_instituicao_maiusculas: ou(d.nome_instituicao).toUpperCase(),
    natureza_juridica_texto: NATUREZA_TEXTO[d.natureza_juridica] ?? "___",
    cnpj: ou(d.cnpj),
    endereco: ou(d.endereco),
    representante: ou(d.representante),
    cx_privada: cx(d.natureza_juridica === "privada"),
    cx_publica: cx(d.natureza_juridica === "publica"),
    cx_paraestatal: cx(d.natureza_juridica === "paraestatal"),
    cx_ecossistema: cx(d.perfil === "ecossistema"),
    cx_convocador: cx(d.perfil === "convocador"),
    cx_viveiro: cx(d.perfil === "viveiro"),
    cx_vitrine: cx(d.perfil === "vitrine"),
    cx_inst_a: cx(d.nivel === "A"),
    cx_inst_b: cx(d.nivel === "B"),
    cx_inst_c: cx(d.nivel === "C"),
    empresas_convocadas_icp: ou(d.empresas_convocadas_icp),
    contrapartidas_instituicao: ou(d.contrapartidas_instituicao),
    contrapartidas_wise: ou(d.contrapartidas_wise),
    calendario: ou(d.calendario),
    cx_sem_instrumento: cx(!comInstrumento),
    cx_com_instrumento: cx(comInstrumento),
    instrumento_instituicao: comInstrumento ? ou(d.instrumento_instituicao) : "",
    cx_prazo_indeterminado: cx(!determinado),
    cx_prazo_determinado: cx(determinado),
    prazo_meses: determinado ? ou(d.prazo_meses) : "___",
    prazo_inicio: determinado ? dataBr(d.prazo_inicio) : "___",
    cadencia: ou(d.cadencia),
    responsavel_instituicao: ou(d.responsavel_instituicao),
    responsavel_wise: ou(d.responsavel_wise),
    data_inicio: dataBr(d.data_inicio),
    data_extenso: dataExtenso(hoje),
  };
}

// Preenche o modelo .docx. Lança erro se sobrar algum marcador sem valor.
export function preencherDocx(modelo: ArrayBuffer | Uint8Array, valores: Record<string, string>): Uint8Array {
  const zip = new PizZip(modelo);
  const doc = new Docxtemplater(zip, {
    paragraphLoop: true,
    linebreaks: true,
    nullGetter: (parte: any) => {
      throw new Error(`Marcador sem valor no modelo: {${parte.value}}`);
    },
  });
  doc.render(valores);
  const saida = doc.getZip().generate({ type: "uint8array", compression: "DEFLATE" }) as Uint8Array;
  const texto = extrairTexto(saida);
  const resto = texto.match(/\{[a-z_]+\}/g);
  if (resto) throw new Error(`Marcadores não preenchidos: ${resto.join(", ")}`);
  return saida;
}

// ---------------------------------------------------------------------------
// Leitura do Word preenchido (parágrafos e tabelas, na ordem do documento)
// ---------------------------------------------------------------------------
export type Bloco =
  | { tipo: "p"; texto: string; negrito: boolean; centro: boolean; tamanho: number }
  | { tipo: "tabela"; grade: number[]; linhas: { texto: string; span: number; negrito: boolean }[][]; cabecalho: boolean[] };

function decodificar(t: string) {
  return t.replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&apos;/g, "'").replace(/&amp;/g, "&");
}

function textoParagrafo(xml: string) {
  let t = "";
  const re = /<w:t(?:\s[^>]*)?>([\s\S]*?)<\/w:t>|<w:tab\/>|<w:br\/>|<w:t\/>/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(xml))) {
    if (m[0] === "<w:tab/>") t += "\t";
    else if (m[0] === "<w:br/>") t += "\n";
    else if (m[1] !== undefined) t += decodificar(m[1]);
  }
  return t;
}

function paragrafo(xml: string): Extract<Bloco, { tipo: "p" }> {
  const texto = textoParagrafo(xml);
  const runs = xml.match(/<w:r[ >][\s\S]*?<\/w:r>/g) ?? [];
  const comTexto = runs.filter((r) => /<w:t[ >]/.test(r));
  const negrito = comTexto.length > 0 && comTexto.every((r) => /<w:b\/>|<w:b w:val="(1|true)"\/>/.test(r));
  const sz = xml.match(/<w:sz w:val="(\d+)"\/>/);
  return { tipo: "p", texto, negrito, centro: /<w:jc w:val="center"\/>/.test(xml), tamanho: sz ? Number(sz[1]) / 2 : 10 };
}

// Separa os elementos de primeiro nível do corpo, respeitando tabelas aninhadas.
function elementos(corpo: string): string[] {
  const out: string[] = [];
  let i = 0;
  while (i < corpo.length) {
    const ini = corpo.indexOf("<w:", i);
    if (ini < 0) break;
    const nome = corpo.slice(ini + 3).match(/^[a-zA-Z]+/)?.[0] ?? "";
    const fimTag = corpo.indexOf(">", ini);
    if (corpo[fimTag - 1] === "/") { out.push(corpo.slice(ini, fimTag + 1)); i = fimTag + 1; continue; }
    let prof = 0;
    const re = new RegExp(`<w:${nome}(?=[\\s>/])[^>]*?(/?)>|</w:${nome}>`, "g");
    re.lastIndex = ini;
    let m: RegExpExecArray | null;
    let fim = corpo.length;
    while ((m = re.exec(corpo))) {
      if (m[0].startsWith("</")) prof--;
      else if (m[1] !== "/") prof++;
      if (prof === 0) { fim = re.lastIndex; break; }
    }
    out.push(corpo.slice(ini, fim));
    i = fim;
  }
  return out;
}

export function lerDocx(docx: ArrayBuffer | Uint8Array): Bloco[] {
  const zip = new PizZip(docx);
  const xml = zip.file("word/document.xml")!.asText();
  const corpo = xml.slice(xml.indexOf("<w:body>") + 8, xml.lastIndexOf("</w:body>"));
  const blocos: Bloco[] = [];
  for (const el of elementos(corpo)) {
    if (el.startsWith("<w:p>") || el.startsWith("<w:p ")) {
      blocos.push(paragrafo(el));
    } else if (el.startsWith("<w:tbl")) {
      const grade = [...el.matchAll(/<w:gridCol w:w="(\d+)"\/>/g)].map((m) => Number(m[1]));
      const linhas: { texto: string; span: number; negrito: boolean }[][] = [];
      const cabecalho: boolean[] = [];
      for (const tr of elementos(el.slice(el.indexOf(">") + 1, el.lastIndexOf("</w:tbl>"))).filter((x) => x.startsWith("<w:tr"))) {
        const celulas = elementos(tr.slice(tr.indexOf(">") + 1, tr.lastIndexOf("</w:tr>"))).filter((x) => x.startsWith("<w:tc"));
        cabecalho.push(/<w:tblHeader\/>/.test(tr));
        linhas.push(celulas.map((tc) => {
          const ps = elementos(tc.slice(tc.indexOf(">") + 1, tc.lastIndexOf("</w:tc>"))).filter((x) => x.startsWith("<w:p"));
          const pars = ps.map(paragrafo);
          const span = Number(tc.match(/<w:gridSpan w:val="(\d+)"\/>/)?.[1] ?? 1);
          return { texto: pars.map((p) => p.texto).join("\n"), span, negrito: pars.length > 0 && pars.every((p) => p.negrito || p.texto === "") };
        }));
      }
      blocos.push({ tipo: "tabela", grade, linhas, cabecalho });
    }
  }
  return blocos;
}

export function extrairTexto(docx: ArrayBuffer | Uint8Array): string {
  return lerDocx(docx)
    .map((b) => (b.tipo === "p" ? b.texto : b.linhas.map((l) => l.map((c) => c.texto).join(" | ")).join("\n")))
    .join("\n");
}

// Desenha o PDF a partir do Word preenchido: mesmo texto, mesma ordem.
export async function docxParaPdf(docx: Uint8Array, opcoes: OpcoesPdf = {}): Promise<Uint8Array> {
  const pdf = await DocumentoPdf.criar({ titulo: "Programa Wise Partners", ...opcoes });
  for (const b of lerDocx(docx)) {
    if (b.tipo === "p") {
      if (b.texto.trim() === "") { pdf.espaco(4); continue; }
      const tamanho = Math.min(16, Math.max(8, b.tamanho * 0.85));
      pdf.texto(b.texto, { tamanho, negrito: b.negrito, alinhamento: b.centro ? "centro" : "esquerda", espacoDepois: 3 });
    } else {
      const totalGrade = b.grade.reduce((a, c) => a + c, 0) || 1;
      b.linhas.forEach((linha, i) => {
        let col = 0;
        const celulas = linha.map((c) => {
          const largura = b.grade.slice(col, col + c.span).reduce((a, x) => a + x, 0);
          col += c.span;
          return { texto: c.texto, fracao: largura / totalGrade, negrito: c.negrito || b.cabecalho[i] };
        });
        pdf.linhaTabela(celulas, { destaque: b.cabecalho[i] });
      });
      pdf.espaco(8);
    }
  }
  return pdf.salvar();
}

// Gera Word e PDF da minuta a partir do Quadro e do modelo vigente.
export async function gerarMinuta(tipo: TipoContrato, dados: DadosQuadro, modelo: ArrayBuffer, hoje: string, opcoesPdf: OpcoesPdf = {}) {
  const faltando = validarQuadro(tipo, dados);
  if (faltando.length) throw new Error(`Preencha antes de gerar: ${faltando.join("; ")}.`);
  const docx = preencherDocx(modelo, marcadores(tipo, dados, hoje));
  const pdf = await docxParaPdf(docx, opcoesPdf);
  return { docx, pdf };
}
