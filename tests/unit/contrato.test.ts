// Geração de contrato: todos os marcadores preenchidos, nenhum "{" restante, opções marcadas
// e PDF com o mesmo texto do Word (briefing técnico, seção 10).
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { docxParaPdf, extrairTexto, lerDocx, marcadores, preencherDocx, validarQuadro, gerarMinuta } from "@/lib/contrato";

const raiz = new URL("../../", import.meta.url).pathname;
const modelo = (tipo: string) => readFileSync(`${raiz}public/modelos/${tipo}.docx`);
const fontes = {
  regular: readFileSync(`${raiz}public/fonts/DejaVuSans.ttf`),
  negrito: readFileSync(`${raiz}public/fonts/DejaVuSans-Bold.ttf`),
  logo: readFileSync(`${raiz}public/logo-wise-makers-clara.png`),
};
const buf = (b: Buffer) => b.buffer.slice(b.byteOffset, b.byteOffset + b.byteLength) as ArrayBuffer;

const comercial = {
  razao_social: "Consistem Sistemas Ltda",
  cnpj: "12.345.678/0001-90",
  endereco: "Rua das Indústrias, 100, Jaraguá do Sul/SC",
  nivel: "A",
  carteira_icp: "60",
  pacote: "C",
  categoria_prateleira: "ERP",
  comissao_modo: "instrumento",
  instrumento_parceiro: "Programa de Parceiros Consistem, 10% do primeiro ano",
  exigencias_solucao: "CNAE de intermediação incluído no contrato social da Wise",
  base_ativa_modo: "nao_se_aplica",
  responsavel_parceiro: "Juliana Loraine Denk",
  responsavel_wise: "Guilherme Faccin",
  data_inicio: "2026-11-02",
};

const institucional = {
  nome_instituicao: "Secretaria Municipal de Indústria",
  natureza_juridica: "publica",
  cnpj: "00.000.000/0001-00",
  endereco: "Av. Central, 1, Ponta Grossa/PR",
  representante: "Secretário Municipal",
  perfil: "convocador",
  nivel: "B",
  empresas_convocadas_icp: "40",
  contrapartidas_instituicao: "Divulgação das ações com 15 dias de antecedência",
  contrapartidas_wise: "Palestra trimestral",
  calendario: "Março, junho e setembro",
  instrumento_modo: "sem",
  prazo_modo: "determinado",
  prazo_meses: "12",
  prazo_inicio: "2026-11-02",
  cadencia: "Mensal",
  responsavel_instituicao: "Coordenadora de Projetos",
  responsavel_wise: "Guilherme Faccin",
  data_inicio: "2026-11-02",
};

describe("Quadro de Identificação", () => {
  it("aponta o que falta", () => {
    const f = validarQuadro("comercial", { ...comercial, cnpj: "", comissao_modo: "percentual" });
    expect(f).toContain("CNPJ");
    expect(f).toContain("Percentual");
    expect(f).not.toContain("Instrumento próprio do parceiro");
  });

  it("exige Base Ativa definida no pacote A e pacote compatível com o nível", () => {
    expect(validarQuadro("comercial", { ...comercial, pacote: "A" }).join()).toMatch(/Base Ativa/);
    expect(validarQuadro("comercial", { ...comercial, nivel: "B", pacote: "A", base_ativa_modo: "fila", ba_previsao: "x" }).join()).toMatch(/não disponível/);
  });
});

describe("Minuta em Word", () => {
  for (const [tipo, dados] of [["comercial", comercial], ["institucional", institucional]] as const) {
    it(`preenche todos os marcadores do contrato ${tipo}`, () => {
      const docx = preencherDocx(buf(modelo(tipo)), marcadores(tipo, dados, "2026-10-23"));
      const texto = extrairTexto(docx);
      expect(texto).not.toMatch(/\{/);
      expect(texto).toContain("23 de outubro de 2026");
      expect(texto).not.toMatch(/[–—]\s*$/m);
    });
  }

  it("marca as opções escolhidas e deixa as outras em branco", () => {
    const texto = extrairTexto(preencherDocx(buf(modelo("comercial")), marcadores("comercial", comercial, "2026-10-23")));
    expect(texto).toContain("☐ Select     ☐ Premium     ☒ Elite");
    expect(texto).toContain("☒ C · Prateleira     ☐ B · Formação     ☐ A · Base Ativa");
    expect(texto).toContain("☒ Conforme instrumento próprio do Parceiro: Programa de Parceiros Consistem");
    expect(texto).toContain("☒ Não se aplica");
    expect(texto).toContain("CONSISTEM SISTEMAS LTDA");
    expect(texto).toContain("60 empresas");
    expect(texto).toContain("02/11/2026");
  });

  it("institucional: natureza jurídica por extenso e prazo determinado", () => {
    const texto = extrairTexto(preencherDocx(buf(modelo("institucional")), marcadores("institucional", institucional, "2026-10-23")));
    expect(texto).toContain("Secretaria Municipal de Indústria, pessoa jurídica de direito público");
    expect(texto).toContain("☐ Privada     ☒ Pública     ☐ Paraestatal");
    expect(texto).toContain("☒ 12 meses, a partir de 02/11/2026");
    expect(texto).toContain("☒ Não há");
  });

  it("recusa modelo com marcador desconhecido", () => {
    expect(() => preencherDocx(buf(modelo("comercial")), { razao_social: "x" })).toThrow(/Marcador sem valor/);
  });
});

describe("Minuta em PDF", () => {
  it("gera PDF a partir do mesmo Word preenchido", async () => {
    const { docx, pdf } = await gerarMinuta("comercial", comercial, buf(modelo("comercial")), "2026-10-23", { fontes });
    expect(Buffer.from(pdf.slice(0, 5)).toString()).toBe("%PDF-");
    expect(pdf.length).toBeGreaterThan(20000);
    const blocos = lerDocx(docx);
    expect(blocos.filter((b) => b.tipo === "tabela").length).toBe(5);
    expect(blocos.some((b) => b.tipo === "p" && b.texto.includes("CONTRATO DE PARCERIA COMERCIAL"))).toBe(true);
    const pdf2 = await docxParaPdf(docx, { fontes });
    expect(pdf2.length).toBeGreaterThan(20000);
  });

  it("recusa gerar com o Quadro incompleto", async () => {
    await expect(gerarMinuta("comercial", { ...comercial, endereco: "" }, buf(modelo("comercial")), "2026-10-23", { fontes })).rejects.toThrow(/Endereço/);
  });
});
