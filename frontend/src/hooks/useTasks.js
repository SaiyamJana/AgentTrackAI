import { useState, useEffect, useCallback } from "react";
import { taskAPI, projectAPI, memberAPI, userAPI } from "../utils/api";

// ── useTaskList — manager/sub-manager list with full CRUD ─────────────────────
export function useTaskList(filters = {}) {
  const [tasks,   setTasks]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);
  const [stats,   setStats]   = useState({ total: 0, completed: 0, inProgress: 0, overdue: 0 });

  const fetch_ = useCallback(async () => {
    // Need at minimum a projectId to fetch tasks
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
