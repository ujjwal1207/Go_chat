import React, { useState, useEffect } from "react";
import { Users, X, Search, Plus, Hash } from "lucide-react";
import { cn } from "../lib/utils.js";
import { useWebSocket } from "../hooks/useWebSocket.js";
import { apiService } from "../lib/api.js";

export function CreateGroupModal({ isOpen, onClose, onCreateGroup }) {
  const [groupName, setGroupName] = useState("");
  const [selectedMembers, setSelectedMembers] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [availableUsers, setAvailableUsers] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const { createGroup, connectionStatus } = useWebSocket();

  // Search users when query changes
  useEffect(() => {
    const searchUsers = async () => {
      if (searchQuery.trim().length < 2) {
        setAvailableUsers([]);
        return;
      }

      setIsSearching(true);
      try {
        const results = await apiService.searchUsers(searchQuery.trim());
        // Filter out already selected users
        const filteredResults = results.filter(
          user => !selectedMembers.some(selected => selected.id === user.id)
        );
        setAvailableUsers(filteredResults);
      } catch (error) {
        console.error("Failed to search users:", error);
        setAvailableUsers([]);
      } finally {
        setIsSearching(false);
      }
    };

    const debounceTimer = setTimeout(searchUsers, 300); // Debounce search
    return () => clearTimeout(debounceTimer);
  }, [searchQuery, selectedMembers]);

  // Show search results or empty state
  const displayedUsers = searchQuery.trim().length >= 2 ? availableUsers : [];

  const handleToggleMember = (user) => {
    setSelectedMembers((prev) => {
      const isSelected = prev.find((m) => m.id === user.id);
      if (isSelected) {
        return prev.filter((m) => m.id !== user.id);
      } else {
        return [...prev, user];
      }
    });
  };

  const handleCreateGroup = async () => {
    if (!groupName.trim() || selectedMembers.length === 0 || isSubmitting)
      return;

    setIsSubmitting(true);
    try {
      // Send group creation request via WebSocket
      const memberIds = selectedMembers.map((m) => m.id);
      const success = createGroup(groupName.trim(), memberIds);

      if (!success) {
        throw new Error("Failed to send group creation request");
      }

      // Group creation request sent, wait for server response
      // The actual group will be added to the store when we receive
      // a 'group_created' message from the WebSocket

      // Close modal - the group will appear when WebSocket confirms creation
      onClose();
      resetForm();
    } catch (error) {
      console.error("Failed to create group:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setGroupName("");
    setSelectedMembers([]);
    setSearchQuery("");
    setAvailableUsers([]);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      <div className="relative w-full max-w-md bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl border border-zinc-200 dark:border-zinc-700">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-zinc-200 dark:border-zinc-700">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-emerald-100 dark:bg-emerald-900/30 rounded-xl flex items-center justify-center">
              <Users className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            </div>
            <h2 className="text-xl font-bold text-zinc-900 dark:text-white">
              Create Group
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-zinc-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 max-h-96 overflow-y-auto">
          {/* Group Name */}
          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
              Group Name
            </label>
            <div className="relative">
              <Hash className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-zinc-400" />
              <input
                type="text"
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-zinc-300 dark:border-zinc-600 rounded-xl bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder="Enter group name"
                maxLength={50}
                disabled={isSubmitting}
              />
            </div>
          </div>

          {/* Member Search */}
          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
              Add Members ({selectedMembers.length} selected)
            </label>
            <div className="relative mb-3">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-zinc-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-zinc-300 dark:border-zinc-600 rounded-lg bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder="Search users..."
                disabled={isSubmitting}
              />
            </div>

            {/* Selected Members */}
            {selectedMembers.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-3 p-3 bg-zinc-50 dark:bg-zinc-800 rounded-lg">
                {selectedMembers.map((member) => (
                  <div
                    key={member.id}
                    className="flex items-center space-x-2 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 px-2 py-1 rounded-full text-sm"
                  >
                    <span>{member.name}</span>
                    <button
                      onClick={() => handleToggleMember(member)}
                      className="hover:bg-indigo-200 dark:hover:bg-indigo-800 rounded-full p-0.5"
                    >
                      <X className="w-3 h-3 text-indigo-700 dark:text-indigo-300" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Available Users */}
            <div className="space-y-1 max-h-32 overflow-y-auto">
              {isSearching ? (
                <div className="flex items-center justify-center py-4">
                  <div className="w-4 h-4 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                  <span className="ml-2 text-sm text-zinc-500 dark:text-zinc-400">Searching...</span>
                </div>
              ) : searchQuery.trim().length < 2 ? (
                <div className="text-center py-4">
                  <p className="text-sm text-zinc-500 dark:text-zinc-400">
                    Type at least 2 characters to search for users
                  </p>
                </div>
              ) : displayedUsers.length === 0 ? (
                <div className="text-center py-4">
                  <p className="text-sm text-zinc-500 dark:text-zinc-400">
                    No users found
                  </p>
                </div>
              ) : (
                displayedUsers.map((user) => {
                  const isSelected = selectedMembers.find(
                    (m) => m.id === user.id
                  );
                  return (
                    <button
                      key={user.id}
                      onClick={() => handleToggleMember(user)}
                      className={cn(
                        "w-full flex items-center space-x-3 p-2 text-left rounded-lg transition-colors",
                        isSelected
                          ? "bg-indigo-50 dark:bg-indigo-900/30 border border-indigo-200 dark:border-indigo-800"
                          : "hover:bg-zinc-100 dark:hover:bg-zinc-800"
                      )}
                      disabled={isSubmitting}
                    >
                      <div className="w-8 h-8 bg-zinc-200 dark:bg-zinc-700 rounded-full flex items-center justify-center flex-shrink-0">
                        <span className="text-sm font-medium text-zinc-600 dark:text-zinc-300">
                          {user.name ? user.name.charAt(0).toUpperCase() : user.email.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-zinc-900 dark:text-white truncate">
                          {user.name || user.email.split('@')[0]}
                        </p>
                        <p className="text-xs text-zinc-500 dark:text-zinc-400 truncate">
                          {user.email}
                        </p>
                      </div>
                      {isSelected && (
                        <div className="w-5 h-5 bg-indigo-600 rounded-full flex items-center justify-center flex-shrink-0">
                          <Plus className="w-3 h-3 text-white rotate-45" />
                        </div>
                      )}
                    </button>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="p-6 border-t border-zinc-200 dark:border-zinc-700">
          <div className="flex space-x-3">
            <button
              onClick={onClose}
              disabled={isSubmitting}
              className="flex-1 px-4 py-3 text-sm font-medium text-zinc-700 dark:text-zinc-300 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded-xl transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleCreateGroup}
              disabled={
                !groupName.trim() ||
                selectedMembers.length === 0 ||
                isSubmitting ||
                connectionStatus !== "connected"
              }
              className="flex-1 px-4 py-3 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 disabled:bg-zinc-300 dark:disabled:bg-zinc-600 rounded-xl transition-colors flex items-center justify-center space-x-2"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Creating...</span>
                </>
              ) : (
                <>
                  <Users className="w-4 h-4 text-white" />
                  <span>Create Group</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
