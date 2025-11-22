import React from "react";
import { Languages, Globe } from "lucide-react";
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

export function TranslationToggle({
  autoTranslate,
  targetLanguage,
  onToggle,
  onLanguageChange,
}) {
  const [isOpen, setIsOpen] = React.useState(false);
  const { user } = useAuthStore();

  const currentLanguage = languages.find(
    (lang) => lang.code === (targetLanguage || user?.language || "en")
  );

  return (
    <div className="relative">
      <div className="flex items-center space-x-2">
        <button
          onClick={onToggle}
          className={cn(
            "flex items-center space-x-2 px-3 py-1.5 rounded-full text-sm font-medium transition-colors",
            autoTranslate
              ? "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300"
              : "bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700"
          )}
        >
          <Languages className={cn("w-4 h-4", autoTranslate ? "text-emerald-700 dark:text-emerald-300" : "text-zinc-600 dark:text-zinc-400")} />
          <span>{autoTranslate ? "Auto-translate" : "Translation off"}</span>
        </button>

        {autoTranslate && (
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="flex items-center space-x-1 px-2 py-1 bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded-lg transition-colors"
          >
            <span className="text-sm">{currentLanguage?.flag}</span>
            <span className="text-xs font-medium">
              {currentLanguage?.code.toUpperCase()}
            </span>
          </button>
        )}
      </div>

      {/* Language Dropdown */}
      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute top-full left-0 mt-1 w-48 bg-white dark:bg-zinc-800 rounded-lg shadow-lg border border-zinc-200 dark:border-zinc-700 z-50 max-h-64 overflow-y-auto">
            <div className="p-2">
              <div className="text-xs font-medium text-zinc-500 dark:text-zinc-400 px-2 py-1">
                Translate to:
              </div>
              {languages.map((language) => (
                <button
                  key={language.code}
                  onClick={() => {
                    onLanguageChange(language.code);
                    setIsOpen(false);
                  }}
                  className={cn(
                    "w-full flex items-center space-x-3 px-2 py-2 text-sm rounded-md transition-colors text-left",
                    currentLanguage?.code === language.code
                      ? "bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300"
                      : "text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-700"
                  )}
                >
                  <span className="text-base">{language.flag}</span>
                  <span>{language.name}</span>
                  {currentLanguage?.code === language.code && (
                    <div className="ml-auto w-2 h-2 bg-indigo-600 rounded-full" />
                  )}
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
