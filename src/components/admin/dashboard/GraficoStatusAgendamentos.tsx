"use client";

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import type { AgendamentosPorStatus } from "@/services/dashboard.service";
import type { StatusAgendamento } from "@/types/agendamento";
import { STATUS_LABEL } from "@/utils/statusAgendamento";

const COR_STATUS: Record<StatusAgendamento, string> = {
  pendente: "#eab308",
  confirmado: "#65528a",
  concluido: "#9b96a0",
  cancelado: "#584324",
};

function TooltipStatus({
  active,
  payload,
}: {
  active?: boolean;
  payload?: { name: string; value: number }[];
}) {
  if (!active || !payload?.length) return null;
  const item = payload[0];
  return (
    <div className="rounded-xl bg-cream px-3 py-2 text-sm shadow-lg">
      <p className="font-semibold text-ink">
        {item.name}: {item.value}
      </p>
    </div>
  );
}

export default function GraficoStatusAgendamentos({
  dados,
}: {
  dados: AgendamentosPorStatus[];
}) {
  const total = dados.reduce((acc, item) => acc + item.total, 0);
  const dadosGrafico = dados.map((item) => ({
    status: item.status,
    nome: STATUS_LABEL[item.status],
    total: item.total,
  }));

  return (
    <div className="rounded-3xl bg-cream-dark p-6">
      <h2 className="text-lg font-bold text-ink">Agendamentos por Status</h2>
      <p className="text-sm text-ink-muted">Mês atual · {total} agendamentos</p>

      {total === 0 ? (
        <p className="mt-8 text-center text-ink-muted">
          Nenhum agendamento registrado no mês.
        </p>
      ) : (
        <div className="mt-2 flex flex-col items-center gap-4 sm:flex-row">
          <div className="h-48 w-48 shrink-0">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={dadosGrafico}
                  dataKey="total"
                  nameKey="nome"
                  innerRadius="60%"
                  outerRadius="100%"
                  paddingAngle={2}
                  stroke="#f4f4ef"
                  strokeWidth={2}
                >
                  {dadosGrafico.map((item) => (
                    <Cell key={item.status} fill={COR_STATUS[item.status]} />
                  ))}
                </Pie>
                <Tooltip content={<TooltipStatus />} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <ul className="flex w-full flex-col gap-2">
            {dadosGrafico.map((item) => (
              <li
                key={item.status}
                className="flex items-center justify-between gap-3 text-sm"
              >
                <span className="flex items-center gap-2 text-ink">
                  <span
                    className="inline-block size-2.5 shrink-0 rounded-full"
                    style={{ backgroundColor: COR_STATUS[item.status] }}
                  />
                  {item.nome}
                </span>
                <span className="font-semibold text-ink">{item.total}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
