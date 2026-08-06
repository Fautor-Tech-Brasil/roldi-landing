# DEPLOY — Landing da Roldi (`roldi-landing`)

Site público da **Roldi Seguros** (a "casa" do cliente nº 1). App estático **Vite + React +
Tailwind + shadcn/ui**, extraído do Lovable em 2026-07-14 e desacoplado. Deploy por **Git → Vercel**.

## Como atualizar (o fluxo normal)
1. Editar o código, `git commit`, **`git push` na `main`**.
2. O **Vercel** detecta o push e faz o build automático (`npm run build` → `dist/`) e o deploy em produção (~1 min).

Sem Lovable, sem upload manual. Projeto Vercel: **team `roldi-seguros` (Hobby/grátis)**, projeto `roldi-landing`.

## O formulário de contato (`/api/contact`)
O envio de e-mail é uma **função serverless da própria Vercel**, em `api/contact.ts`, publicada
pelo mesmo push que publica o site. Ela chama a API do Resend e manda o lead para
`contato@` e `diego@roldiseguros.com.br`.

É **mesma origem** (`/api/contact` no próprio domínio), então não há CORS.

> **Desde 2026-08-05 a casa não usa mais Supabase** (ADR-0008, no repo do motor). Antes, isto era
> uma edge function num projeto Supabase que só existia dentro do Lovable. Não procure `supabase/`
> neste repositório: foi removido, e não é para voltar.

## Variáveis de ambiente (no painel do Vercel — não no git)
**O frontend não usa nenhuma.** A única variável do projeto é um segredo de servidor, em
**Vercel → Project → Settings → Environment Variables**:

- `RESEND_API_KEY` — chave da conta Resend do Diego, lida por `api/contact.ts` via `process.env`.

⚠️ **Nunca** prefixar um segredo com `VITE_`: esse prefixo publica o valor no bundle do navegador.

> Sem essa variável o site continua no ar normalmente, mas o formulário responde erro. O sintoma
> é o formulário, não a página em branco.

## Domínio & DNS
- **Domínio:** `roldiseguros.com.br` — apex faz **308 → `www`** (canônico); servido pelo **Vercel**.
- **DNS gerenciado no Hostinger** (conta do Diego; domínio "externo" → hPanel → *Manage DNS*).
- Registros que apontam pro Vercel:

| Tipo | Nome | Valor |
|---|---|---|
| `A` | `@` | `216.198.79.1` |
| `CNAME` | `www` | `9b0d96777f9f805c.vercel-dns-017.com` |

⚠️ **Não tocar** nos registros de e-mail: `MX` (`mx1`/`mx2.hostinger.com`), `TXT` SPF
(`include:_spf.mail.hostinger.com`) e os `CNAME`/`TXT` de DKIM (`hostingermail-*`, `resend._domainkey`).
Mexer neles derruba o e-mail do Diego.

## Rollback
`git revert` do commit problemático e `git push` na `main`. A Vercel republica sozinha em ~1 min.

Para a **Vercel**, dá também para promover um deployment anterior pelo painel
(*Deployments* → o build bom → *Promote to Production*), que é mais rápido que esperar build.

> ⚠️ **O rollback "voltar pro Lovable" não existe mais.** Ele apontava o DNS para
> `185.158.133.1` e dependia do projeto no Lovable, que foi **despublicado em 2026-08-05** (servia
> um build de antes do gate jurídico de 01/08, com página em branco por falta das variáveis de
> ambiente). O projeto Supabase antigo segue de pé apenas como rede até a migração ser dada por
> provada; depois disso também é encerrado.

## Contexto / follow-ups
- Extraído do Lovable e migrado Lovable → Vercel em **2026-07-14** (ver ADR-0003 no repo do motor).
- Base do código é a versão de **13/07** do Lovable — se houve edição no Lovable depois, reconciliar.
- Dívidas: `npm audit` acusa vulnerabilidades herdadas do template; imagens pesadas
  (`roldi-logo` ~1,7 MB, `diego-duarte` ~2 MB) → otimizar para Web Vitals.
