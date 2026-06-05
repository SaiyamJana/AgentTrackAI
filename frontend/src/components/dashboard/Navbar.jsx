const Navbar = ({ title }) => {
  return (
    <div className="bg-white border-b border-blue-100 shadow-sm px-6 py-4 flex justify-between items-center">
      <h1 className="text-2xl font-bold text-blue-700">
        {title}
      </h1>

      <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition">
        Logout
      </button>
    </div>
  );
};

export default Navbar;