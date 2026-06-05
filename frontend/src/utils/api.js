const BASE_URL = "http://localhost:5000/api/v1/users";

export const authAPI = {
  login: async (email, password) => {
    const res = await fetch(`${BASE_URL}/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "Login failed");
    return data;
  },

  register: async (payload) => {
    const res = await fetch(`${BASE_URL}/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "Registration failed");
    return data;
  },
};

export const getRoleDashboard = (role) => {
  const routes = {
    admin: "/admin/dashboard",
    manager: "/manager/dashboard",
    employee: "/employee/dashboard",
  };
  return routes[role] || "/";
};
