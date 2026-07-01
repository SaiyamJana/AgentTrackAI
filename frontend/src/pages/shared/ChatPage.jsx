import { useState } from "react";
import DashboardLayout from "../../components/layout/DashboardLayout";
import ConversationList from "../../components/chat/ConversationList";
import ChatWindow from "../../components/chat/ChatWindow";
import { useAuth } from "../../context/AuthContext";
import { useChats } from "../../context/ChatContext";

const ChatPage = () => {
  const { user } = useAuth();
  const { conversations, activeConvId } = useChats();
  const [mobileShowChat, setMobileShowChat] = useState(false);

  const activeConv = conversations.find((c) => String(c._id) === String(activeConvId));

  return (
    <DashboardLayout title="Messages">
      <div className="h-[calc(100vh-7rem)] bg-white rounded-2xl border border-slate-100 overflow-hidden flex">
        {/* Sidebar — hidden on mobile when a chat is open */}
        <div className={`w-full sm:w-80 shrink-0 ${mobileShowChat ? "hidden sm:block" : "block"}`}>
          <ConversationList
            currentUserId={user?._id}
            onSelect={() => setMobileShowChat(true)}
          />
        </div>

        {/* Chat window — hidden on mobile until a conversation is selected */}
        <div className={`flex-1 ${mobileShowChat ? "block" : "hidden sm:block"}`}>
          <ChatWindow conversation={activeConv} />
        </div>
      </div>
    </DashboardLayout>
  );
};

export default ChatPage;
