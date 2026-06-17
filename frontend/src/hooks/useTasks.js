import { useState, useEffect, useCallback } from "react";
import { taskAPI, projectAPI, memberAPI, userAPI, notificationAPI, riskAPI, reportAPI, analyticsAPI } from "../utils/api";

// ── useTaskList — manager/sub-manager list with full CRUD ─────────────────────
export function useTaskList(filters = {}) {
  const [tasks,   setTasks]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);
  const [stats,   setStats]   = useState({ total: 0, completed: 0, inProgress: 0, overdue: 0 });

  const fetch_ = useCallback(async () => {
    if (!filters.projectId && Object.keys(filters).length === 0) {
      setTasks([]); setLoading(false); return;
    }
    setLoading(true); setError(null);
    try {
      const res  = await taskAPI.list(filters);
      const list = res.data ?? [];
      setTasks(list);
      const now = Date.now();
      setStats({
        total:      list.length,
        completed:  list.filter(t => t.status === "completed").length,
        inProgress: list.filter(t => t.status === "in-progress").length,
        overdue:    list.filter(t => t.status !== "completed" && new Date(t.deadline) < now).length,
      });
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  }, [JSON.stringify(filters)]);

  useEffect(() => { fetch_(); }, [fetch_]);

  const createTask = async (payload) => {
    const res = await taskAPI.create(payload);
    await fetch_();
    return res.data;
  };
  const updateTask = async (id, payload) => {
    const res = await taskAPI.update(id, payload);
    setTasks(prev => prev.map(t => t._id === id ? { ...t, ...res.data } : t));
    return res.data;
  };
  const deleteTask = async (id) => {
    await taskAPI.delete(id);
    setTasks(prev => prev.filter(t => t._id !== id));
  };

  return { tasks, loading, error, stats, refetch: fetch_, createTask, updateTask, deleteTask };
}

// ── useMyTasks — employee's own tasks ────────────────────────────────────────
export function useMyTasks(filters = {}) {
  const [tasks,   setTasks]   = useState([]);
  const [stats,   setStats]   = useState({ total: 0, completed: 0, inProgress: 0, overdue: 0 });
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);

  const fetch_ = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const res  = await taskAPI.my(filters);
      const list = res.data ?? [];
      setTasks(list);
      const now = Date.now();
      setStats({
        total:      list.length,
        completed:  list.filter(t => t.status === "completed").length,
        inProgress: list.filter(t => t.status === "in-progress").length,
        overdue:    list.filter(t => t.status !== "completed" && new Date(t.deadline) < now).length,
      });
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  }, [JSON.stringify(filters)]);

  useEffect(() => { fetch_(); }, [fetch_]);

  const updateStatus = async (id, status) => {
    const res = await taskAPI.updateStatus(id, status);
    setTasks(prev => prev.map(t => t._id === id ? { ...t, ...res.data } : t));
    return res.data;
  };
  const updateProgress = async (id, payload) => {
    const res = await taskAPI.updateProgress(id, payload);
    setTasks(prev => prev.map(t => t._id === id ? { ...t, ...res.data } : t));
    return res.data;
  };

  return { tasks, stats, loading, error, refetch: fetch_, updateStatus, updateProgress };
}

