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
  // POST /companies/register — public bootstrap, creates company + admin
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

  // POST /users/register — employee self-register with inviteCode
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

  // POST /users/login — requires companyId + email + password
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

// ── Users ─────────────────────────────────────────────────────────────────────
export const userAPI = {
  list: (params = {}) => {
    const qs = new URLSearchParams(
      Object.fromEntries(Object.entries(params).filter(([, v]) => v))
    ).toString();
    return request("GET", `/users${qs ? `?${qs}` : ""}`);
  },
  getById:    (id)         => request("GET",    `/users/${id}`),
  update:     (id, body)   => request("PATCH",  `/users/${id}`, body),
  deactivate: (id)         => request("DELETE", `/users/${id}`),
};

// ── Companies ─────────────────────────────────────────────────────────────────
export const companyAPI = {
  getById:          (id)       => request("GET",   `/companies/${id}`),
  update:           (id, body) => request("PATCH", `/companies/${id}`, body),
  regenerateInvite: (id)       => request("POST",  `/companies/${id}/regenerate-invite`),
};

// ── Projects ──────────────────────────────────────────────────────────────────
export const projectAPI = {
  // GET /projects — Admin: all; Employee-manager: their own
  list: (params = {}) => {
    const qs = new URLSearchParams(
      Object.fromEntries(Object.entries(params).filter(([, v]) => v))
    ).toString();
    return request("GET", `/projects${qs ? `?${qs}` : ""}`);
  },
  // GET /projects/my — employee: projects they are assigned to
  my:       ()           => request("GET",    "/projects/my"),
  getById:  (id)         => request("GET",    `/projects/${id}`),
  create:   (body)       => request("POST",   "/projects", body),
  update:   (id, body)   => request("PATCH",  `/projects/${id}`, body),
  assignManager: (id, managerId) => request("PATCH", `/projects/${id}/manager`, { managerId }),
};

// ── Project Members (EmployeeProject junction) ────────────────────────────────
export const memberAPI = {
  // GET  /projects/:id/employees
  list:   (projectId)                      => request("GET",    `/projects/${projectId}/employees`),
  // POST /projects/:id/employees — { employeeId, projectRole: "manager"|"member" }
  assign: (projectId, employeeId, projectRole = "member") =>
    request("POST",   `/projects/${projectId}/employees`, { employeeId, projectRole }),
  // PATCH /projects/:id/employees/:eid/role — manager sets sub-manager
  setRole:(projectId, employeeId, projectRole) =>
    request("PATCH",  `/projects/${projectId}/employees/${employeeId}/role`, { projectRole }),
  // DELETE /projects/:id/employees/:eid
  remove: (projectId, employeeId)          => request("DELETE", `/projects/${projectId}/employees/${employeeId}`),
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
  // GET /tasks/my  (employee — own tasks)
  my: (params = {}) => {
    const qs = new URLSearchParams(
      Object.fromEntries(Object.entries(params).filter(([, v]) => v))
    ).toString();
    return request("GET", `/tasks/my${qs ? `?${qs}` : ""}`);
  },
  // GET /tasks/kanban?projectId=
  kanban:  (projectId) => request("GET",    `/tasks/kanban?projectId=${projectId}`),
  getById: (id)        => request("GET",    `/tasks/${id}`),
  create:  (body)      => request("POST",   "/tasks", body),
  update:  (id, body)  => request("PATCH",  `/tasks/${id}`, body),
  updateStatus:   (id, status)  => request("PATCH", `/tasks/${id}/status`,   { status }),
  updateProgress: (id, body)    => request("PATCH", `/tasks/${id}/progress`, body),
  delete:  (id)        => request("DELETE", `/tasks/${id}`),
};

// ── Reports ───────────────────────────────────────────────────────────────────
export const reportAPI = {
  // GET /reports?projectId=&reportType=
  list: (params = {}) => {
    const qs = new URLSearchParams(
      Object.fromEntries(Object.entries(params).filter(([, v]) => v))
    ).toString();
    return request("GET", `/reports${qs ? `?${qs}` : ""}`);
  },
  getById:  (id)   => request("GET",  `/reports/${id}`),
  // POST /reports/generate — { projectId, reportType: "daily"|"weekly"|"project-summary" }
  generate: (body) => request("POST", "/reports/generate", body),
  delete:   (id)   => request("DELETE", `/reports/${id}`),
};

// ── Analytics ─────────────────────────────────────────────────────────────────
export const analyticsAPI = {
  // GET /analytics/me?range=1d|7d|30d|90d|all|custom&from=&to=
  me: (params = {}) => {
    const qs = new URLSearchParams(
      Object.fromEntries(Object.entries(params).filter(([, v]) => v))
    ).toString();
    return request("GET", `/analytics/me${qs ? `?${qs}` : ""}`);
  },
  // GET /analytics/project/:projectId?range=...
  project: (projectId, params = {}) => {
    const qs = new URLSearchParams(
      Object.fromEntries(Object.entries(params).filter(([, v]) => v))
    ).toString();
    return request("GET", `/analytics/project/${projectId}${qs ? `?${qs}` : ""}`);
  },
};

// ── Role redirect ─────────────────────────────────────────────────────────────
export const getRoleDashboard = (role) =>
  role === "admin" ? "/admin/dashboard" : "/employee/dashboard";

// ── Notifications ──────────────────────────────────────────────────────────
export const notificationAPI = {
  list:        (params = {}) => {
    const qs = new URLSearchParams(
      Object.fromEntries(Object.entries(params).filter(([, v]) => v !== undefined && v !== ""))
    ).toString();
    return request("GET", `/notifications${qs ? `?${qs}` : ""}`);
  },
  markAsRead:  (id) => request("PATCH", `/notifications/${id}/read`),
  markAllRead: ()   => request("PATCH", `/notifications/read-all`),
};

// ── Risks ──────────────────────────────────────────────────────────────────
export const riskAPI = {
  list:    (params = {}) => {
    const qs = new URLSearchParams(
      Object.fromEntries(Object.entries(params).filter(([, v]) => v !== undefined && v !== ""))
    ).toString();
    return request("GET", `/risks${qs ? `?${qs}` : ""}`);
  },
  resolve: (id) => request("PATCH", `/risks/${id}/resolve`),
};

// Task Member API
export const taskMemberAPI = {
  // GET /tasks/:id/members (List members assigned to a task)
  List: (taskId) => request("GET", `/tasks/${taskId}/members`),
  //POST /tasks/:id/members — { employeeId } (Assign employee to task)
  add: (taskId , employeeIds) => request("POST", `/tasks/${taskId}/members`, { employeeIds }),
  // DELETE /tasks/:id/members/:employeeId (Remove employee from task)
  remove: (taskId, employeeId) => request("DELETE", `/tasks/${taskId}/members/${employeeId}`),
};