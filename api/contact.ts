import { createHash, randomBytes } from "node:crypto";
import type { VercelRequest, VercelResponse } from "@vercel/node";

/**
 * Recebe o formulário "Fale com a ROLDI" e envia o e-mail ao corretor via Resend.
 *
 * Vive na Vercel, na mesma origem do site, então não há CORS: o navegador chama
 * /api/contact no próprio domínio. Substitui a edge function do Supabase (ADR-0008
 * do Fautor-Pacta).
 *
 * O segredo vem de variável de ambiente da Vercel, nunca do repositório.
 */

const RESEND_ENDPOINT = "https://api.resend.com/emails";

const REMETENTE = "ROLDI Seguros <contato@roldiseguros.com.br>";
const DESTINATARIOS = ["contato@roldiseguros.com.br", "diego@roldiseguros.com.br"];

const needLabels: Record<string, string> = {
  residencia: "Seguro Residência",
  auto: "Seguro Automóvel",
  empresarial: "Seguro Empresarial",
  vida: "Seguro de Vida",
  condominio: "Seguro Condomínio",
  consorcio: "Consórcio",
  outro: "Outro",
};

interface ContactRequest {
  name: string;
  email: string;
  phone: string;
  need: string;
  message?: string;
  /** Honeypot: humano nunca preenche, o campo é escondido e fora da ordem de foco. */
  website?: string;
}

/** Escapa caracteres especiais para impedir injeção de HTML no e-mail que sai. */
const escapeHtml = (input: unknown): string =>
  String(input ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

// Validadores conservadores
const isValidEmail = (v: string) =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) && v.length <= 254;
const isValidPhone = (v: string) => /^[+\d\s().-]{6,32}$/.test(v);

/* -------------------------------------------------------------------------
 * Controle de abuso (Fautor-Pacta#3)
 *
 * O endpoint é público por desenho: formulário sem login. O que se controla
 * aqui é volume, não identidade.
 *
 * ⚠️ LIMITE CONHECIDO, e está documentado em docs/audits/: o estado vive na
 * memória da instância serverless. Ele não é compartilhado entre instâncias e
 * se perde a cada partida a frio. Isto é defesa contra robô de formulário e
 * contra laço ingênuo, NÃO é garantia contra atacante determinado. A defesa
 * robusta exige desafio (Turnstile) ou estado compartilhado, e as duas custam
 * propriedades que este projeto decidiu preservar por ora.
 *
 * LGPD: o IP nunca é persistido, nunca é registrado em log, e é guardado em
 * memória apenas como hash com sal por instância (minimização, Art. 6º III).
 * ---------------------------------------------------------------------- */

const JANELA_IP_MS = 10 * 60 * 1000;
const MAX_ENVIOS_POR_IP = 3;
const JANELA_GLOBAL_MS = 60 * 60 * 1000;
const MAX_ENVIOS_GLOBAIS = 10;
/** Teto de chaves, para que rotação de IP não vire consumo ilimitado de memória. */
const MAX_CHAVES = 5000;

const HOSTS_PERMITIDOS = new Set([
  "roldiseguros.com.br",
  "www.roldiseguros.com.br",
  "localhost:8081",
  "localhost:5173",
]);

/** Sal por instância: o mesmo IP gera hashes diferentes entre instâncias, e some no reinício. */
const salDaInstancia = randomBytes(16).toString("hex");
const enviosPorChave = new Map<string, number[]>();
let enviosGlobais: number[] = [];

/**
 * Devolve null quando não dá para identificar o cliente.
 *
 * Isso é deliberado: se a plataforma deixar de enviar o cabeçalho, todo mundo
 * cairia na mesma chave e o teto por cliente viraria um teto global de 3 por 10
 * minutos, barrando lead legítimo. Preferimos degradar para "só o teto global
 * protege" a arriscar derrubar a captação do cliente.
 */
const chaveDoCliente = (req: VercelRequest): string | null => {
  const headers = req.headers ?? {};
  const encaminhado = headers["x-forwarded-for"];
  const bruto = Array.isArray(encaminhado) ? encaminhado[0] : encaminhado;
  const ip = (bruto ?? (headers["x-real-ip"] as string) ?? "").split(",")[0].trim();
  if (!ip) return null;
  return createHash("sha256").update(salDaInstancia + ip).digest("hex").slice(0, 32);
};

const recentes = (marcas: number[], agora: number, janela: number) =>
  marcas.filter((t) => agora - t < janela);

