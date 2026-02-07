/**
 * Global State Management
 * Using Zustand for lightweight state management with persistence
 */

import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';

/**
 * Main application store
 */
export const useAppStore = create(
  devtools(
    persist(
      (set, get) => ({
        // ===================
        // User State
        // ===================
        user: null,
        setUser: (user) => set({ user }),
        clearUser: () => set({ user: null }),

        // ===================
        // Search State
        // ===================
        searchResults: null,
        isSearching: false,
        searchError: null,
        sessionId: null,
        drugName: '',

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

        // ===================
        // Search History (Persisted)
        // ===================
        searchHistory: [],

        addToHistory: (search) =>
          set((state) => {
            // Avoid duplicates (by drug name within 1 hour)
            const exists = state.searchHistory.some(
              (s) =>
                s.drugName.toLowerCase() === search.drugName.toLowerCase() &&
                Date.now() - new Date(s.timestamp).getTime() < 3600000
            );
            if (exists) return state;

            return {
              searchHistory: [search, ...state.searchHistory.slice(0, 49)], // Keep last 50
            };
          }),

        clearHistory: () => set({ searchHistory: [] }),

        deleteFromHistory: (drugName, timestamp) =>
          set((state) => ({
            searchHistory: state.searchHistory.filter(
              (s) => !(s.drugName === drugName && s.timestamp === timestamp)
            ),
          })),

        // ===================
        // Saved Opportunities (Persisted)
        // ===================
        savedOpportunities: [],

        saveOpportunity: (opportunity) =>
          set((state) => ({
            savedOpportunities: [opportunity, ...state.savedOpportunities],
          })),

        removeOpportunity: (id) =>
          set((state) => ({
            savedOpportunities: state.savedOpportunities.filter((o) => o.id !== id),
          })),

        clearSavedOpportunities: () => set({ savedOpportunities: [] }),

        // ===================
        // UI State
        // ===================
        sidebarCollapsed: false,
        toggleSidebar: () =>
          set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),

        activeTab: 'opportunities',
        setActiveTab: (tab) => set({ activeTab: tab }),

        selectedIndication: null,
        setSelectedIndication: (indication) =>
          set({ selectedIndication: indication }),

        // ===================
        // Chat State
        // ===================
        chatMessages: [],
        isChatOpen: false,

        addChatMessage: (message) =>
          set((state) => ({
            chatMessages: [...state.chatMessages, message],
          })),

        clearChatMessages: () => set({ chatMessages: [] }),

        setIsChatOpen: (isOpen) => set({ isChatOpen: isOpen }),

        // ===================
        // Cache State
        // ===================
        cacheStats: null,
        setCacheStats: (stats) => set({ cacheStats: stats }),

        // ===================
        // Integrations State
        // ===================
        integrations: [],
        integrationsLoading: false,
        integrationsError: null,

        setIntegrations: (integrations) =>
          set({ integrations, integrationsLoading: false, integrationsError: null }),

        setIntegrationsLoading: (loading) =>
          set({ integrationsLoading: loading }),

        setIntegrationsError: (error) =>
          set({ integrationsError: error, integrationsLoading: false }),

        updateIntegrationStatus: (integrationId, enabled) =>
          set((state) => ({
            integrations: state.integrations.map((int) =>
              int.id === integrationId ? { ...int, enabled, status: enabled ? 'active' : 'inactive' } : int
            ),
          })),

        updateIntegrationConfig: (integrationId, config) =>
          set((state) => ({
            integrations: state.integrations.map((int) =>
              int.id === integrationId
                ? { ...int, configured: true, api_key_set: !!config.api_key }
                : int
            ),
          })),

        // ===================
        // Reset Functions
        // ===================
        resetSearch: () =>
          set({
            searchResults: null,
            isSearching: false,
            searchError: null,
            sessionId: null,
            drugName: '',
            chatMessages: [],
            isChatOpen: false,
            activeTab: 'opportunities',
            selectedIndication: null,
          }),

        reset: () =>
          set({
            searchResults: null,
            isSearching: false,
            searchError: null,
            sessionId: null,
            drugName: '',
            chatMessages: [],
            isChatOpen: false,
            activeTab: 'opportunities',
            selectedIndication: null,
            cacheStats: null,
            integrations: [],
            integrationsLoading: false,
            integrationsError: null,
          }),
      }),
      {
        name: 'repurpose-ai-storage',
        // Only persist these fields
        partialize: (state) => ({
          user: state.user,
          searchHistory: state.searchHistory,
          savedOpportunities: state.savedOpportunities,
          sidebarCollapsed: state.sidebarCollapsed,
        }),
      }
    ),
    {
      name: 'drug-repurposing-store',
    }
  )
);

export default useAppStore;
