import { PDFDocument, rgb, type PDFFont, type PDFPage, type PDFImage } from "pdf-lib";
import fontkit from "@pdf-lib/fontkit";
import { semTravessao } from "@/lib/formato";

// Gerador de PDF simples com a identidade da Wise: faixa escura no topo, logo clara, acento menta.
// Usa a fonte DejaVu Sans (public/fonts), que tem acentos e os símbolos ☐ e ☒ do contrato.

const A4: [number, number] = [595.28, 841.89];
const MARGEM = 50;
const MENTA = rgb(0, 225 / 255, 147 / 255);
const ESCURO = rgb(16 / 255, 16 / 255, 18 / 255);
const TEXTO = rgb(0.1, 0.1, 0.12);
const CINZA = rgb(0.38, 0.38, 0.42);
const LINHA = rgb(0.85, 0.85, 0.87);

async function buscar(caminho: string): Promise<ArrayBuffer> {
  const base = typeof window !== "undefined" ? window.location.origin : "";
  const r = await fetch(base + caminho);
  if (!r.ok) throw new Error(`Não foi possível carregar ${caminho}`);
  return r.arrayBuffer();
}

export type OpcoesPdf = {
  titulo?: string;           // texto da faixa superior
  cabecalhoEscuro?: boolean; // faixa escura com logo (padrão: true)
  fontes?: { regular: ArrayBuffer; negrito: ArrayBuffer; logo?: ArrayBuffer | null };
};

export class DocumentoPdf {
  private doc!: PDFDocument;
  private pagina!: PDFPage;
  private fonte!: PDFFont;
  private negrito!: PDFFont;
  private logo: PDFImage | null = null;
  private y = 0;
  private opcoes: OpcoesPdf;

  private constructor(opcoes: OpcoesPdf) {
    this.opcoes = { cabecalhoEscuro: true, ...opcoes };
  }

  static async criar(opcoes: OpcoesPdf = {}): Promise<DocumentoPdf> {
    const d = new DocumentoPdf(opcoes);
    d.doc = await PDFDocument.create();
    d.doc.registerFontkit(fontkit);
    const regular = opcoes.fontes?.regular ?? (await buscar("/fonts/DejaVuSans.ttf"));
    const negrito = opcoes.fontes?.negrito ?? (await buscar("/fonts/DejaVuSans-Bold.ttf"));
    d.fonte = await d.doc.embedFont(regular, { subset: true });
    d.negrito = await d.doc.embedFont(negrito, { subset: true });
    const logo = opcoes.fontes ? opcoes.fontes.logo : await buscar("/logo-wise-makers-clara.png").catch(() => null);
    if (logo) d.logo = await d.doc.embedPng(logo);
    d.novaPagina();
    return d;
  }

  private novaPagina() {
    this.pagina = this.doc.addPage(A4);
    const [w, h] = A4;
    if (this.opcoes.cabecalhoEscuro) {
      this.pagina.drawRectangle({ x: 0, y: h - 64, width: w, height: 64, color: ESCURO });
      this.pagina.drawRectangle({ x: 0, y: h - 67, width: w, height: 3, color: MENTA });
      if (this.logo) {
        const alt = 22;
        const larg = (this.logo.width / this.logo.height) * alt;
        this.pagina.drawImage(this.logo, { x: MARGEM, y: h - 43, width: larg, height: alt });
      }
      if (this.opcoes.titulo) {
        const t = this.limpar(this.opcoes.titulo);
        const tw = this.negrito.widthOfTextAtSize(t, 10);
        this.pagina.drawText(t, { x: w - MARGEM - tw, y: h - 38, size: 10, font: this.negrito, color: MENTA });
      }
      this.y = h - 100;
    } else {
      this.y = h - MARGEM;
    }
    const n = this.doc.getPageCount();
    this.pagina.drawText(String(n), { x: w / 2 - 3, y: 25, size: 8, font: this.fonte, color: CINZA });
  }

  private limpar(t: string) {
    return semTravessao(String(t ?? "")).replace(/\t/g, "    ").replace(/\r/g, "");
  }

  private garantir(altura: number) {
    if (this.y - altura < 50) this.novaPagina();
  }

  // Quebra o texto em linhas que cabem na largura
  quebrar(texto: string, fonte: PDFFont, tamanho: number, largura: number): string[] {
    const linhas: string[] = [];
    for (const paragrafo of this.limpar(texto).split("\n")) {
      if (paragrafo.trim() === "") { linhas.push(""); continue; }
      let atual = "";
      for (const palavra of paragrafo.split(/(\s+)/)) {
        const tentativa = atual + palavra;
        if (fonte.widthOfTextAtSize(tentativa, tamanho) <= largura || atual === "") {
          atual = tentativa;
        } else {
          linhas.push(atual.trimEnd());
          atual = palavra.trimStart();
        }
      }
      linhas.push(atual.trimEnd());
    }
    return linhas;
  }

