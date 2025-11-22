import React, { useState } from "react";
import {
  Command,
  Search,
  MessageCircle,
  Users,
  Hash,
  Loader2,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useChatStore } from "../store/chat.js";
import { cn } from "../lib/utils.js";

export function QuickSwitcher({ isOpen, onClose }) {
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const navigate = useNavigate();
  const { conversations, setActiveConversation } = useChatStore();

  const commands = [
    {
      id: "new-dm",
      name: "Start new conversation",
      icon: MessageCircle,
      action: () => console.log("New DM"),
    },
    {
      id: "new-group",
      name: "Create new group",
      icon: Users,
      action: () => console.log("New Group"),
    },
    {
      id: "settings",
      name: "Open settings",
      icon: Command,
      action: () => navigate("/settings"),
    },
  ];

  const filteredConversations = conversations.filter((conv) =>
    conv.name.toLowerCase().includes(query.toLowerCase())
  );

  const filteredCommands = commands.filter((cmd) =>
    cmd.name.toLowerCase().includes(query.toLowerCase())
  );

  const allResults = [
    ...filteredCommands.map((cmd) => ({ ...cmd, type: "command" })),
    ...filteredConversations,
  ];

  const handleKeyDown = (e) => {
    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setSelectedIndex((prev) => Math.min(prev + 1, allResults.length - 1));
        break;
      case "ArrowUp":
        e.preventDefault();
        setSelectedIndex((prev) => Math.max(prev - 1, 0));
        break;
      case "Enter":
        e.preventDefault();
        if (allResults[selectedIndex]) {
          handleSelect(allResults[selectedIndex]);
        }
        break;
      case "Escape":
        onClose();
        break;
    }
  };

  const handleSelect = (item) => {
    if (item.type === "command") {
      item.action();
    } else {
      setActiveConversation(item.id);
      navigate(`/chat/${item.id}`);
    }
    onClose();
  };

  React.useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  React.useEffect(() => {
    const handleEscapeKey = (e) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEscapeKey);
      return () => document.removeEventListener("keydown", handleEscapeKey);
    }
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[10vh] p-4">
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      <div className="relative w-full max-w-lg bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl border border-zinc-200 dark:border-zinc-700 overflow-hidden">
        {/* Search Input */}
        <div className="flex items-center p-4 border-b border-zinc-200 dark:border-zinc-700">
          <Search className="w-5 h-5 text-zinc-400 mr-3 flex-shrink-0" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            className="flex-1 text-lg bg-transparent text-zinc-900 dark:text-white placeholder-zinc-500 dark:placeholder-zinc-400 focus:outline-none"
            placeholder="Search conversations or commands..."
            autoFocus
          />
          <div className="flex items-center space-x-1 text-xs text-zinc-500 dark:text-zinc-400 ml-3">
            <kbd className="px-2 py-1 bg-zinc-100 dark:bg-zinc-800 rounded border border-zinc-300 dark:border-zinc-600">
              ↑↓
            </kbd>
            <kbd className="px-2 py-1 bg-zinc-100 dark:bg-zinc-800 rounded border border-zinc-300 dark:border-zinc-600">
              ↵
            </kbd>
          </div>
        </div>

        {/* Results */}
        <div className="max-h-96 overflow-y-auto">
          {allResults.length === 0 ? (
            <div className="p-8 text-center">
              <div className="w-12 h-12 bg-zinc-100 dark:bg-zinc-800 rounded-full flex items-center justify-center mx-auto mb-3">
                <Search className="w-6 h-6 text-zinc-400" />
              </div>
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                {query ? "No results found" : "Start typing to search..."}
              </p>
            </div>
          ) : (
            <div className="p-2">
              {/* Commands */}
              {filteredCommands.length > 0 && (
                <div className="mb-2">
                  <div className="px-2 py-1 text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                    Commands
                  </div>
                  {filteredCommands.map((command, index) => {
                    const globalIndex = index;
                    return (
                      <button
                        key={command.id}
                        onClick={() => handleSelect(command)}
                        className={cn(
                          "w-full flex items-center space-x-3 p-3 text-left rounded-xl transition-colors",
                          selectedIndex === globalIndex
                            ? "bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300"
                            : "text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                        )}
                      >
                        <command.icon className={cn("w-5 h-5 flex-shrink-0", selectedIndex === globalIndex ? "text-indigo-700 dark:text-indigo-300" : "text-zinc-700 dark:text-zinc-300")} />
                        <span className="font-medium">{command.name}</span>
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Conversations */}
              {filteredConversations.length > 0 && (
                <div>
                  <div className="px-2 py-1 text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                    Conversations
                  </div>
                  {filteredConversations.map((conversation, index) => {
                    const globalIndex = filteredCommands.length + index;
                    return (
                      <button
                        key={conversation.id}
                        onClick={() => handleSelect(conversation)}
                        className={cn(
                          "w-full flex items-center space-x-3 p-3 text-left rounded-xl transition-colors",
                          selectedIndex === globalIndex
                            ? "bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300"
                            : "text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                        )}
                      >
                        <div className="w-8 h-8 flex-shrink-0">
                          {conversation.type === "group" ? (
                            <div className="w-full h-full bg-indigo-100 dark:bg-indigo-900/30 rounded-full flex items-center justify-center">
                              <span className="text-lg">
                                {conversation.avatar}
                              </span>
                            </div>
                          ) : (
                            <div className="w-full h-full bg-zinc-200 dark:bg-zinc-700 rounded-full flex items-center justify-center">
                              <span className="text-sm font-medium text-zinc-600 dark:text-zinc-300">
                                {conversation.avatar}
                              </span>
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-2">
                            {conversation.type === "group" ? (
                              <Hash className="w-3 h-3 text-zinc-400" />
                            ) : (
                              <MessageCircle className="w-3 h-3 text-zinc-400" />
                            )}
                            <span className="font-medium truncate">
                              {conversation.name}
                            </span>
                          </div>
                          <p className="text-sm text-zinc-500 dark:text-zinc-400 truncate mt-0.5">
                            {conversation.lastMessage}
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/50">
          <div className="flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-1">
                <kbd className="px-1.5 py-0.5 bg-white dark:bg-zinc-700 rounded border">
                  ⌘
                </kbd>
                <kbd className="px-1.5 py-0.5 bg-white dark:bg-zinc-700 rounded border">
                  K
                </kbd>
                <span>to open</span>
              </div>
              <div className="flex items-center space-x-1">
                <kbd className="px-1.5 py-0.5 bg-white dark:bg-zinc-700 rounded border">
                  Esc
                </kbd>
                <span>to close</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
