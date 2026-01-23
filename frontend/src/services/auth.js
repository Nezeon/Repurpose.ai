/**
 * Authentication Service
 * Handles user registration, login, and session management
 */

import api from './api';
import { ENDPOINTS } from '../config/api';

// Token storage keys
const TOKEN_KEY = 'repurpose_ai_token';
const USER_KEY = 'repurpose_ai_user';

/**
 * Register a new user
 * @param {object} userData - { username, email, password, full_name }
 * @returns {Promise<object>} Created user data
 */
export const register = async (userData) => {
  const response = await api.post(ENDPOINTS.AUTH_REGISTER, userData);
  return response.data;
};

/**
 * Login user and store token
 * @param {string} username - Username or email
 * @param {string} password - Password
 * @returns {Promise<object>} Token data
 */
export const login = async (username, password) => {
  const response = await api.post(ENDPOINTS.AUTH_LOGIN, { username, password });
  const { access_token, expires_in } = response.data;

  // Store token
  localStorage.setItem(TOKEN_KEY, access_token);

  // Get and store user info
  const user = await getCurrentUser();
  localStorage.setItem(USER_KEY, JSON.stringify(user));

  return response.data;
};

/**
 * Logout user and clear stored data
 */
export const logout = () => {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
};

/**
 * Get stored authentication token
 * @returns {string|null} Access token
 */
export const getToken = () => {
  return localStorage.getItem(TOKEN_KEY);
};

/**
 * Get stored user data
 * @returns {object|null} User data
 */
export const getStoredUser = () => {
  const user = localStorage.getItem(USER_KEY);
  return user ? JSON.parse(user) : null;
};

/**
 * Check if user is authenticated
 * @returns {boolean} True if authenticated
 */
export const isAuthenticated = () => {
  return !!getToken();
};

/**
 * Get current user info from API
 * @returns {Promise<object>} User data
 */
export const getCurrentUser = async () => {
  const response = await api.get(ENDPOINTS.AUTH_ME);
  return response.data;
};

/**
 * Check authentication status
 * @returns {Promise<object>} Auth status { authenticated, user }
 */
export const checkAuthStatus = async () => {
  try {
    const response = await api.get(ENDPOINTS.AUTH_STATUS);
    return response.data;
  } catch (error) {
    return { authenticated: false, user: null };
  }
};

/**
 * Change password
 * @param {string} currentPassword - Current password
 * @param {string} newPassword - New password
 * @returns {Promise<object>} Success message
 */
export const changePassword = async (currentPassword, newPassword) => {
  const response = await api.post(ENDPOINTS.AUTH_CHANGE_PASSWORD, {
    current_password: currentPassword,
    new_password: newPassword,
  });
  return response.data;
};

/**
 * Add auth token to API requests
 */
export const setupAuthInterceptor = () => {
  api.interceptors.request.use(
    (config) => {
      const token = getToken();
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    },
    (error) => {
      return Promise.reject(error);
    }
  );

  // Handle 401 responses
  api.interceptors.response.use(
    (response) => response,
    (error) => {
      if (error.response?.status === 401) {
        // Token expired or invalid
        logout();
        window.dispatchEvent(new CustomEvent('auth:logout'));
      }
      return Promise.reject(error);
    }
  );
};

// Set up interceptors on load
setupAuthInterceptor();

export default {
  register,
  login,
  logout,
  getToken,
  getStoredUser,
  isAuthenticated,
  getCurrentUser,
  checkAuthStatus,
  changePassword,
};
