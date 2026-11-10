import { pageview } from "@vercel/analytics";

/**
 * Conta um contato (toque no WhatsApp ou formulário enviado) para o relatório mensal.
 *
 * Registra uma "página vista" com um endereço fixo, como /contato/whatsapp/botao, na contagem
 * gratuita da Vercel. Nenhum dado da pessoa entra: nem nome, nem telefone, nem mensagem.
 * Aprovada pelo cliente em 10/11/2026 junto com a contagem de visitas.
 */
export function contaContato(caminho: string) {
  const path = `/contato/${caminho}`;
  try {
    pageview({ route: path, path });
  } catch {
    // A contagem nunca pode atrapalhar o contato.
  }
}

/** "Seguro Automóvel" vira "seguro-automovel". */
export function slug(texto: string) {
  return texto
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}
