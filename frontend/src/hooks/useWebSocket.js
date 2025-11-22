import { useEffect, useRef, useState } from 'react'
import { useAuthStore } from '../store/auth.js'
import { useChatStore } from '../store/chat.js'
import { apiService } from '../lib/api.js'

export function useWebSocket() {
  const wsRef = useRef(null)
  const [connectionStatus, setConnectionStatus] = useState('disconnected')
  const { user, isAuthenticated, token } = useAuthStore()
  const { addMessage, addTypingUser, removeTypingUser, markAsRead, conversations } = useChatStore()
  const reconnectTimeoutRef = useRef(null)
  const reconnectAttemptsRef = useRef(0)

  const connect = () => {
    if (!isAuthenticated || !user || !token) return
    
    // Don't connect if already connected or connecting
    if (wsRef.current && (wsRef.current.readyState === WebSocket.OPEN || wsRef.current.readyState === WebSocket.CONNECTING)) {
      return
    }

    // Connect to real Go WebSocket server
    const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000'
    // Use secure WebSocket (wss) when backend is https
    const proto = baseUrl.startsWith('https') ? 'wss' : 'ws'
    const host = baseUrl.replace('http://', '').replace('https://', '')
    const wsUrl = `${proto}://${host}/ws?token=${token}&lang=en`
    
    try {
      setConnectionStatus('connecting')
      
      const ws = new WebSocket(wsUrl)
      
      ws.onopen = () => {
        console.log('WebSocket connected')
        setConnectionStatus('connected')
        reconnectAttemptsRef.current = 0
        wsRef.current = ws
      }
      
      ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data)
          handleIncomingMessage(message)
        } catch (error) {
          console.error('Failed to parse WebSocket message:', error)
        }
      }
      
      ws.onclose = (event) => {
        console.log('WebSocket closed:', event.code, event.reason)
        wsRef.current = null
        
        // Check for authentication-related failures
        const isAuthFailure = event.code === 1008 || // Policy violation (auth)
                             event.code === 4001 || // Custom auth failure
                             (event.reason && event.reason.toLowerCase().includes('auth'))
        
        if (isAuthFailure) {
          console.warn('WebSocket closed due to authentication failure - not reconnecting')
          setConnectionStatus('auth_failed')
          reconnectAttemptsRef.current = 10 // Prevent reconnection
          return
        }
        
        if (event.code !== 1000) { // Not a normal closure
          setConnectionStatus('disconnected')
          scheduleReconnect()
        } else {
          setConnectionStatus('disconnected')
        }
      }
      
      ws.onerror = (error) => {
        console.error('WebSocket error:', error)
        setConnectionStatus('error')
      }

    } catch (error) {
      console.error('WebSocket connection failed:', error)
      setConnectionStatus('error')
      scheduleReconnect()
    }
  }

  const handleIncomingMessage = async (message) => {
    console.log('Received WebSocket message:', message)
    
    switch (message.type) {
      case 'message':
        // Handle incoming chat message
        const chatMessage = {
          id: Date.now().toString() + Math.random(),
          content: message.text,
          senderId: message.from_user,
          senderName: message.from_user, // TODO: Get actual name
          timestamp: new Date().toISOString(),
          type: 'text',
          files: message.files || []
        }
        
        // Determine conversation ID based on chat type
        let conversationId
        if (message.chat_type === 'dm') {
          // For DMs, find the conversation that includes both users
          const conversations = useChatStore.getState().conversations
          const dmConversation = conversations.find(conv => 
            conv.type === 'dm' && 
            conv.participants && 
            conv.participants.includes(message.from_user)
          )
          conversationId = dmConversation?.id
          console.log('🔍 Looking for DM conversation with:', message.from_user)
          console.log('📋 Available conversations:', conversations.map(c => ({id: c.id, type: c.type, participants: c.participants})))
          console.log('✅ Found DM conversation:', conversationId)
        } else if (message.chat_type === 'group') {
          conversationId = message.group_id
        }
        
        if (conversationId) {
          console.log('📨 Adding message to conversation:', conversationId)
          addMessage(conversationId, chatMessage)
        } else {
          console.warn('❌ No conversation found for message:', message)
        }
        break
        
      case 'group_created':
        // Handle group creation notification
        console.log('Group created:', message)
        // Refetch conversations to include the new group
        try {
          const updatedConversations = await apiService.getConversations()
          useChatStore.getState().setConversations(updatedConversations)
          console.log('✅ Refetched conversations after group creation:', updatedConversations.length)
        } catch (error) {
          console.error('❌ Failed to refetch conversations after group creation:', error)
        }
        break
        
      case 'joined_group':
        // Handle group join notification
        console.log('Joined group:', message)
        break
        
      case 'error':
        console.error('WebSocket error message:', message.error)
        break
        
      default:
        console.log('Unknown message type:', message.type)
    }
  }

  const disconnect = () => {
    if (wsRef.current) {
      wsRef.current.close(1000, 'Manual disconnect')
    }
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current)
    }
    wsRef.current = null
    setConnectionStatus('disconnected')
  }

  const scheduleReconnect = () => {
    // Don't reconnect if user is no longer authenticated
    if (!isAuthenticated || !user) {
      console.log('User no longer authenticated - stopping reconnection')
      setConnectionStatus('disconnected')
      return
    }
    
    if (reconnectAttemptsRef.current >= 5) {
      console.log('Max reconnection attempts reached')
      setConnectionStatus('failed')
      return
    }

    const delay = Math.min(1000 * Math.pow(2, reconnectAttemptsRef.current), 30000)
    reconnectAttemptsRef.current += 1
    
    console.log(`Scheduling WebSocket reconnection attempt ${reconnectAttemptsRef.current} in ${delay}ms`)
    setConnectionStatus('reconnecting')
    reconnectTimeoutRef.current = setTimeout(connect, delay)
  }

  const sendMessage = (conversationId, message) => {
    if (connectionStatus !== 'connected' || !wsRef.current) {
      console.warn('Cannot send message: not connected')
      return false
    }

    // Find conversation to determine chat type and target
    const conversation = conversations.find(c => c.id === conversationId)
    if (!conversation) {
      console.error('Conversation not found:', conversationId)
      return false
    }

    // Prepare WebSocket message based on conversation type
    let wsMessage
    if (conversation.type === 'dm') {
      // Find the other user's ID from participants (exclude current user)
      const currentUser = useAuthStore.getState().user
      const otherUserId = conversation.participants?.find(id => id !== currentUser?.id)
      
      if (!otherUserId) {
        console.error('❌ Could not find other user in DM conversation:', conversation)
        return false
      }
      
      console.log('📤 Sending DM to user:', otherUserId, 'in conversation:', conversationId)
      
      wsMessage = {
        type: 'send_message',
        chat_type: 'dm',
        to_user: otherUserId, // Use the actual other user's ID, not conversation ID
        conversation_id: conversationId, // Add conversation ID for consistency
        text: message.text,
        source_lang: 'en'
      }
      if (message.files && message.files.length > 0) {
        wsMessage.files = message.files
      }
    } else if (conversation.type === 'group') {
      wsMessage = {
        type: 'send_message',
        chat_type: 'group',
        group_id: conversationId,
        conversation_id: conversationId, // Add for consistency
        text: message.text,
        source_lang: 'en'
      }
      if (message.files && message.files.length > 0) {
        wsMessage.files = message.files
      }
    } else {
      console.error('Unknown conversation type:', conversation.type)
      return false
    }

    // Add message optimistically to UI
    const messageWithId = {
      ...message,
      id: Date.now().toString() + Math.random(),
      senderId: user.id,
      senderName: user.displayName,
      timestamp: new Date().toISOString(),
      status: 'sending'
    }
    
    addMessage(conversationId, messageWithId)

    // Send to server
    try {
      wsRef.current.send(JSON.stringify(wsMessage))
      console.log('Sent WebSocket message:', wsMessage)
      return true
    } catch (error) {
      console.error('Failed to send WebSocket message:', error)
      return false
    }
  }

  const sendTypingIndicator = (conversationId, isTyping) => {
    if (connectionStatus !== 'connected' || !wsRef.current) return

    // TODO: Implement typing indicators in backend
    console.log(`Typing indicator: ${isTyping ? 'start' : 'stop'} typing in ${conversationId}`)
  }

  const createGroup = (name, members) => {
    if (connectionStatus !== 'connected' || !wsRef.current) {
      console.warn('Cannot create group: not connected')
      return false
    }

    const wsMessage = {
      type: 'create_group',
      name: name,
      members: members
    }

    try {
      wsRef.current.send(JSON.stringify(wsMessage))
      console.log('Sent group creation request:', wsMessage)
      return true
    } catch (error) {
      console.error('Failed to create group:', error)
      return false
    }
  }

  // Connect when authenticated
  useEffect(() => {
    if (isAuthenticated && user && user.email && token) {
      // Only connect if we're not already connected/connecting
      const currentState = wsRef.current?.readyState
      if (!wsRef.current || currentState === WebSocket.CLOSED || currentState === WebSocket.CLOSING) {
        console.log('Initiating WebSocket connection for user:', user.email)
        connect()
      } else {
        console.log('WebSocket already connected/connecting, skipping')
      }
    } else {
      console.log('WebSocket disconnect - auth state:', { isAuthenticated, hasUser: !!user, hasToken: !!token })
      disconnect()
    }

    return () => {
      disconnect()
    }
  }, [isAuthenticated, user?.id, !!token]) // Use user.id and token presence as more stable dependencies

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      disconnect()
    }
  }, [])

  return {
    connectionStatus,
    sendMessage,
    sendTypingIndicator,
    createGroup,
    connect,
    disconnect
  }
}