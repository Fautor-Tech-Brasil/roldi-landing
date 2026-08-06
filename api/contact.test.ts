import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import type { VercelRequest, VercelResponse } from "@vercel/node";

/**
 * Cobre a superfície que importa da função de contato: validação, escape de HTML,
 * honeypot e controle de abuso (Fautor-Pacta#3). O envio é simulado, nenhum
 * e-mail real sai daqui.
 *
 * O controle de abuso guarda estado em memória de módulo, então cada teste
 * recarrega o módulo para começar do zero. Sem isso, um teste contamina o outro.
 */

// Precisam bater com as constantes de api/contact.ts.
const MAX_POR_IP = 3;
const MAX_GLOBAL = 10;

type Handler = (req: VercelRequest, res: VercelResponse) => Promise<unknown>;

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

interface OpcoesReq {
  method?: string;
  ip?: string;
  origin?: string;
  referer?: string;
}

const criarReq = (body: unknown, o: OpcoesReq = {}) =>
  ({
    method: o.method ?? "POST",
    headers: {
      ...(o.ip ? { "x-forwarded-for": o.ip } : {}),
      ...(o.origin ? { origin: o.origin } : {}),
      ...(o.referer ? { referer: o.referer } : {}),
    },
    body,
  }) as unknown as VercelRequest;

const leadValido = {
  name: "Maria de Teste",
  email: "maria@exemplo.com.br",
  phone: "(48) 99999-9999",
  need: "auto",
};

const corpoEnviadoAoResend = (simulado: ReturnType<typeof vi.fn>) =>
  JSON.parse(simulado.mock.calls[0][1].body as string);

let handler: Handler;
let fetchSimulado: ReturnType<typeof vi.fn>;

