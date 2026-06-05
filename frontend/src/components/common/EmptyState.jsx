const EmptyState = ({
  message = "No Data Available",
}) => {
  return (
    <div className="bg-white border border-blue-100 rounded-xl p-10 text-center shadow-lg">
      <h2 className="text-xl font-semibold text-blue-700">
        {message}
      </h2>

      <p className="text-gray-500 mt-2">
        There is currently nothing to display.
      </p>
    </div>
  );
};

export default EmptyState;