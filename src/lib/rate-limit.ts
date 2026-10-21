import { pool } from "@/db/client";

// Limitador em Postgres: um Map em memória não é visto por outras invocações
// serverless (cada uma pode cair numa instância/cold start diferente na Vercel),
// então a contagem precisa viver num lugar compartilhado. O UPSERT é atômico —
// duas requisições concorrentes com a mesma chave serializam no lock da linha.
export async function checkRateLimit(key: string, limit = 5, windowMs = 15 * 60 * 1000): Promise<boolean> {
  const result = await pool.query<{ contagem: number }>(
    `INSERT INTO rate_limits (chave, contagem, expira_em)
     VALUES ($1, 1, now() + ($2::double precision * interval '1 millisecond'))
     ON CONFLICT (chave) DO UPDATE SET
       contagem = CASE WHEN rate_limits.expira_em < now() THEN 1 ELSE rate_limits.contagem + 1 END,
       expira_em = CASE
         WHEN rate_limits.expira_em < now() THEN now() + ($2::double precision * interval '1 millisecond')
         ELSE rate_limits.expira_em
       END
     RETURNING contagem`,
    [key, windowMs],
  );

  // Limpeza oportunista das linhas vencidas — sem job agendado, uma fração das
  // chamadas varre o que já expirou há mais de um dia.
  if (Math.random() < 0.01) {
    pool
      .query("DELETE FROM rate_limits WHERE expira_em < now() - interval '1 day'")
      .catch((error) => console.error("Erro ao limpar rate_limits:", error));
  }

  return (result.rows[0]?.contagem ?? 0) <= limit;
}

export function getClientIp(request: Request): string {
  return request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
}
