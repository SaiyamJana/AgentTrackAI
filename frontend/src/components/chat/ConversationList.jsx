import { useState } from "react";
import { useChats } from "../../context/ChatContext";
import Icon from "../shared/Icon";

const formatTime = (dateStr) => {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  const now = new Date();
  const diffDays = Math.floor((now - d) / 86400000);
  if (diffDays === 0) return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7)  return d.toLocaleDateString([], { weekday: "short" });
  return d.toLocaleDateString([], { month: "short", day: "numeric" });
};

const typeLabel = (type) => {
  if (type === "project_group") return "Project";
  if (type === "task_group")    return "Task";
  return null;
};

const ConvAvatar = ({ conv, onlineUsers, currentUserId }) => {
  if (conv.type === "direct") {
    const other = conv.members?.find((m) => String(m._id) !== String(currentUserId));
    const initials = (other?.name || "?").split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase();
    const isOnline = onlineUsers.has(String(other?._id));
    return (
      <div className="relative shrink-0">
        <div className="w-10 h-10 rounded-xl bg-linear-to-br from-blue-500 to-blue-700 flex items-center justify-center text-white text-xs font-bold">
          {initials}
        </div>
        <span className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white ${isOnline ? "bg-emerald-400" : "bg-slate-300"}`} />
      </div>
    );
  }
  // Group chat
  const bg = conv.type === "project_group" ? "from-violet-500 to-violet-700" : "from-amber-500 to-orange-600";
  const icon = conv.type === "project_group" ? "folder" : "task";
  return (
    <div className="w-10 h-10 rounded-xl bg-linear-to-br shrink-0 flex items-center justify-center text-white" style={{background: ""}}>
      <div className={`w-10 h-10 rounded-xl bg-linear-to-br ${bg} flex items-center justify-center`}>
        <Icon name={icon} className="w-4.5 h-4.5 text-white" />
      </div>
    </div>
  );
};

const ConversationList = ({ currentUserId, onSelect }) => {
  const { conversations, activeConvId, openConversation, onlineUsers, convLoading } = useChats();
  const [search, setSearch] = useState("");

  const filtered = conversations.filter((c) => {
    if (!search.trim()) return true;
    const name = c.name || c.members?.find((m) => String(m._id) !== String(currentUserId))?.name || "";
    return name.toLowerCase().includes(search.toLowerCase());
  });

  const grouped = {
    direct:        filtered.filter((c) => c.type === "direct"),
    project_group: filtered.filter((c) => c.type === "project_group"),
    task_group:    filtered.filter((c) => c.type === "task_group"),
  };

  const handleSelect = (conv) => {
    openConversation(conv._id);
    onSelect?.(conv);
  };

  const ConvItem = ({ conv }) => {
    const isActive = String(conv._id) === String(activeConvId);
    const other = conv.type === "direct"
      ? conv.members?.find((m) => String(m._id) !== String(currentUserId))
      : null;
    const displayName = conv.name || other?.name || "Unknown";
    const label = typeLabel(conv.type);

    return (
      <button
        onClick={() => handleSelect(conv)}
        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all duration-150 group
          ${isActive ? "bg-blue-600 text-white shadow-md shadow-blue-200" : "hover:bg-slate-50 text-slate-700"}`}
      >
        <ConvAvatar conv={conv} onlineUsers={onlineUsers} currentUserId={currentUserId} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <span className={`text-sm font-semibold truncate ${isActive ? "text-white" : "text-slate-800"}`}>
              {displayName}
            </span>
            <span className={`text-[10px] shrink-0 ${isActive ? "text-blue-200" : "text-slate-400"}`}>
              {formatTime(conv.lastMessage?.sentAt)}
            </span>
          </div>
          <div className="flex items-center justify-between gap-1 mt-0.5">
            <p className={`text-xs truncate ${isActive ? "text-blue-100" : "text-slate-400"}`}>
              {conv.lastMessage?.content || (label ? `${label} group` : "No messages yet")}
            </p>
            {conv.unreadCount > 0 && !isActive && (
              <span className="shrink-0 min-w-4.5 h-4.5 bg-blue-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1">
                {conv.unreadCount > 99 ? "99+" : conv.unreadCount}
              </span>
            )}
          </div>
        </div>
      </button>
    );
  };

  const Section = ({ title, items }) => {
    if (items.length === 0) return null;
    return (
      <div>
        <p className="px-3 py-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">{title}</p>
        <div className="space-y-0.5">
          {items.map((c) => <ConvItem key={c._id} conv={c} />)}
        </div>
      </div>
    );
  };

  return (
    <div className="h-full flex flex-col bg-white border-r border-slate-100">
      {/* Header */}
      <div className="px-4 py-4 border-b border-slate-100 shrink-0">
        <h2 className="text-base font-bold text-slate-800 mb-3">Messages</h2>
        <div className="relative">
          <Icon name="chat" className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search conversations..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto px-2 py-2 space-y-3">
        {convLoading ? (
          <div className="flex items-center justify-center h-32">
            <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : conversations.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-center px-4">
            <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center mb-3">
              <Icon name="chat" className="w-6 h-6 text-blue-400" />
            </div>
            <p className="text-sm font-semibold text-slate-600">No conversations yet</p>
            <p className="text-xs text-slate-400 mt-1">Open a task or project to start chatting</p>
          </div>
        ) : (
          <>
            <Section title="Direct Messages" items={grouped.direct} />
            <Section title="Project Chats"   items={grouped.project_group} />
            <Section title="Task Chats"      items={grouped.task_group} />
          </>
        )}
      </div>
    </div>
  );
};

export default ConversationList;