/** Só é chamado quando o envio de fato vai acontecer, para que lixo não gaste a cota de ninguém. */
const podeEnviar = (chave: string | null): { ok: true } | { ok: false; motivo: "ip" | "global" } => {
  const agora = Date.now();

  enviosGlobais = recentes(enviosGlobais, agora, JANELA_GLOBAL_MS);
  if (enviosGlobais.length >= MAX_ENVIOS_GLOBAIS) return { ok: false, motivo: "global" };

  if (chave === null) return { ok: true }; // cliente não identificável: só o teto global vale

  const doCliente = recentes(enviosPorChave.get(chave) ?? [], agora, JANELA_IP_MS);
  if (doCliente.length >= MAX_ENVIOS_POR_IP) {
    enviosPorChave.set(chave, doCliente);
    return { ok: false, motivo: "ip" };
  }

  return { ok: true };
};

const registrarEnvio = (chave: string | null) => {
  const agora = Date.now();
  enviosGlobais.push(agora);
  if (chave === null) return;
  enviosPorChave.set(chave, [...recentes(enviosPorChave.get(chave) ?? [], agora, JANELA_IP_MS), agora]);

  if (enviosPorChave.size > MAX_CHAVES) {
    for (const [k, marcas] of enviosPorChave) {
      if (recentes(marcas, agora, JANELA_IP_MS).length === 0) enviosPorChave.delete(k);
    }
    if (enviosPorChave.size > MAX_CHAVES) enviosPorChave.clear();
  }
};

/**
 * Origem: rejeita quando o cabeçalho existe e aponta para outro lugar.
 * Ausência é tolerada de propósito. Bloquear ausência arriscaria derrubar um
 * visitante legítimo cujo navegador ou extensão remova o cabeçalho, e o ganho
 * seria pequeno: quem forja um POST forja o Origin junto. Quem barra o laço
 * direto é o limite de volume, não isto.
 */
const origemAceita = (req: VercelRequest): boolean => {
  const headers = req.headers ?? {};
  const bruto = (headers.origin ?? headers.referer) as string | undefined;
  if (!bruto) return true;
  try {
    return HOSTS_PERMITIDOS.has(new URL(bruto).host);
  } catch {
    return false;
  }
};

const montarHtml = (dados: {
  name: string;
  email: string;
  phone: string;
  needLabel: string;
  message: string;
}) => {
  // Todo valor é escapado antes de entrar no HTML.
  const safeName = escapeHtml(dados.name);
  const safeEmail = escapeHtml(dados.email);
  const safePhone = escapeHtml(dados.phone);
  const safeNeed = escapeHtml(dados.needLabel);
  const safeMessage = dados.message ? escapeHtml(dados.message) : "";
  const linhaDivisoria = safeMessage ? "border-bottom: 1px solid #222; " : "";

  return `
        <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #0a0a0a; border-radius: 12px; overflow: hidden; border: 1px solid #222;">
          <div style="background: linear-gradient(135deg, #b8860b, #d4a843); padding: 28px 32px;">
            <h1 style="color: #0a0a0a; margin: 0; font-size: 22px; font-weight: 700;">ROLDI Seguros</h1>
            <p style="color: #0a0a0a; margin: 6px 0 0; font-size: 14px; opacity: 0.8;">Novo contato recebido via site</p>
          </div>
          <div style="padding: 32px;">
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 12px 0; border-bottom: 1px solid #222; color: #999; font-size: 13px; width: 140px;">Nome</td>
                <td style="padding: 12px 0; border-bottom: 1px solid #222; color: #fff; font-size: 15px; font-weight: 600;">${safeName}</td>
              </tr>
              <tr>
                <td style="padding: 12px 0; border-bottom: 1px solid #222; color: #999; font-size: 13px;">E-mail</td>
                <td style="padding: 12px 0; border-bottom: 1px solid #222; color: #d4a843; font-size: 15px;">
                  <a href="mailto:${safeEmail}" style="color: #d4a843; text-decoration: none;">${safeEmail}</a>
                </td>
              </tr>
              <tr>
                <td style="padding: 12px 0; border-bottom: 1px solid #222; color: #999; font-size: 13px;">Telefone</td>
                <td style="padding: 12px 0; border-bottom: 1px solid #222; color: #fff; font-size: 15px;">
                  <a href="tel:${safePhone}" style="color: #fff; text-decoration: none;">${safePhone}</a>
                </td>
              </tr>
              <tr>
                <td style="padding: 12px 0; ${linhaDivisoria}color: #999; font-size: 13px;">Necessidade</td>
                <td style="padding: 12px 0; ${linhaDivisoria}color: #fff; font-size: 15px; font-weight: 600;">${safeNeed}</td>
              </tr>${safeMessage ? `
              <tr>
                <td style="padding: 12px 0; color: #999; font-size: 13px; vertical-align: top;">Mensagem</td>
                <td style="padding: 12px 0; color: #fff; font-size: 15px; white-space: pre-wrap;">${safeMessage}</td>
              </tr>` : ""}
            </table>
            <div style="margin-top: 28px; padding: 16px; background: #111; border-radius: 8px; border: 1px solid #222;">
              <p style="margin: 0; color: #999; font-size: 12px;">Para responder diretamente ao cliente, basta clicar em "Responder": o e-mail será enviado para <strong style="color: #d4a843;">${safeEmail}</strong>.</p>
            </div>
          </div>
          <div style="padding: 16px 32px; background: #050505; text-align: center;">
            <p style="margin: 0; color: #666; font-size: 11px;">ROLDI Seguros, Rua Afonso Pena, 564, Florianópolis - SC</p>
          </div>
        </div>
      `;
};

