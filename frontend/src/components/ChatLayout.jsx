import React, { useState, useEffect } from "react";
import { Routes, Route, useNavigate } from "react-router-dom";
import { Menu, Settings, LogOut, Wifi, WifiOff } from "lucide-react";
import { useAuthStore } from "../store/auth.js";
import { cn } from "../lib/utils.js";
import { LeftSidebar } from "./LeftSidebar.jsx";
import { ChatPane } from "./ChatPane.jsx";
import { StatusDot } from "./StatusDot.jsx";
import { QuickSwitcher } from "./QuickSwitcher.jsx";
import { CreateGroupModal } from "./CreateGroupModal.jsx";
import { SettingsPage } from "./SettingsPage.jsx";
import { useWebSocket } from "../hooks/useWebSocket.js";
import { useDemoData } from "../hooks/useDemoData.js";

export function ChatLayout() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [showQuickSwitcher, setShowQuickSwitcher] = useState(false);
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const { connectionStatus } = useWebSocket();

  // Load dynamic chat data
  useDemoData();

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Cmd/Ctrl + K for quick switcher
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setShowQuickSwitcher(true);
      }

      // Escape to close modals
      if (e.key === "Escape") {
        setShowQuickSwitcher(false);
        setShowCreateGroup(false);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  const handleLogout = () => {
    logout();
  };

  return (
    <div className="h-screen flex bg-slate-100 dark:bg-zinc-900">
      {/* Mobile overlay */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Left Sidebar */}
      <div
        className={cn(
          "fixed lg:relative inset-y-0 left-0 z-50 w-80 bg-slate-100 dark:bg-zinc-900 border-r border-slate-200 dark:border-zinc-700 shadow-md transform transition-transform lg:translate-x-0",
          isSidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <LeftSidebar
          onClose={() => setIsSidebarOpen(false)}
          onNewGroup={() => setShowCreateGroup(true)}
        />
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header */}
        <header className="h-16 bg-white dark:bg-zinc-900/80 backdrop-blur-md border-b border-slate-200 dark:border-zinc-800 flex items-center justify-between px-4">
          {/* Left side - Mobile menu button */}
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="lg:hidden p-2 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
            >
              <Menu className="w-5 h-5" />
            </button>

            {/* Connection status on mobile */}
            <div className="lg:hidden flex items-center space-x-2">
              <StatusDot status={connectionStatus} />
              <span className="text-sm text-slate-800 dark:text-zinc-400 capitalize">
                {connectionStatus}
              </span>
            </div>
          </div>

          {/* Center - App title (mobile only) */}
          <div className="lg:hidden">
            <h1 className="text-lg font-bold text-slate-800 dark:text-white">
              RealChat
            </h1>
          </div>

          {/* Right side - User info and actions */}
          <div className="flex items-center space-x-3">
            {/* Connection status (desktop) */}
            <div
              className={cn(
                "hidden lg:flex items-center space-x-2 px-3 py-1.5 rounded-full border transition-all duration-200",
                connectionStatus === "connected"
                  ? "bg-emerald-900/40 text-emerald-300 border border-emerald-700"
                  : connectionStatus === "connecting"
                  ? "bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800"
                  : "bg-rose-50 dark:bg-rose-900/20 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-800"
              )}
            >
              {connectionStatus === "connected" ? (
                <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
              ) : connectionStatus === "connecting" ? (
                <div className="w-2 h-2 bg-amber-400 rounded-full animate-pulse" />
              ) : (
                <div className="w-2 h-2 bg-rose-500 rounded-full" />
              )}
              <span className="text-sm font-medium">
                {connectionStatus === "connected"
                  ? "Connected"
                  : connectionStatus === "connecting"
                  ? "Reconnecting..."
                  : "Offline"}
              </span>
            </div>

            {/* User info */}
            <div className="flex items-center space-x-2">
              <StatusDot status="online" />
              <div className="hidden sm:block">
                <p className="text-sm font-medium text-slate-800 dark:text-white">
                  {user?.name}
                </p>
                <p className="text-xs text-slate-500 dark:text-zinc-400">
                  {user?.email}
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center space-x-1">
              {/* Settings */}
              <button
                onClick={() => navigate("/settings")}
                className={cn(
                  "p-2 rounded-lg transition-colors",
                  "bg-zinc-900 text-white hover:bg-zinc-800",                  // light theme
                  "dark:bg-zinc-700 dark:text-white dark:hover:bg-zinc-600"   // dark theme
                )}
              >
                <Settings className="w-4 h-4" />
              </button>

              {/* Logout */}
              <button
                onClick={handleLogout}
                className={cn(
                  "p-2 rounded-lg transition-colors",
                  "bg-rose-500 text-white hover:bg-rose-600",                  // light theme
                  "dark:bg-rose-600 dark:text-white dark:hover:bg-rose-500"   // dark theme
                )}
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </header>

        {/* Chat Content */}
        <div className="flex-1 flex min-h-0 bg-slate-50 dark:bg-zinc-800/30">
          <Routes>
            <Route path="/" element={<ChatPane />} />
            <Route path="/chat/:id" element={<ChatPane />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="/profile" element={<div>Profile Page</div>} />
          </Routes>
        </div>
      </div>

      {/* Modals */}
      <QuickSwitcher
        isOpen={showQuickSwitcher}
        onClose={() => setShowQuickSwitcher(false)}
      />

      <CreateGroupModal
        isOpen={showCreateGroup}
        onClose={() => setShowCreateGroup(false)}
      />
    </div>
  );
}
