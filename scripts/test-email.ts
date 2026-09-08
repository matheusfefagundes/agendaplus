import { config } from "dotenv";

config({ path: ".env.local" });

const apiKey = process.env.BREVO_API_KEY;
const senderEmail = process.env.BREVO_SENDER_EMAIL;
const senderName = process.env.BREVO_SENDER_NAME ?? "Agenda+";
const recipient = process.env.BREVO_TEST_RECIPIENT || senderEmail;

if (!apiKey || !senderEmail || !recipient) {
  console.error(
    "Configure BREVO_API_KEY e BREVO_SENDER_EMAIL no .env.local antes de executar o teste.",
  );
  process.exit(1);
}

async function main() {
  const response = await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: {
      accept: "application/json",
      "api-key": apiKey as string,
      "content-type": "application/json",
    },
    body: JSON.stringify({
      sender: { name: senderName, email: senderEmail },
      to: [{ email: recipient }],
      subject: "Teste de e-mail do Agenda+",
      htmlContent: `
        <div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;color:#49454f">
          <h1 style="color:#c49e77">Agenda+</h1>
          <p>A integração com a Brevo está funcionando.</p>
          <p>Este é apenas um e-mail de teste; nenhuma senha foi alterada.</p>
        </div>
      `,
      tags: ["teste-integracao"],
    }),
    signal: AbortSignal.timeout(15_000),
  });

  const body = (await response.json().catch(() => null)) as
    | { messageId?: string; message?: string; code?: string }
    | null;

  if (!response.ok) {
    if (response.status === 401 && body?.message?.includes("unrecognised IP address")) {
      throw new Error(
        "A Brevo bloqueou o IP atual. Autorize-o em https://app.brevo.com/security/authorised_ips e execute o teste novamente.",
      );
    }
    throw new Error(
      `Brevo respondeu HTTP ${response.status}: ${body?.message ?? body?.code ?? "erro desconhecido"}`,
    );
  }

  console.log(`E-mail aceito pela Brevo. Message ID: ${body?.messageId ?? "não informado"}`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : "Falha desconhecida no teste de e-mail.");
  process.exitCode = 1;
});
