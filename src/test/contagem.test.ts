import { describe, it, expect, vi } from "vitest";

const pageview = vi.fn();
vi.mock("@vercel/analytics", () => ({ pageview: (a: unknown) => pageview(a) }));

import { contaContato, slug } from "@/lib/contagem";

describe("contagem de contatos", () => {
  it("transforma o nome do produto em endereço", () => {
    expect(slug("Seguro Automóvel")).toBe("seguro-automovel");
    expect(slug("Seguro de Vida")).toBe("seguro-de-vida");
    expect(slug("Consórcio")).toBe("consorcio");
  });

  it("registra só o endereço fixo, sem dado de ninguém", () => {
    contaContato("whatsapp/botao");
    expect(pageview).toHaveBeenCalledWith({ route: "/contato/whatsapp/botao", path: "/contato/whatsapp/botao" });
  });

  it("nunca atrapalha o contato se a contagem falhar", () => {
    pageview.mockImplementationOnce(() => {
      throw new Error("sem rede");
    });
    expect(() => contaContato("formulario")).not.toThrow();
  });
});
