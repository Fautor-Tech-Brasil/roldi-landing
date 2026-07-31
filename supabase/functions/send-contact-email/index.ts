import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

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
}

// Escape HTML special chars to prevent HTML/script injection in outgoing emails
const escapeHtml = (input: unknown): string =>
  String(input ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

// Conservative validators
const isValidEmail = (v: string) =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) && v.length <= 254;
const isValidPhone = (v: string) => /^[+\d\s().-]{6,32}$/.test(v);

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const body = (await req.json()) as Partial<ContactRequest>;
    const name = typeof body.name === "string" ? body.name.trim() : "";
    const email = typeof body.email === "string" ? body.email.trim() : "";
    const phone = typeof body.phone === "string" ? body.phone.trim() : "";
    const need = typeof body.need === "string" ? body.need.trim() : "";
    const message = typeof body.message === "string" ? body.message.trim().slice(0, 2000) : "";

    if (!name || !email || !phone || !need) {
      return new Response(
        JSON.stringify({ error: "Todos os campos são obrigatórios." }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    if (name.length > 120 || !isValidEmail(email) || !isValidPhone(phone) || need.length > 60) {
      return new Response(
        JSON.stringify({ error: "Dados inválidos." }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const needLabel = needLabels[need] || "Outro";

    // Pre-escape every value before interpolating into HTML
    const safeName = escapeHtml(name);
    const safeEmail = escapeHtml(email);
    const safePhone = escapeHtml(phone);
    const safeNeed = escapeHtml(needLabel);
    const safeMessage = message ? escapeHtml(message) : "";

    console.log(`Enviando e-mail de contato de ${safeName}`);

    const emailResponse = await resend.emails.send({
      from: "ROLDI Seguros <contato@roldiseguros.com.br>",
      to: ["contato@roldiseguros.com.br", "diego@roldiseguros.com.br"],
      reply_to: email,
      subject: `Novo contato via site — ${name}`.slice(0, 180),
      html: `
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
                <td style="padding: 12px 0; ${safeMessage ? "border-bottom: 1px solid #222; " : ""}color: #999; font-size: 13px;">Necessidade</td>
                <td style="padding: 12px 0; ${safeMessage ? "border-bottom: 1px solid #222; " : ""}color: #fff; font-size: 15px; font-weight: 600;">${safeNeed}</td>
              </tr>${safeMessage ? `
              <tr>
                <td style="padding: 12px 0; color: #999; font-size: 13px; vertical-align: top;">Mensagem</td>
                <td style="padding: 12px 0; color: #fff; font-size: 15px; white-space: pre-wrap;">${safeMessage}</td>
              </tr>` : ""}
            </table>
            <div style="margin-top: 28px; padding: 16px; background: #111; border-radius: 8px; border: 1px solid #222;">
              <p style="margin: 0; color: #999; font-size: 12px;">Para responder diretamente ao cliente, basta clicar em "Responder" — o e-mail será enviado para <strong style="color: #d4a843;">${safeEmail}</strong>.</p>
            </div>
          </div>
          <div style="padding: 16px 32px; background: #050505; text-align: center;">
            <p style="margin: 0; color: #666; font-size: 11px;">ROLDI Seguros — Rua Afonso Pena, 564, Florianópolis - SC</p>
          </div>
        </div>
      `,
    });

    console.log("E-mail enviado com sucesso:", emailResponse?.data?.id ?? "ok");

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error) {
    // Log full detail server-side, return generic message to the client
    console.error("Erro ao enviar e-mail:", error);
    return new Response(
      JSON.stringify({ error: "Não foi possível enviar o contato no momento. Tente novamente mais tarde." }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
