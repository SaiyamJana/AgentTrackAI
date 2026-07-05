const BASE = import.meta.env.VITE_API_URL || "http://localhost:5000/api/v1";

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

  login: async (companyId, email, password) => {
    console.log("API URL:", import.meta.env.VITE_API_URL);
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
  getById:    (id)       => request("GET",    `/users/${id}`),
  update:     (id, body) => request("PATCH",  `/users/${id}`, body),
  deactivate: (id)       => request("DELETE", `/users/${id}`),
};

// ── Companies ─────────────────────────────────────────────────────────────────
export const companyAPI = {
  getById:          (id)       => request("GET",   `/companies/${id}`),
  update:           (id, body) => request("PATCH", `/companies/${id}`, body),
  regenerateInvite: (id)       => request("POST",  `/companies/${id}/regenerate-invite`),
};

// ── Projects ──────────────────────────────────────────────────────────────────
export const projectAPI = {
  list: (params = {}) => {
    const qs = new URLSearchParams(
      Object.fromEntries(Object.entries(params).filter(([, v]) => v))
    ).toString();
    return request("GET", `/projects${qs ? `?${qs}` : ""}`);
  },
  my:            ()              => request("GET",   "/projects/my"),
  getById:       (id)            => request("GET",   `/projects/${id}`),
  create:        (body)          => request("POST",  "/projects", body),
  update:        (id, body)      => request("PATCH", `/projects/${id}`, body),
  assignManager: (id, managerId) => request("PATCH", `/projects/${id}/manager`, { managerId }),
  remove:        (id, password)  => request("DELETE", `/projects/${id}`, { password }),
};

// ── Project Members ───────────────────────────────────────────────────────────
export const memberAPI = {
  list:    (projectId)                           => request("GET",    `/projects/${projectId}/employees`),
  assign:  (projectId, employeeId, projectRole = "member") =>
    request("POST",   `/projects/${projectId}/employees`, { employeeId, projectRole }),
  setRole: (projectId, employeeId, projectRole) =>
    request("PATCH",  `/projects/${projectId}/employees/${employeeId}/role`, { projectRole }),
  remove:  (projectId, employeeId)               => request("DELETE", `/projects/${projectId}/employees/${employeeId}`),
};

// ── Tasks ─────────────────────────────────────────────────────────────────────
export const taskAPI = {
  list: (params = {}) => {
    const qs = new URLSearchParams(
      Object.fromEntries(Object.entries(params).filter(([, v]) => v))
    ).toString();
    return request("GET", `/tasks${qs ? `?${qs}` : ""}`);
  },
  my: (params = {}) => {
    const qs = new URLSearchParams(
      Object.fromEntries(Object.entries(params).filter(([, v]) => v))
    ).toString();
    return request("GET", `/tasks/my${qs ? `?${qs}` : ""}`);
  },
  kanban:         (projectId) => request("GET",    `/tasks/kanban?projectId=${projectId}`),
  getById:        (id)        => request("GET",    `/tasks/${id}`),
  create:         (body)      => request("POST",   "/tasks", body),
  update:         (id, body)  => request("PATCH",  `/tasks/${id}`, body),
  updateStatus:   (id, status)=> request("PATCH",  `/tasks/${id}/status`, { status }),
  updateProgress: (id, body)  => request("PATCH",  `/tasks/${id}/assignments/progress`, body),
  delete:         (id)        => request("DELETE", `/tasks/${id}`),
  getAssignments: (id)        => request("GET",    `/tasks/${id}/assignments`),
};

// ── Task Members ──────────────────────────────────────────────────────────────
export const taskMemberAPI = {
  list:   (taskId)                  => request("GET",    `/tasks/${taskId}/members`),
  add:    (taskId, employeeIds)     => request("POST",   `/tasks/${taskId}/members`, { employeeIds }),
  remove: (taskId, employeeId)      => request("DELETE", `/tasks/${taskId}/members/${employeeId}`),
};

// ── Reports ───────────────────────────────────────────────────────────────────
export const reportAPI = {
  list: (params = {}) => {
    const qs = new URLSearchParams(
      Object.fromEntries(Object.entries(params).filter(([, v]) => v))
    ).toString();
    return request("GET", `/reports${qs ? `?${qs}` : ""}`);
  },
  getById:  (id)   => request("GET",    `/reports/${id}`),
  generate: (body) => request("POST",   "/reports/generate", body),
  delete:   (id)   => request("DELETE", `/reports/${id}`),
};

// ── Analytics ─────────────────────────────────────────────────────────────────
export const analyticsAPI = {
  me: (params = {}) => {
    const qs = new URLSearchParams(
      Object.fromEntries(Object.entries(params).filter(([, v]) => v))
    ).toString();
    return request("GET", `/analytics/me${qs ? `?${qs}` : ""}`);
  },
  project: (projectId, params = {}) => {
    const qs = new URLSearchParams(
      Object.fromEntries(Object.entries(params).filter(([, v]) => v))
    ).toString();
    return request("GET", `/analytics/project/${projectId}${qs ? `?${qs}` : ""}`);
  },
};

