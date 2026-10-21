"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
} from "recharts";
import type { FaturamentoDia } from "@/services/dashboard.service";
import { formatarDataCurta, formatarMoeda } from "@/utils/formatters";

const COR_BARRA = "#a9793f";

function TooltipFaturamento({
  active,
  payload,
}: {
  active?: boolean;
  payload?: { value: number }[];
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl bg-cream px-3 py-2 text-sm shadow-lg">
      <p className="font-semibold text-ink">
        {formatarMoeda(payload[0].value)}
      </p>
    </div>
  );
}

export default function GraficoFaturamento({
  dados,
}: {
  dados: FaturamentoDia[];
}) {
  const total = dados.reduce((acc, item) => acc + item.total, 0);

  return (
    <div className="rounded-3xl bg-cream-dark p-6">
      <div className="flex items-baseline justify-between gap-4">
        <h2 className="text-lg font-bold text-ink">Faturamento Diário</h2>
        <p className="text-sm text-ink-muted">
          Últimos {dados.length} dias:{" "}
          <span className="font-semibold text-ink">{formatarMoeda(total)}</span>
        </p>
      </div>

      <div className="mt-4 h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={dados}
            margin={{ top: 8, right: 8, left: 8, bottom: 0 }}
          >
            <CartesianGrid vertical={false} stroke="#e1e0d9" />
            <XAxis
              dataKey="data"
              tickFormatter={formatarDataCurta}
              interval={1}
              tickLine={false}
              axisLine={{ stroke: "#c3c2b7" }}
              tick={{ fill: "#898781", fontSize: 12 }}
            />
            <Tooltip
              content={<TooltipFaturamento />}
              cursor={{ fill: "rgba(73,69,79,0.06)" }}
            />
            <Bar
              dataKey="total"
              fill={COR_BARRA}
              radius={[4, 4, 0, 0]}
              maxBarSize={28}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
