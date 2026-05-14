import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend
} from "recharts";

const COLORS = ["#10B981", "#3B82F6", "#64748B"];

export default function TaskPieChart({ completed, inProgress, todo }) {
  const data = [
    { name: "Done", value: completed || 0 },
    { name: "In Progress", value: inProgress || 0 },
    { name: "Todo", value: todo || 0 }
  ];

  const hasData = data.some(d => d.value > 0);

  const safeData = hasData
    ? data
    : [{ name: "No Data", value: 1 }];

  return (
    <div className="w-full h-[320px]">
      <ResponsiveContainer>
        <PieChart>
          <Pie
            data={safeData}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={110}
            paddingAngle={4}
            dataKey="value"
          >
            {safeData.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={COLORS[index % COLORS.length] || "#1e293b"}
              />
            ))}
          </Pie>

          <Tooltip />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
