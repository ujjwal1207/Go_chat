import React, { useState } from "react";
import {
  Search,
  Plus,
  Users,
  MessageCircle,
  Hash,
  X,
  UserPlus,
} from "lucide-react";
import { useAuthStore } from "../store/auth.js";
import { useChatStore } from "../store/chat.js";
import { StatusDot } from "./StatusDot.jsx";
import { cn } from "../lib/utils.js";
import { apiService } from "../lib/api.js";
import UserSearchModal from "./UserSearchModal.jsx";

// Avatar color variants using cohesive palette with softer tints
const avatarColors = [
  "bg-sky-100 text-sky-700 dark:bg-indigo-700/40 dark:text-indigo-300",
  "bg-indigo-100 text-indigo-700 dark:bg-sky-700/40 dark:text-sky-300",
  "bg-emerald-100 text-emerald-700 dark:bg-emerald-700/40 dark:text-emerald-300",
  "bg-amber-100 text-amber-700 dark:bg-amber-700/40 dark:text-amber-300",
  "bg-violet-100 text-violet-700 dark:bg-violet-700/40 dark:text-violet-300",
  "bg-slate-100 text-slate-700 dark:bg-zinc-700/40 dark:text-zinc-300",
];

const getAvatarColor = (id) => {
  return avatarColors[parseInt(id) % avatarColors.length];
};

