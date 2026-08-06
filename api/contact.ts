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

    // Sem dado pessoal no log (LGPD): nem nome, nem e-mail, nem telefone.
    console.log("E-mail de contato enviado com sucesso.");
    return res.status(200).json({ success: true });
  } catch (error) {
    console.error("Erro ao enviar e-mail de contato:", error);
    return res.status(500).json(respostaGenerica);
  }
}
