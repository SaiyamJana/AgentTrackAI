const BASE = "http://localhost:5000/api/v1";

// ── Token helper ─────────────────────────────────────────────────────────────
const getToken = () => localStorage.getItem("token");

const authHeaders = () => ({
  "Content-Type": "application/json",
  Authorization: `Bearer ${getToken()}`,
});

// ── Generic fetch wrapper ────────────────────────────────────────────────────
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

// ── Auth API ─────────────────────────────────────────────────────────────────
export const authAPI = {
  login: async (email, password) => {
    const res = await fetch(`${BASE}/users/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "Login failed");
    return data;
  },

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
};

// ── Task API ─────────────────────────────────────────────────────────────────
export const taskAPI = {
  // GET /tasks — paginated, filterable
  // params: { projectId, status, priority, assignedTo, page, limit }
  list: (params = {}) => {
    const qs = new URLSearchParams(
      Object.fromEntries(Object.entries(params).filter(([, v]) => v))
    ).toString();
    return request("GET", `/tasks${qs ? `?${qs}` : ""}`);
  },

  // GET /tasks/my-tasks — employee's own tasks + stats
  myTasks: (params = {}) => {
    const qs = new URLSearchParams(
      Object.fromEntries(Object.entries(params).filter(([, v]) => v))
    ).toString();
    return request("GET", `/tasks/my-tasks${qs ? `?${qs}` : ""}`);
  },

  // GET /tasks/stats/overview — KPI counts for manager dashboard
  statsOverview: () => request("GET", "/tasks/stats/overview"),

  // GET /tasks/project/:projectId — kanban board grouped by status
  byProject: (projectId) => request("GET", `/tasks/project/${projectId}`),

  // GET /tasks/:taskId
  getById: (taskId) => request("GET", `/tasks/${taskId}`),

  // POST /tasks
  create: (payload) => request("POST", "/tasks", payload),

  // PATCH /tasks/:taskId
  update: (taskId, payload) => request("PATCH", `/tasks/${taskId}`, payload),

  // PATCH /tasks/:taskId/reassign
  reassign: (taskId, assignedTo) =>
    request("PATCH", `/tasks/${taskId}/reassign`, { assignedTo }),

  // DELETE /tasks/:taskId
  delete: (taskId) => request("DELETE", `/tasks/${taskId}`),
};

// ── User API ─────────────────────────────────────────────────────────────────
export const userAPI = {
  // GET /users — list all users (admin)
  list: (params = {}) => {
    const qs = new URLSearchParams(
      Object.fromEntries(Object.entries(params).filter(([, v]) => v))
    ).toString();
    return request("GET", `/users${qs ? `?${qs}` : ""}`);
  },

  // GET /users/project/:projectId/members — employees on a project (for dropdowns)
  projectMembers: (projectId) =>
    request("GET", `/users/project/${projectId}/members`),
};

// ── Project API ──────────────────────────────────────────────────────────────
export const projectAPI = {
  // GET /projects
  list: (params = {}) => {
    const qs = new URLSearchParams(
      Object.fromEntries(Object.entries(params).filter(([, v]) => v))
    ).toString();
    return request("GET", `/projects${qs ? `?${qs}` : ""}`);
  },
};

// ── Role redirect helper ─────────────────────────────────────────────────────
export const getRoleDashboard = (role) => {
  const routes = {
    admin: "/admin/dashboard",
    manager: "/manager/dashboard",
    employee: "/employee/dashboard",
  };
  return routes[role] || "/";
};