// ── Notifications ─────────────────────────────────────────────────────────────
export const notificationAPI = {
  list: (params = {}) => {
    const qs = new URLSearchParams(
      Object.fromEntries(Object.entries(params).filter(([, v]) => v !== undefined && v !== ""))
    ).toString();
    return request("GET", `/notifications${qs ? `?${qs}` : ""}`);
  },
  markAsRead:  (id) => request("PATCH", `/notifications/${id}/read`),
  markAllRead: ()   => request("PATCH", `/notifications/read-all`),
};

// ── Risks ─────────────────────────────────────────────────────────────────────
export const riskAPI = {
  list: (params = {}) => {
    const qs = new URLSearchParams(
      Object.fromEntries(Object.entries(params).filter(([, v]) => v !== undefined && v !== ""))
    ).toString();
    return request("GET", `/risks${qs ? `?${qs}` : ""}`);
  },
  resolve:   (id) => request("PATCH", `/risks/${id}/resolve`),
  triggerScan: () => request("POST",  "/risks/scan"),
};

// ── Workload ──────────────────────────────────────────────────────────────────
export const workloadAPI = {
  // Employee: own workload snapshot + priority queue + AI summary
  me: () => request("GET", "/workloads/me"),

  // Manager: latest snapshot for every member of a project
  team: (projectId) => request("GET", `/workloads/team?projectId=${projectId}`),

  // Admin: latest snapshot for every employee in the company
  company: () => request("GET", "/workloads/company"),

  // Manager/Admin: specific employee's workload + 30-day history
  employee: (employeeId) => request("GET", `/workloads/employee/${employeeId}`),

  // Manager/Admin: employees currently overloaded or at burnout risk
  alerts: () => request("GET", "/workloads/alerts"),

  // Manager/Admin: snapshot history for an employee over N days
  history: (params = {}) => {
    const qs = new URLSearchParams(
      Object.fromEntries(Object.entries(params).filter(([, v]) => v))
    ).toString();
    return request("GET", `/workloads/history${qs ? `?${qs}` : ""}`);
  },

  // Manager/Admin: manually trigger a full workload recalculation
  recalculate: () => request("POST", "/workloads/recalculate"),

  // Manager/Admin: set contribution% for a specific TaskAssignment
  updateContribution: (assignmentId, contributionPercentage) =>
    request("PATCH", `/workloads/assignments/${assignmentId}/contribution`, { contributionPercentage }),

  // Admin: set capacityHoursPerWeek for an employee
  updateCapacity: (employeeId, capacityHoursPerWeek) =>
    request("PATCH", "/workloads/capacity", { employeeId, capacityHoursPerWeek }),
};

// ── Activity Log ──────────────────────────────────────────────────────────────
export const activityLogAPI = {
  list: (params = {}) => {
    const qs = new URLSearchParams(
      Object.fromEntries(Object.entries(params).filter(([, v]) => v !== undefined && v !== ""))
    ).toString();
    return request("GET", `/activity-logs${qs ? `?${qs}` : ""}`);
  },
};

// ── Role redirect ─────────────────────────────────────────────────────────────
export const getRoleDashboard = (role) =>
  role === "admin" ? "/admin/dashboard" : "/employee/dashboard";

// ── Chat ──────────────────────────────────────────────────────────────────────
export const chatAPI = {
  // Conversations
  getConversations:       ()                        => request("GET",    "/chat/conversations"),
  getConversationById:    (id)                      => request("GET",    `/chat/conversations/${id}`),
  openDirect:             (body)                    => request("POST",   "/chat/conversations/direct", body),
  createProjectGroup:     (projectId)               => request("POST",   "/chat/conversations/project-group", { projectId }),
  createTaskGroup:        (taskId)                  => request("POST",   "/chat/conversations/task-group",    { taskId }),

  // Messages
  getMessages:  (convId, params = {}) => {
    const qs = new URLSearchParams(
      Object.fromEntries(Object.entries(params).filter(([, v]) => v))
    ).toString();
    return request("GET", `/chat/conversations/${convId}/messages${qs ? `?${qs}` : ""}`);
  },
  sendMessage:   (convId, body)       => request("POST",   `/chat/conversations/${convId}/messages`, body),
  deleteMessage: (msgId, everyone)    => request("DELETE", `/chat/messages/${msgId}?everyone=${everyone}`),
  markSeen:      (convId, messageIds) => request("POST",   `/chat/conversations/${convId}/seen`, { messageIds }),

  // Search
  searchInConversation: (convId, q)  => request("GET", `/chat/conversations/${convId}/search?q=${encodeURIComponent(q)}`),
  globalSearch:         (q)          => request("GET", `/chat/search?q=${encodeURIComponent(q)}`),

  // Chat member context panels
  getTaskChatMembers:    (taskId)    => request("GET", `/chat/task/${taskId}/members`),
  getProjectChatMembers: (projectId) => request("GET", `/chat/project/${projectId}/members`),
};
