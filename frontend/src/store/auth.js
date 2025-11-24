import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { useChatStore } from './chat.js'
import { apiService } from '../lib/api.js'

export const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      refreshToken: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      // Initialize auth state from stored token
      initializeAuth: async () => {
        const token = localStorage.getItem('access_token')
        const userId = localStorage.getItem('user_id')
        
        console.debug('Auth init - token present:', !!token, 'userId:', userId)
        
        if (!token || !userId) {
          // No stored credentials - ensure clean state
          console.debug('No stored credentials found - clearing auth state')
          get().logout()
          return
        }
        
        try {
          apiService.setAuthToken(token)
          const userDetails = await apiService.getMe()
          
          console.debug('User details from /me endpoint:', userDetails)
          
          const user = {
            id: userId,
            email: userDetails.email,
            name: userDetails.name,
            displayName: userDetails.display_name,
            language: userDetails.language,
            locale: userDetails.locale,
            isVerified: userDetails.is_verified
          }
          
          console.debug('Setting user in store:', user)
          
          set({ 
            isAuthenticated: true, 
            user: user,
            token: token
          })
        } catch (error) {
          console.error('Failed to initialize auth - tokens may be expired:', error)
          
          // If authentication fails (401, expired tokens, etc.), clear everything
          if (error.status === 401) {
            console.debug('Invalid/expired tokens detected - forcing logout')
            get().logout()
            return
          }
          
          // For non-auth errors, try fallback but be more cautious
          const storedEmail = localStorage.getItem('user_email')
          if (storedEmail && error.status !== 401) {
            console.debug('Network error - using fallback user data from localStorage')
            const user = {
              id: userId,
              email: storedEmail,
              name: storedEmail.split('@')[0], 
              isVerified: true
            }
            
            set({ 
              isAuthenticated: true, 
              user: user,
              token: token
            })
          } else {
            // Clear everything for safety
            console.debug('No fallback possible - clearing auth state')
            get().logout()
          }
        }
      },

      requestOTP: async (email) => {
        set({ isLoading: true, error: null })
        try {
          const response = await apiService.requestOTP(email)
          set({ isLoading: false })
          return response
        } catch (error) {
          set({ isLoading: false, error: error.message })
          throw new Error(error.message || 'Failed to send OTP')
        }
      },

      verifyOTP: async (email, code, displayName) => {
        set({ isLoading: true, error: null })
        try {
          const response = await apiService.verifyOTP(email, code, displayName)
          
          // Try to get user details from /me endpoint, fallback to provided email
          let userDetails = null
          try {
            userDetails = await apiService.getMe()
          } catch (meError) {
            console.warn('Failed to fetch user details from /me endpoint:', meError)
          }
          
          const user = {
            id: response.user_id,
            email: userDetails?.email || email, // Use provided email as fallback
            name: userDetails?.name || displayName,
            isVerified: true
          }
          
          // Store tokens and additional data for fallback
          apiService.setAuthToken(response.access_token)
          localStorage.setItem('user_id', response.user_id)
          localStorage.setItem('user_email', email)
          localStorage.setItem('refresh_token', response.refresh_token)
          
          set({ 
            isAuthenticated: true, 
            user: user,
            token: response.access_token,
            refreshToken: response.refresh_token,
            isLoading: false
          })
          
          return user
        } catch (error) {
          set({ isLoading: false, error: error.message })
          throw new Error(error.message || 'Invalid OTP code')
        }
      },

      updateProfile: async (updates) => {
        console.debug('Updating user profile with:', updates)
        
        try {
          // Update the backend first
          const response = await apiService.updateMe(updates)
          console.debug('Profile updated on backend:', response)
          
          // Then update local state
          set(state => {
            const updatedUser = state.user ? { ...state.user, ...updates } : null
            console.debug('Updated user object:', updatedUser)
            return { user: updatedUser }
          })
        } catch (error) {
          console.error('Failed to update profile:', error)
          throw error
        }
      },
      
      setTokens: (token, refreshToken) => set({ token, refreshToken }),
      setError: (error) => set({ error }),
      setLoading: (isLoading) => set({ isLoading }),
      clearError: () => set({ error: null }),
      
      logout: () => {
        // Clear all localStorage items
        localStorage.removeItem('access_token')
        localStorage.removeItem('refresh_token') 
        localStorage.removeItem('user_id')
        localStorage.removeItem('user_email')
        localStorage.removeItem('realchat-conversations') // Clear persisted chat data
        
        apiService.logout()
        set({ 
          user: null, 
          token: null, 
          refreshToken: null, 
          isAuthenticated: false,
          error: null 
        })
        
        // Clear chat store data
        try {
          const { useChatStore } = require('./chat.js')
          useChatStore.getState().setConversations([])
          useChatStore.getState().setActiveConversation(null)
        } catch (e) {
          // Ignore if chat store not available
        }
        
        console.debug('Logged out - all tokens and data cleared')
      },

      // Force logout to get fresh tokens
      forceLogout: () => {
        console.debug('🔄 Force logout - clearing all data to get fresh tokens')
        localStorage.clear()
        sessionStorage.clear()
        apiService.logout()
        set({ 
          user: null, 
          token: null, 
          refreshToken: null, 
          isAuthenticated: false,
          error: null 
        })
        
        // Reload page to ensure clean state
        setTimeout(() => {
          window.location.reload()
        }, 100)
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({ 
        user: state.user,
        token: state.token,
        refreshToken: state.refreshToken,
        isAuthenticated: state.isAuthenticated
      }),
      onRehydrateStorage: () => (state) => {
        // Initialize auth when store is rehydrated
        if (state?.initializeAuth) {
          state.initializeAuth()
        }
      }
    }
  )
)