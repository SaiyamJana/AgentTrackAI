const PageHeader = ({ title, subtitle }) => {
  return (
    <div className="mb-6">
      <h1 className="text-4xl font-bold text-blue-700">
        {title}
      </h1>

      <p className="text-gray-600 mt-2">
        {subtitle}
      </p>
    </div>
  );
};

export default PageHeader;