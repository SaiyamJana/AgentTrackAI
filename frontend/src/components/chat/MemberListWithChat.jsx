import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useChats } from "../../context/ChatContext";
import { chatAPI } from "../../utils/api";
import Icon from "../shared/Icon";

/*
 * MemberListWithChat
 *
 * Embeddable panel shown inside Task detail and Project detail views.
 * Fetches the relevant member list (task or project scoped) and renders
 * each member with a Chat button that opens (or creates) a DM.
 *
 * Props:
 *   mode      — "task" | "project"
 *   contextId — taskId or projectId depending on mode
 */
const roleBadge = {
  "sub-manager":     "bg-violet-100 text-violet-700",
  "team-member":     "bg-slate-100 text-slate-600",
  "project-manager": "bg-blue-100 text-blue-700",
  "manager":         "bg-blue-100 text-blue-700",
  "member":          "bg-slate-100 text-slate-600",
};

const roleLabel = {
  "sub-manager":     "Sub-Manager",
  "team-member":     "Employee",
  "project-manager": "Manager",
  "manager":         "Manager",
  "member":          "Employee",
};

const MemberListWithChat = ({ mode, contextId }) => {
  const { user } = useAuth();
  const { onlineUsers, openConversation } = useChats();
  const navigate = useNavigate();

  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);
  const [openingId, setOpeningId] = useState(null);

  useEffect(() => {
    if (!contextId) return;
    setLoading(true);
    setError(null);

    const fetcher = mode === "task"
      ? chatAPI.getTaskChatMembers(contextId)
      : chatAPI.getProjectChatMembers(contextId);

    fetcher
      .then((res) => setData(res.data))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [mode, contextId]);

  const handleChat = async (targetUser) => {
    if (String(targetUser._id) === String(user._id)) return;
    setOpeningId(targetUser._id);
    try {
      const body = mode === "task"
        ? { targetUserId: targetUser._id, contextTaskId: contextId }
        : { targetUserId: targetUser._id, contextProjectId: contextId };
      const res = await chatAPI.openDirect(body);
      openConversation(res.data._id);
      navigate("/chat");
    } catch (err) {
      console.error("[Chat] Failed to open conversation:", err.message);
      alert(err.message); // simple inline feedback; matches lightweight error pattern used elsewhere
    } finally {
      setOpeningId(null);
    }
  };

  const MemberRow = ({ member, role }) => {
    const isMe = String(member._id) === String(user._id);
    const isOnline = onlineUsers.has(String(member._id));
    const initials = (member.name || "?").split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase();

    return (
      <div className="flex items-center justify-between gap-3 px-3 py-2.5 rounded-xl hover:bg-slate-50 transition-colors">
        <div className="flex items-center gap-3 min-w-0">
          <div className="relative shrink-0">
            <div className="w-9 h-9 rounded-xl bg-linear-to-br from-blue-500 to-blue-700 flex items-center justify-center text-white text-xs font-bold">
              {initials}
            </div>
            <span className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-white ${isOnline ? "bg-emerald-400" : "bg-slate-300"}`} />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-slate-800 truncate">
              {member.name} {isMe && <span className="text-slate-400 font-normal">(You)</span>}
            </p>
            <span className={`inline-block text-[10px] font-semibold px-1.5 py-0.5 rounded-md ${roleBadge[role] || "bg-slate-100 text-slate-600"}`}>
              {roleLabel[role] || role}
            </span>
          </div>
        </div>
        {!isMe && (
          <button
            onClick={() => handleChat(member)}
            disabled={openingId === member._id}
            className="p-2 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-600 transition-colors disabled:opacity-50 shrink-0"
            title="Chat"
          >
            {openingId === member._id ? (
              <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
            ) : (
              <Icon name="chat" className="w-4 h-4" />
            )}
          </button>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="bg-white rounded-2xl border border-slate-100 p-5 flex items-center justify-center h-32">
        <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-2xl border border-slate-100 p-5">
        <p className="text-xs text-red-500">{error}</p>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="bg-white rounded-2xl border border-slate-100 p-4">
      <h3 className="text-sm font-bold text-slate-800 mb-3 px-1">
        {mode === "task" ? "Task Members" : "Project Members"}
      </h3>

      {mode === "task" ? (
        <div className="space-y-0.5">
          {data.projectManager && (
            <MemberRow member={data.projectManager} role="project-manager" />
          )}
          {data.members?.map((m) => (
            <MemberRow key={m._id} member={m} role={m.taskRole} />
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {data.manager && (
            <div>
              <p className="px-1 pb-1 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Manager</p>
              <MemberRow member={data.manager} role="manager" />
            </div>
          )}
          {data.subManagers?.length > 0 && (
            <div>
              <p className="px-1 pb-1 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Sub-Managers</p>
              <div className="space-y-0.5">
                {data.subManagers.map((m) => <MemberRow key={m._id} member={m} role="sub-manager" />)}
              </div>
            </div>
          )}
          {data.employees?.length > 0 && (
            <div>
              <p className="px-1 pb-1 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Employees</p>
              <div className="space-y-0.5">
                {data.employees.map((m) => <MemberRow key={m._id} member={m} role="member" />)}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default MemberListWithChat;
