import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

const data = [
  { month: "Jan", tasks: 20 },
  { month: "Feb", tasks: 35 },
  { month: "Mar", tasks: 28 },
  { month: "Apr", tasks: 45 },
];

const TaskChart = () => {
  return (
    <div className="bg-white p-5 rounded-xl shadow-lg border border-blue-100">
      <h2 className="text-xl font-semibold text-blue-700 mb-4">
        Tasks Overview
      </h2>

      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data}>
          <XAxis dataKey="month" />
          <YAxis />
          <Tooltip />
          <Bar dataKey="tasks" fill="#2563eb" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default TaskChart;