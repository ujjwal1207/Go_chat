import React, { useState, useRef } from "react";
import { Send, Smile, Paperclip, Image, X } from "lucide-react";
import { cn } from "../lib/utils.js";
import { useAuthStore } from "../store/auth.js";

const EMOJI_LIST = [
  "😀",
  "😃",
  "😄",
  "😁",
  "😅",
  "😂",
  "🤣",
  "😊",
  "😇",
  "🙂",
  "🙃",
  "😉",
  "😌",
  "😍",
  "🥰",
  "😘",
  "😗",
  "😙",
  "😚",
  "😋",
  "😛",
  "😝",
  "😜",
  "🤪",
  "🤨",
  "🧐",
  "🤓",
  "😎",
  "🥸",
  "🤩",
  "🥳",
  "😏",
  "😒",
  "😞",
  "😔",
  "😟",
  "😕",
  "🙁",
  "☹️",
  "😣",
  "😖",
  "😫",
  "😩",
  "🥺",
  "😢",
  "😭",
  "😤",
  "😠",
  "😡",
  "🤬",
];

export function MessageInput({
  value,
  onChange,
  onSend,
  placeholder = "Type a message...",
  disabled = false,
  onFileSelect,
  reply,
  onCancelReply,
}) {
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [attachedFiles, setAttachedFiles] = useState([]);
  const textareaRef = useRef(null);
  const fileInputRef = useRef(null);
  const { user } = useAuthStore();
  const [isRecording, setIsRecording] = useState(false);
  const [recordStart, setRecordStart] = useState(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);

  const computeReplyLabel = (r) => {
    if (!r) return 'Unknown'
    // Prefer explicit sender name
    if (r.senderName) return r.senderName
    const raw = r.replySender || ''
    if (!raw) return 'Unknown'
    if (user && (raw === user.id || raw === user.displayName)) return 'you'
    if (/^[0-9a-fA-F]{24}$/.test(raw)) return raw.slice(0, 6) + '...'
    return raw
  }

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleSend = () => {
    if ((!value.trim() && attachedFiles.length === 0) || disabled) return;

    const payload = {
      text: value.trim(),
      files: attachedFiles.map((f) => f.url),
    };

    if (reply) {
      payload.replyTo = reply.id || reply.messageId || null;
      payload.replyText = reply.content || reply.text || reply.replyText || "";
      payload.replySender = reply.senderId || reply.senderName || reply.replySender || "";
    }

    onSend(payload);

    setAttachedFiles([]);
    setShowEmojiPicker(false);
    if (onCancelReply) onCancelReply();
  };

  // Recording helpers
  const startRecording = async () => {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      alert('Recording not supported in this browser')
      return
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mimeType = MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : (MediaRecorder.isTypeSupported('audio/ogg') ? 'audio/ogg' : 'audio/mpeg')
      const mr = new MediaRecorder(stream, { mimeType })
      audioChunksRef.current = []
      mr.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) audioChunksRef.current.push(e.data)
      }
      mr.onstop = async () => {
        try {
          const blob = new Blob(audioChunksRef.current, { type: mr.mimeType || 'audio/webm' })
          const fileName = `voicenote_${Date.now()}.${blob.type.includes('ogg') ? 'ogg' : (blob.type.includes('mpeg') || blob.type.includes('mp3') ? 'mp3' : 'webm')}`
          const file = new File([blob], fileName, { type: blob.type })

          // upload
          const formData = new FormData()
          formData.append('file', file)
          const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000'
          const resp = await fetch(`${baseUrl}/upload`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
            },
            body: formData,
          })
          if (!resp.ok) {
            const text = await resp.text().catch(() => '')
            console.error('Upload response body:', text)
            throw new Error('Upload failed: ' + text)
          }
          const result = await resp.json()

          // auto-send voice note message
          onSend({
            text: '',
            files: [result.url],
            type: 'voice'
          })
        } catch (error) {
          console.error('Voice upload failed', error)
          alert('Failed to upload voice note')
        }
      }

      mediaRecorderRef.current = mr
      mr.start()
      setIsRecording(true)
      setRecordStart(Date.now())
    } catch (err) {
      console.error('Failed to start recording', err)
      alert('Could not start audio recording')
    }
  }

  const stopRecording = () => {
    try {
      mediaRecorderRef.current?.stop()
      // stop all tracks
      mediaRecorderRef.current?.stream?.getTracks?.().forEach(t => t.stop && t.stop())
    } catch (e) {
      console.warn('Error stopping recorder', e)
    }
    setIsRecording(false)
    setRecordStart(null)
  }

  const handleEmojiClick = (emoji) => {
    const textarea = textareaRef.current;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const newValue = value.slice(0, start) + emoji + value.slice(end);

    onChange(newValue);

    // Restore cursor position
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + emoji.length, start + emoji.length);
    }, 0);
  };

  const handleFileChange = async (e) => {
    const files = Array.from(e.target.files);
    
    for (const file of files) {
      try {
        const formData = new FormData();
        formData.append('file', file);
        
        const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000'
        const response = await fetch(`${baseUrl}/upload`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
          },
          body: formData,
        });
        
        if (!response.ok) {
          throw new Error('Upload failed');
        }
        
        const uploadResult = await response.json();
        
        const newFile = {
          id: Date.now() + Math.random(),
          file,
          name: file.name,
          size: file.size,
          type: file.type,
          url: uploadResult.url,
          preview: file.type.startsWith("image/")
            ? URL.createObjectURL(file)
            : null,
        };

        setAttachedFiles((prev) => [...prev, newFile]);
        if (onFileSelect) onFileSelect([...attachedFiles, newFile]);
      } catch (error) {
        console.error('Failed to upload file:', error);
        alert('Failed to upload file. Please try again.');
      }
    }
    
    // Clear the input
    e.target.value = '';
  };

  const removeFile = (fileId) => {
    setAttachedFiles((prev) => {
      const updated = prev.filter((f) => f.id !== fileId);
      if (onFileSelect) onFileSelect(updated);
      return updated;
    });
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  return (
    <div className="relative">
      {/* File Attachments */}
      {attachedFiles.length > 0 && (
        <div className="mx-4 mb-3 p-3 bg-white dark:bg-zinc-800 rounded-2xl border border-slate-200 dark:border-zinc-700 shadow-sm">
          <div className="flex flex-wrap gap-2">
            {attachedFiles.map((file) => (
              <div
                key={file.id}
                className="flex items-center space-x-2 bg-slate-50 dark:bg-zinc-700 rounded-xl p-3 border border-slate-200 dark:border-zinc-600"
              >
                {file.preview ? (
                  <img
                    src={file.preview}
                    alt={file.name}
                    className="w-8 h-8 rounded object-cover"
                  />
                ) : (
                  <div className="w-8 h-8 bg-slate-100 dark:bg-zinc-700 rounded flex items-center justify-center text-slate-500 dark:text-zinc-300">
                    <Paperclip className="w-4 h-4" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-900 dark:text-white truncate">
                    {file.name}
                  </p>
                  <p className="text-xs text-slate-500">
                    {formatFileSize(file.size)}
                  </p>
                </div>
                <button
                  onClick={() => removeFile(file.id)}
                  className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-zinc-300"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Emoji Picker */}
      {showEmojiPicker && (
        <div className="absolute bottom-full left-4 right-4 mb-2 bg-white dark:bg-zinc-800 rounded-lg shadow-lg border border-slate-200 dark:border-zinc-700 p-4 z-50">
          <div className="grid grid-cols-10 gap-2 max-h-32 overflow-y-auto">
            {EMOJI_LIST.map((emoji) => (
              <button
                key={emoji}
                onClick={() => handleEmojiClick(emoji)}
                className="w-8 h-8 flex items-center justify-center text-lg hover:bg-slate-100 dark:hover:bg-zinc-700 rounded transition-colors"
              >
                {emoji}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input Area */}
      {/* Reply preview */}
      {reply && (
        <div className="mx-4 mb-2 p-3 bg-white/5 dark:bg-zinc-800 rounded-2xl border border-slate-200 dark:border-zinc-700">
          <div className="flex items-start justify-between">
            <div className="text-xs text-slate-300">
              <strong className="mr-2">Replying to {computeReplyLabel(reply)}</strong>
              <span className="text-xs opacity-80 truncate block">{reply.content || reply.text || reply.replyText}</span>
            </div>
            <button onClick={() => onCancelReply && onCancelReply()} className="text-slate-400 hover:text-slate-600 ml-2">✕</button>
          </div>
        </div>
      )}

      {/* Main Input */}
      <div className="p-4 bg-white dark:bg-zinc-900 border-t border-slate-200 dark:border-zinc-700">
        <div className="flex items-end space-x-3 p-3 bg-white dark:bg-zinc-900/70 backdrop-blur-md rounded-3xl border border-slate-200 dark:border-zinc-700 shadow-sm hover:shadow-md transition-shadow">
          {/* Attachment Button */}
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={disabled}
            className={cn(
              "p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-700 dark:bg-zinc-700 dark:hover:bg-zinc-800 dark:text-zinc-400 dark:hover:text-indigo-400 rounded-xl transition-all duration-200",
              disabled && "opacity-50 cursor-not-allowed"
            )}
            title="Attach file"
          >
            <Paperclip className="w-5 h-5" />
          </button>

          {/* Voice record button */}
          <button
            onClick={() => { if (isRecording) stopRecording(); else startRecording() }}
            disabled={disabled}
            className={cn(
              "p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-700 dark:bg-zinc-700 dark:hover:bg-zinc-800 dark:text-zinc-400 dark:hover:text-indigo-400 rounded-xl transition-all duration-200",
              disabled && "opacity-50 cursor-not-allowed",
              isRecording && "ring-2 ring-red-400"
            )}
            title={isRecording ? "Stop recording" : "Record voice note"}
          >
            <span className={cn("w-4 h-4 rounded-full inline-block", isRecording ? 'bg-red-500' : 'bg-slate-500')} />
          </button>

          {/* Emoji Button */}
          <button
            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
            disabled={disabled}
            className={cn(
              "p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-700 dark:bg-zinc-700 dark:hover:bg-zinc-800 dark:text-zinc-400 dark:hover:text-indigo-400 rounded-xl transition-all duration-200",
              disabled && "opacity-50 cursor-not-allowed",
              showEmojiPicker && "ring-2 ring-indigo-300"
            )}
            title="Add emoji"
          >
            <Smile className="w-5 h-5" />
          </button>

          {/* Text Input */}
          <div className="flex-1">
            <textarea
              ref={textareaRef}
              value={value}
              onChange={(e) => onChange(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={`${placeholder} (Shift + Enter for new line)`}
              disabled={disabled}
              rows={1}
              className={cn(
                "w-full resize-none border-0 px-0 py-2 text-sm bg-transparent text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none",
                "scrollbar-thin scrollbar-track-transparent scrollbar-thumb-slate-300 dark:scrollbar-thumb-zinc-600",
                disabled && "opacity-50 cursor-not-allowed"
              )}
              style={{
                minHeight: "40px",
                maxHeight: "120px",
                height: "auto",
              }}
              onInput={(e) => {
                e.target.style.height = "auto";
                e.target.style.height =
                  Math.min(e.target.scrollHeight, 120) + "px";
              }}
            />
          </div>

          {/* Send Button */}
          <button
            onClick={handleSend}
            disabled={(!value.trim() && attachedFiles.length === 0) || disabled}
            className={cn(
              "p-3 rounded-2xl font-medium transition-all duration-200 transform",
              (!value.trim() && attachedFiles.length === 0) || disabled
                ? "text-slate-400 bg-slate-100 dark:bg-zinc-700 cursor-not-allowed"
                : "text-white bg-indigo-500 hover:bg-indigo-600 shadow-md hover:shadow-lg hover:scale-105 active:scale-95"
            )}
            title="Send message"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.txt"
        onChange={handleFileChange}
        className="hidden"
      />
    </div>
  );
}
