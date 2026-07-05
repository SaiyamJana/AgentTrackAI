import { createContext, useContext, useState, useEffect, useCallback, useRef } from "react";
import { useAuth } from "./AuthContext";
import { chatAPI } from "../utils/api";
import useChat from "../hooks/useChat";

const ChatContext = createContext(null);

export const ChatProvider = ({ children }) => {
  const { user, token } = useAuth();

  const [conversations,    setConversations]    = useState([]);
  const [activeConvId,     setActiveConvId]     = useState(null);
  const [onlineUsers,      setOnlineUsers]      = useState(new Set());
  const [totalUnread,      setTotalUnread]      = useState(0);
  const [convLoading,      setConvLoading]      = useState(false);

  // ── Load conversation list ──────────────────────────────────────────────────
  const loadConversations = useCallback(async () => {
    if (!token) return;
    setConvLoading(true);
    try {
      const res = await chatAPI.getConversations();
      setConversations(res.data ?? []);
    } catch (err) {
      console.error("[Chat] Failed to load conversations:", err.message);
    } finally {
      setConvLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (user) loadConversations();
  }, [user, loadConversations]);

  // ── Recompute total unread whenever conversations change ────────────────────
  useEffect(() => {
    const total = conversations.reduce((sum, c) => sum + (c.unreadCount ?? 0), 0);
    setTotalUnread(total);
  }, [conversations]);

  // Keep a ref to activeConvId so the onMessage handler (closure, invoked
  // from a socket event much later) always reads the current value instead
  // of whatever activeConvId was at the time `handlers` was defined.
  const activeConvIdRef = useRef(activeConvId);
  useEffect(() => { activeConvIdRef.current = activeConvId; }, [activeConvId]);

  // ── Socket event handlers ───────────────────────────────────────────────────
  const handlers = {
    onMessage: (msg) => {
      setConversations((prev) =>
        prev.map((c) => {
          if (String(c._id) !== String(msg.conversationId)) return c;
          const isActive = String(c._id) === activeConvIdRef.current;
          return {
            ...c,
            lastMessage: {
              senderId: msg.senderId,
              content:  msg.content,
              sentAt:   msg.createdAt,
            },
            unreadCount: isActive ? 0 : (c.unreadCount ?? 0) + 1,
          };
        })
      );
    },

    onSeen: ({ conversationId, seenBy }) => {
      if (String(seenBy) === String(user?._id)) {
        // I saw the messages — zero out my unread count for this conv
        setConversations((prev) =>
          prev.map((c) =>
            String(c._id) === String(conversationId)
              ? { ...c, unreadCount: 0 }
              : c
          )
        );
      }
    },

    onUserStatus: ({ userId, status }) => {
      setOnlineUsers((prev) => {
        const next = new Set(prev);
        if (status === "online") next.add(userId);
        else next.delete(userId);
        return next;
      });
    },

    onUsersOnline: (ids) => {
      setOnlineUsers(new Set(ids));
    },

    onNewConversation: (conv) => {
      setConversations((prev) => {
        // Avoid duplicates
        if (prev.some((c) => String(c._id) === String(conv._id))) return prev;
        return [{ ...conv, unreadCount: 0 }, ...prev];
      });
    },
  };

  const chatUtils = useChat(token, handlers);

  // ── Open a conversation (sets active + joins socket room) ───────────────────
  const openConversation = useCallback((convId) => {
    setActiveConvId(convId);
    chatUtils.joinConv(convId);
    // Zero out unread count immediately on open
    setConversations((prev) =>
      prev.map((c) =>
        String(c._id) === String(convId) ? { ...c, unreadCount: 0 } : c
      )
    );
  }, [chatUtils]);

  return (
    <ChatContext.Provider value={{
      conversations,
      setConversations,
      activeConvId,
      setActiveConvId,
      openConversation,
      onlineUsers,
      totalUnread,
      convLoading,
      loadConversations,
      ...chatUtils,      // exposes sendMessage, startTyping, stopTyping, markSeen, deleteMessage, getUserStatus
    }}>
      {children}
    </ChatContext.Provider>
  );
};

export const useChats = () => {
  const ctx = useContext(ChatContext);
  if (!ctx) throw new Error("useChats must be used within ChatProvider");
  return ctx;
};
