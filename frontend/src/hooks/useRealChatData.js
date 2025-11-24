import { useEffect, useState } from 'react'
import { useChatStore } from '../store/chat.js'
import { useAuthStore } from '../store/auth.js'
import { apiService } from '../lib/api.js'

// Dynamic data hook - fetches real conversations and messages from API
export function useRealChatData() {
  const { isAuthenticated, user } = useAuthStore()
  const { setConversations, setMessages, setActiveConversation, conversations } = useChatStore()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!isAuthenticated || !user) {
      // Clear conversations when not authenticated
      setConversations([])
      setActiveConversation(null)
      return
    }

    const fetchConversations = async () => {
      setLoading(true)
      setError(null)

      try {
        // Always try to fetch fresh conversations from API when authenticated
        let apiConversations = []
        try {
          apiConversations = await apiService.getConversations()
          console.debug('Fetching conversations from API...')
        } catch (apiError) {
          console.warn('API not available, using existing conversations:', apiError)
          // Keep existing conversations if API fails
          setLoading(false)
          return
        }

        // Handle loaded conversations
        if (apiConversations.length > 0) {
          console.debug('Loading conversations from API:', apiConversations.length)
          setConversations(apiConversations)
        } else if (conversations.length === 0) {
          // Only show welcome bot if no conversations exist at all
          console.debug('Creating welcome conversation')
          const welcomeConversation = [
            {
              id: '1',
              type: 'dm',
              name: 'Welcome Bot',
              avatar: null,
              lastMessage: `Welcome to RealChat, ${user.name || user.email}!`,
              lastMessageTime: new Date(),
              unreadCount: 1,
              isOnline: true,
              participants: [user.id, 'bot']
            }
          ]
          setConversations(welcomeConversation)
        }

        // Load messages for each conversation
        for (const conversation of apiConversations) {
          try {
            let messages = []
            if (conversation.id === '1' || conversation.type === 'welcome') {
              // Welcome message for new users
              messages = [
                {
                  id: '1',
                  senderId: 'bot',
                  senderName: 'Welcome Bot',
                  content: `Hello ${user.name || user.email}! Welcome to RealChat. This is your personal chat space. Start by creating a new conversation or joining a group!`,
                  timestamp: new Date(),
                  type: 'text',
                  isRead: false
                }
              ]
            } else {
              // Fetch messages from API
              if (conversation.type === 'dm') {
                // For DM conversations, we need to get the other user ID
                const currentUser = useAuthStore.getState().user
                const otherUserId = conversation.participants?.find(id => id !== currentUser?.id)
                if (otherUserId) {
                  messages = await apiService.getDMHistory(otherUserId)
                } else {
                  messages = []
                }
              } else {
                messages = await apiService.getMessages(conversation.id)
              }
            }
            setMessages(conversation.id, messages || [])
          } catch (err) {
            console.warn(`Failed to load messages for conversation ${conversation.id}:`, err)
            setMessages(conversation.id, [])
          }
        }
        
        // Always set first conversation as active when loading from API
        if (apiConversations.length > 0) {
          setActiveConversation(apiConversations[0].id)
        }
      } catch (error) {
        console.error('Failed to fetch conversations:', error)
        setError(error.message)
      } finally {
        setLoading(false)
      }
    }

    fetchConversations()
  }, [isAuthenticated, user?.id, setConversations, setMessages, setActiveConversation])

  return {
    conversations: conversations || [],
    isLoading: loading,
    error
  }
}