export function LeftSidebar({ onClose, onNewGroup }) {
  const { user } = useAuthStore();
  const {
    conversations,
    activeConversationId,
    setActiveConversation,
    addConversation,
  } = useChatStore();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("all"); // 'all', 'dms', 'groups'
  const [showUserSearch, setShowUserSearch] = useState(false);

  // Filter conversations based on search and tab
  const filteredConversations = conversations.filter((conv) => {
    const matchesSearch = conv.name
      ? conv.name.toLowerCase().includes(searchQuery.toLowerCase())
      : true; // If no name, don't filter by search
    const matchesTab =
      activeTab === "all" ||
      (activeTab === "dms" && conv.type === "dm") ||
      (activeTab === "groups" && conv.type === "group");

    return matchesSearch && matchesTab;
  });

  const handleAddUser = async (selectedUser) => {
    // Check if user is authenticated
    if (!user || !localStorage.getItem("access_token")) {
      console.error("User not authenticated");
      alert("Please log in first to add people to chat");
      return;
    }

    console.log("Creating DM conversation with:", selectedUser.email);
    console.log("Current user:", user);
    console.log(
      "Auth token available:",
      !!localStorage.getItem("access_token")
    );

    // If user data is incomplete (email/name undefined), skip API and use local fallback
    if (!user.email || !user.name) {
      console.warn(
        "User data incomplete, using local fallback for DM creation"
      );
      console.log("Using fallback with user ID:", user.id);

      const newConversation = {
        id: `dm-${Date.now()}`,
        type: "dm",
        participants: [user, selectedUser],
        name: selectedUser.name || selectedUser.email.split("@")[0],
        lastMessage: null,
        unreadCount: 0,
        lastMessageTime: new Date(),
        isOnline: selectedUser.isOnline || false,
      };

      addConversation(newConversation);
      setActiveConversation(newConversation.id);
      setShowUserSearch(false);
      return;
    }

    try {
      // Create or get existing DM conversation
      const conversation = await apiService.createDMConversation(
        selectedUser.email
      );

      console.log("API Response conversation:", conversation);

      // Add to store
      addConversation(conversation);

      console.log(
        "Added conversation to store, all conversations:",
        conversations
      );

      // Select the new conversation
      setActiveConversation(conversation.id);

      console.log("Set active conversation to:", conversation.id);

      // Close modal
      setShowUserSearch(false);

      console.log("Created DM conversation with:", selectedUser.email);
    } catch (error) {
      console.error("Failed to create DM conversation:", error);

      // Fallback: create local conversation for demo
      const newConversation = {
        id: `dm-${Date.now()}`,
        type: "dm",
        participants: [user, selectedUser],
        name: selectedUser.name || selectedUser.email.split("@")[0],
        lastMessage: null,
        unreadCount: 0,
        lastMessageTime: new Date(),
        isOnline: selectedUser.isOnline || false,
      };

      addConversation(newConversation);
      setActiveConversation(newConversation.id);
      setShowUserSearch(false);
    }
  };

  const formatTime = (date) => {
    if (!date) return '';
    const now = new Date();
    const messageDate = new Date(date);
    if (isNaN(messageDate.getTime())) return '';
    const diffInMinutes = Math.floor((now - messageDate) / (1000 * 60));

    if (diffInMinutes < 1) return "now";
    if (diffInMinutes < 60) return `${diffInMinutes}m`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h`;
    return `${Math.floor(diffInMinutes / 1440)}d`;
  };

  return (
    <div className="h-full flex flex-col bg-slate-50 dark:bg-zinc-900">
      {/* Header */}
      <div className="p-4 border-b border-slate-200 dark:border-zinc-700">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-indigo-500 rounded-xl flex items-center justify-center">
              <span className="text-white font-bold text-sm">RC</span>
            </div>
            <div>
              <h2 className="font-bold text-slate-900 dark:text-white">
                RealChat
              </h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="lg:hidden p-1 text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
          >
            <X className="w-5 h-5 text-zinc-500" />
          </button>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search conversations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-3 text-sm border border-slate-200 dark:border-zinc-700 rounded-2xl bg-white dark:bg-zinc-800/50 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-400 transition-colors"
          />
        </div>
      </div>

      {/* Navigation Pills */}
      <div className="px-4 py-3 border-b border-slate-200 dark:border-zinc-700">
        <div className="flex bg-slate-100 dark:bg-zinc-800/60 rounded-2xl p-1">
          {[
            { id: "all", label: "All", icon: MessageCircle },
            { id: "dms", label: "DMs", icon: Users },
            { id: "groups", label: "Groups", icon: Hash },
          ].map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={cn(
                "flex-1 flex items-center justify-center space-x-1.5 px-3 py-3 text-sm font-medium rounded-xl transition-all duration-200",
                activeTab === id
                  ? "bg-indigo-600 text-white border border-indigo-500 shadow-[0_0_0_1px_rgba(99,102,241,0.5)]"
                  : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-100 dark:bg-zinc-800/60 dark:text-zinc-400 dark:border-zinc-700 dark:hover:bg-zinc-700/50"
              )}
            >
              <Icon className={cn("w-4 h-4", activeTab === id ? "text-white" : "text-slate-600 dark:text-zinc-400")} />
              <span className="hidden sm:inline">{label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Conversations List */}
      <div className="flex-1 overflow-y-auto">
        {filteredConversations.length === 0 ? (
          <div className="p-8 text-center">
            <div className="w-12 h-12 bg-zinc-100 dark:bg-zinc-800 rounded-full flex items-center justify-center mx-auto mb-3">
              <MessageCircle className="w-6 h-6 text-zinc-400" />
            </div>
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              {searchQuery ? "No conversations found" : "No conversations yet"}
            </p>
          </div>
        ) : (
          <div className="p-2 flex flex-col gap-2">
            {filteredConversations.map((conversation) => (
              <button
                key={conversation.id}
                onClick={() => {
                  setActiveConversation(conversation.id);
                  onClose && onClose();
                }}
                className={cn(
                  "w-full min-h-[64px] p-4 rounded-2xl text-left transition-all duration-200 bg-white hover:bg-slate-50 dark:bg-zinc-800 dark:hover:bg-zinc-700/50 hover:shadow-sm group text-slate-700 dark:text-zinc-300 border border-slate-200 dark:border-transparent",
                  activeConversationId === conversation.id &&
                    "bg-indigo-50 dark:bg-indigo-900/40 ring-2 ring-indigo-400 dark:ring-indigo-400 ring-offset-2 ring-offset-slate-50 dark:ring-offset-zinc-900 text-slate-900 dark:text-zinc-200"
                )}
              >
                <div className="flex items-center space-x-3">
                  {/* Avatar */}
                  <div className="relative flex-shrink-0 group-hover:scale-105 transition-transform duration-200">
                    {conversation.type === "group" ? (
                      <div
                        className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-sm ${getAvatarColor(
                          conversation.id
                        )}`}
                      >
                        <span className="text-lg font-semibold">
                          {conversation.avatar || "#"}
                        </span>
                      </div>
                    ) : (
                      <div
                        className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-sm ${getAvatarColor(
                          conversation.id
                        )}`}
                      >
                        <span className="text-sm font-semibold">
                          {conversation.name
                            .split(" ")
                            .map((n) => n[0])
                            .join("")}
                        </span>
                      </div>
                    )}
                    {conversation.type === "dm" && (
                      <div className="absolute -bottom-0.5 -right-0.5">
                        <StatusDot
                          status={conversation.isOnline ? "online" : "offline"}
                          className="w-3 h-3 border-2 border-white dark:border-zinc-900"
                        />
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="text-sm font-medium text-slate-900 dark:text-zinc-200 truncate">
                        {conversation.name}
                      </h3>
                      <div className="flex items-center space-x-2">
                        <span className="text-xs text-slate-500 dark:text-zinc-500">
                          {formatTime(conversation.lastMessageTime)}
                        </span>
                        {conversation.unreadCount > 0 && (
                          <div className="w-5 h-5 bg-indigo-500 rounded-full flex items-center justify-center">
                            <span className="text-xs text-white font-medium">
                              {conversation.unreadCount > 9
                                ? "9+"
                                : conversation.unreadCount}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                    <p className="text-sm text-slate-500 dark:text-zinc-500/90 truncate">
                      {conversation.lastMessage}
                    </p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* New Chat Buttons */}
      <div className="p-4 border-t border-slate-200 dark:border-zinc-700 bg-gradient-to-t from-slate-100 to-transparent dark:from-zinc-900 dark:to-transparent">
        <div className="space-y-2">
          <button
            onClick={() => setShowUserSearch(true)}
            className="w-full flex items-center justify-center space-x-2 py-3.5 px-4 bg-indigo-500 hover:bg-indigo-600 dark:bg-indigo-600 dark:hover:bg-indigo-500 text-white rounded-2xl font-medium transition-all duration-200 shadow-lg hover:shadow-xl dark:shadow-[0_0_10px_rgba(99,102,241,0.15)] transform hover:scale-[1.02] active:scale-[0.98]"
          >
            <UserPlus className="w-5 h-5 text-white" />
            <span>Add People</span>
          </button>
          <button
            onClick={onNewGroup}
            className="w-full flex items-center justify-center space-x-2 py-3.5 px-4 bg-white hover:bg-slate-50 dark:bg-zinc-700 dark:hover:bg-zinc-600 text-slate-700 dark:text-zinc-200 border border-slate-200 dark:border-transparent rounded-2xl font-medium transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98]"
          >
            <Users className="w-5 h-5 text-slate-700 dark:text-zinc-200" />
            <span>New Group</span>
          </button>
        </div>
      </div>

      {/* User Search Modal */}
      <UserSearchModal
        isOpen={showUserSearch}
        onClose={() => setShowUserSearch(false)}
        onUserAdd={handleAddUser}
        existingUsers={conversations
          .filter((c) => c.type === "dm")
          .flatMap((c) => c.participants || [])}
      />
    </div>
  );
}
