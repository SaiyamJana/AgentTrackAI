import { useState, useEffect, useCallback } from "react";
import { taskAPI } from "../utils/api";

// ── useTaskList ───────────────────────────────────────────────────────────────
// For manager TasksPage — paginated, filterable list + CRUD mutations
export function useTaskList(filters = {}) {
  const [tasks, setTasks]     = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);
  const [stats, setStats]     = useState({ total: 0, completed: 0, inProgress: 0, overdue: 0 });
  const [pagination, setPagination] = useState({ total: 0, page: 1, totalPages: 1 });

  const fetchTasks = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await taskAPI.list(filters);
      const list = res.data?.tasks ?? [];
      setTasks(list);
      setPagination(res.data?.pagination ?? pagination);

      // Derive stats from returned list
      const now = Date.now();
      setStats({
        total:      list.length,
        completed:  list.filter(t => t.status === "completed").length,
        inProgress: list.filter(t => t.status === "in-progress").length,
        overdue:    list.filter(t => t.status !== "completed" && new Date(t.deadline) < now).length,
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [JSON.stringify(filters)]);

  useEffect(() => { fetchTasks(); }, [fetchTasks]);

  const createTask = async (payload) => {
    const res = await taskAPI.create(payload);
    await fetchTasks(); // re-fetch to get fully populated task from server
    return res.data;
  };

  const deleteTask = async (taskId) => {
    await taskAPI.delete(taskId);
    setTasks(prev => prev.filter(t => t._id !== taskId));
  };

  const reassignTask = async (taskId, assignedTo) => {
    const res = await taskAPI.reassign(taskId, assignedTo);
    setTasks(prev => prev.map(t => t._id === taskId ? res.data : t));
    return res.data;
  };

  return { tasks, loading, error, stats, pagination, refetch: fetchTasks, createTask, deleteTask, reassignTask };
}

// ── useMyTasks ────────────────────────────────────────────────────────────────
// For employee MyTasksPage — own tasks + server-side stats
export function useMyTasks(filters = {}) {
  const [tasks, setTasks]     = useState([]);
  const [stats, setStats]     = useState({ total: 0, completed: 0, inProgress: 0, overdue: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);

  const fetchMyTasks = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await taskAPI.myTasks(filters);
      setTasks(res.data?.tasks ?? []);
      const s = res.data?.stats ?? {};
      setStats({
        total:      s.total      ?? 0,
        completed:  s.completed  ?? 0,
        inProgress: s.inProgress ?? 0,
        overdue:    s.overdue    ?? 0,
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [JSON.stringify(filters)]);

  useEffect(() => { fetchMyTasks(); }, [fetchMyTasks]);

  const updateTask = async (taskId, payload) => {
    const res = await taskAPI.update(taskId, payload);
    setTasks(prev => prev.map(t => t._id === taskId ? { ...t, ...res.data } : t));
    return res.data;
  };

  return { tasks, stats, loading, error, refetch: fetchMyTasks, updateTask };
}

// ── useTaskStats ──────────────────────────────────────────────────────────────
// For manager dashboard KPI cards
export function useTaskStats() {
  const [stats, setStats]     = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);

  useEffect(() => {
    taskAPI.statsOverview()
      .then(res => setStats(res.data))
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  return { stats, loading, error };
}

// ── useProjectMembers ─────────────────────────────────────────────────────────
// Load employees for a project — used in CreateTask & Reassign dropdowns
export function useProjectMembers(projectId) {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!projectId) { setMembers([]); return; }
    setLoading(true);
    // Falls back gracefully if the endpoint isn't wired yet
    fetch(`http://localhost:5000/api/v1/users/project/${projectId}/members`, {
      headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
    })
      .then(r => r.json())
      .then(d => setMembers(d.data ?? []))
      .catch(() => setMembers([]))
      .finally(() => setLoading(false));
  }, [projectId]);

  return { members, loading };
}

// ── useManagerProjects ────────────────────────────────────────────────────────
// Load manager's own projects — used in TasksPage project filter dropdown
export function useManagerProjects() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading]   = useState(true);

  useEffect(() => {
    fetch("http://localhost:5000/api/v1/projects", {
      headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
    })
      .then(r => r.json())
      .then(d => setProjects(d.data?.projects ?? d.data ?? []))
      .catch(() => setProjects([]))
      .finally(() => setLoading(false));
  }, []);

  return { projects, loading };
}
