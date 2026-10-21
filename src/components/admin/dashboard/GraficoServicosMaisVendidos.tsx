"use client";

import {
  Bar,
  BarChart,
  Cell,
  LabelList,
  ResponsiveContainer,
  XAxis,
  YAxis,
} from "recharts";
import type { ServicoMaisVendido } from "@/services/dashboard.service";

const CORES_CATEGORICAS = [
  "#2a78d6",
  "#eb6834",
  "#1baf7a",
  "#eda100",
  "#e87ba4",
  "#4a3aa7",
];

export default function GraficoServicosMaisVendidos({
  dados,
}: {
  dados: ServicoMaisVendido[];
}) {
  const maior = Math.max(1, ...dados.map((item) => item.total));

  return (
    <div className="rounded-3xl bg-cream-dark p-6">
      <h2 className="text-lg font-bold text-ink">Serviços Mais Procurados</h2>
      <p className="text-sm text-ink-muted">
        Mês atual · agendamentos não cancelados
      </p>

      {dados.length === 0 ? (
        <p className="mt-8 text-center text-ink-muted">
          Nenhum agendamento registrado no mês.
        </p>
      ) : (
        <div
          className="mt-4"
          style={{ height: Math.max(180, dados.length * 44) }}
        >
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={dados}
              layout="vertical"
              margin={{ top: 0, right: 24, left: 0, bottom: 0 }}
            >
              <XAxis type="number" domain={[0, maior]} hide />
              <YAxis
                type="category"
                dataKey="nome"
                width={140}
                tickLine={false}
                axisLine={false}
                tick={{ fill: "#49454f", fontSize: 13 }}
              />
              <Bar dataKey="total" radius={[0, 4, 4, 0]} maxBarSize={22}>
                {dados.map((item, index) => (
                  <Cell
                    key={item.nome}
                    fill={CORES_CATEGORICAS[index % CORES_CATEGORICAS.length]}
                  />
                ))}
                <LabelList
                  dataKey="total"
                  position="right"
                  style={{ fill: "#49454f", fontSize: 12, fontWeight: 600 }}
                />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
