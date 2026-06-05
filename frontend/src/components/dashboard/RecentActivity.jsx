const RecentActivity = () => {
  const activities = [
    "New task assigned",
    "Task completed",
    "Manager updated project",
    "Report generated",
  ];

  return (
    <div className="bg-white rounded-xl shadow-lg border border-blue-100 p-5">
      <h2 className="text-xl font-semibold text-blue-700 mb-4">
        Recent Activity
      </h2>

      {activities.map((activity, index) => (
        <div
          key={index}
          className="py-3 border-b border-blue-50"
        >
          {activity}
        </div>
      ))}
    </div>
  );
};

export default RecentActivity;