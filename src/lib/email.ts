import "server-only";

const BREVO_EMAIL_ENDPOINT = "https://api.brevo.com/v3/smtp/email";

function escaparHtml(valor: string): string {
  return valor.replace(/[&<>"]/g, (caractere) => {
    const entidades: Record<string, string> = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
    };
    return entidades[caractere];
  });
}

export async function enviarEmailRedefinicaoSenha(input: {
  destinatario: string;
  nome: string;
  link: string;
}): Promise<void> {
  const apiKey = process.env.BREVO_API_KEY;
  if (!apiKey) {
    throw new Error("BREVO_API_KEY não configurada.");
  }

  const remetenteEmail = process.env.BREVO_SENDER_EMAIL;
  if (!remetenteEmail) {
    throw new Error("BREVO_SENDER_EMAIL não configurado.");
  }

  const remetenteNome = process.env.BREVO_SENDER_NAME ?? "Agenda+";
  const nome = escaparHtml(input.nome);
  const link = escaparHtml(input.link);

  const response = await fetch(BREVO_EMAIL_ENDPOINT, {
    method: "POST",
    headers: {
      accept: "application/json",
      "api-key": apiKey,
      "content-type": "application/json",
    },
    body: JSON.stringify({
      sender: { name: remetenteNome, email: remetenteEmail },
      to: [{ name: input.nome, email: input.destinatario }],
      subject: "Redefina sua senha do Agenda+",
      htmlContent: `
        <div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;color:#49454f">
          <h1 style="color:#c49e77">Agenda+</h1>
          <p>Olá, ${nome}.</p>
          <p>Recebemos uma solicitação para redefinir a senha da sua conta.</p>
          <p style="margin:32px 0">
            <a href="${link}" style="background:#c49e77;color:#fff;text-decoration:none;padding:14px 24px;border-radius:999px;font-weight:700">
              Redefinir minha senha
            </a>
          </p>
          <p>Este link é válido por 1 hora e só pode ser usado uma vez.</p>
          <p style="font-size:13px;color:#7a7580">Se você não fez esta solicitação, ignore este e-mail.</p>
        </div>
      `,
      tags: ["recuperacao-senha"],
    }),
    cache: "no-store",
    signal: AbortSignal.timeout(15_000),
  });

  if (!response.ok) {
    const detalhes = (await response.json().catch(() => null)) as { message?: string } | null;
    throw new Error(
      `Falha ao enviar e-mail pela Brevo (${response.status}): ${detalhes?.message ?? "erro desconhecido"}`,
    );
  }
}
