/**
 * Helper Utilities
 */

/**
 * Merge class names conditionally (like clsx/classnames)
 * @param  {...any} classes - Class names or conditionals
 * @returns {string} Merged class string
 */
export const cn = (...classes) => {
  return classes
    .flat()
    .filter((cls) => typeof cls === 'string' && cls.trim())
    .join(' ');
};

/**
 * Debounce a function
 * @param {Function} fn - Function to debounce
 * @param {number} delay - Delay in milliseconds
 * @returns {Function} Debounced function
 */
export const debounce = (fn, delay = 300) => {
  let timeoutId;
  return (...args) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), delay);
  };
};

/**
 * Throttle a function
 * @param {Function} fn - Function to throttle
 * @param {number} limit - Time limit in milliseconds
 * @returns {Function} Throttled function
 */
export const throttle = (fn, limit = 300) => {
  let inThrottle;
  return (...args) => {
    if (!inThrottle) {
      fn(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
};

/**
 * Generate a unique session ID
 * @returns {string} UUID-like session ID
 */
export const generateSessionId = () => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

/**
 * Sleep/delay function
 * @param {number} ms - Milliseconds to sleep
 * @returns {Promise} Promise that resolves after delay
 */
export const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Safely parse JSON
 * @param {string} str - JSON string
 * @param {any} fallback - Fallback value if parsing fails
 * @returns {any} Parsed object or fallback
 */
export const safeJsonParse = (str, fallback = null) => {
  try {
    return JSON.parse(str);
  } catch {
    return fallback;
  }
};

/**
 * Get value from nested object path
 * @param {object} obj - Object to traverse
 * @param {string} path - Dot-notation path
 * @param {any} defaultValue - Default value if path not found
 * @returns {any} Value at path or default
 */
export const getNestedValue = (obj, path, defaultValue = undefined) => {
  const keys = path.split('.');
  let result = obj;

  for (const key of keys) {
    if (result === null || result === undefined) {
      return defaultValue;
    }
    result = result[key];
  }

  return result === undefined ? defaultValue : result;
};

/**
 * Sort array by property
 * @param {Array} arr - Array to sort
 * @param {string} key - Property key
 * @param {string} order - 'asc' or 'desc'
 * @returns {Array} Sorted array
 */
export const sortBy = (arr, key, order = 'desc') => {
  return [...arr].sort((a, b) => {
    const aVal = getNestedValue(a, key, 0);
    const bVal = getNestedValue(b, key, 0);

    if (order === 'asc') {
      return aVal > bVal ? 1 : aVal < bVal ? -1 : 0;
    }
    return aVal < bVal ? 1 : aVal > bVal ? -1 : 0;
  });
};

/**
 * Group array by property
 * @param {Array} arr - Array to group
 * @param {string|Function} key - Property key or function
 * @returns {object} Grouped object
 */
export const groupBy = (arr, key) => {
  return arr.reduce((acc, item) => {
    const groupKey = typeof key === 'function' ? key(item) : item[key];
    if (!acc[groupKey]) {
      acc[groupKey] = [];
    }
    acc[groupKey].push(item);
    return acc;
  }, {});
};

/**
 * Get unique values from array
 * @param {Array} arr - Array
 * @param {string} key - Optional property key for objects
 * @returns {Array} Unique values
 */
export const unique = (arr, key = null) => {
  if (key) {
    const seen = new Set();
    return arr.filter((item) => {
      const val = item[key];
      if (seen.has(val)) return false;
      seen.add(val);
      return true;
    });
  }
  return [...new Set(arr)];
};

/**
 * Check if value is empty (null, undefined, '', [], {})
 * @param {any} value - Value to check
 * @returns {boolean} Is empty
 */
export const isEmpty = (value) => {
  if (value === null || value === undefined) return true;
  if (typeof value === 'string') return value.trim() === '';
  if (Array.isArray(value)) return value.length === 0;
  if (typeof value === 'object') return Object.keys(value).length === 0;
  return false;
};

/**
 * Clamp a number between min and max
 * @param {number} num - Number to clamp
 * @param {number} min - Minimum value
 * @param {number} max - Maximum value
 * @returns {number} Clamped value
 */
export const clamp = (num, min, max) => Math.min(Math.max(num, min), max);

/**
 * Linear interpolation
 * @param {number} start - Start value
 * @param {number} end - End value
 * @param {number} t - Progress (0-1)
 * @returns {number} Interpolated value
 */
export const lerp = (start, end, t) => start + (end - start) * t;

/**
 * Map a value from one range to another
 * @param {number} value - Value to map
 * @param {number} inMin - Input range minimum
 * @param {number} inMax - Input range maximum
 * @param {number} outMin - Output range minimum
 * @param {number} outMax - Output range maximum
 * @returns {number} Mapped value
 */
export const mapRange = (value, inMin, inMax, outMin, outMax) => {
  return ((value - inMin) * (outMax - outMin)) / (inMax - inMin) + outMin;
};

/**
 * Copy text to clipboard
 * @param {string} text - Text to copy
 * @returns {Promise<boolean>} Success status
 */
export const copyToClipboard = async (text) => {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    // Fallback for older browsers
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.select();
    try {
      document.execCommand('copy');
      return true;
    } catch {
      return false;
    } finally {
      document.body.removeChild(textarea);
    }
  }
};

/**
 * Download data as file
 * @param {string|Blob} data - Data to download
 * @param {string} filename - Filename
 * @param {string} mimeType - MIME type
 */
export const downloadFile = (data, filename, mimeType = 'application/octet-stream') => {
  const blob = data instanceof Blob ? new Blob([data], { type: mimeType }) : new Blob([data], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.style.display = 'none';
  document.body.appendChild(link);
  link.click();
  // Delay cleanup so the browser has time to start the download
  setTimeout(() => {
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, 1000);
};

/**
 * Create a promise that resolves when condition is met
 * @param {Function} condition - Condition function
 * @param {number} interval - Check interval in ms
 * @param {number} timeout - Timeout in ms
 * @returns {Promise} Promise that resolves when condition is met
 */
export const waitFor = (condition, interval = 100, timeout = 10000) => {
  return new Promise((resolve, reject) => {
    const startTime = Date.now();

    const check = () => {
      if (condition()) {
        resolve();
      } else if (Date.now() - startTime > timeout) {
        reject(new Error('Timeout waiting for condition'));
      } else {
        setTimeout(check, interval);
      }
    };

    check();
  });
};

export default {
  cn,
  debounce,
  throttle,
  generateSessionId,
  sleep,
  safeJsonParse,
  getNestedValue,
  sortBy,
  groupBy,
  unique,
  isEmpty,
  clamp,
  lerp,
  mapRange,
  copyToClipboard,
  downloadFile,
  waitFor,
};
