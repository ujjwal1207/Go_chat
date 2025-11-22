import { cn } from "../lib/utils.js";

export function StatusDot({ status, className, showTooltip = false }) {
  const getStatusColor = () => {
    switch (status) {
      case "online":
      case "connected":
        return "bg-emerald-500";
      case "away":
      case "connecting":
        return "bg-amber-400";
      case "offline":
      case "disconnected":
        return "bg-slate-400 dark:bg-zinc-500";
      default:
        return "bg-slate-400 dark:bg-zinc-500";
    }
  };

  const getStatusText = () => {
    switch (status) {
      case "online":
        return "Active now";
      case "connected":
        return "Connected";
      case "away":
        return "Away";
      case "connecting":
        return "Reconnecting...";
      case "offline":
        return "Offline";
      case "disconnected":
        return "Disconnected";
      default:
        return "Unknown";
    }
  };

  const isAnimated = status === "connecting";

  return (
    <div className="relative group">
      <div
        className={cn(
          "w-2 h-2 rounded-full",
          getStatusColor(),
          isAnimated && "animate-pulse",
          className
        )}
      />
      {showTooltip && (
        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-1 px-2 py-1 text-xs text-white bg-zinc-900 dark:bg-zinc-700 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10">
          {getStatusText()}
        </div>
      )}
    </div>
  );
}
