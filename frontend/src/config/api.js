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
  CHAT_MESSAGE: '/api/chat/message',
  CHAT_HEALTH: '/api/chat/health',

  // File upload endpoints
  FILES_UPLOAD: '/api/files/upload',
  FILES_LIST: '/api/files',
  FILE_SUMMARY: (fileId) => `/api/files/${fileId}/summary`,

  // Export endpoints
  EXPORT_PDF: '/api/export/pdf',
  EXPORT_OPPORTUNITY_PDF: '/api/export/opportunity-pdf',
  EXPORT_EXCEL: '/api/export/excel',
  EXPORT_JSON: '/api/export/json',

  // Compare endpoint
  COMPARE: '/api/compare',

  // Reports (archival) endpoints
  REPORTS_LIST: '/api/reports',
  REPORTS_FOR_DRUG: (drugName) => `/api/reports/drug/${encodeURIComponent(drugName)}`,
  REPORT_DOWNLOAD: (reportId) => `/api/reports/${reportId}/download`,
  REPORT_DELETE: (reportId) => `/api/reports/${reportId}`,

  // Conversation history endpoints
  CONVERSATIONS_LIST: '/api/chat/conversations',
  CONVERSATION_GET: (id) => `/api/chat/conversations/${id}`,
  CONVERSATION_DELETE: (id) => `/api/chat/conversations/${id}`,

  // Auth endpoints
  AUTH_REGISTER: '/api/auth/register',
  AUTH_LOGIN: '/api/auth/login',
  AUTH_ME: '/api/auth/me',
  AUTH_STATUS: '/api/auth/status',
  AUTH_CHANGE_PASSWORD: '/api/auth/change-password',

  // Integration endpoints
  INTEGRATIONS: '/api/integrations',
  INTEGRATIONS_ENABLED: '/api/integrations/enabled',
  INTEGRATION_ENABLE: (id) => `/api/integrations/${id}/enable`,
  INTEGRATION_DISABLE: (id) => `/api/integrations/${id}/disable`,
  INTEGRATION_CONFIGURE: (id) => `/api/integrations/${id}/configure`,
  INTEGRATION_TEST: (id) => `/api/integrations/${id}/test`,

  // Health check
  HEALTH: '/health',
};

// WebSocket endpoint
export const getWebSocketUrl = (sessionId) => {
  return `${WS_URL}/${sessionId}`;
};

// Request timeout (ms) - increased for multi-agent search operations with 15 agents
export const API_TIMEOUT = 600000; // 600 seconds (10 minutes)

// Retry configuration
export const RETRY_CONFIG = {
  maxRetries: 3,
  retryDelay: 1000, // 1 second
  retryableStatuses: [408, 429, 500, 502, 503, 504],
};
