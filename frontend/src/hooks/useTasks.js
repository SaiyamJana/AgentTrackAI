import { useState, useEffect, useCallback } from "react";
import { taskAPI, projectAPI, memberAPI } from "../utils/api";

// ── useMyTasks — Employee's own tasks (GET /tasks/my) ────────────────────────
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

  const updateStatus = async (taskId, status) => {
    const res = await taskAPI.updateStatus(taskId, status);
    setTasks(prev => prev.map(t => t._id === taskId ? { ...t, ...res.data } : t));
    return res.data;
  };

  const updateProgress = async (taskId, payload) => {
    const res = await taskAPI.updateProgress(taskId, payload);
    setTasks(prev => prev.map(t => t._id === taskId ? { ...t, ...res.data } : t));
    return res.data;
  };

  return { tasks, stats, loading, error, refetch: fetch_, updateStatus, updateProgress };
}

// ── useTaskList — Manager/Sub-manager task list (GET /tasks?projectId=) ───────
export function useTaskList(filters = {}) {
  const [tasks,   setTasks]   = useState([]);
  const [stats,   setStats]   = useState({ total: 0, completed: 0, inProgress: 0, overdue: 0 });
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);

  const fetch_ = useCallback(async () => {
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

  const deleteTask = async (id) => {
    await taskAPI.delete(id);
    setTasks(prev => prev.filter(t => t._id !== id));
  };

  const updateTask = async (id, payload) => {
    const res = await taskAPI.update(id, payload);
    setTasks(prev => prev.map(t => t._id === id ? { ...t, ...res.data } : t));
    return res.data;
  };

  return { tasks, stats, loading, error, refetch: fetch_, createTask, deleteTask, updateTask };
}

// ── useMyProjects — Employee's assigned projects (GET /projects/my) ───────────
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

// ── useManagerProjects — Projects where user is manager (GET /projects) ───────
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

// ── useProjectMembers — Members of a project (GET /projects/:id/employees) ───
export function useProjectMembers(projectId) {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!projectId) { setMembers([]); return; }
    setLoading(true);
    memberAPI.list(projectId)
      .then(res => setMembers(res.data ?? []))
      .catch(() => setMembers([]))
      .finally(() => setLoading(false));
  }, [projectId]);

  return { members, loading };
}

// ── useAllEmployees — All company employees (Admin: GET /users?role=employee) ─
export function useAllEmployees() {
  const [employees, setEmployees] = useState([]);
  const [loading,   setLoading]   = useState(true);

  useEffect(() => {
    fetch("http://localhost:5000/api/v1/users?role=employee", {
      headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
    })
      .then(r => r.json())
      .then(d => setEmployees(d.data ?? []))
      .catch(() => setEmployees([]))
      .finally(() => setLoading(false));
  }, []);

  return { employees, loading };
}