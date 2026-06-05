const DashboardCard = ({ title, value }) => {
  return (
    <div className="bg-white rounded-xl shadow-lg border border-blue-100 p-5 hover:shadow-xl transition">
      <h3 className="text-gray-500 text-sm">
        {title}
      </h3>

      <h2 className="text-3xl font-bold text-blue-700 mt-2">
        {value}
      </h2>
    </div>
  );
};

export default DashboardCard;