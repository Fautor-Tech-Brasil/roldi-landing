import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import type { VercelRequest, VercelResponse } from "@vercel/node";
import handler from "./contact";

/**
 * Cobre a superfície que importa da função de contato: validação, escape de HTML
 * e honeypot. O envio em si é simulado, nenhum e-mail real sai daqui.
 */

interface RespostaCapturada {
  statusCode?: number;
  corpo?: unknown;
  headers: Record<string, string>;
}

const criarRes = () => {
  const capturado: RespostaCapturada = { headers: {} };
  const res = {
    status(code: number) {
      capturado.statusCode = code;
      return this;
    },
    json(payload: unknown) {
      capturado.corpo = payload;
      return this;
    },
    setHeader(nome: string, valor: string) {
      capturado.headers[nome] = valor;
      return this;
    },
  };
  return { res: res as unknown as VercelResponse, capturado };
};

const criarReq = (body: unknown, method = "POST") =>
  ({ method, body }) as unknown as VercelRequest;

const leadValido = {
  name: "Maria de Teste",
  email: "maria@exemplo.com.br",
  phone: "(48) 99999-9999",
  need: "auto",
};

/** Último corpo JSON enviado ao Resend pelo fetch simulado. */
const corpoEnviadoAoResend = (fetchSimulado: ReturnType<typeof vi.fn>) =>
  JSON.parse(fetchSimulado.mock.calls[0][1].body as string);

let fetchSimulado: ReturnType<typeof vi.fn>;

beforeEach(() => {
  process.env.RESEND_API_KEY = "re_chave_de_teste";
  fetchSimulado = vi.fn(async () => ({ ok: true, status: 200 }));
  vi.stubGlobal("fetch", fetchSimulado);
  vi.spyOn(console, "log").mockImplementation(() => {});
  vi.spyOn(console, "warn").mockImplementation(() => {});
  vi.spyOn(console, "error").mockImplementation(() => {});
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("api/contact", () => {
  it("recusa método diferente de POST", async () => {
    const { res, capturado } = criarRes();
    await handler(criarReq(leadValido, "GET"), res);
    expect(capturado.statusCode).toBe(405);
    expect(capturado.headers.Allow).toBe("POST");
    expect(fetchSimulado).not.toHaveBeenCalled();
  });

  it("falha de forma genérica quando a RESEND_API_KEY não está no ambiente", async () => {
    delete process.env.RESEND_API_KEY;
    const { res, capturado } = criarRes();
    await handler(criarReq(leadValido), res);
    expect(capturado.statusCode).toBe(500);
    expect(capturado.corpo).not.toHaveProperty("success");
    expect(fetchSimulado).not.toHaveBeenCalled();
  });

  it("descarta em silêncio quando o honeypot vem preenchido", async () => {
    const { res, capturado } = criarRes();
    await handler(criarReq({ ...leadValido, website: "http://spam.example" }), res);
    // Responde 200 de propósito, para não ensinar o robô que foi barrado.
    expect(capturado.statusCode).toBe(200);
    expect(fetchSimulado).not.toHaveBeenCalled();
  });

  it("aceita quando o honeypot vem vazio", async () => {
    const { res, capturado } = criarRes();
    await handler(criarReq({ ...leadValido, website: "" }), res);
    expect(capturado.statusCode).toBe(200);
    expect(fetchSimulado).toHaveBeenCalledOnce();
  });

  it.each([
    ["sem nome", { ...leadValido, name: "" }],
    ["sem e-mail", { ...leadValido, email: "" }],
    ["sem telefone", { ...leadValido, phone: "" }],
    ["sem necessidade", { ...leadValido, need: "" }],
  ])("recusa payload %s", async (_rotulo, payload) => {
    const { res, capturado } = criarRes();
    await handler(criarReq(payload), res);
    expect(capturado.statusCode).toBe(400);
    expect(fetchSimulado).not.toHaveBeenCalled();
  });

  it.each([
    ["e-mail malformado", { ...leadValido, email: "nao-e-email" }],
    ["telefone malformado", { ...leadValido, phone: "abc" }],
    ["nome longo demais", { ...leadValido, name: "x".repeat(121) }],
  ])("recusa %s", async (_rotulo, payload) => {
    const { res, capturado } = criarRes();
    await handler(criarReq(payload), res);
    expect(capturado.statusCode).toBe(400);
    expect(fetchSimulado).not.toHaveBeenCalled();
  });

  it("envia ao Resend com destinatários, remetente e reply-to corretos", async () => {
    const { res, capturado } = criarRes();
    await handler(criarReq(leadValido), res);

    expect(capturado.statusCode).toBe(200);
    expect(fetchSimulado).toHaveBeenCalledOnce();

    const [url, init] = fetchSimulado.mock.calls[0];
    expect(url).toBe("https://api.resend.com/emails");
    expect(init.headers.Authorization).toBe("Bearer re_chave_de_teste");

    const corpo = corpoEnviadoAoResend(fetchSimulado);
    expect(corpo.to).toEqual([
      "contato@roldiseguros.com.br",
      "diego@roldiseguros.com.br",
    ]);
    expect(corpo.from).toContain("contato@roldiseguros.com.br");
    expect(corpo.reply_to).toBe(leadValido.email);
    expect(corpo.html).toContain("Seguro Automóvel");
  });

  it("escapa HTML vindo do formulário antes de montar o e-mail", async () => {
    const { res } = criarRes();
    await handler(
      criarReq({ ...leadValido, name: '<script>alert("x")</script>' }),
      res,
    );

    const corpo = corpoEnviadoAoResend(fetchSimulado);
    expect(corpo.html).not.toContain("<script>");
    expect(corpo.html).toContain("&lt;script&gt;");
  });

  it("devolve mensagem genérica quando o Resend recusa o envio", async () => {
    fetchSimulado.mockResolvedValueOnce({ ok: false, status: 422 });
    const { res, capturado } = criarRes();
    await handler(criarReq(leadValido), res);

    expect(capturado.statusCode).toBe(502);
    expect(JSON.stringify(capturado.corpo)).not.toContain("422");
  });
});