// ── useMyProjects — employee's assigned projects ──────────────────────────────
export function useMyProjects() {
  const [projects, setProjects] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState(null);

  useEffect(() => {
    projectAPI.my()
      .then(res => setProjects(res.data ?? []))
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  return { projects, loading, error };
}

// ── useManagerProjects — projects where employee is manager ───────────────────
export function useManagerProjects() {
  const [projects, setProjects] = useState([]);
  const [loading,  setLoading]  = useState(true);

  useEffect(() => {
    projectAPI.list()
      .then(res => setProjects(res.data ?? []))
      .catch(() => setProjects([]))
      .finally(() => setLoading(false));
  }, []);

  return { projects, loading };
}

// ── useAllProjects — admin: all company projects with CRUD ────────────────────
export function useAllProjects(filters = {}) {
  const [projects, setProjects] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState(null);

  const fetch_ = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const res = await projectAPI.list(filters);
      setProjects(res.data ?? []);
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  }, [JSON.stringify(filters)]);

  useEffect(() => { fetch_(); }, [fetch_]);

  const createProject = async (payload) => {
    const res = await projectAPI.create(payload);
    await fetch_();
    return res.data;
  };
  const updateProject = async (id, payload) => {
    const res = await projectAPI.update(id, payload);
    setProjects(prev => prev.map(p => p._id === id ? { ...p, ...res.data } : p));
    return res.data;
  };
  const assignManager = async (id, managerId) => {
    const res = await projectAPI.assignManager(id, managerId);
    setProjects(prev => prev.map(p => p._id === id ? { ...p, ...res.data } : p));
    return res.data;
  };

  return { projects, loading, error, refetch: fetch_, createProject, updateProject, assignManager };
}

// ── useProjectMembers — members of a project ─────────────────────────────────
export function useProjectMembers(projectId) {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetch_ = useCallback(async () => {
    if (!projectId) { setMembers([]); return; }
    setLoading(true);
    try {
      const res = await memberAPI.list(projectId);
      setMembers(res.data ?? []);
    } catch { setMembers([]); }
    finally { setLoading(false); }
  }, [projectId]);

  useEffect(() => { fetch_(); }, [fetch_]);

  const assignMember = async (employeeId, projectRole = "member") => {
    const res = await memberAPI.assign(projectId, employeeId, projectRole);
    await fetch_();
    return res.data;
  };
  const setRole = async (employeeId, projectRole) => {
    const res = await memberAPI.setRole(projectId, employeeId, projectRole);
    await fetch_();
    return res.data;
  };
  const removeMember = async (employeeId) => {
    await memberAPI.remove(projectId, employeeId);
    setMembers(prev => prev.filter(m => (m.employeeId?._id ?? m.employeeId) !== employeeId));
  };

  return { members, loading, refetch: fetch_, assignMember, setRole, removeMember };
}

// ── useAllEmployees — admin: all company employees ────────────────────────────
export function useAllEmployees() {
  const [employees, setEmployees] = useState([]);
  const [loading,   setLoading]   = useState(true);

  useEffect(() => {
    userAPI.list({ role: "employee" })
      .then(res => setEmployees(res.data ?? []))
      .catch(() => setEmployees([]))
      .finally(() => setLoading(false));
  }, []);

  return { employees, loading };
}

// ── useAllEmployeesAdmin — admin: full employee list with edit/deactivate ──
export function useAllEmployeesAdmin(filters = {}) {
  const [employees, setEmployees] = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState(null);

  const fetch_ = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const res = await userAPI.list({ role: "employee", ...filters });
      setEmployees(res.data ?? []);
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  }, [JSON.stringify(filters)]);

  useEffect(() => { fetch_(); }, [fetch_]);

  const updateEmployee = async (id, payload) => {
    const res = await userAPI.update(id, payload);
    setEmployees(prev => prev.map(e => e._id === id ? { ...e, ...res.data } : e));
    return res.data;
  };

  const deactivateEmployee = async (id) => {
    const res = await userAPI.deactivate(id);
    setEmployees(prev => prev.map(e => e._id === id ? { ...e, ...res.data } : e));
    return res.data;
  };

  const reactivateEmployee = async (id) => updateEmployee(id, { isActive: true });

  return { employees, loading, error, refetch: fetch_, updateEmployee, deactivateEmployee, reactivateEmployee };
}

// ── useEmployeeProjects — admin: a single employee's project assignments ──
export function useEmployeeProjects(employeeId) {
  const [assignments, setAssignments] = useState([]);
  const [loading,     setLoading]     = useState(false);

  useEffect(() => {
    if (!employeeId) { setAssignments([]); return; }
    setLoading(true);
    projectAPI.list()
      .then(async (res) => {
        const projects = res.data ?? [];
        const results = await Promise.all(
          projects.map(async (p) => {
            try {
              const m = await memberAPI.list(p._id);
              const match = (m.data ?? []).find(
                x => (x.employeeId?._id ?? x.employeeId) === employeeId
              );
              return match ? { project: p, projectRole: match.projectRole } : null;
            } catch { return null; }
          })
        );
        setAssignments(results.filter(Boolean));
      })
      .catch(() => setAssignments([]))
      .finally(() => setLoading(false));
  }, [employeeId]);

  return { assignments, loading };
}

