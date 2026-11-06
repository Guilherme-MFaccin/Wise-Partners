// Validações e utilitários da landing page dos parceiros
import { describe, expect, it } from "vitest";
import { cnpjValido, fonteVideo, mascaraCnpj, mascaraTelefone } from "@/lib/landing";

describe("landing", () => {
  it("valida CNPJ pelos dígitos verificadores", () => {
    expect(cnpjValido("11.222.333/0001-81")).toBe(true);
    expect(cnpjValido("11222333000181")).toBe(true);
    expect(cnpjValido("11.222.333/0001-82")).toBe(false);
    expect(cnpjValido("00.000.000/0000-00")).toBe(false);
    expect(cnpjValido("123")).toBe(false);
  });
  it("aplica máscaras de CNPJ e telefone", () => {
    expect(mascaraCnpj("11222333000181")).toBe("11.222.333/0001-81");
    expect(mascaraTelefone("44999990000")).toBe("(44) 99999-0000");
    expect(mascaraTelefone("4433330000")).toBe("(44) 3333-0000");
  });
  it("reconhece YouTube, Vimeo e arquivo", () => {
    expect(fonteVideo("https://youtu.be/abcdefgh123")?.src).toContain("youtube-nocookie.com/embed/abcdefgh123");
    expect(fonteVideo("https://www.youtube.com/watch?v=abcdefgh123")?.tipo).toBe("iframe");
    expect(fonteVideo("https://www.youtube.com/watch?v=abcdefgh123")?.vertical).toBe(false);
    expect(fonteVideo("https://www.youtube.com/shorts/8ts8Mc5wjyI")).toMatchObject({ vertical: true, youtube: "8ts8Mc5wjyI", src: "https://www.youtube-nocookie.com/embed/8ts8Mc5wjyI?rel=0" });
    expect(fonteVideo("https://vimeo.com/123456")?.src).toBe("https://player.vimeo.com/video/123456");
    expect(fonteVideo("https://cdn.exemplo.com/video.mp4")?.tipo).toBe("arquivo");
    expect(fonteVideo("javascript:alert(1)")).toBeNull();
    expect(fonteVideo(null)).toBeNull();
  });
});
