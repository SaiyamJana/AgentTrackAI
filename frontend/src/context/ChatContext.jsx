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

    onConversationRemoved: ({ conversationId }) => {
      setConversations((prev) => prev.filter((c) => String(c._id) !== String(conversationId)));
      // If the removed conversation was open, fall back to the empty state
      // instead of leaving the window pointed at a conversation the user
      // can no longer access.
      if (String(conversationId) === activeConvIdRef.current) {
        setActiveConvId(null);
      }
    },

    onConversationsRemovedBulk: ({ conversationIds }) => {
      const idSet = new Set((conversationIds ?? []).map(String));
      setConversations((prev) => prev.filter((c) => !idSet.has(String(c._id))));
      if (idSet.has(activeConvIdRef.current)) {
        setActiveConvId(null);
      }
    },
  };

  const chatUtils = useChat(token, handlers);

  // ── Open a conversation (sets active + joins socket room) ───────────────────
  // `convObj` is optional: pass the freshly-created conversation (e.g. from
  // chatAPI.openDirect's response) when opening a conversation that may not
  // be in `conversations` yet. Without this, a brand-new DM would set
  // activeConvId to an id ChatPage can't find in its list, and the chat
  // window would just show the empty "Select a conversation" placeholder
  // until the next full reload — this was the root cause of "DMs between
  // task members don't work".
  const openConversation = useCallback((convId, convObj) => {
    setActiveConvId(convId);
    chatUtils.joinConv(convId);
    setConversations((prev) => {
      const exists = prev.some((c) => String(c._id) === String(convId));
      if (exists) {
        return prev.map((c) =>
          String(c._id) === String(convId) ? { ...c, unreadCount: 0 } : c
        );
      }
      if (convObj) {
        return [{ ...convObj, unreadCount: 0 }, ...prev];
      }
      return prev;
    });
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