const respostaGenerica = {
  error: "Não foi possível enviar o contato no momento. Tente novamente mais tarde.",
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Método não permitido." });
  }

  if (!origemAceita(req)) {
    console.warn("Envio recusado: origem não permitida.");
    return res.status(403).json({ error: "Origem não permitida." });
  }

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    // Falha de configuração: alto no log do servidor, genérica para quem chamou.
    console.error("RESEND_API_KEY ausente no ambiente. E-mail não enviado.");
    return res.status(500).json(respostaGenerica);
  }

  try {
    const body = (req.body ?? {}) as Partial<ContactRequest>;

    // Honeypot: se veio preenchido, é robô. Responde 200 para não ensinar o robô,
    // e não envia nada.
    if (typeof body.website === "string" && body.website.trim() !== "") {
      console.warn("Envio descartado pelo honeypot.");
      return res.status(200).json({ success: true });
    }

    const name = typeof body.name === "string" ? body.name.trim() : "";
    const email = typeof body.email === "string" ? body.email.trim() : "";
    const phone = typeof body.phone === "string" ? body.phone.trim() : "";
    const need = typeof body.need === "string" ? body.need.trim() : "";
    const message =
      typeof body.message === "string" ? body.message.trim().slice(0, 2000) : "";

    if (!name || !email || !phone || !need) {
      return res.status(400).json({ error: "Todos os campos são obrigatórios." });
    }

    if (name.length > 120 || !isValidEmail(email) || !isValidPhone(phone) || need.length > 60) {
      return res.status(400).json({ error: "Dados inválidos." });
    }

    // O limite é conferido aqui, e não na entrada: assim requisição malformada e
    // robô pego no honeypot não consomem a cota de um visitante legítimo que
    // porventura divida o mesmo IP (escritório atrás de NAT, por exemplo).
    const chave = chaveDoCliente(req);
    const permissao = podeEnviar(chave);
    if (!permissao.ok) {
      // Sem IP no log: só o motivo. O global tripado merece atenção humana.
      if (permissao.motivo === "global") {
        console.error("Teto global de envios atingido na janela. Possível abuso em curso.");
      } else {
        console.warn("Teto por cliente atingido na janela.");
      }
      res.setHeader("Retry-After", "600");
      return res.status(429).json({
        error: "Muitas mensagens enviadas em pouco tempo. Tente novamente em alguns minutos.",
      });
    }

    const needLabel = needLabels[need] || "Outro";

    const envio = await fetch(RESEND_ENDPOINT, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: REMETENTE,
        to: DESTINATARIOS,
        reply_to: email,
        subject: `Novo contato via site: ${name}`.slice(0, 180),
        html: montarHtml({ name, email, phone, needLabel, message }),
      }),
    });

    if (!envio.ok) {
      // O corpo do Resend pode conter o endereço do lead, então não vai para o log.
      console.error(`Resend recusou o envio. HTTP ${envio.status}.`);
      return res.status(502).json(respostaGenerica);
    }

    registrarEnvio(chave);

    // Sem dado pessoal no log (LGPD): nem nome, nem e-mail, nem telefone.
    console.log("E-mail de contato enviado com sucesso.");
    return res.status(200).json({ success: true });
  } catch (error) {
    console.error("Erro ao enviar e-mail de contato:", error);
    return res.status(500).json(respostaGenerica);
  }
}
