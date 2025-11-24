// API service for communicating with Go backend
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000'

class APIError extends Error {
  constructor(message, status, response) {
    super(message)
    this.name = 'APIError'
    this.status = status
    this.response = response
  }
}

class APIService {
  constructor() {
    this.baseURL = API_BASE_URL
    this.token = localStorage.getItem('access_token')
  }

  getToken() {
    return localStorage.getItem('access_token')
  }

  setAuthToken(token) {
    this.token = token
    if (token) {
      localStorage.setItem('access_token', token)
    } else {
      localStorage.removeItem('access_token')
    }
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`
    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    }

    // Add auth token if available (get fresh token from localStorage)
    const token = this.getToken()
    if (token && !config.headers.Authorization) {
      config.headers.Authorization = `Bearer ${token}`
    }

    try {
      const response = await fetch(url, config)
      
      // Handle different response types
      const contentType = response.headers.get('content-type')
      let data
      
      if (contentType && contentType.includes('application/json')) {
        data = await response.json()
      } else {
        data = await response.text()
      }

      if (!response.ok) {
        // Handle 401 Unauthorized - but be selective about when to logout
        if (response.status === 401) {
          console.warn('API call failed with 401:', endpoint)
          // Only logout on critical auth endpoints, not on general API failures
          if (endpoint === '/me' || endpoint.includes('/auth/')) {
            console.warn('Critical auth endpoint failed - clearing tokens')
            this.logout()
          } else {
            console.warn('Non-critical API endpoint failed - keeping session')
          }
        }
        
        throw new APIError(
          data.message || data || `HTTP ${response.status}`,
          response.status,
          data
        )
      }

      return data
    } catch (error) {
      if (error instanceof APIError) {
        throw error
      }
      
      // Network or other errors
      throw new APIError(
        'Network error: ' + error.message,
        0,
        null
      )
    }
  }

  // GET request
  async get(endpoint, params = {}) {
    const searchParams = new URLSearchParams()
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        searchParams.append(key, value.toString())
      }
    })
    
    const queryString = searchParams.toString()
    const url = queryString ? `${endpoint}?${queryString}` : endpoint
    
    return this.request(url, { method: 'GET' })
  }

  // POST request
  async post(endpoint, body = null) {
    return this.request(endpoint, {
      method: 'POST',
      body: body ? JSON.stringify(body) : null,
    })
  }

  // PUT request
  async put(endpoint, body = null) {
    return this.request(endpoint, {
      method: 'PUT',
      body: body ? JSON.stringify(body) : null,
    })
  }

  // DELETE request
  async delete(endpoint) {
    return this.request(endpoint, { method: 'DELETE' })
  }

  // Authentication methods
  async requestOTP(email) {
    return this.post('/auth/request-otp', { email })
  }

  async verifyOTP(email, code, name) {
    const response = await this.post('/auth/verify-otp', { 
      email, 
      code,
      name 
    })
    
    // Store tokens
    if (response.access_token) {
      this.setAuthToken(response.access_token)
      localStorage.setItem('refresh_token', response.refresh_token)
      localStorage.setItem('user_id', response.user_id)
    }
    
    return response
  }

  async getMe() {
    return this.get('/me')
  }

  async updateMe(updates) {
    return this.put('/me', updates)
  }

  // Message history methods
  async getDMHistory(otherUserId, limit = 50, offset = 0) {
    try {
      const rawMessages = await this.get('/messages/dm', {
        user_id: otherUserId,
        limit,
        offset
      })
      // Handle null or undefined response
      if (!rawMessages || !Array.isArray(rawMessages)) {
        console.warn('API returned invalid DM messages data:', rawMessages)
        return []
      }
      // Transform API response to frontend format and reverse to chronological order
      const transformedMessages = rawMessages
        .filter(msg => msg && typeof msg === 'object') // Filter out null/invalid messages
        .map(msg => ({
          id: msg._id,
          senderId: msg.sender_id,
          // prefer server-provided sender_name or display_name when available
          senderName: msg.sender_name || msg.sender_display_name || msg.sender_id,
          content: msg.content,
          timestamp: new Date(msg.created_at),
          type: (msg.files && msg.files.some(f => /\.(mp3|wav|webm|ogg|m4a)$/i.test(f))) ? 'voice' : 'text',
          isRead: false,
          files: msg.files || [],
          contentLang: msg.content_lang,
          // reply metadata (server may return resolved display names)
          replyTo: msg.reply_to || null,
          replyText: msg.reply_text || null,
          replySender: msg.reply_sender || null,
        }))
      // Reverse to show oldest first
      return transformedMessages.reverse()
    } catch (error) {
      console.warn('API DM messages not available:', error)
      return []
    }
  }

  async getGroupHistory(groupId, limit = 50, offset = 0) {
    return this.get('/messages/group', {
      group_id: groupId,
      limit,
      offset
    })
  }

  // Presence methods
  async getPresence() {
    return this.get('/presence')
  }

  async getUserPresence(userId) {
    return this.get(`/presence/${userId}`)
  }

  // Get user's conversations
  async getConversations() {
    try {
      console.debug('Fetching conversations from API...')
      const conversations = await this.request('/conversations')
      console.debug('Loaded conversations count:', conversations && conversations.length)
      return conversations
    } catch (error) {
      console.warn('❌ API conversations not available:', error)
      return []
    }
  }

  // Get messages for a conversation
  async getMessages(conversationId) {
    try {
      const rawMessages = await this.get(`/messages/group?group_id=${conversationId}&limit=100`)
      // Handle null or undefined response
      if (!rawMessages || !Array.isArray(rawMessages)) {
        console.warn('API returned invalid messages data:', rawMessages)
        return []
      }
      // Transform API response to frontend format and reverse to chronological order
      const transformedMessages = rawMessages
        .filter(msg => msg && typeof msg === 'object') // Filter out null/invalid messages
        .map(msg => ({
          id: msg._id,
          senderId: msg.sender_id,
          senderName: msg.sender_name || msg.sender_display_name || msg.sender_id,
          content: msg.content,
          timestamp: new Date(msg.created_at),
          type: (msg.files && msg.files.some(f => /\.(mp3|wav|webm|ogg|m4a)$/i.test(f))) ? 'voice' : 'text',
          isRead: false,
          files: msg.files || [],
          contentLang: msg.content_lang,
          replyTo: msg.reply_to || null,
          replyText: msg.reply_text || null,
          replySender: msg.reply_sender || null,
        }))
      // Reverse to show oldest first
      return transformedMessages.reverse()
    } catch (error) {
      console.warn('API messages not available:', error)
      return []
    }
  }

  // Search users by email or name
  async searchUsers(query) {
    try {
      return await this.get(`/users/search?q=${encodeURIComponent(query)}`)
    } catch (error) {
      console.warn('User search API not available:', error)
      throw error
    }
  }

  // Create or get direct message conversation
  async createDMConversation(userEmail) {
    try {
      const token = this.getToken()
      console.debug('API: Creating DM request for email:', userEmail)
      return await this.post('/conversations/dm', { userEmail })
    } catch (error) {
      console.warn('Create DM API not available:', error)
      throw error
    }
  }

  // Delete a conversation
  async deleteConversation(conversationId) {
    try {
      console.debug('Deleting conversation:', conversationId)
      await this.delete(`/conversations/${conversationId}`)
      console.debug('Conversation deleted successfully')
    } catch (error) {
      console.warn('❌ Failed to delete conversation:', error)
      throw error
    }
  }

  // Health check
  async healthCheck() {
    return this.get('/')
  }

  // Clear all auth data
  logout() {
    this.setAuthToken(null)
    localStorage.removeItem('refresh_token')
    localStorage.removeItem('user_id')
  }
}

// Create singleton instance
export const apiService = new APIService()

// Export class for testing
export { APIService, APIError }