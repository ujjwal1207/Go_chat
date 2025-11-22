import React, { useState, useRef, useEffect } from "react";
import { useParams } from "react-router-dom";
import { MoreVertical, Search, Phone, Video, Send, Trash2 } from "lucide-react";
import { useChatStore } from "../store/chat.js";
import { useAuthStore } from "../store/auth.js";
import { StatusDot } from "./StatusDot.jsx";
import { cn } from "../lib/utils.js";
import { useWebSocket } from "../hooks/useWebSocket.js";
import { MessageInput } from "./MessageInput.jsx";
import { MessageBubble } from "./MessageBubble.jsx";
import { apiService } from "../lib/api.js";

// Avatar color variants using cohesive palette with softer tints
const avatarColors = [
  "bg-sky-100 text-sky-700 dark:bg-indigo-800/40 dark:text-indigo-300",
  "bg-indigo-100 text-indigo-700 dark:bg-sky-800/40 dark:text-sky-300",
  "bg-emerald-100 text-emerald-700 dark:bg-emerald-800/40 dark:text-emerald-300",
  "bg-amber-100 text-amber-700 dark:bg-amber-800/40 dark:text-amber-300",
  "bg-violet-100 text-violet-700 dark:bg-violet-800/40 dark:text-violet-300",
  "bg-slate-100 text-slate-700 dark:bg-zinc-800/40 dark:text-zinc-300",
];

const getAvatarColor = (id) => {
  return avatarColors[parseInt(id) % avatarColors.length];
};

