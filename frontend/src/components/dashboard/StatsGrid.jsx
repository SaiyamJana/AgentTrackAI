import DashboardCard from "./DashboardCard";

const StatsGrid = ({ stats }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
      {stats.map((item, index) => (
        <DashboardCard
          key={index}
          title={item.title}
          value={item.value}
        />
      ))}
    </div>
  );
};

export default StatsGrid;