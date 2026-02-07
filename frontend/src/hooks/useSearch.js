/**
 * Search Hook
 * Combines API search with WebSocket progress tracking
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { searchDrug } from '../services/api';
import { useWebSocket } from './useWebSocket';
import { generateSessionId } from '../utils/helpers';
import { ROUTES } from '../utils/constants';
import useAppStore from '../store';

/**
 * Custom hook for drug search with progress tracking
 * @param {object} options - Hook options
 * @returns {object} Search state and methods
 */
export const useSearch = (options = {}) => {
  const {
    autoNavigate = true,
    onComplete = null,
    onError = null,
  } = options;

  const navigate = useNavigate();
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState(null);
  const [sessionId, setSessionId] = useState(null);
  const [elapsedTime, setElapsedTime] = useState(0);

  const startTimeRef = useRef(null);
  const timerRef = useRef(null);

  const {
    setSearchResults,
    addToHistory,
  } = useAppStore();

  // WebSocket connection for progress
  const {
    connected,
    agentProgress,
    workflowStatus,
    resetProgress,
  } = useWebSocket(sessionId, {
    autoConnect: !!sessionId,
  });

  // Timer for elapsed time
  useEffect(() => {
    if (isSearching && startTimeRef.current) {
      timerRef.current = setInterval(() => {
        setElapsedTime((Date.now() - startTimeRef.current) / 1000);
      }, 100);
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [isSearching]);

  /**
   * Execute search
   */
  const search = useCallback(async (drugName, searchOptions = {}) => {
    if (!drugName?.trim() || isSearching) return;

    const { forceRefresh = false, context = {} } = searchOptions;
    const newSessionId = generateSessionId();

    setSessionId(newSessionId);
    setIsSearching(true);
    setError(null);
    resetProgress();
    startTimeRef.current = Date.now();
    setElapsedTime(0);

    try {
      const results = await searchDrug(drugName.trim(), {
        sessionId: newSessionId,
        forceRefresh,
        context,
      });

      setSearchResults(results);

      // Add to history
      addToHistory({
        drugName: drugName.trim(),
        timestamp: new Date().toISOString(),
        opportunityCount:
          results.enhanced_indications?.length ||
          results.ranked_indications?.length ||
          0,
        cached: results.cached || false,
      });

      // Callback
      if (onComplete) {
        onComplete(results);
      }

      // Auto-navigate to results
      if (autoNavigate) {
        navigate(`${ROUTES.RESULTS}/${encodeURIComponent(drugName.trim())}`);
      }

      return results;
    } catch (err) {
      console.error('Search error:', err);
      const errorMessage = err.message || 'Search failed. Please try again.';
      setError(errorMessage);

      if (onError) {
        onError(err);
      }

      throw err;
    } finally {
      setIsSearching(false);
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    }
  }, [isSearching, resetProgress, setSearchResults, addToHistory, onComplete, onError, autoNavigate, navigate]);

  /**
   * Reset search state
   */
  const reset = useCallback(() => {
    setIsSearching(false);
    setError(null);
    setSessionId(null);
    setElapsedTime(0);
    resetProgress();
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
  }, [resetProgress]);

  /**
   * Cancel ongoing search (if possible)
   */
  const cancel = useCallback(() => {
    // Note: This doesn't actually cancel the backend request,
    // but it resets the UI state
    reset();
  }, [reset]);

  return {
    // State
    isSearching,
    error,
    sessionId,
    elapsedTime,
    connected,
    agentProgress,
    workflowStatus,

    // Methods
    search,
    reset,
    cancel,
  };
};

export default useSearch;
