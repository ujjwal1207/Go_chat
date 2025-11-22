import React from "react";
import { Languages, Eye } from "lucide-react";
import { cn } from "../lib/utils.js";

export function MessageBubble({
  message,
  isOwn,
  showAvatar,
  onTranslateToggle,
}) {
  const [showOriginal, setShowOriginal] = React.useState(false);

  const displayContent = showOriginal
    ? (message.content || message.text || "")
    : (message.translatedContent || message.content || message.text || "");
  const isTranslated = message.translatedContent && !showOriginal;

  const handleToggleOriginal = () => {
    setShowOriginal(!showOriginal);
  };

  return (
    <div
      className={cn(
        "flex space-x-3 group",
        isOwn ? "justify-end" : "justify-start"
      )}
    >
      {!isOwn && (
        <div className="flex-shrink-0">
          {showAvatar ? (
            <div className="w-8 h-8 bg-slate-200 dark:bg-zinc-700 rounded-full flex items-center justify-center">
              <span className="text-xs font-medium text-slate-600 dark:text-zinc-300">
                {message.senderName
                  .split(" ")
                  .map((n) => n[0])
                  .join("")}
              </span>
            </div>
          ) : (
            <div className="w-8 h-8" />
          )}
        </div>
      )}

      <div className={cn("max-w-xs lg:max-w-md", isOwn && "order-2")}>
        <div
          className={cn(
            "px-4 py-2 rounded-2xl relative",
            isOwn
              ? "bg-indigo-500 text-white shadow-[0_1px_3px_rgba(99,102,241,0.25)] hover:bg-indigo-600"
              : "bg-zinc-800 text-zinc-200 shadow-sm",
            message.isPending && "opacity-60"
          )}
        >
          {/* Display text content if present */}
          {displayContent.trim() && <p className="text-sm">{displayContent}</p>}

          {/* Display attached files */}
          {message.files && message.files.length > 0 && (
            <div className="mt-2 space-y-1">
              {message.files.map((fileUrl, index) => (
                <div key={index} className="flex items-center space-x-2">
                  {fileUrl.match(/\.(jpg|jpeg|png|gif|webp)$/i) ? (
                    <img
                      src={fileUrl}
                      alt={`Attachment ${index + 1}`}
                      className="max-w-48 max-h-48 rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
                      onClick={() => window.open(fileUrl, '_blank')}
                    />
                  ) : (
                    <a
                      href={fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center space-x-2 p-2 bg-slate-100 dark:bg-zinc-700 rounded-lg hover:bg-slate-200 dark:hover:bg-zinc-600 transition-colors"
                    >
                      <div className="w-8 h-8 bg-slate-200 dark:bg-zinc-600 rounded flex items-center justify-center">
                        📎
                      </div>
                      <span className="text-sm text-slate-700 dark:text-zinc-300">
                        {fileUrl.split('/').pop()}
                      </span>
                    </a>
                  )}
                </div>
              ))}
            </div>
          )}
          {isTranslated && message.originalLanguage && (
            <div className="flex items-center space-x-1 mt-1">
              <Languages className="w-3 h-3 opacity-60" />
              <span className="text-xs opacity-60">
                {message.originalLanguage.toUpperCase()} →{" "}
                {message.targetLanguage?.toUpperCase()}
              </span>
            </div>
          )}

          {/* Message actions on hover */}
          <div
            className={cn(
              "absolute top-1 opacity-0 group-hover:opacity-100 transition-opacity z-10",
              isOwn ? "-left-10" : "-right-10"
            )}
          >
            <div className="flex items-center space-x-1 bg-white dark:bg-zinc-800 rounded-full shadow-md p-1">
              {message.translatedContent && (
                <button
                  onClick={handleToggleOriginal}
                  className="p-1 text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white rounded-full hover:bg-slate-100 dark:hover:bg-zinc-700 transition-colors"
                  title={showOriginal ? "Show translated" : "Show original"}
                >
                  <Eye className="w-3 h-3 text-slate-600 dark:text-zinc-400" />
                </button>
              )}
              <button
                className="p-1 text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white rounded-full hover:bg-slate-100 dark:hover:bg-zinc-700 transition-colors"
                title="React"
              >
                😀
              </button>
            </div>
          </div>
        </div>

        {/* Translation toggle */}
        {message.translatedContent && (
          <div
            className={cn(
              "flex items-center space-x-2 mt-1 px-1",
              isOwn ? "justify-end" : "justify-start"
            )}
          >
            <button
              onClick={handleToggleOriginal}
              className="text-xs text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300 flex items-center space-x-1"
            >
              <Languages className="w-3 h-3 text-zinc-500 dark:text-zinc-400" />
              <span>{showOriginal ? "Show translated" : "Show original"}</span>
            </button>
          </div>
        )}

        <div
          className={cn(
            "flex items-center space-x-2 mt-1 px-1",
            isOwn ? "justify-end" : "justify-start"
          )}
        >
          <span className="text-xs text-zinc-500 dark:text-zinc-400">
            {(() => {
              try {
                const timestamp = message.timestamp || new Date();
                const date = timestamp instanceof Date 
                  ? timestamp 
                  : new Date(timestamp);
                if (isNaN(date.getTime())) {
                  return "Invalid time";
                }
                return new Intl.DateTimeFormat("en-US", {
                  hour: "numeric",
                  minute: "2-digit",
                  hour12: true,
                }).format(date);
              } catch (error) {
                return "Invalid time";
              }
            })()}
          </span>
          {isOwn && (
            <div className="flex space-x-1">
              <div className="w-1 h-1 bg-zinc-400 rounded-full" />
              <div className="w-1 h-1 bg-zinc-400 rounded-full" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
