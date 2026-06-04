import { useState } from "react";

const RegisterForm = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
  });

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <input
        name="name"
        placeholder="Full Name"
        className="w-full border p-3 rounded"
        onChange={handleChange}
      />

      <input
        name="email"
        type="email"
        placeholder="Email"
        className="w-full border p-3 rounded"
        onChange={handleChange}
      />

      <input
        name="password"
        type="password"
        placeholder="Password"
        className="w-full border p-3 rounded"
        onChange={handleChange}
      />

      <button
        type="submit"
        className="w-full bg-green-600 text-white py-3 rounded"
      >
        Sign Up
      </button>
    </form>
  );
};

export default RegisterForm;