beforeEach(async () => {
  vi.resetModules(); // zera o estado em memória do controle de abuso
  process.env.RESEND_API_KEY = "re_chave_de_teste";
  fetchSimulado = vi.fn(async () => ({ ok: true, status: 200 }));
  vi.stubGlobal("fetch", fetchSimulado);
  vi.spyOn(console, "log").mockImplementation(() => {});
  vi.spyOn(console, "warn").mockImplementation(() => {});
  vi.spyOn(console, "error").mockImplementation(() => {});
  handler = (await import("./contact")).default;
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("api/contact — entrada e validação", () => {
  it("recusa método diferente de POST", async () => {
    const { res, capturado } = criarRes();
    await handler(criarReq(leadValido, { method: "GET" }), res);
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

  it.each([
    ["sem nome", { ...leadValido, name: "" }],
    ["sem e-mail", { ...leadValido, email: "" }],
    ["sem telefone", { ...leadValido, phone: "" }],
    ["sem necessidade", { ...leadValido, need: "" }],
    ["e-mail malformado", { ...leadValido, email: "nao-e-email" }],
    ["telefone malformado", { ...leadValido, phone: "abc" }],
    ["nome longo demais", { ...leadValido, name: "x".repeat(121) }],
  ])("recusa payload %s", async (_rotulo, payload) => {
    const { res, capturado } = criarRes();
    await handler(criarReq(payload), res);
    expect(capturado.statusCode).toBe(400);
    expect(fetchSimulado).not.toHaveBeenCalled();
  });
});

describe("api/contact — envio", () => {
  it("envia ao Resend com destinatários, remetente e reply-to corretos", async () => {
    const { res, capturado } = criarRes();
    await handler(criarReq(leadValido), res);

    expect(capturado.statusCode).toBe(200);
    const [url, init] = fetchSimulado.mock.calls[0];
    expect(url).toBe("https://api.resend.com/emails");
    expect(init.headers.Authorization).toBe("Bearer re_chave_de_teste");

    const corpo = corpoEnviadoAoResend(fetchSimulado);
    expect(corpo.to).toEqual(["contato@roldiseguros.com.br", "diego@roldiseguros.com.br"]);
    expect(corpo.reply_to).toBe(leadValido.email);
    expect(corpo.html).toContain("Seguro Automóvel");
  });

  it("escapa HTML vindo do formulário antes de montar o e-mail", async () => {
    const { res } = criarRes();
    await handler(criarReq({ ...leadValido, name: '<script>alert("x")</script>' }), res);
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

describe("api/contact — honeypot", () => {
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
});

describe("api/contact — origem", () => {
  it("recusa origem de outro domínio", async () => {
    const { res, capturado } = criarRes();
    await handler(criarReq(leadValido, { origin: "https://site-do-atacante.example" }), res);
    expect(capturado.statusCode).toBe(403);
    expect(fetchSimulado).not.toHaveBeenCalled();
  });

  it("recusa referer de outro domínio", async () => {
    const { res, capturado } = criarRes();
    await handler(criarReq(leadValido, { referer: "https://site-do-atacante.example/x" }), res);
    expect(capturado.statusCode).toBe(403);
    expect(fetchSimulado).not.toHaveBeenCalled();
  });

  it("aceita a origem do próprio site", async () => {
    const { res, capturado } = criarRes();
    await handler(criarReq(leadValido, { origin: "https://www.roldiseguros.com.br" }), res);
    expect(capturado.statusCode).toBe(200);
  });

  it("tolera ausência de origem, para não derrubar visitante legítimo", async () => {
    const { res, capturado } = criarRes();
    await handler(criarReq(leadValido), res);
    expect(capturado.statusCode).toBe(200);
  });
});

describe("api/contact — controle de abuso (regressão da #3)", () => {
  /**
   * Este é O teste da Issue. Antes do fix, 50 requisições válidas do mesmo
   * cliente disparavam 50 envios. Foi assim que a vulnerabilidade foi provada.
   */
  it("50 requisições válidas do mesmo cliente não disparam 50 envios", async () => {
    const respostas: number[] = [];
    for (let i = 0; i < 50; i++) {
      const { res, capturado } = criarRes();
      await handler(criarReq({ ...leadValido, email: `a${i}@exemplo.com` }, { ip: "203.0.113.7" }), res);
      respostas.push(capturado.statusCode!);
    }

    expect(fetchSimulado).toHaveBeenCalledTimes(MAX_POR_IP);
    expect(respostas.filter((c) => c === 200)).toHaveLength(MAX_POR_IP);
    expect(respostas.filter((c) => c === 429)).toHaveLength(50 - MAX_POR_IP);
  });

  it("a resposta 429 traz Retry-After", async () => {
    let ultimo = criarRes();
    for (let i = 0; i <= MAX_POR_IP; i++) {
      ultimo = criarRes();
      await handler(criarReq(leadValido, { ip: "203.0.113.8" }), ultimo.res);
    }
    expect(ultimo.capturado.statusCode).toBe(429);
    expect(ultimo.capturado.headers["Retry-After"]).toBe("600");
  });

  it("clientes diferentes não herdam o bloqueio um do outro", async () => {
    const primeiro = criarRes();
    for (let i = 0; i <= MAX_POR_IP; i++) {
      await handler(criarReq(leadValido, { ip: "203.0.113.10" }), criarRes().res);
    }
    await handler(criarReq(leadValido, { ip: "203.0.113.11" }), primeiro.res);
    expect(primeiro.capturado.statusCode).toBe(200);
  });

  it("o teto global protege a cota do Resend mesmo com IPs rotativos", async () => {
    // 8 clientes distintos x 3 envios cada = 24 tentativas, acima do teto global.
    for (let cliente = 0; cliente < 8; cliente++) {
      for (let i = 0; i < MAX_POR_IP; i++) {
        await handler(criarReq(leadValido, { ip: `198.51.100.${cliente}` }), criarRes().res);
      }
    }
    expect(fetchSimulado).toHaveBeenCalledTimes(MAX_GLOBAL);
  });

  it("requisição malformada não consome a cota de quem é legítimo", async () => {
    for (let i = 0; i < 20; i++) {
      await handler(criarReq({ lixo: true }, { ip: "203.0.113.20" }), criarRes().res);
    }
    const { res, capturado } = criarRes();
    await handler(criarReq(leadValido, { ip: "203.0.113.20" }), res);
    expect(capturado.statusCode).toBe(200);
    expect(fetchSimulado).toHaveBeenCalledOnce();
  });

  it("robô pego no honeypot não consome a cota de quem é legítimo", async () => {
    for (let i = 0; i < 20; i++) {
      await handler(
        criarReq({ ...leadValido, website: "spam" }, { ip: "203.0.113.21" }),
        criarRes().res,
      );
    }
    const { res, capturado } = criarRes();
    await handler(criarReq(leadValido, { ip: "203.0.113.21" }), res);
    expect(capturado.statusCode).toBe(200);
    expect(fetchSimulado).toHaveBeenCalledOnce();
  });

  it("sem cabeçalho de IP, não bloqueia visitante legítimo, mas o teto global ainda protege", async () => {
    // Cenário de degradação: se a plataforma parar de enviar x-forwarded-for,
    // ninguém pode ser identificado. O teto por cliente tem que sair de cena,
    // senão o terceiro visitante do dia leva 429 sem ter feito nada.
    const respostas: number[] = [];
    for (let i = 0; i < 15; i++) {
      const { res, capturado } = criarRes();
      await handler(criarReq(leadValido), res); // sem ip
      respostas.push(capturado.statusCode!);
    }
    expect(respostas.slice(0, MAX_POR_IP + 1).every((c) => c === 200)).toBe(true);
    expect(fetchSimulado).toHaveBeenCalledTimes(MAX_GLOBAL);
  });

  it("não registra IP em log", async () => {
    const warn = vi.spyOn(console, "warn");
    const ip = "203.0.113.99";
    for (let i = 0; i <= MAX_POR_IP; i++) {
      await handler(criarReq(leadValido, { ip }), criarRes().res);
    }
    const tudo = warn.mock.calls.flat().join(" ");
    expect(tudo).not.toContain(ip);
  });
});
