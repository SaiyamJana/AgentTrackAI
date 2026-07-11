import { useEffect, useRef, useCallback } from "react";
import { io } from "socket.io-client";
const SOCKET_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:5000";
let _socket = null; // singleton — one connection per browser tab

/*
 * useChat(token, handlers)
 *
 * Manages the Socket.IO connection lifecycle.  Creates one socket instance
 * per tab (singleton pattern) and reconnects automatically.
 *
 * handlers — object of callbacks the ChatPage/ChatWindow subscribe to:
 *   onMessage(msg)              — new message arrived
 *   onTypingStart({userId, conversationId, name})
 *   onTypingStop({userId, conversationId})
 *   onSeen({conversationId, messageIds, seenBy, seenAt})
 *   onMessageDeleted({messageId, conversationId, deleteForEveryone})
 *   onUserStatus({userId, status, lastSeen})
 *   onUsersOnline(userIdArray)
 *   onNewConversation(conv)     — a new DM or group was created for this user
 *   onConversationRemoved({conversationId}) — user lost access to a conversation
 *                                  (removed from task/project, or it was deleted)
 *   onNotification(notif)       — real-time notification pushed
 *
 * Returns: { socket, emit, joinConv, sendMessage, startTyping, stopTyping, markSeen }
 */
const useChat = (token, handlers = {}) => {
  const handlersRef = useRef(handlers);
  useEffect(() => { handlersRef.current = handlers; }, [handlers]);

  // ── Connect / disconnect on token change ────────────────────────────────────
  useEffect(() => {
    if (!token) return;

    // Reuse existing socket if the token hasn't changed
    if (_socket && _socket.connected) {
      attachHandlers(_socket);
      return;
    }

    console.log("[Socket] Connecting to", SOCKET_URL);
    console.log(".env.VITE_BACKEND_URL =", import.meta.env.VITE_BACKEND_URL);

    _socket = io(SOCKET_URL, {
      auth:            { token },
      transports:      ["websocket", "polling"],
      reconnection:    true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 10,
    });

    _socket.on("connect", () => {
      console.log("[Socket] Connected:", _socket.id);
    });

    _socket.on("connect_error", (err) => {
      console.error("[Socket] Connection error:", err.message);
    });

    _socket.on("disconnect", (reason) => {
      console.log("[Socket] Disconnected:", reason);
    });

    attachHandlers(_socket);

    // Cleanup: remove event listeners but DON'T disconnect —
    // the socket is a singleton and other components may still need it.
    return () => {
      _socket.off("message:new");
      _socket.off("typing:start");
      _socket.off("typing:stop");
      _socket.off("messages:seen");
      _socket.off("message:deleted");
      _socket.off("user:status");
      _socket.off("users:online");
      _socket.off("conv:new");
      _socket.off("conv:removed");
      _socket.off("conv:removed:bulk");
      _socket.off("notification:new");
    };
  }, [token]);

  const attachHandlers = (socket) => {
    socket.off("message:new").on("message:new", (msg) => {
      handlersRef.current.onMessage?.(msg);
    });
    socket.off("typing:start").on("typing:start", (data) => {
      handlersRef.current.onTypingStart?.(data);
    });
    socket.off("typing:stop").on("typing:stop", (data) => {
      handlersRef.current.onTypingStop?.(data);
    });
    socket.off("messages:seen").on("messages:seen", (data) => {
      handlersRef.current.onSeen?.(data);
    });
    socket.off("message:deleted").on("message:deleted", (data) => {
      handlersRef.current.onMessageDeleted?.(data);
    });
    socket.off("user:status").on("user:status", (data) => {
      handlersRef.current.onUserStatus?.(data);
    });
    socket.off("users:online").on("users:online", (ids) => {
      handlersRef.current.onUsersOnline?.(ids);
    });
    socket.off("conv:new").on("conv:new", (conv) => {
      handlersRef.current.onNewConversation?.(conv);
    });
    socket.off("conv:removed").on("conv:removed", (data) => {
      handlersRef.current.onConversationRemoved?.(data);
    });
    socket.off("conv:removed:bulk").on("conv:removed:bulk", (data) => {
      handlersRef.current.onConversationsRemovedBulk?.(data);
    });
    socket.off("notification:new").on("notification:new", (notif) => {
      handlersRef.current.onNotification?.(notif);
    });
  };

  // ── Action emitters ─────────────────────────────────────────────────────────
  const joinConv = useCallback((conversationId) => {
    _socket?.emit("conv:join", { conversationId });
  }, []);

  const sendMessage = useCallback((payload, callback) => {
    if (!_socket) return;
    _socket.emit("message:send", payload, callback);
  }, []);

  const startTyping = useCallback((conversationId) => {
    _socket?.emit("typing:start", { conversationId });
  }, []);

  const stopTyping = useCallback((conversationId) => {
    _socket?.emit("typing:stop", { conversationId });
  }, []);

  const markSeen = useCallback((conversationId, messageIds, callback) => {
    _socket?.emit("messages:seen", { conversationId, messageIds }, callback);
  }, []);

  const deleteMessage = useCallback((messageId, deleteForEveryone, callback) => {
    _socket?.emit("message:delete", { messageId, deleteForEveryone }, callback);
  }, []);

  const getUserStatus = useCallback((userIds, callback) => {
    _socket?.emit("users:status", { userIds }, callback);
  }, []);

  return {
    socket: _socket,
    joinConv,
    sendMessage,
    startTyping,
    stopTyping,
    markSeen,
    deleteMessage,
    getUserStatus,
  };
};

export default useChat;
