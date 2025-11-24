import React from "react";
import { Languages, Eye } from "lucide-react";
import { Play, Pause, Volume2 } from "lucide-react";
import { cn } from "../lib/utils.js";
import { useAuthStore } from "../store/auth.js";

export function MessageBubble({
  message,
  isOwn,
  showAvatar,
  onTranslateToggle,
  onReply,
  conversationName,
  conversationType,
}) {
  const [showOriginal, setShowOriginal] = React.useState(false);

  const { user } = useAuthStore();

  const getReplyLabel = () => {
    const raw = message.replySender || "";
    if (!raw) return null;
    // If the server already provided a display name matching current user
    if (user && (raw === user.id || raw === user.displayName)) return "you";
    // For DM conversations, show the conversation name for the other person
    if (conversationType === "dm") return conversationName || raw;
    // If replySender looks like an ObjectID hex and we don't have mapping, show truncated
    if (/^[0-9a-fA-F]{24}$/.test(raw)) {
      return raw.slice(0, 6) + "...";
    }
    return raw;
  };

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
          {/* Quoted / Reply preview */}
          {message.replyText && (
            <div className="mb-2 p-2 bg-white/10 rounded-md border-l-2 border-slate-300 dark:border-zinc-700">
              <div className="text-xs text-slate-300 truncate">
                <strong className="text-xs text-slate-200 mr-1">{getReplyLabel() || 'Unknown'}</strong>
                {message.replyText}
              </div>
            </div>
          )}

          {/* Display text content if present */}
          {displayContent.trim() && <p className="text-sm">{displayContent}</p>}

          {/* Display attached files */}
          {message.files && message.files.length > 0 && (
            <div className="mt-2 space-y-1">
              {message.files.map((fileUrl, index) => {
                const isImage = fileUrl.match(/\.(jpg|jpeg|png|gif|webp)$/i)
                const isAudio = fileUrl.match(/\.(mp3|wav|webm|ogg|m4a)$/i)
                if (isImage) {
                  return (
                    <div key={index} className="flex items-center space-x-2">
                      <img
                        src={fileUrl}
                        alt={`Attachment ${index + 1}`}
                        className="max-w-48 max-h-48 rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
                        onClick={() => window.open(fileUrl, '_blank')}
                      />
                    </div>
                  )
                }

                if (isAudio) {
                  return (
                    <div key={index} className="flex items-center space-x-2 w-full">
                      <InlineAudioPlayer src={fileUrl} isOwn={isOwn} />
                    </div>
                  )
                }

                return (
                  <div key={index} className="flex items-center space-x-2">
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
                  </div>
                )
              })}
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
            </div>
              <div className="ml-1">
                <button
                  onClick={() => onReply && onReply(message)}
                  className="p-1 text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white rounded-full hover:bg-slate-100 dark:hover:bg-zinc-700 transition-colors"
                  title="Reply"
                >
                  ↩
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

function InlineAudioPlayer({ src, isOwn }) {
  const [playing, setPlaying] = React.useState(false)
  const [duration, setDuration] = React.useState(0)
  const [current, setCurrent] = React.useState(0)
  const audioRef = React.useRef(null)

  React.useEffect(() => {
    const a = new Audio(src)
    audioRef.current = a
    const onLoaded = () => setDuration(a.duration || 0)
    const onTime = () => setCurrent(a.currentTime || 0)
    const onEnd = () => setPlaying(false)
    a.addEventListener('loadedmetadata', onLoaded)
    a.addEventListener('timeupdate', onTime)
    a.addEventListener('ended', onEnd)
    return () => {
      a.pause()
      a.removeEventListener('loadedmetadata', onLoaded)
      a.removeEventListener('timeupdate', onTime)
      a.removeEventListener('ended', onEnd)
      audioRef.current = null
    }
  }, [src])

  const toggle = async () => {
    const a = audioRef.current
    if (!a) return
    if (playing) {
      a.pause()
      setPlaying(false)
    } else {
      try {
        await a.play()
        setPlaying(true)
      } catch (e) {
        console.error('Playback failed', e)
      }
    }
  }

  const seek = (e) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const x = e.clientX - rect.left
    const pct = Math.max(0, Math.min(1, x / rect.width))
    const a = audioRef.current
    if (!a) return
    a.currentTime = pct * duration
    setCurrent(a.currentTime)
  }

  const fmt = (t) => {
    if (!t || isNaN(t)) return '0:00'
    const m = Math.floor(t / 60)
    const s = Math.floor(t % 60)
    return `${m}:${s.toString().padStart(2, '0')}`
  }

  return (
    <div className={cn('flex items-center space-x-3 p-2 rounded-lg', isOwn ? 'bg-indigo-600/20' : 'bg-white/5')} style={{minWidth: 220}}>
      <button onClick={toggle} className="p-2 rounded-full bg-transparent border border-transparent hover:border-white/20">
        {playing ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
      </button>
      <div className="flex-1">
        <div className="w-full h-2 bg-zinc-700 rounded-md cursor-pointer" onClick={seek}>
          <div className="h-2 bg-indigo-400 rounded-md" style={{width: duration ? `${(current/duration)*100}%` : '0%'}} />
        </div>
        <div className="flex justify-between text-xs mt-1 text-zinc-400">
          <span>{fmt(current)}</span>
          <span>{fmt(duration)}</span>
        </div>
      </div>
      <div className="ml-2 text-zinc-400"><Volume2 className="w-4 h-4" /></div>
    </div>
  )
}
