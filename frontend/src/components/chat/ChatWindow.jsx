import { useState, useEffect, useRef, useCallback } from "react";
import { useAuth } from "../../context/AuthContext";
import { useChats } from "../../context/ChatContext";
import { chatAPI } from "../../utils/api";
import Icon from "../shared/Icon";
import MessageBubble from "./MessageBubble";
import TypingIndicator from "./TypingIndicator";

/*
 * ChatWindow
 *
 * Props:
 *   conversation — the active Conversation object (from ConversationList selection)
 *
 * Handles:
 *   - Loading paginated message history (lazy-load older messages on scroll-to-top)
 *   - Sending text messages via the useChat socket hook
 *   - Typing indicator emit/receive
 *   - Marking visible messages as seen
 *   - Reply-to staging
 *   - Delete for me / delete for everyone
 */
const ChatWindow = ({ conversation }) => {
  const { user } = useAuth();
  const {
    socket,
    sendMessage: socketSend,
    startTyping,
    stopTyping,
    markSeen,
    deleteMessage: socketDelete,
    onlineUsers,
  } = useChats();

  const [messages,    setMessages]    = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore,     setHasMore]     = useState(false);
  const [draft,       setDraft]       = useState("");
  const [replyTo,     setReplyTo]     = useState(null);
  const [typingUser,  setTypingUser]  = useState(null);

  const scrollRef        = useRef(null);
  const typingTimeoutRef = useRef(null);

  const convId = conversation?._id;

  // ── Load initial message history ────────────────────────────────────────────
  useEffect(() => {
    if (!convId) return;
    setLoading(true);
    setMessages([]);
    chatAPI.getMessages(convId)
      .then((res) => {
        setMessages(res.data.messages ?? []);
        setHasMore(res.data.hasMore ?? false);
      })
      .catch((err) => console.error("[Chat] Failed to load messages:", err.message))
      .finally(() => setLoading(false));
  }, [convId]);

  // ── Auto-scroll to bottom on new message (only if already near bottom) ──────
  useEffect(() => {
    if (!scrollRef.current) return;
    const el = scrollRef.current;
    const nearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 200;
    if (nearBottom || messages.length <= 1) {
      el.scrollTop = el.scrollHeight;
    }
  }, [messages]);

  // ── Scoped socket listeners for the open conversation ───────────────────────
  useEffect(() => {
    if (!socket || !convId) return;

    const onNewMessage = (msg) => {
      if (String(msg.conversationId) !== String(convId)) return;
      setMessages((prev) => {
        if (prev.some((m) => m._id === msg._id)) return prev;
        return [...prev, msg];
      });
    };

    const onTypingStart = (data) => {
      if (String(data.conversationId) !== String(convId)) return;
      if (String(data.userId) === String(user?._id)) return;
      setTypingUser(data.name);
    };

    const onTypingStop = (data) => {
      if (String(data.conversationId) !== String(convId)) return;
      setTypingUser(null);
    };

    const onDeleted = (data) => {
      if (String(data.conversationId) !== String(convId)) return;
      setMessages((prev) =>
        data.deleteForEveryone
          ? prev.map((m) => (m._id === data.messageId ? { ...m, deletedForEveryone: true } : m))
          : prev.filter((m) => m._id !== data.messageId)
      );
    };

    socket.on("message:new",     onNewMessage);
    socket.on("typing:start",    onTypingStart);
    socket.on("typing:stop",     onTypingStop);
    socket.on("message:deleted", onDeleted);

    return () => {
      socket.off("message:new",     onNewMessage);
      socket.off("typing:start",    onTypingStart);
      socket.off("typing:stop",     onTypingStop);
      socket.off("message:deleted", onDeleted);
    };
  }, [socket, convId, user]);

  // ── Mark messages as seen when window is open ───────────────────────────────
  useEffect(() => {
    if (!convId || messages.length === 0) return;
    const unseenIds = messages
      .filter((m) => String(m.senderId?._id) !== String(user?._id))
      .map((m) => m._id);
    if (unseenIds.length > 0) markSeen(convId, unseenIds);
  }, [convId, messages, user, markSeen]);

  // ── Pagination — load older messages ────────────────────────────────────────
  const loadOlder = useCallback(async () => {
    if (!hasMore || loadingMore || messages.length === 0) return;
    setLoadingMore(true);
    const oldestId = messages[0]._id;
    try {
      const res = await chatAPI.getMessages(convId, { before: oldestId });
      const older = res.data.messages ?? [];
      setMessages((prev) => [...older, ...prev]);
      setHasMore(res.data.hasMore ?? false);
    } catch (err) {
      console.error("[Chat] Failed to load older messages:", err.message);
    } finally {
      setLoadingMore(false);
    }
  }, [convId, hasMore, loadingMore, messages]);

  const handleScroll = (e) => {
    if (e.target.scrollTop < 80) loadOlder();
  };

  // ── Typing indicator ─────────────────────────────────────────────────────────
  const handleDraftChange = (e) => {
    setDraft(e.target.value);
    startTyping(convId);
    clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => stopTyping(convId), 2000);
  };

  // ── Send ─────────────────────────────────────────────────────────────────────
  const handleSend = () => {
    if (!draft.trim()) return;
    stopTyping(convId);
    clearTimeout(typingTimeoutRef.current);

    socketSend(
      {
        conversationId: convId,
        content:        draft.trim(),
        replyTo:        replyTo?._id || null,
        mentions:       [],
      },
      (res) => {
        if (!res?.success) console.error("[Chat] Send failed:", res?.message);
      }
    );

    setDraft("");
    setReplyTo(null);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleDelete = (messageId, deleteForEveryone) => {
    socketDelete(messageId, deleteForEveryone, (res) => {
      if (res?.success) {
        setMessages((prev) =>
          deleteForEveryone
            ? prev.map((m) => (m._id === messageId ? { ...m, deletedForEveryone: true } : m))
            : prev.filter((m) => m._id !== messageId)
        );
      }
    });
  };

  // ── Empty state ──────────────────────────────────────────────────────────────
  if (!conversation) {
    return (
      <div className="flex-1 flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center mx-auto mb-3">
            <Icon name="chat" className="w-7 h-7 text-blue-400" />
          </div>
          <p className="text-sm font-semibold text-slate-500">Select a conversation</p>
          <p className="text-xs text-slate-400 mt-1">Choose a chat from the sidebar to start messaging</p>
        </div>
      </div>
    );
  }

  const other = conversation.type === "direct"
    ? conversation.members?.find((m) => String(m._id) !== String(user?._id))
    : null;
  const headerName    = conversation.name || other?.name || "Unknown";
  const isOtherOnline = other && onlineUsers.has(String(other._id));

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-50">
      {/* Header */}
      <div className="h-16 flex items-center justify-between px-5 border-b border-slate-100 bg-white shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-linear-to-br from-blue-500 to-blue-700 flex items-center justify-center text-white text-xs font-bold">
            {headerName.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase()}
          </div>
          <div>
            <p className="text-sm font-bold text-slate-800">{headerName}</p>
            {conversation.type === "direct" ? (
              <p className="text-[11px] text-slate-400">{isOtherOnline ? "Online" : "Offline"}</p>
            ) : (
              <p className="text-[11px] text-slate-400">{conversation.members?.length ?? 0} members</p>
            )}
          </div>
        </div>
      </div>

      {/* Messages */}
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto py-3"
      >
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <>
            {loadingMore && (
              <div className="flex justify-center py-2">
                <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
              </div>
            )}
            {messages.map((msg, idx) => {
              const isOwn      = String(msg.senderId?._id) === String(user?._id);
              const prevMsg    = messages[idx - 1];
              const showSenderName =
                conversation.type !== "direct" &&
                (!prevMsg || String(prevMsg.senderId?._id) !== String(msg.senderId?._id));
              return (
                <MessageBubble
                  key={msg._id}
                  message={msg}
                  isOwn={isOwn}
                  showSenderName={showSenderName}
                  onReply={setReplyTo}
                  onDelete={handleDelete}
                />
              );
            })}
            {typingUser && <TypingIndicator name={typingUser} />}
          </>
        )}
      </div>

      {/* Reply preview bar */}
      {replyTo && (
        <div className="flex items-center justify-between px-4 py-2 bg-blue-50 border-t border-blue-100">
          <div className="min-w-0">
            <p className="text-[11px] font-semibold text-blue-600">Replying to {replyTo.senderId?.name}</p>
            <p className="text-xs text-slate-500 truncate">{replyTo.content}</p>
          </div>
          <button
            onClick={() => setReplyTo(null)}
            className="p-1 rounded-md hover:bg-blue-100 text-blue-400 shrink-0"
          >
            <Icon name="x" className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Composer — text only */}
      <div className="flex items-end gap-2 px-4 py-3 border-t border-slate-100 bg-white shrink-0">
        <textarea
          value={draft}
          onChange={handleDraftChange}
          onKeyDown={handleKeyDown}
          placeholder="Type a message..."
          rows={1}
          className="flex-1 resize-none px-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent max-h-32"
        />
        <button
          onClick={handleSend}
          disabled={!draft.trim()}
          className="p-2.5 rounded-xl bg-blue-600 text-white disabled:opacity-40 disabled:cursor-not-allowed hover:bg-blue-700 transition-colors shrink-0"
        >
          <Icon name="arrow" className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};

export default ChatWindow;
