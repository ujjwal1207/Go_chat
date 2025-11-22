import { clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs) {
  return twMerge(clsx(inputs))
}

export function maskEmail(email) {
  const [local, domain] = email.split('@')
  if (local.length <= 3) {
    return `${local[0]}***@${domain}`
  }
  return `${local.slice(0, 3)}***@${domain}`
}

export function formatTime(date) {
  return new Intl.DateTimeFormat('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  }).format(date)
}

export function formatDate(date) {
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const messageDate = new Date(date.getFullYear(), date.getMonth(), date.getDate())
  
  const daysDiff = Math.floor((today.getTime() - messageDate.getTime()) / (1000 * 60 * 60 * 24))
  
  if (daysDiff === 0) return 'Today'
  if (daysDiff === 1) return 'Yesterday'
  if (daysDiff < 7) return date.toLocaleDateString('en-US', { weekday: 'long' })
  
  return date.toLocaleDateString('en-US', { 
    month: 'short', 
    day: 'numeric',
    year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
  })
}