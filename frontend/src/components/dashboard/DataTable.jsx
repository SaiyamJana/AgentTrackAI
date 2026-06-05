const DataTable = ({ data }) => {
  return (
    <div className="bg-white rounded-xl shadow-lg border border-blue-100 p-5 overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="bg-blue-50">
            <th className="p-3 text-left text-blue-700">
              Name
            </th>
            <th className="p-3 text-left text-blue-700">
              Role
            </th>
            <th className="p-3 text-left text-blue-700">
              Status
            </th>
          </tr>
        </thead>

        <tbody>
          {data.map((user, index) => (
            <tr
              key={index}
              className="border-b hover:bg-blue-50"
            >
              <td className="p-3">{user.name}</td>
              <td className="p-3">{user.role}</td>
              <td className="p-3">{user.status}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default DataTable;