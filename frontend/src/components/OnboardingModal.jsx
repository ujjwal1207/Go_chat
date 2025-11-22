import React, { useState } from "react";
import { User, Globe, ArrowRight } from "lucide-react";
import { useAuthStore } from "../store/auth.js";

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

export function OnboardingModal({ isOpen, onComplete }) {
  const { user, updateProfile } = useAuthStore();
  const [displayName, setDisplayName] = useState(
    user?.name || user?.displayName || ""
  );
  const [selectedLanguage, setSelectedLanguage] = useState(
    user?.language || "en"
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!displayName.trim() || isSubmitting) return;

    setIsSubmitting(true);

    try {
      if (user) {
        // Call the API to update the profile
        await updateProfile({
          name: displayName.trim(),
          displayName: displayName.trim(), // Keep both for backwards compatibility
          language: selectedLanguage,
        });
      }

      onComplete();
    } catch (error) {
      console.error("Failed to update profile:", error);
      alert("Failed to update profile. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedLang = languages.find((lang) => lang.code === selectedLanguage);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />

      {/* Modal */}
      <div className="relative w-full max-w-md bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl border border-zinc-200 dark:border-zinc-700 animate-scale-in">
        {/* Header */}
        <div className="p-6 border-b border-zinc-200 dark:border-zinc-700">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-zinc-900 dark:text-white">
                Complete Your Profile
              </h2>
              <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-1">
                Let's personalize your chat experience
              </p>
            </div>
          </div>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Display Name */}
          <div>
            <label className="flex items-center text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-3">
              <User className="w-4 h-4 mr-2" />
              Display Name
            </label>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="w-full px-4 py-3 border border-zinc-300 dark:border-zinc-600 rounded-xl bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              placeholder="How should others see you?"
              maxLength={50}
              required
              disabled={isSubmitting}
            />
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
              This is how you'll appear to other users
            </p>
          </div>

          {/* Language Selection */}
          <div>
            <label className="flex items-center text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-3">
              <Globe className="w-4 h-4 mr-2" />
              Preferred Language
            </label>
            <div className="relative">
              <select
                value={selectedLanguage}
                onChange={(e) => setSelectedLanguage(e.target.value)}
                className="w-full px-4 py-3 border border-zinc-300 dark:border-zinc-600 rounded-xl bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent appearance-none cursor-pointer"
                disabled={isSubmitting}
              >
                {languages.map((lang) => (
                  <option key={lang.code} value={lang.code}>
                    {lang.flag} {lang.name}
                  </option>
                ))}
              </select>
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
                <ArrowRight className="w-4 h-4 text-zinc-400 rotate-90" />
              </div>
            </div>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
              Messages will be auto-translated to this language
            </p>
          </div>

          {/* Actions */}
          <div className="flex space-x-3 pt-4">
            <button
              type="submit"
              disabled={!displayName.trim() || isSubmitting}
              className="flex-1 bg-indigo-500 hover:bg-indigo-600 dark:bg-indigo-600 dark:hover:bg-indigo-500 disabled:bg-zinc-300 dark:disabled:bg-zinc-600 text-white py-3 px-4 rounded-xl font-medium transition-colors flex items-center justify-center space-x-2"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <span>Get Started</span>
                  <ArrowRight className="w-4 h-4 text-white" />
                </>
              )}
            </button>
          </div>
        </form>

        {/* Language Preview */}
        {selectedLang && (
          <div className="px-6 pb-6">
            <div className="bg-zinc-50 dark:bg-zinc-800 rounded-xl p-4 border border-zinc-200 dark:border-zinc-700">
              <div className="flex items-center space-x-3">
                <div className="text-2xl">{selectedLang.flag}</div>
                <div>
                  <p className="text-sm font-medium text-zinc-900 dark:text-white">
                    {selectedLang.name}
                  </p>
                  <p className="text-xs text-zinc-600 dark:text-zinc-400">
                    Auto-translation enabled
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
