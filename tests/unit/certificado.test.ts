// Certificado da trilha: PDF gerado com nome, trilha, versão e data, sem travessão nem meia-risca.
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { gerarCertificado, nomeArquivoCertificado, textosCertificado } from "@/lib/certificado";

const raiz = new URL("../../", import.meta.url).pathname;
const fontes = {
  regular: readFileSync(`${raiz}public/fonts/DejaVuSans.ttf`),
  negrito: readFileSync(`${raiz}public/fonts/DejaVuSans-Bold.ttf`),
  logo: readFileSync(`${raiz}public/logo-wise-makers-clara.png`),
};

// Os caracteres proibidos são montados pelo código para não aparecerem no fonte
const TRAVESSAO = String.fromCharCode(0x2014);
const MEIA_RISCA = String.fromCharCode(0x2013);
const proibidos = new RegExp(`[${TRAVESSAO}${MEIA_RISCA}]`);

const dados = {
  nome: "Juliana Loraine Denk",
  trilha: "Como vender a Wise Makers",
  versao: 2,
  data: "2026-10-24",
  codigo: "64FB3D098E",
  parceiro: "Parceiro Alfa",
};

describe("Certificado", () => {
  it("gera o PDF com nome, trilha, versão, data e código", async () => {
    const { pdf, textos } = await gerarCertificado(dados, { fontes });
    expect(Buffer.from(pdf.slice(0, 5)).toString()).toBe("%PDF-");
    expect(pdf.length).toBeGreaterThan(5000);
    const tudo = textos.join("\n");
    expect(tudo).toContain("Juliana Loraine Denk");
    expect(tudo).toContain("Como vender a Wise Makers");
    expect(tudo).toContain("Versão 2");
    expect(tudo).toContain("24 de outubro de 2026");
    expect(tudo).toContain("64FB3D098E");
    expect(tudo).toContain("Parceiro Alfa");
  });

  it("nenhum texto gerado tem travessão (U+2014) nem meia-risca (U+2013)", async () => {
    const { textos } = await gerarCertificado(
      { ...dados, nome: `Ana ${TRAVESSAO} Souza`, trilha: `Trilha 1${MEIA_RISCA}2`, parceiro: `Empresa ${MEIA_RISCA} Filial` }, { fontes });
    for (const t of textos) {
      expect(t).not.toMatch(proibidos);
    }
    for (const t of Object.values(textosCertificado(dados))) {
      expect(t).not.toMatch(proibidos);
    }
  });

  it("funciona sem a empresa e com nome muito longo", async () => {
    const longo = "Maria Aparecida dos Santos Albuquerque de Oliveira Pereira da Silva Junqueira";
    const { pdf, textos } = await gerarCertificado({ ...dados, parceiro: null, nome: longo }, { fontes: { ...fontes, logo: null } });
    expect(pdf.length).toBeGreaterThan(3000);
    expect(textos).toContain(longo);
    expect(nomeArquivoCertificado(dados)).toBe("Certificado_Como_vender_a_Wise_Makers_Juliana_Loraine_Denk.pdf");
  });
});
