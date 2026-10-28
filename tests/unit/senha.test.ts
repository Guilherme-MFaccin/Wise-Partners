// Regras de senha do acesso por e-mail e senha: geração da senha provisória, validação da senha pessoal e
// mensagens de erro do Supabase Auth em português, sem travessão nem meia-risca.
import { describe, expect, it } from "vitest";
import { gerarSenha, mensagemErroAcesso, MINIMO_SENHA_PESSOAL, problemaSenhaPessoal } from "@/lib/senha";

describe("gerarSenha", () => {
  it("gera 12 caracteres sem os que se confundem", () => {
    for (let i = 0; i < 200; i++) {
      const s = gerarSenha();
      expect(s).toHaveLength(12);
      expect(s).not.toMatch(/[0O1lI]/);
    }
  });
  it("não repete senhas", () => {
    const geradas = new Set(Array.from({ length: 500 }, () => gerarSenha()));
    expect(geradas.size).toBe(500);
  });
});

describe("problemaSenhaPessoal", () => {
  it("exige o mínimo de caracteres", () => {
    expect(problemaSenhaPessoal("123456", "123456")).toMatch(String(MINIMO_SENHA_PESSOAL));
  });
  it("recusa senhas fáceis de adivinhar", () => {
    expect(problemaSenhaPessoal("12345678", "12345678")).toMatch(/fácil/);
    expect(problemaSenhaPessoal("aaaaaaaa", "aaaaaaaa")).toMatch(/fácil/);
  });
  it("confere a confirmação", () => {
    expect(problemaSenhaPessoal("lua cheia no rio", "lua cheia no mar")).toMatch(/confirmação/);
  });
  it("aceita uma senha boa", () => {
    expect(problemaSenhaPessoal("lua cheia no rio", "lua cheia no rio")).toBeNull();
  });
});

describe("mensagemErroAcesso", () => {
  it("traduz os erros mais comuns", () => {
    expect(mensagemErroAcesso("Invalid login credentials")).toBe("E-mail ou senha incorretos.");
    expect(mensagemErroAcesso("Request rate limit reached")).toMatch(/Muitas tentativas/);
    expect(mensagemErroAcesso("New password should be different from the old password.")).toMatch(/diferente/);
  });
  it("não usa travessão nem meia-risca", () => {
    for (const m of ["Invalid login credentials", "Email not confirmed", "rate limit", "weak", "outro"]) {
      expect(mensagemErroAcesso(m)).not.toMatch(/[–—]/);
    }
  });
});
