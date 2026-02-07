/**
 * Formatting Utilities
 */

import { CONFIDENCE_LEVELS } from './constants';

/**
 * Format a score to display with appropriate decimal places
 * @param {number} score - Score value (0-100)
 * @param {number} decimals - Number of decimal places
 * @returns {string} Formatted score
 */
export const formatScore = (score, decimals = 1) => {
  if (score === null || score === undefined) return '—';
  return Number(score).toFixed(decimals);
};

/**
 * Format a number with comma separators
 * @param {number} num - Number to format
 * @returns {string} Formatted number
 */
export const formatNumber = (num) => {
  if (num === null || num === undefined) return '—';
  return new Intl.NumberFormat('en-US').format(num);
};

/**
 * Format currency with appropriate suffix (K, M, B, T)
 * @param {number} amount - Amount in dollars
 * @param {number} decimals - Number of decimal places
 * @returns {string} Formatted currency
 */
export const formatCurrency = (amount, decimals = 1) => {
  if (amount === null || amount === undefined) return '—';

  const absAmount = Math.abs(amount);
  const sign = amount < 0 ? '-' : '';

  if (absAmount >= 1e12) {
    return `${sign}$${(absAmount / 1e12).toFixed(decimals)}T`;
  }
  if (absAmount >= 1e9) {
    return `${sign}$${(absAmount / 1e9).toFixed(decimals)}B`;
  }
  if (absAmount >= 1e6) {
    return `${sign}$${(absAmount / 1e6).toFixed(decimals)}M`;
  }
  if (absAmount >= 1e3) {
    return `${sign}$${(absAmount / 1e3).toFixed(decimals)}K`;
  }

  return `${sign}$${absAmount.toFixed(decimals)}`;
};

/**
 * Format a percentage value
 * @param {number} value - Value to format (0-100 or 0-1)
 * @param {number} decimals - Number of decimal places
 * @param {boolean} isDecimal - Whether the input is a decimal (0-1)
 * @returns {string} Formatted percentage
 */
export const formatPercentage = (value, decimals = 1, isDecimal = false) => {
  if (value === null || value === undefined) return '—';
  const percentage = isDecimal ? value * 100 : value;
  return `${percentage.toFixed(decimals)}%`;
};

/**
 * Format a date to relative time (e.g., "2 hours ago")
 * @param {string|Date} date - Date to format
 * @returns {string} Relative time string
 */
export const formatTimeAgo = (date) => {
  if (!date) return '—';

  const now = new Date();
  const past = new Date(date);
  const diffInSeconds = Math.floor((now - past) / 1000);

  if (diffInSeconds < 60) {
    return 'just now';
  }

  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) {
    return `${diffInMinutes}m ago`;
  }

  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) {
    return `${diffInHours}h ago`;
  }

  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 7) {
    return `${diffInDays}d ago`;
  }

  const diffInWeeks = Math.floor(diffInDays / 7);
  if (diffInWeeks < 4) {
    return `${diffInWeeks}w ago`;
  }

  const diffInMonths = Math.floor(diffInDays / 30);
  if (diffInMonths < 12) {
    return `${diffInMonths}mo ago`;
  }

  const diffInYears = Math.floor(diffInDays / 365);
  return `${diffInYears}y ago`;
};

/**
 * Format a date to a readable string
 * @param {string|Date} date - Date to format
 * @param {object} options - Intl.DateTimeFormat options
 * @returns {string} Formatted date
 */
export const formatDate = (date, options = {}) => {
  if (!date) return '—';

  const defaultOptions = {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    ...options,
  };

  return new Date(date).toLocaleDateString('en-US', defaultOptions);
};

/**
 * Format duration in seconds to human readable format
 * @param {number} seconds - Duration in seconds
 * @returns {string} Formatted duration
 */
export const formatDuration = (seconds) => {
  if (seconds === null || seconds === undefined) return '—';

  if (seconds < 60) {
    return `${seconds.toFixed(1)}s`;
  }

  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;

  if (minutes < 60) {
    return `${minutes}m ${remainingSeconds.toFixed(0)}s`;
  }

  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;

  return `${hours}h ${remainingMinutes}m`;
};

/**
 * Get confidence level object based on score
 * @param {number} score - Score value (0-100)
 * @returns {object} Confidence level object
 */
export const getConfidenceLevel = (score) => {
  if (score === null || score === undefined) {
    return CONFIDENCE_LEVELS.veryLow;
  }

  if (score >= CONFIDENCE_LEVELS.veryHigh.min) return CONFIDENCE_LEVELS.veryHigh;
  if (score >= CONFIDENCE_LEVELS.high.min) return CONFIDENCE_LEVELS.high;
  if (score >= CONFIDENCE_LEVELS.moderate.min) return CONFIDENCE_LEVELS.moderate;
  if (score >= CONFIDENCE_LEVELS.low.min) return CONFIDENCE_LEVELS.low;
  return CONFIDENCE_LEVELS.veryLow;
};

/**
 * Get confidence color based on score
 * @param {number} score - Score value (0-100)
 * @returns {string} Hex color
 */
export const getConfidenceColor = (score) => {
  return getConfidenceLevel(score).color;
};

/**
 * Get confidence label based on score
 * @param {number} score - Score value (0-100)
 * @returns {string} Confidence label
 */
export const getConfidenceLabel = (score) => {
  return getConfidenceLevel(score).label;
};

/**
 * Truncate text with ellipsis
 * @param {string} text - Text to truncate
 * @param {number} maxLength - Maximum length
 * @returns {string} Truncated text
 */
export const truncateText = (text, maxLength = 100) => {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  return `${text.substring(0, maxLength).trim()}...`;
};

/**
 * Format a drug name (capitalize properly)
 * @param {string} name - Drug name
 * @returns {string} Formatted drug name
 */
export const formatDrugName = (name) => {
  if (!name) return '';
  return name.charAt(0).toUpperCase() + name.slice(1).toLowerCase();
};

/**
 * Format large numbers with suffix
 * @param {number} num - Number to format
 * @returns {string} Formatted number
 */
export const formatCompactNumber = (num) => {
  if (num === null || num === undefined) return '—';

  const absNum = Math.abs(num);
  const sign = num < 0 ? '-' : '';

  if (absNum >= 1e9) {
    return `${sign}${(absNum / 1e9).toFixed(1)}B`;
  }
  if (absNum >= 1e6) {
    return `${sign}${(absNum / 1e6).toFixed(1)}M`;
  }
  if (absNum >= 1e3) {
    return `${sign}${(absNum / 1e3).toFixed(1)}K`;
  }

  return `${sign}${absNum}`;
};

export default {
  formatScore,
  formatNumber,
  formatCurrency,
  formatPercentage,
  formatTimeAgo,
  formatDate,
  formatDuration,
  getConfidenceLevel,
  getConfidenceColor,
  getConfidenceLabel,
  truncateText,
  formatDrugName,
  formatCompactNumber,
};
