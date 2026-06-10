const BASE_URL = "http://localhost:5000/api/v1";

export const authAPI = {
  // POST /api/v1/users/login  — needs companyId + email + password
  login: async (companyId, email, password) => {
    const res = await fetch(`${BASE_URL}/users/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ companyId, email, password }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "Login failed");
    return data;
  },

  // POST /api/v1/users/register  — employee self-registration using inviteCode
  registerEmployee: async (payload) => {
    const res = await fetch(`${BASE_URL}/users/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "Registration failed");
    return data;
  },

  // POST /api/v1/companies/register  — admin registers company + creates admin account
  registerCompany: async (payload) => {
    const res = await fetch(`${BASE_URL}/companies/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "Company registration failed");
    return data;
  },
};

// Redirect based on user.role (only "admin" or "employee" exist)
export const getRoleDashboard = (role) => {
  const routes = {
    admin:    "/admin/dashboard",
    employee: "/employee/dashboard",
  };
  return routes[role] || "/";
};