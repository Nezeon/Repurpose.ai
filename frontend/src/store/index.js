/**
 * Global State Management
 * Using Zustand for lightweight state management
 */

import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

/**
 * Main application store
 */
export const useAppStore = create(
  devtools(
    (set, get) => ({
      // Search state
      searchResults: null,
      isSearching: false,
      searchError: null,
      sessionId: null,
      drugName: '',

      // Cache state
      cacheStats: null,

      // Chat state
      chatMessages: [],
      isChatOpen: false,

      // UI state
      activeTab: 'overview', // 'overview', 'evidence', 'sources', 'chat'
      selectedIndication: null,

      // Actions
      setSearchResults: (results) =>
        set({ searchResults: results, searchError: null }),

      setIsSearching: (isSearching) =>
        set({ isSearching }),

      setSearchError: (error) =>
        set({ searchError: error, isSearching: false }),

      setSessionId: (sessionId) =>
        set({ sessionId }),

      setDrugName: (drugName) =>
        set({ drugName }),

      setCacheStats: (stats) =>
        set({ cacheStats: stats }),

      addChatMessage: (message) =>
        set((state) => ({
          chatMessages: [...state.chatMessages, message],
        })),

      clearChatMessages: () =>
        set({ chatMessages: [] }),

      setIsChatOpen: (isOpen) =>
        set({ isChatOpen: isOpen }),

      setActiveTab: (tab) =>
        set({ activeTab: tab }),

      setSelectedIndication: (indication) =>
        set({ selectedIndication: indication }),

      // Reset all state
      reset: () =>
        set({
          searchResults: null,
          isSearching: false,
          searchError: null,
          sessionId: null,
          drugName: '',
          chatMessages: [],
          isChatOpen: false,
          activeTab: 'overview',
          selectedIndication: null,
        }),
    }),
    {
      name: 'drug-repurposing-store',
    }
  )
);

export default useAppStore;
