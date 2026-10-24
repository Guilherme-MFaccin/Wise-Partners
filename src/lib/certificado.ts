import { PDFDocument, rgb, type PDFFont, type PDFPage } from "pdf-lib";
import fontkit from "@pdf-lib/fontkit";
import { dataExtenso, semTravessao } from "@/lib/formato";
import { baixarBlob } from "@/lib/pdf";

// Certificado da trilha de capacitação (FR-153): nome da pessoa, trilha, versão, data e código,
// com a identidade da Wise (faixa escura com a logo clara e acento menta), em A4 paisagem.

const PAGINA: [number, number] = [841.89, 595.28];
const MENTA = rgb(0, 225 / 255, 147 / 255);
const ESCURO = rgb(16 / 255, 16 / 255, 18 / 255);
const TEXTO = rgb(0.1, 0.1, 0.12);
const CINZA = rgb(0.38, 0.38, 0.42);
const BORDA = rgb(0.85, 0.85, 0.87);

export type DadosCertificado = {
  nome: string;
  trilha: string;
  versao: number;
  data: string | Date;      // emissão
  codigo: string;
  parceiro?: string | null; // empresa da pessoa
};

export type FontesCertificado = { regular: ArrayBuffer | Uint8Array; negrito: ArrayBuffer | Uint8Array; logo?: ArrayBuffer | Uint8Array | null };

async function buscar(caminho: string): Promise<ArrayBuffer> {
  const base = typeof window !== "undefined" ? window.location.origin : "";
  const r = await fetch(base + caminho);
  if (!r.ok) throw new Error(`Não foi possível carregar ${caminho}`);
  return r.arrayBuffer();
}

const limpar = (t: string) => semTravessao(String(t ?? "")).replace(/\s+/g, " ").trim();

// Todos os textos do certificado, na ordem em que são desenhados
export function textosCertificado(d: DadosCertificado) {
  return {
    selo: "PROGRAMA WISE PARTNERS",
    titulo: "Certificado de capacitação",
    abertura: "Certificamos que",
    nome: limpar(d.nome),
    empresa: d.parceiro ? limpar(`da empresa ${d.parceiro}`) : "",
    meio: "concluiu com aprovação a trilha",
    trilha: limpar(d.trilha),
    detalhe: limpar(`Versão ${d.versao} · concluída em ${dataExtenso(d.data)}`),
    codigo: limpar(`Código de verificação: ${d.codigo}`),
    rodape: "Wise Makers · Trilha oferecida exclusivamente no Portal Wise Partners",
  };
}

export async function gerarCertificado(d: DadosCertificado, opcoes: { fontes?: FontesCertificado } = {}): Promise<{ pdf: Uint8Array; textos: string[] }> {
  const doc = await PDFDocument.create();
  doc.registerFontkit(fontkit);
  doc.setTitle(limpar(`Certificado: ${d.trilha}`));
  doc.setAuthor("Wise Makers");
  doc.setCreator("Portal Wise Partners");
  const regular = await doc.embedFont(opcoes.fontes?.regular ?? (await buscar("/fonts/DejaVuSans.ttf")), { subset: true });
  const negrito = await doc.embedFont(opcoes.fontes?.negrito ?? (await buscar("/fonts/DejaVuSans-Bold.ttf")), { subset: true });
  const logoBytes = opcoes.fontes ? opcoes.fontes.logo ?? null : await buscar("/logo-wise-makers-clara.png").catch(() => null);
  const logo = logoBytes ? await doc.embedPng(logoBytes) : null;

  const pagina = doc.addPage(PAGINA);
  const [w, h] = PAGINA;
  const desenhados: string[] = [];

  // Moldura, faixa escura com logo e acento menta
  pagina.drawRectangle({ x: 18, y: 18, width: w - 36, height: h - 36, borderColor: BORDA, borderWidth: 1 });
  pagina.drawRectangle({ x: 0, y: h - 90, width: w, height: 90, color: ESCURO });
  pagina.drawRectangle({ x: 0, y: h - 94, width: w, height: 4, color: MENTA });
  if (logo) {
    const alt = 30;
    const larg = (logo.width / logo.height) * alt;
    pagina.drawImage(logo, { x: 50, y: h - 60, width: larg, height: alt });
  }
  const t = textosCertificado(d);
  const texto = (s: string, o: { y: number; tamanho: number; fonte: PDFFont; cor?: ReturnType<typeof rgb>; x?: "centro" | "direita"; max?: number }) =>
    desenhar(pagina, desenhados, s, { ...o, largura: w });

  texto(t.selo, { y: h - 52, tamanho: 11, fonte: negrito, cor: MENTA, x: "direita" });
  texto(t.titulo, { y: h - 160, tamanho: 30, fonte: negrito });
  pagina.drawRectangle({ x: w / 2 - 30, y: h - 178, width: 60, height: 3, color: MENTA });
  texto(t.abertura, { y: h - 225, tamanho: 13, fonte: regular, cor: CINZA });
  texto(t.nome, { y: h - 268, tamanho: 28, fonte: negrito, max: w - 160 });
  let y = h - 300;
  if (t.empresa) {
    texto(t.empresa, { y, tamanho: 12, fonte: regular, cor: CINZA, max: w - 160 });
    y -= 30;
  } else {
    y -= 8;
  }
  texto(t.meio, { y, tamanho: 13, fonte: regular, cor: CINZA });
  texto(t.trilha, { y: y - 38, tamanho: 20, fonte: negrito, max: w - 160 });
  texto(t.detalhe, { y: y - 72, tamanho: 12, fonte: regular });

  pagina.drawLine({ start: { x: 60, y: 92 }, end: { x: w - 60, y: 92 }, thickness: 0.6, color: BORDA });
  texto(t.codigo, { y: 66, tamanho: 10, fonte: negrito, cor: TEXTO });
  texto(t.rodape, { y: 46, tamanho: 9, fonte: regular, cor: CINZA });

  return { pdf: await doc.save(), textos: desenhados };
}

// Centraliza (ou alinha à direita) e reduz o tamanho até caber na largura máxima
function desenhar(pagina: PDFPage, desenhados: string[], s: string,
  o: { y: number; tamanho: number; fonte: PDFFont; cor?: ReturnType<typeof rgb>; x?: "centro" | "direita"; max?: number; largura: number }) {
  const txt = limpar(s);
  if (!txt) return;
  const max = o.max ?? o.largura - 100;
  let tamanho = o.tamanho;
  while (tamanho > 8 && o.fonte.widthOfTextAtSize(txt, tamanho) > max) tamanho -= 0.5;
  const tw = o.fonte.widthOfTextAtSize(txt, tamanho);
  const x = o.x === "direita" ? o.largura - 50 - tw : (o.largura - tw) / 2;
  pagina.drawText(txt, { x, y: o.y, size: tamanho, font: o.fonte, color: o.cor ?? TEXTO });
  desenhados.push(txt);
}

export function nomeArquivoCertificado(d: Pick<DadosCertificado, "trilha" | "nome">) {
  const base = `Certificado ${d.trilha} ${d.nome}`.normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-zA-Z0-9]+/g, "_");
  return `${base.slice(0, 90)}.pdf`;
}

export async function baixarCertificado(d: DadosCertificado) {
  const { pdf } = await gerarCertificado(d);
  baixarBlob(new Blob([pdf], { type: "application/pdf" }), nomeArquivoCertificado(d));
}
