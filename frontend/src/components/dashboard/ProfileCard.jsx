const ProfileCard = () => {
  return (
    <div className="bg-white rounded-xl shadow-lg border border-blue-100 p-5 text-center">
      <div className="w-24 h-24 rounded-full bg-blue-600 text-white flex items-center justify-center mx-auto text-3xl font-bold">
        JD
      </div>

      <h2 className="mt-4 text-xl font-bold text-blue-700">
        John Doe
      </h2>

      <p className="text-gray-500">
        Software Engineer
      </p>
    </div>
  );
};

export default ProfileCard;