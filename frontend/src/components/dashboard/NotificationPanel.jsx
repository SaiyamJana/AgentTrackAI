const NotificationPanel = () => {
  const notifications = [
    "Meeting at 3 PM",
    "Task deadline tomorrow",
    "Project review scheduled",
    "New employee joined",
  ];

  return (
    <div className="bg-white rounded-xl shadow-lg border border-blue-100 p-5">
      <h2 className="text-xl font-semibold text-blue-700 mb-4">
        Notifications
      </h2>

      <ul className="space-y-3">
        {notifications.map((item, index) => (
          <li
            key={index}
            className="border-b border-blue-50 pb-2"
          >
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default NotificationPanel;