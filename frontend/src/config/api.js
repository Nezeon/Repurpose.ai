/**
 * API Configuration
 * Central configuration for API endpoints and WebSocket URLs
 */

// Get base URLs from environment variables or use defaults
export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
export const WS_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:8000/ws';

// API endpoints
export const ENDPOINTS = {
  // Search endpoints
  SEARCH: '/api/search',
  SEARCH_STATUS: (sessionId) => `/api/search/status/${sessionId}`,
  CACHE_STATS: '/api/search/cache/stats',
  CLEAR_CACHE: '/api/search/cache/clear',
  CLEAR_DRUG_CACHE: (drugName) => `/api/search/cache/${drugName}`,

  // Chat endpoints
  CHAT: '/api/chat',
  CHAT_HEALTH: '/api/chat/health',

  // Export endpoints
  EXPORT_PDF: '/api/export/pdf',
  EXPORT_JSON: '/api/export/json',

  // Auth endpoints
  AUTH_REGISTER: '/api/auth/register',
  AUTH_LOGIN: '/api/auth/login',
  AUTH_ME: '/api/auth/me',
  AUTH_STATUS: '/api/auth/status',
  AUTH_CHANGE_PASSWORD: '/api/auth/change-password',

  // Health check
  HEALTH: '/health',
};

// WebSocket endpoint
export const getWebSocketUrl = (sessionId) => {
  return `${WS_URL}/${sessionId}`;
};

// Request timeout (ms)
export const API_TIMEOUT = 60000; // 60 seconds

// Retry configuration
export const RETRY_CONFIG = {
  maxRetries: 3,
  retryDelay: 1000, // 1 second
  retryableStatuses: [408, 429, 500, 502, 503, 504],
};
