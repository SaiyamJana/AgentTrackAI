const BASE = "http://localhost:5000/api/v1";

const getToken = () => localStorage.getItem("token");
const authHeaders = () => ({
  "Content-Type": "application/json",
  Authorization: `Bearer ${getToken()}`,
});

const request = async (method, path, body) => {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: authHeaders(),
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Request failed");
  return data;
};

// ── Auth ──────────────────────────────────────────────────────────────────────
export const authAPI = {
  // POST /companies/register  — public bootstrap (Admin only)
  registerCompany: async (payload) => {
    const res = await fetch(`${BASE}/companies/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "Company registration failed");
    return data;
  },

  // POST /users/register  — employee self-registration with inviteCode
  register: async (payload) => {
    const res = await fetch(`${BASE}/users/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "Registration failed");
    return data;
  },

  // POST /users/login  — requires companyId + email + password
  login: async (companyId, email, password) => {
    const res = await fetch(`${BASE}/users/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ companyId, email, password }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "Login failed");
    return data;
  },
};

// ── Users (Admin) ─────────────────────────────────────────────────────────────
export const userAPI = {
  list: (params = {}) => {
    const qs = new URLSearchParams(
      Object.fromEntries(Object.entries(params).filter(([, v]) => v))
    ).toString();
    return request("GET", `/users${qs ? `?${qs}` : ""}`);
  },
  getById: (id) => request("GET", `/users/${id}`),
  update:  (id, payload) => request("PATCH", `/users/${id}`, payload),
  deactivate: (id) => request("DELETE", `/users/${id}`),
};

// ── Companies (Admin) ─────────────────────────────────────────────────────────
export const companyAPI = {
  getById:         (id) => request("GET",  `/companies/${id}`),
  update:          (id, payload) => request("PATCH", `/companies/${id}`, payload),
  regenerateInvite:(id) => request("POST", `/companies/${id}/regenerate-invite`),
};

// ── Projects ──────────────────────────────────────────────────────────────────
export const projectAPI = {
  // GET /projects — Admin sees all; employee (manager) sees their own
  list: (params = {}) => {
    const qs = new URLSearchParams(
      Object.fromEntries(Object.entries(params).filter(([, v]) => v))
    ).toString();
    return request("GET", `/projects${qs ? `?${qs}` : ""}`);
  },
  // GET /projects/my — employee sees projects they are assigned to
  my: () => request("GET", "/projects/my"),

  getById: (id) => request("GET", `/projects/${id}`),
  create:  (payload) => request("POST", "/projects", payload),
  update:  (id, payload) => request("PATCH", `/projects/${id}`, payload),
  assignManager: (id, managerId) => request("PATCH", `/projects/${id}/manager`, { managerId }),
};

// ── Project Members ───────────────────────────────────────────────────────────
export const memberAPI = {
  // GET /projects/:id/employees
  list: (projectId) => request("GET", `/projects/${projectId}/employees`),
  // POST /projects/:id/employees — { employeeId, projectRole: "manager"|"member" }
  assign: (projectId, employeeId, projectRole = "member") =>
    request("POST", `/projects/${projectId}/employees`, { employeeId, projectRole }),
  // PATCH /projects/:id/employees/:eid/role — manager sets sub-manager
  setRole: (projectId, employeeId, projectRole) =>
    request("PATCH", `/projects/${projectId}/employees/${employeeId}/role`, { projectRole }),
  // DELETE /projects/:id/employees/:eid
  remove: (projectId, employeeId) =>
    request("DELETE", `/projects/${projectId}/employees/${employeeId}`),
};

// ── Tasks ─────────────────────────────────────────────────────────────────────
export const taskAPI = {
  // GET /tasks?projectId=&status=&priority=  (manager/sub-manager)
  list: (params = {}) => {
    const qs = new URLSearchParams(
      Object.fromEntries(Object.entries(params).filter(([, v]) => v))
    ).toString();
    return request("GET", `/tasks${qs ? `?${qs}` : ""}`);
  },
  // GET /tasks/kanban?projectId=  (manager/sub-manager)
  kanban: (projectId) => request("GET", `/tasks/kanban?projectId=${projectId}`),
  // GET /tasks/my  (employee — own tasks)
  my: (params = {}) => {
    const qs = new URLSearchParams(
      Object.fromEntries(Object.entries(params).filter(([, v]) => v))
    ).toString();
    return request("GET", `/tasks/my${qs ? `?${qs}` : ""}`);
  },
  getById:  (id) => request("GET",    `/tasks/${id}`),
  create:   (payload) => request("POST",  "/tasks", payload),
  update:   (id, payload) => request("PATCH", `/tasks/${id}`, payload),
  // PATCH /tasks/:id/status  (assigned employee only)
  updateStatus:   (id, status) => request("PATCH", `/tasks/${id}/status`, { status }),
  // PATCH /tasks/:id/progress  (assigned employee only)
  updateProgress: (id, payload) => request("PATCH", `/tasks/${id}/progress`, payload),
  delete: (id) => request("DELETE", `/tasks/${id}`),
};

// ── Role redirect helper ──────────────────────────────────────────────────────
// After the redesign there are only two user roles: "admin" and "employee"
export const getRoleDashboard = (role) =>
  role === "admin" ? "/admin/dashboard" : "/employee/dashboard";
