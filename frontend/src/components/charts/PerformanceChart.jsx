import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

const data = [
  { week: "W1", performance: 60 },
  { week: "W2", performance: 75 },
  { week: "W3", performance: 82 },
  { week: "W4", performance: 95 },
];

const PerformanceChart = () => {
  return (
    <div className="bg-white p-5 rounded-xl shadow-lg border border-blue-100">
      <h2 className="text-xl font-semibold text-blue-700 mb-4">
        Performance
      </h2>

      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={data}>
          <XAxis dataKey="week" />
          <YAxis />
          <Tooltip />
          <Line
            type="monotone"
            dataKey="performance"
            stroke="#2563eb"
            strokeWidth={3}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default PerformanceChart;