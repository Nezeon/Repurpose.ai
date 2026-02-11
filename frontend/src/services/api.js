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
 * Compare 2-3 drugs using cached pipeline results
 * @param {Array<string>} drugNames - Array of 2-3 drug names
 * @returns {Promise<object>} Comparison data with scores, overlapping indications, etc.
 */
export const compareDrugs = async (drugNames) => {
  const response = await api.post(ENDPOINTS.COMPARE, {
    drug_names: drugNames,
  });
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
 * Export a single opportunity as PDF
 * @param {string} drugName - Drug name
 * @param {object} opportunity - Opportunity data
 * @param {Array} evidenceItems - Evidence items for this indication
 * @param {object} enhancedOpportunity - Enhanced data (comparisons, market, science)
 * @returns {Promise<Blob>} PDF file blob
 */
export const exportOpportunityPDF = async (drugName, opportunity, evidenceItems, enhancedOpportunity) => {
  const response = await api.post(ENDPOINTS.EXPORT_OPPORTUNITY_PDF, {
    drug_name: drugName,
    opportunity,
    evidence_items: evidenceItems,
    enhanced_opportunity: enhancedOpportunity,
  }, {
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

// Integration API Methods

/**
 * Get all available integrations
 * @returns {Promise<Array>} List of all integrations with status
 */
export const getIntegrations = async () => {
  const response = await api.get(ENDPOINTS.INTEGRATIONS);
  return response.data;
};

/**
 * Get list of enabled integration IDs
 * @returns {Promise<Array>} List of enabled integration IDs
 */
export const getEnabledIntegrations = async () => {
  const response = await api.get(ENDPOINTS.INTEGRATIONS_ENABLED);
  return response.data;
};

/**
 * Enable an integration
 * @param {string} integrationId - Integration ID to enable
 * @returns {Promise<object>} Result
 */
export const enableIntegration = async (integrationId) => {
  const response = await api.post(ENDPOINTS.INTEGRATION_ENABLE(integrationId));
  return response.data;
};

/**
 * Disable an integration
 * @param {string} integrationId - Integration ID to disable
 * @returns {Promise<object>} Result
 */
export const disableIntegration = async (integrationId) => {
  const response = await api.post(ENDPOINTS.INTEGRATION_DISABLE(integrationId));
  return response.data;
};

/**
 * Configure an integration (set API key, custom settings)
 * @param {string} integrationId - Integration ID
 * @param {object} config - Configuration object with api_key, custom_settings
 * @returns {Promise<object>} Result
 */
export const configureIntegration = async (integrationId, config) => {
  const response = await api.put(ENDPOINTS.INTEGRATION_CONFIGURE(integrationId), config);
  return response.data;
};

/**
 * Test an integration connection
 * @param {string} integrationId - Integration ID to test
 * @returns {Promise<object>} Test result with success status and message
 */
export const testIntegration = async (integrationId) => {
  const response = await api.post(ENDPOINTS.INTEGRATION_TEST(integrationId));
  return response.data;
};

// Report Archive Methods

/**
 * Get list of archived reports
 * @param {number} limit - Max reports to return
 * @returns {Promise<object>} { total, reports }
 */
export const getArchivedReports = async (limit = 50) => {
  const response = await api.get(`${ENDPOINTS.REPORTS_LIST}?limit=${limit}`);
  return response.data;
};

/**
 * Download an archived report
 * @param {string} reportId - Report ID
 * @returns {Promise<Blob>} File blob
 */
export const downloadArchivedReport = async (reportId) => {
  const response = await api.get(ENDPOINTS.REPORT_DOWNLOAD(reportId), {
    responseType: 'blob',
  });
  return response.data;
};

/**
 * Delete an archived report
 * @param {string} reportId - Report ID
 * @returns {Promise<object>} Confirmation
 */
export const deleteArchivedReport = async (reportId) => {
  const response = await api.delete(ENDPOINTS.REPORT_DELETE(reportId));
  return response.data;
};

/**
 * Export results as Excel
 * @param {object} searchResults - Search results to export
 * @returns {Promise<Blob>} Excel file blob
 */
export const exportExcel = async (searchResults) => {
  const response = await api.post(ENDPOINTS.EXPORT_EXCEL, searchResults, {
    responseType: 'blob',
  });
  return response.data;
};

// Conversation History Methods

/**
 * Get list of saved conversations
 * @param {number} limit - Max conversations
 * @returns {Promise<object>} { total, conversations }
 */
export const getConversations = async (limit = 50) => {
  const response = await api.get(`${ENDPOINTS.CONVERSATIONS_LIST}?limit=${limit}`);
  return response.data;
};

/**
 * Get full conversation by ID
 * @param {string} conversationId - Conversation ID
 * @returns {Promise<object>} Conversation with messages
 */
export const getConversation = async (conversationId) => {
  const response = await api.get(ENDPOINTS.CONVERSATION_GET(conversationId));
  return response.data;
};

/**
 * Delete a conversation
 * @param {string} conversationId - Conversation ID
 * @returns {Promise<object>} Confirmation
 */
export const deleteConversation = async (conversationId) => {
  const response = await api.delete(ENDPOINTS.CONVERSATION_DELETE(conversationId));
  return response.data;
};

// Export axios instance for direct use if needed
export default api;
