import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export const useChatStore = create(
  persist(
    (set, get) => ({
      conversations: [],
      activeConversationId: null,
      messages: {},
      typingUsers: {},
  
  setConversations: (conversations) => set({ conversations }),
  setActiveConversation: (activeConversationId) => set({ activeConversationId }),
  
  addMessage: (conversationId, message) => set((state) => ({
    messages: {
      ...state.messages,
      [conversationId]: [...(state.messages[conversationId] || []), message]
    }
  })),
  
  updateMessage: (conversationId, messageId, updates) => set((state) => ({
    messages: {
      ...state.messages,
      [conversationId]: state.messages[conversationId]?.map(msg =>
        msg.id === messageId ? { ...msg, ...updates } : msg
      ) || []
    }
  })),
  
  setMessages: (conversationId, messages) => set((state) => ({
    messages: {
      ...state.messages,
      [conversationId]: messages
    }
  })),

  // Add a new conversation
  addConversation: (conversation) => set((state) => ({
    conversations: [conversation, ...state.conversations]
  })),

  // Remove a conversation
  removeConversation: (conversationId) => set((state) => {
    const newConversations = state.conversations.filter(conv => conv.id !== conversationId);
    const newMessages = { ...state.messages };
    delete newMessages[conversationId];
    
    // If the removed conversation was active, set active to first available or null
    let newActiveId = state.activeConversationId;
    if (state.activeConversationId === conversationId) {
      newActiveId = newConversations.length > 0 ? newConversations[0].id : null;
    }
    
    return {
      conversations: newConversations,
      messages: newMessages,
      activeConversationId: newActiveId
    };
  }),

  // Add user to existing conversation (for groups)
  addUserToConversation: (conversationId, user) => set((state) => ({
    conversations: state.conversations.map(conv =>
      conv.id === conversationId
        ? { ...conv, participants: [...conv.participants, user] }
        : conv
    )
  })),
  
  addTypingUser: (conversationId, userId) => set((state) => ({
    typingUsers: {
      ...state.typingUsers,
      [conversationId]: [...(state.typingUsers[conversationId] || []), userId]
    }
  })),
  
  removeTypingUser: (conversationId, userId) => set((state) => ({
    typingUsers: {
      ...state.typingUsers,
      [conversationId]: (state.typingUsers[conversationId] || []).filter(id => id !== userId)
    }
  })),
  
  markAsRead: (conversationId, messageId, userId) => set((state) => ({
    messages: {
      ...state.messages,
      [conversationId]: state.messages[conversationId]?.map(msg =>
        msg.id === messageId 
          ? { ...msg, readBy: [...(msg.readBy || []), userId] }
          : msg
      ) || []
    }
  }))
}),
{
  name: 'realchat-conversations',
  partialize: (state) => ({
    conversations: state.conversations,
    messages: state.messages,
    activeConversationId: state.activeConversationId
  })
}
))