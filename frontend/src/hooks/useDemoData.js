import { useRealChatData } from './useRealChatData.js'

// Export the real chat data hook as the demo data hook for backward compatibility
export const useDemoData = useRealChatData

// Also export useRealChatData for explicit usage
export { useRealChatData } from './useRealChatData.js'