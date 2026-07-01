import { useState } from "react";
import Icon from "../shared/Icon";

const formatTime = (dateStr) =>
  new Date(dateStr).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

const MessageBubble = ({ message, isOwn, onReply, onDelete, showSenderName }) => {
  const [menuOpen, setMenuOpen] = useState(false);

  if (message._deleted || message.deletedForEveryone) {
    return (
      <div className={`flex ${isOwn ? "justify-end" : "justify-start"} px-4 py-1`}>
        <div className="px-4 py-2 rounded-2xl bg-slate-100 text-slate-400 text-xs italic">
          This message was deleted
        </div>
      </div>
    );
  }

  const canDeleteForEveryone =
    isOwn && (Date.now() - new Date(message.createdAt).getTime() < 60 * 60 * 1000);

  return (
    <div className={`group flex ${isOwn ? "justify-end" : "justify-start"} px-4 py-1`}>
      <div className={`max-w-[70%] flex flex-col ${isOwn ? "items-end" : "items-start"}`}>
        {showSenderName && !isOwn && (
          <span className="text-[11px] font-semibold text-slate-500 mb-0.5 px-1">
            {message.senderId?.name}
          </span>
        )}

        <div className="relative flex items-center gap-1">
          {/* Delete menu — appears on hover, sender side */}
          {isOwn && (
            <div className="opacity-0 group-hover:opacity-100 transition-opacity relative order-first">
              <button
                onClick={() => setMenuOpen((o) => !o)}
                className="p-1 rounded-md hover:bg-slate-100 text-slate-400"
              >
                <Icon name="settings" className="w-3.5 h-3.5" />
              </button>
              {menuOpen && (
                <div className="absolute bottom-full right-0 mb-1 bg-white border border-slate-200 rounded-lg shadow-lg py-1 w-44 z-10">
                  <button
                    onClick={() => { onDelete?.(message._id, false); setMenuOpen(false); }}
                    className="w-full text-left px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-50"
                  >
                    Delete for me
                  </button>
                  {canDeleteForEveryone && (
                    <button
                      onClick={() => { onDelete?.(message._id, true); setMenuOpen(false); }}
                      className="w-full text-left px-3 py-1.5 text-xs text-red-500 hover:bg-red-50"
                    >
                      Delete for everyone
                    </button>
                  )}
                </div>
              )}
            </div>
          )}

          <div
            className={`rounded-2xl px-4 py-2.5 ${
              isOwn
                ? "bg-blue-600 text-white rounded-br-md"
                : "bg-slate-100 text-slate-800 rounded-bl-md"
            }`}
          >
            {/* Reply preview */}
            {message.replyTo && (
              <div className={`mb-1.5 pl-2 border-l-2 ${isOwn ? "border-blue-300" : "border-slate-300"}`}>
                <p className={`text-[11px] font-semibold ${isOwn ? "text-blue-100" : "text-slate-500"}`}>
                  {message.replyTo.senderId?.name || "Unknown"}
                </p>
                <p className={`text-xs truncate max-w-50 ${isOwn ? "text-blue-100" : "text-slate-500"}`}>
                  {message.replyTo.content}
                </p>
              </div>
            )}

            {/* Text content */}
            {message.content && (
              <p className="text-sm whitespace-pre-wrap wrap-break-words">{message.content}</p>
            )}
          </div>

          {/* Reply trigger */}
          <button
            onClick={() => onReply?.(message)}
            className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded-md hover:bg-slate-100 text-slate-400"
          >
            <Icon name="arrow" className="w-3.5 h-3.5 rotate-180" />
          </button>
        </div>

        {/* Timestamp + seen status */}
        <div className="flex items-center gap-1 mt-0.5 px-1">
          <span className="text-[10px] text-slate-400">{formatTime(message.createdAt)}</span>
          {isOwn && message.seenBy?.length > 0 && (
            <span className="text-[10px] text-blue-500 font-medium">Seen</span>
          )}
        </div>
      </div>
    </div>
  );
};

export default MessageBubble;
