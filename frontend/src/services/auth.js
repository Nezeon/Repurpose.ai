/**
 * Authentication Service
 * Handles user registration, login, and session management using Supabase
 */

import { supabase, isSupabaseConfigured } from '../config/supabase';
import api from './api';

// Storage keys for backwards compatibility
const USER_KEY = 'repurpose_ai_user';

/**
 * Register a new user with Supabase
 * @param {object} userData - { username, email, password, full_name }
 * @returns {Promise<object>} Created user data
 */
export const register = async (userData) => {
  if (!isSupabaseConfigured()) {
    throw new Error('Authentication is not configured');
  }

  const { data, error } = await supabase.auth.signUp({
    email: userData.email,
    password: userData.password,
    options: {
      data: {
        username: userData.username,
        full_name: userData.full_name || '',
      }
    }
  });

  if (error) {
    throw new Error(error.message);
  }

  // Store user data for UI
  if (data.user) {
    const userInfo = {
      id: data.user.id,
      email: data.user.email,
      username: data.user.user_metadata?.username || userData.username,
      full_name: data.user.user_metadata?.full_name || userData.full_name,
    };
    localStorage.setItem(USER_KEY, JSON.stringify(userInfo));
  }

  return data;
};

/**
 * Login user with Supabase
 * @param {string} email - Email address
 * @param {string} password - Password
 * @returns {Promise<object>} Session data
 */
export const login = async (email, password) => {
  if (!isSupabaseConfigured()) {
    throw new Error('Authentication is not configured');
  }

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    throw new Error(error.message);
  }

  // Store user data for UI
  if (data.user) {
    const userInfo = {
      id: data.user.id,
      email: data.user.email,
      username: data.user.user_metadata?.username || email.split('@')[0],
      full_name: data.user.user_metadata?.full_name || '',
    };
    localStorage.setItem(USER_KEY, JSON.stringify(userInfo));
  }

  return data;
};

/**
 * Logout user from Supabase
 */
export const logout = async () => {
  if (isSupabaseConfigured()) {
    await supabase.auth.signOut();
  }
  localStorage.removeItem(USER_KEY);
  window.dispatchEvent(new CustomEvent('auth:logout'));
};

/**
 * Get current session token
 * @returns {Promise<string|null>} Access token
 */
export const getToken = async () => {
  if (!isSupabaseConfigured()) {
    return null;
  }

  const { data: { session } } = await supabase.auth.getSession();
  return session?.access_token || null;
};

/**
 * Get stored user data (sync version for UI)
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
  return !!getStoredUser();
};

/**
 * Get current user from Supabase session
 * @returns {Promise<object|null>} User data
 */
export const getCurrentUser = async () => {
  if (!isSupabaseConfigured()) {
    return null;
  }

  const { data: { user } } = await supabase.auth.getUser();

  if (user) {
    return {
      id: user.id,
      email: user.email,
      username: user.user_metadata?.username || user.email?.split('@')[0],
      full_name: user.user_metadata?.full_name || '',
    };
  }

  return null;
};

/**
 * Get current session
 * @returns {Promise<object|null>} Session data
 */
export const getSession = async () => {
  if (!isSupabaseConfigured()) {
    return null;
  }

  const { data: { session } } = await supabase.auth.getSession();
  return session;
};

/**
 * Check authentication status
 * @returns {Promise<object>} Auth status { authenticated, user }
 */
export const checkAuthStatus = async () => {
  try {
    const user = await getCurrentUser();
    return {
      authenticated: !!user,
      user,
    };
  } catch (error) {
    return { authenticated: false, user: null };
  }
};

/**
 * Listen for auth state changes
 * @param {function} callback - Callback function (event, session)
 * @returns {object} Subscription object with unsubscribe method
 */
export const onAuthStateChange = (callback) => {
  if (!isSupabaseConfigured()) {
    return { data: { subscription: { unsubscribe: () => {} } } };
  }

  return supabase.auth.onAuthStateChange((event, session) => {
    if (event === 'SIGNED_IN' && session?.user) {
      const userInfo = {
        id: session.user.id,
        email: session.user.email,
        username: session.user.user_metadata?.username || session.user.email?.split('@')[0],
        full_name: session.user.user_metadata?.full_name || '',
      };
      localStorage.setItem(USER_KEY, JSON.stringify(userInfo));
    } else if (event === 'SIGNED_OUT') {
      localStorage.removeItem(USER_KEY);
    }
    callback(event, session);
  });
};

/**
 * Setup auth interceptor for API requests
 * Adds Supabase token to backend API calls
 */
export const setupAuthInterceptor = () => {
  api.interceptors.request.use(
    async (config) => {
      const token = await getToken();
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
    async (error) => {
      if (error.response?.status === 401) {
        await logout();
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
  getSession,
  checkAuthStatus,
  onAuthStateChange,
};