  texto(t: string, o: { tamanho?: number; negrito?: boolean; cor?: ReturnType<typeof rgb>; alinhamento?: "esquerda" | "centro"; espacoDepois?: number; recuo?: number } = {}) {
    const tamanho = o.tamanho ?? 10;
    const fonte = o.negrito ? this.negrito : this.fonte;
    const largura = A4[0] - 2 * MARGEM - (o.recuo ?? 0);
    const altLinha = tamanho * 1.4;
    for (const linha of this.quebrar(t, fonte, tamanho, largura)) {
      this.garantir(altLinha);
      const lw = fonte.widthOfTextAtSize(linha, tamanho);
      const x = o.alinhamento === "centro" ? (A4[0] - lw) / 2 : MARGEM + (o.recuo ?? 0);
      if (linha) this.pagina.drawText(linha, { x, y: this.y - tamanho, size: tamanho, font: fonte, color: o.cor ?? TEXTO });
      this.y -= altLinha;
    }
    this.y -= o.espacoDepois ?? 4;
  }

  titulo(t: string) {
    this.garantir(40);
    this.texto(t, { tamanho: 18, negrito: true, espacoDepois: 6 });
  }

  secao(t: string) {
    this.garantir(36);
    this.y -= 6;
    this.pagina.drawRectangle({ x: MARGEM, y: this.y - 13, width: 3, height: 14, color: MENTA });
    this.texto(t, { tamanho: 12, negrito: true, recuo: 10, espacoDepois: 6 });
  }

  campo(rotulo: string, valor: string | null | undefined) {
    if (valor === null || valor === undefined || String(valor).trim() === "") return;
    this.texto(rotulo, { tamanho: 8, negrito: true, cor: CINZA, espacoDepois: 0 });
    this.texto(String(valor), { tamanho: 10, espacoDepois: 6 });
  }

  espaco(px = 8) {
    this.y -= px;
  }

  linha() {
    this.garantir(10);
    this.pagina.drawLine({ start: { x: MARGEM, y: this.y }, end: { x: A4[0] - MARGEM, y: this.y }, thickness: 0.5, color: LINHA });
    this.y -= 8;
  }

  // Tabela simples: colunas de largura igual (ou proporcional a `pesos`), com grade
  tabela(linhas: string[][], o: { tamanho?: number; pesos?: number[]; cabecalho?: boolean } = {}) {
    const tamanho = o.tamanho ?? 8.5;
    const total = A4[0] - 2 * MARGEM;
    const ncol = Math.max(...linhas.map((l) => l.length));
    const pesos = o.pesos && o.pesos.length === ncol ? o.pesos : Array(ncol).fill(1);
    const soma = pesos.reduce((a, b) => a + b, 0);
    const larguras = pesos.map((p) => (p / soma) * total);
    const pad = 4;
    const altLinha = tamanho * 1.35;
    linhas.forEach((cels, i) => {
      const cab = o.cabecalho && i === 0;
      const fonte = cab ? this.negrito : this.fonte;
      // células mescladas: última célula ocupa o restante
      const conteudo = cels.map((c, j) => {
        const larg = j === cels.length - 1 ? larguras.slice(j).reduce((a, b) => a + b, 0) : larguras[j];
        return { larg, linhas: this.quebrar(c ?? "", fonte, tamanho, larg - 2 * pad) };
      });
      const altura = Math.max(...conteudo.map((c) => c.linhas.length)) * altLinha + 2 * pad;
      this.garantir(altura);
      let x = MARGEM;
      for (const c of conteudo) {
        this.pagina.drawRectangle({ x, y: this.y - altura, width: c.larg, height: altura, borderColor: LINHA, borderWidth: 0.6,
          color: cab ? rgb(0.95, 0.97, 0.96) : undefined });
        c.linhas.forEach((l, k) => {
          if (l) this.pagina.drawText(l, { x: x + pad, y: this.y - pad - tamanho - k * altLinha + 1, size: tamanho, font: fonte, color: TEXTO });
        });
        x += c.larg;
      }
      this.y -= altura;
    });
    this.y -= 8;
  }

  async salvar(): Promise<Uint8Array> {
    return this.doc.save();
  }

  async blob(): Promise<Blob> {
    const bytes = await this.salvar();
    return new Blob([bytes], { type: "application/pdf" });
  }
}

export function baixarBlob(blob: Blob, nome: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = nome;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}
