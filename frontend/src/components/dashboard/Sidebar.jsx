const Sidebar = ({ menuItems }) => {
  return (
    <div className="w-64 min-h-screen bg-blue-800 text-white p-5">
      <h2 className="text-3xl font-bold mb-8">
        AgentTrack AI
      </h2>

      <ul className="space-y-3">
        {menuItems.map((item, index) => (
          <li
            key={index}
            className="p-3 rounded-lg hover:bg-blue-700 cursor-pointer transition"
          >
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default Sidebar;