// ── useNotifications — bell icon dropdown ──────────────────────────────────
export function useNotifications() {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount,   setUnreadCount]   = useState(0);
  const [loading,       setLoading]       = useState(true);

  const fetch_ = useCallback(async () => {
    try {
      const res = await notificationAPI.list();
      setNotifications(res.data?.notifications ?? []);
      setUnreadCount(res.data?.unreadCount ?? 0);
    } catch { /* silently ignore */ }
    finally { setLoading(false); }
  }, []);

  useEffect(() => {
    fetch_();
    const interval = setInterval(fetch_, 60000);
    return () => clearInterval(interval);
  }, [fetch_]);

  const markAsRead = async (id) => {
    await notificationAPI.markAsRead(id);
    setNotifications(prev => prev.map(n => n._id === id ? { ...n, read: true } : n));
    setUnreadCount(prev => Math.max(0, prev - 1));
  };

  const markAllRead = async () => {
    await notificationAPI.markAllRead();
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    setUnreadCount(0);
  };

  return { notifications, unreadCount, loading, refetch: fetch_, markAsRead, markAllRead };
}

// ── useRisks — active/resolved risk alerts ──────────────────────────────────
export function useRisks(filters = {}) {
  const [risks,   setRisks]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);

  const fetch_ = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const res = await riskAPI.list(filters);
      setRisks(res.data ?? []);
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  }, [JSON.stringify(filters)]);

  useEffect(() => { fetch_(); }, [fetch_]);

  const resolveRisk = async (id) => {
    const res = await riskAPI.resolve(id);
    setRisks(prev => prev.map(r => r._id === id ? { ...r, ...res.data } : r));
    return res.data;
  };

  return { risks, loading, error, refetch: fetch_, resolveRisk };
}

// ── useReports — AI-generated reports for a project ───────────────────────────
export function useReports(projectId, reportType = "") {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);
  const [generating, setGenerating] = useState(false);

  const fetch_ = useCallback(async () => {
    if (!projectId) { setReports([]); setLoading(false); return; }
    setLoading(true); setError(null);
    try {
      const res = await reportAPI.list(reportType ? { projectId, reportType } : { projectId });
      setReports(res.data ?? []);
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  }, [projectId, reportType]);

  useEffect(() => { fetch_(); }, [fetch_]);

  const generateReport = async (type) => {
    setGenerating(true);
    try {
      const res = await reportAPI.generate({ projectId, reportType: type });
      await fetch_();
      return res.data;
    } finally {
      setGenerating(false);
    }
  };

  const deleteReport = async (id) => {
    await reportAPI.delete(id);
    setReports(prev => prev.filter(r => r._id !== id));
  };

  return { reports, loading, error, generating, refetch: fetch_, generateReport, deleteReport };
}

// ── useAnalytics — personal productivity analytics ─────────────────────────────
export function useAnalytics(params = {}) {
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);

  const fetch_ = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const res = await analyticsAPI.me(params);
      setData(res.data);
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  }, [JSON.stringify(params)]);

  useEffect(() => { fetch_(); }, [fetch_]);

  return { data, loading, error, refetch: fetch_ };
}

// ── useProjectAnalytics — team/project analytics (manager/sub-manager/admin) ──
export function useProjectAnalytics(projectId, params = {}) {
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);

  const fetch_ = useCallback(async () => {
    if (!projectId) { setData(null); setLoading(false); return; }
    setLoading(true); setError(null);
    try {
      const res = await analyticsAPI.project(projectId, params);
      setData(res.data);
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  }, [projectId, JSON.stringify(params)]);

  useEffect(() => { fetch_(); }, [fetch_]);

  return { data, loading, error, refetch: fetch_ };
}