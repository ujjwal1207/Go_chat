import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Moon,
  Sun,
  Monitor,
  User,
  Globe,
  Shield,
  Bell,
  Eye,
  MessageSquare,
  ArrowLeft,
} from "lucide-react";
import { useAuthStore } from "../store/auth.js";
import { cn } from "../lib/utils.js";

const languages = [
  { code: "en", name: "English", flag: "🇺🇸" },
  { code: "es", name: "Spanish", flag: "🇪🇸" },
  { code: "fr", name: "French", flag: "🇫🇷" },
  { code: "de", name: "German", flag: "🇩🇪" },
  { code: "it", name: "Italian", flag: "🇮🇹" },
  { code: "pt", name: "Portuguese", flag: "🇧🇷" },
  { code: "ru", name: "Russian", flag: "🇷🇺" },
  { code: "ja", name: "Japanese", flag: "🇯🇵" },
  { code: "ko", name: "Korean", flag: "🇰🇷" },
  { code: "zh", name: "Chinese", flag: "🇨🇳" },
  { code: "hi", name: "Hindi", flag: "🇮🇳" },
  { code: "ar", name: "Arabic", flag: "🇸🇦" },
];

export function SettingsPage() {
  const navigate = useNavigate();
  const { user, setUser } = useAuthStore();
  const [theme, setTheme] = useState("system");
  const [displayName, setDisplayName] = useState(user?.name || "");
  const [language, setLanguage] = useState(user?.language || "en");
  const [messageDensity, setMessageDensity] = useState("comfortable");
  const [readReceipts, setReadReceipts] = useState(true);
  const [allowDMs, setAllowDMs] = useState(true);
  const [isLoading, setIsLoading] = useState(false);

  const handleSaveProfile = async () => {
    setIsLoading(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 500));

      if (user) {
        setUser({
          ...user,
          displayName: displayName.trim(),
          language,
        });
      }
    } catch (error) {
      console.error("Failed to save profile:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const applyTheme = (newTheme) => {
    setTheme(newTheme);

    if (newTheme === "dark") {
      document.documentElement.classList.add("dark");
    } else if (newTheme === "light") {
      document.documentElement.classList.remove("dark");
    } else {
      // System theme
      const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
      if (mediaQuery.matches) {
        document.documentElement.classList.add("dark");
      } else {
        document.documentElement.classList.remove("dark");
      }
    }
  };

  const selectedLanguage = languages.find((lang) => lang.code === language);

  return (
    <div className="flex-1 overflow-y-auto bg-zinc-50 dark:bg-zinc-900">
      <div className="max-w-2xl mx-auto p-6 space-y-8">
        {/* Header */}
        <div>
          <div className="flex items-center space-x-3 mb-2">
            <button
              onClick={() => navigate("/")}
              className="p-2 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">
              Settings
            </h1>
          </div>
          <p className="text-zinc-600 dark:text-zinc-400 ml-12">
            Manage your account and preferences
          </p>
        </div>

        {/* Profile Section */}
        <div className="bg-white dark:bg-zinc-800 rounded-2xl border border-slate-200 dark:border-zinc-700 shadow-lg p-6">
          <div className="flex items-center space-x-3 mb-6">
            <User className="w-5 h-5 text-slate-600 dark:text-zinc-400" />
            <h2 className="text-lg font-semibold text-slate-900 dark:text-zinc-200">
              Profile
            </h2>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-zinc-300 mb-2">
                Display Name
              </label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="w-full px-4 py-3 border border-slate-300 dark:border-zinc-700 rounded-xl bg-white dark:bg-zinc-800/50 text-slate-900 dark:text-zinc-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder="Your display name"
                maxLength={50}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-zinc-300 mb-2">
                Email
              </label>
              <input
                type="email"
                value={user?.email || ""}
                className="w-full px-4 py-3 border border-slate-300 dark:border-zinc-700 rounded-xl bg-slate-50 dark:bg-zinc-800/50 text-slate-500 dark:text-zinc-400"
                disabled
                readOnly
              />
              <p className="text-xs text-slate-500 dark:text-zinc-500 mt-1">
                Email cannot be changed
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-zinc-300 mb-2">
                <Globe className="w-4 h-4 inline mr-1 text-slate-700 dark:text-zinc-300" />
                Preferred Language
              </label>
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="w-full px-4 py-3 border border-slate-300 dark:border-zinc-700 rounded-xl bg-white dark:bg-zinc-800/50 text-slate-900 dark:text-zinc-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              >
                {languages.map((lang) => (
                  <option key={lang.code} value={lang.code}>
                    {lang.flag} {lang.name}
                  </option>
                ))}
              </select>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                Messages will be auto-translated to this language
              </p>
            </div>

            <button
              onClick={handleSaveProfile}
              disabled={isLoading || !displayName.trim()}
              className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-zinc-300 dark:disabled:bg-zinc-600 text-white rounded-xl font-medium transition-colors flex items-center space-x-2"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <span>Save Profile</span>
              )}
            </button>
          </div>
        </div>

        {/* Appearance Section */}
        <div className="bg-white dark:bg-zinc-800 rounded-2xl border border-zinc-200 dark:border-zinc-700 p-6">
          <div className="flex items-center space-x-3 mb-6">
            <Sun className="w-5 h-5 text-zinc-600 dark:text-zinc-400" />
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-white">
              Appearance
            </h2>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-3">
                Theme
              </label>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { id: "light", name: "Light", icon: Sun },
                  { id: "dark", name: "Dark", icon: Moon },
                  { id: "system", name: "System", icon: Monitor },
                ].map(({ id, name, icon: Icon }) => (
                  <button
                    key={id}
                    onClick={() => applyTheme(id)}
                    className={cn(
                      "flex flex-col items-center space-y-2 p-4 border-2 rounded-xl transition-colors",
                      theme === id
                        ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20"
                        : "border-zinc-200 dark:border-zinc-600 hover:border-zinc-300 dark:hover:border-zinc-500"
                    )}
                  >
                    <Icon className="w-5 h-5 text-zinc-600 dark:text-zinc-400" />
                    <span className="text-sm font-medium text-zinc-900 dark:text-white">
                      {name}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-3">
                Message Density
              </label>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { id: "compact", name: "Compact" },
                  { id: "comfortable", name: "Comfortable" },
                ].map(({ id, name }) => (
                  <button
                    key={id}
                    onClick={() => setMessageDensity(id)}
                    className={cn(
                      "flex items-center justify-center p-3 border-2 rounded-xl transition-colors text-sm font-medium",
                      messageDensity === id
                        ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-300"
                        : "border-zinc-200 dark:border-zinc-600 hover:border-zinc-300 dark:hover:border-zinc-500 text-zinc-900 dark:text-white"
                    )}
                  >
                    {name}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Privacy Section */}
        <div className="bg-white dark:bg-zinc-800 rounded-2xl border border-zinc-200 dark:border-zinc-700 p-6">
          <div className="flex items-center space-x-3 mb-6">
            <Shield className="w-5 h-5 text-zinc-600 dark:text-zinc-400" />
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-white">
              Privacy
            </h2>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Eye className="w-4 h-4 text-zinc-600 dark:text-zinc-400" />
                <div>
                  <p className="text-sm font-medium text-zinc-900 dark:text-white">
                    Read Receipts
                  </p>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">
                    Let others see when you've read their messages
                  </p>
                </div>
              </div>
              <button
                onClick={() => setReadReceipts(!readReceipts)}
                className={cn(
                  "relative w-12 h-6 rounded-full transition-colors",
                  readReceipts
                    ? "bg-indigo-500"
                    : "bg-zinc-300 dark:bg-zinc-700"
                )}
              >
                <div
                  className={cn(
                    "absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform",
                    readReceipts ? "translate-x-7" : "translate-x-1"
                  )}
                />
              </button>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <MessageSquare className="w-4 h-4 text-zinc-600 dark:text-zinc-400" />
                <div>
                  <p className="text-sm font-medium text-zinc-900 dark:text-white">
                    Allow Direct Messages
                  </p>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">
                    Let others start conversations with you
                  </p>
                </div>
              </div>
              <button
                onClick={() => setAllowDMs(!allowDMs)}
                className={cn(
                  "relative w-12 h-6 rounded-full transition-colors",
                  allowDMs ? "bg-indigo-500" : "bg-zinc-300 dark:bg-zinc-700"
                )}
              >
                <div
                  className={cn(
                    "absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform",
                    allowDMs ? "translate-x-7" : "translate-x-1"
                  )}
                />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
