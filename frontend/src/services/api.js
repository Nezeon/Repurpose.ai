/**
 * API Service
 * Axios-based HTTP client for backend API communication
 */

import axios from 'axios';
import { API_BASE_URL, ENDPOINTS, API_TIMEOUT } from '../config/api';

// Create axios instance with default configuration
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: API_TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor for logging/auth
api.interceptors.request.use(
  (config) => {
    console.log(`[API] ${config.method.toUpperCase()} ${config.url}`);
    return config;
  },
  (error) => {
    console.error('[API] Request error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => {
    console.log(`[API] Response from ${response.config.url}:`, response.status);
    return response;
  },
  async (error) => {
    // Handle blob responses (like PDF export errors)
    if (error.response?.data instanceof Blob) {
      try {
        const text = await error.response.data.text();
        const json = JSON.parse(text);
        console.error('[API] Response error:', json);
        return Promise.reject(new Error(json.detail || 'An error occurred'));
      } catch {
        console.error('[API] Response error:', error.message);
        return Promise.reject(new Error('An error occurred'));
      }
    }

    console.error('[API] Response error:', error.response?.data || error.message);

    // Format error message
    const errorMessage = error.response?.data?.detail || error.message || 'An error occurred';

    return Promise.reject(new Error(errorMessage));
  }
);

// API Methods

/**
 * Search for drug repurposing opportunities
 * @param {string} drugName - Name of the drug to search
 * @param {object} options - Additional search options
 * @returns {Promise<object>} Search results
 */
export const searchDrug = async (drugName, options = {}) => {
  const {
    context = {},
    sessionId = null,
    forceRefresh = false,
  } = options;

  const response = await api.post(ENDPOINTS.SEARCH, {
    drug_name: drugName,
    context,
    session_id: sessionId,
    force_refresh: forceRefresh,
  });

  return response.data;
};

/**
 * Get cache statistics
 * @returns {Promise<object>} Cache stats
 */
export const getCacheStats = async () => {
  const response = await api.get(ENDPOINTS.CACHE_STATS);
  return response.data;
};

/**
 * Clear all cache
 * @returns {Promise<object>} Confirmation
 */
export const clearCache = async () => {
  const response = await api.delete(ENDPOINTS.CLEAR_CACHE);
  return response.data;
};

/**
 * Clear cache for specific drug
 * @param {string} drugName - Drug name to clear
 * @returns {Promise<object>} Confirmation
 */
export const clearDrugCache = async (drugName) => {
  const response = await api.delete(ENDPOINTS.CLEAR_DRUG_CACHE(drugName));
  return response.data;
};

/**
 * Send chat message
 * @param {string} question - User's question
 * @param {object} context - Search context
 * @returns {Promise<object>} Chat response
 */
export const sendChatMessage = async (question, context = {}) => {
  const {
    drugName = '',
    indications = [],
    evidenceSummary = '',
  } = context;

  const response = await api.post(ENDPOINTS.CHAT, {
    question,
    drug_name: drugName,
    indications,
    evidence_summary: evidenceSummary,
  });

  return response.data;
};

/**
 * Check chat service health
 * @returns {Promise<object>} Health status
 */
export const getChatHealth = async () => {
  const response = await api.get(ENDPOINTS.CHAT_HEALTH);
  return response.data;
};

/**
 * Export results as PDF
 * @param {object} searchResults - Search results to export
 * @returns {Promise<Blob>} PDF file blob
 */
export const exportPDF = async (searchResults) => {
  const response = await api.post(ENDPOINTS.EXPORT_PDF, searchResults, {
    responseType: 'blob',
  });

  return response.data;
};

/**
 * Export results as JSON
 * @param {object} searchResults - Search results to export
 * @returns {Promise<object>} JSON export data
 */
export const exportJSON = async (searchResults) => {
  const response = await api.post(ENDPOINTS.EXPORT_JSON, searchResults);
  return response.data;
};

/**
 * Check API health
 * @returns {Promise<object>} Health status
 */
export const checkHealth = async () => {
  const response = await api.get(ENDPOINTS.HEALTH);
  return response.data;
};

// Export axios instance for direct use if needed
export default api;