export function ChatPane() {
  const { id: chatId } = useParams();
  const { user } = useAuthStore();
  const { activeConversationId, conversations, messages, addMessage, removeConversation } =
    useChatStore();
  const [messageText, setMessageText] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const messagesEndRef = useRef(null);
  const menuRef = useRef(null);
  const { sendMessage, sendTypingIndicator, connectionStatus } = useWebSocket();

  // Get current conversation
  const conversationId = chatId || activeConversationId || "1";
  const conversation = conversations.find((c) => c.id === conversationId) || {
    id: conversationId,
    type: "dm",
    name: "Select a conversation",
    isOnline: false,
    lastSeen: new Date(),
  };

  // Get messages for current conversation
  const conversationMessages = messages[conversationId] || [];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // Handle click outside to close menu
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setShowMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleDeleteChat = async () => {
    if (window.confirm(`Are you sure you want to delete the conversation with ${conversation.name}?`)) {
      try {
        await apiService.deleteConversation(conversation.id);
        removeConversation(conversation.id);
        setShowMenu(false);
      } catch (error) {
        console.error('Failed to delete conversation:', error);
        alert('Failed to delete conversation. Please try again.');
      }
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [conversationMessages]);

  const handleSendMessage = (messageData) => {
    if (
      !messageData.text.trim() &&
      (!messageData.files || messageData.files.length === 0)
    )
      return;

    const message = {
      text: messageData.text,
      type: messageData.files && messageData.files.length > 0 ? "file" : "text",
      files: messageData.files || [],
    };

    // Send via WebSocket
    const success = sendMessage(conversation.id, message);
    if (success) {
      setMessageText("");
    }
  };

  // Handle typing indicators
  useEffect(() => {
    if (messageText && !isTyping) {
      setIsTyping(true);
      sendTypingIndicator(conversation.id, true);
    }

    const timeout = setTimeout(() => {
      if (isTyping) {
        setIsTyping(false);
        sendTypingIndicator(conversation.id, false);
      }
    }, 1000);

    return () => clearTimeout(timeout);
  }, [messageText, isTyping, conversation.id, sendTypingIndicator]);

  const formatTime = (date) => {
    if (!date) return "";

    // Handle both Date objects and strings
    const dateObj = date instanceof Date ? date : new Date(date);

    // Check if date is valid
    if (isNaN(dateObj.getTime())) {
      return "";
    }

    return new Intl.DateTimeFormat("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    }).format(dateObj);
  };

  const formatDate = (date) => {
    if (!date) return "Unknown Date";

    // Handle both Date objects and strings
    const dateObj = date instanceof Date ? date : new Date(date);

    // Check if date is valid
    if (isNaN(dateObj.getTime())) {
      return "Unknown Date";
    }

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const messageDate = new Date(
      dateObj.getFullYear(),
      dateObj.getMonth(),
      dateObj.getDate()
    );

    const daysDiff = Math.floor(
      (today.getTime() - messageDate.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (daysDiff === 0) return "Today";
    if (daysDiff === 1) return "Yesterday";
    if (daysDiff < 7)
      return dateObj.toLocaleDateString("en-US", { weekday: "long" });

    return dateObj.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: date.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
    });
  };

  if (!activeConversationId) {
    return (
      <div className="flex-1 flex items-center justify-center bg-white dark:bg-zinc-900">
        <div className="text-center max-w-sm px-6">
          <div className="w-20 h-20 bg-gradient-to-br from-indigo-100 to-purple-100 dark:from-indigo-900/30 dark:to-purple-900/30 rounded-3xl flex items-center justify-center mx-auto mb-6">
            <Send className="w-10 h-10 text-indigo-500 dark:text-indigo-400" />
          </div>
          <h3 className="text-xl font-semibold text-zinc-900 dark:text-white mb-3">
            Select a conversation
          </h3>
          <p className="text-slate-600 dark:text-zinc-400 leading-relaxed">
            Choose from your existing conversations or start a new one to begin
            chatting
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-gradient-to-b from-white to-slate-50 dark:bg-gradient-to-b dark:from-zinc-900 dark:to-zinc-950">
      {/* Chat Header */}
      <header className="h-16 bg-white dark:bg-zinc-900/50 border-b border-slate-200 dark:border-zinc-800 shadow-sm px-6 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="relative">
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center ${getAvatarColor(
                conversation.id
              )}`}
            >
              <span className="text-sm font-medium">
                {conversation.name
                  .split(" ")
                  .map((n) => n[0])
                  .join("")}
              </span>
            </div>
            <div className="absolute -bottom-0.5 -right-0.5">
              <StatusDot
                status={conversation.isOnline ? "online" : "offline"}
                className="w-3 h-3 border-2 border-white dark:border-zinc-900"
              />
            </div>
          </div>
          <div>
            <h2 className="font-medium text-slate-900 dark:text-white">
              {conversation.name}
            </h2>
            <p className="text-sm text-slate-500 dark:text-zinc-400">
              {conversation.isOnline
                ? "Active now"
                : `Last seen ${formatTime(conversation.lastSeen)}`}
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-1">
          <button
            className="p-2.5 bg-white text-slate-600 border border-slate-200 hover:bg-slate-100 hover:text-slate-700 hover:border-slate-300 rounded-xl transition-all duration-200 tooltip"
            title="Voice Call"
          >
            <Phone className="w-5 h-5 text-slate-600" />
          </button>
          <button
            className="p-2.5 bg-white text-slate-600 border border-slate-200 hover:bg-slate-100 hover:text-slate-700 hover:border-slate-300 rounded-xl transition-all duration-200 tooltip"
            title="Video Call"
          >
            <Video className="w-5 h-5 text-slate-600" />
          </button>
          <button
            className="p-2.5 bg-white text-slate-600 border border-slate-200 hover:bg-slate-100 hover:text-slate-700 hover:border-slate-300 rounded-xl transition-all duration-200 tooltip"
            title="Search"
          >
            <Search className="w-5 h-5 text-slate-600" />
          </button>
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="p-2.5 bg-white text-slate-600 border border-slate-200 hover:bg-slate-100 hover:text-slate-700 hover:border-slate-300 rounded-xl transition-all duration-200 tooltip"
              title="More Options"
            >
              <MoreVertical className="w-5 h-5 text-slate-600" />
            </button>
            
            {showMenu && (
              <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-lg shadow-lg z-50">
                <div className="py-1">
                  <button
                    onClick={handleDeleteChat}
                    className="flex items-center w-full px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-700 dark:hover:text-red-300 transition-colors duration-150"
                  >
                    <Trash2 className="w-4 h-4 mr-3 text-red-600 dark:text-red-400" />
                    Delete Chat
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-transparent dark:bg-zinc-800/30">
        {/* Date separator */}
        <div className="flex items-center my-6">
          <div className="flex-1 h-px bg-slate-200 dark:bg-zinc-700"></div>
          <div className="bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-full px-4 py-1.5 mx-4 shadow-sm">
            <span className="text-xs font-medium text-slate-400 dark:text-zinc-400">
              {formatDate(new Date())}
            </span>
          </div>
          <div className="flex-1 h-px bg-slate-200 dark:bg-zinc-700"></div>
        </div>

        {/* Messages */}
        {conversationMessages.map((message, index) => {
          const isOwnMessage =
            message.senderId === user?.id || message.senderId === "user1";
          const showAvatar =
            !isOwnMessage &&
            (index === 0 ||
              conversationMessages[index - 1].senderId !== message.senderId);

          return (
            <MessageBubble
              key={message.id}
              message={message}
              isOwn={isOwnMessage}
              showAvatar={showAvatar}
            />
          );
        })}

        {/* Typing indicator */}
        {isTyping && (
          <div className="flex space-x-3">
            <div className="w-8 h-8 bg-zinc-200 dark:bg-zinc-700 rounded-full flex items-center justify-center">
              <span className="text-xs font-medium text-zinc-600 dark:text-zinc-300">
                A
              </span>
            </div>
            <div className="bg-zinc-100 dark:bg-zinc-800 rounded-2xl px-4 py-2">
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-zinc-400 rounded-full animate-pulse" />
                <div
                  className="w-2 h-2 bg-zinc-400 rounded-full animate-pulse"
                  style={{ animationDelay: "0.2s" }}
                />
                <div
                  className="w-2 h-2 bg-zinc-400 rounded-full animate-pulse"
                  style={{ animationDelay: "0.4s" }}
                />
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <MessageInput
        value={messageText}
        onChange={setMessageText}
        onSend={handleSendMessage}
        placeholder={`Message ${conversation.name}...`}
        disabled={connectionStatus !== "connected"}
      />
    </div>
  );
}
