/**
 * WebSocket Hook
 * React hook for WebSocket connection and real-time agent progress updates
 */

import { useEffect, useState, useCallback, useRef } from 'react';
import { getWebSocketUrl } from '../config/api';

/**
 * Custom hook for WebSocket communication
 * @param {string} sessionId - Session ID for WebSocket connection
 * @param {object} options - Connection options
 * @returns {object} WebSocket state and methods
 */
export const useWebSocket = (sessionId, options = {}) => {
  const {
    onMessage = null,
    onError = null,
    onConnect = null,
    onDisconnect = null,
    autoConnect = true,
    reconnect = true,
    reconnectInterval = 3000,
  } = options;

  const [connected, setConnected] = useState(false);
  const [agentProgress, setAgentProgress] = useState({});
  const [workflowStatus, setWorkflowStatus] = useState(null);
  const [error, setError] = useState(null);
  const [messages, setMessages] = useState([]);

  const wsRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);
  const reconnectAttemptsRef = useRef(0);
  const maxReconnectAttempts = 5;

  /**
   * Connect to WebSocket
   */
  const connect = useCallback(() => {
    if (!sessionId) {
      console.warn('[WebSocket] No session ID provided');
      return;
    }

    if (wsRef.current?.readyState === WebSocket.OPEN) {
      console.log('[WebSocket] Already connected');
      return;
    }

    try {
      const url = getWebSocketUrl(sessionId);
      console.log(`[WebSocket] Connecting to ${url}...`);

      const ws = new WebSocket(url);
      wsRef.current = ws;

      ws.onopen = () => {
        console.log('[WebSocket] Connected successfully');
        setConnected(true);
        setError(null);
        reconnectAttemptsRef.current = 0;

        if (onConnect) {
          onConnect();
        }

        // Send ping every 30 seconds to keep connection alive
        const pingInterval = setInterval(() => {
          if (ws.readyState === WebSocket.OPEN) {
            ws.send('ping');
          }
        }, 30000);

        ws.pingInterval = pingInterval;
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          console.log('[WebSocket] Message received:', data);

          // Add to message history
          setMessages((prev) => [...prev, data]);

          // Handle different message types
          switch (data.type) {
            case 'connection':
              console.log('[WebSocket] Connection confirmed:', data.session_id);
              break;

            case 'agent_progress':
              setAgentProgress((prev) => ({
                ...prev,
                [data.agent]: {
                  status: data.status,
                  message: data.message,
                  evidenceCount: data.evidence_count,
                  timestamp: data.timestamp,
                },
              }));
              break;

            case 'workflow_status':
              setWorkflowStatus({
                stage: data.stage,
                status: data.status,
                message: data.message,
                timestamp: data.timestamp,
              });
              break;

            case 'error':
              console.error('[WebSocket] Error from server:', data.error);
              setError(data.error);
              break;

            case 'complete':
              console.log('[WebSocket] Search complete:', data.summary);
              setWorkflowStatus({
                stage: 'complete',
                status: 'success',
                message: 'Search completed successfully',
                timestamp: data.timestamp,
              });
              break;

            default:
              console.log('[WebSocket] Unknown message type:', data.type);
          }

          // Call custom message handler
          if (onMessage) {
            onMessage(data);
          }
        } catch (err) {
          console.error('[WebSocket] Failed to parse message:', err);
        }
      };

      ws.onerror = (event) => {
        console.error('[WebSocket] Error:', event);
        setError('WebSocket connection error');

        if (onError) {
          onError(event);
        }
      };

      ws.onclose = () => {
        console.log('[WebSocket] Connection closed');
        setConnected(false);

        // Clear ping interval
        if (ws.pingInterval) {
          clearInterval(ws.pingInterval);
        }

        if (onDisconnect) {
          onDisconnect();
        }

        // Attempt reconnection if enabled
        if (reconnect && reconnectAttemptsRef.current < maxReconnectAttempts) {
          reconnectAttemptsRef.current += 1;
          console.log(
            `[WebSocket] Reconnecting... (attempt ${reconnectAttemptsRef.current}/${maxReconnectAttempts})`
          );

          reconnectTimeoutRef.current = setTimeout(() => {
            connect();
          }, reconnectInterval);
        } else if (reconnectAttemptsRef.current >= maxReconnectAttempts) {
          console.error('[WebSocket] Max reconnection attempts reached');
          setError('Failed to reconnect to server');
        }
      };
    } catch (err) {
      console.error('[WebSocket] Connection failed:', err);
      setError(err.message);

      if (onError) {
        onError(err);
      }
    }
  }, [sessionId, reconnect, reconnectInterval, onConnect, onDisconnect, onMessage, onError]);

  /**
   * Disconnect from WebSocket
   */
  const disconnect = useCallback(() => {
    console.log('[WebSocket] Disconnecting...');

    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }

    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }

    setConnected(false);
  }, []);

  /**
   * Send message through WebSocket
   */
  const send = useCallback((message) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      const data = typeof message === 'string' ? message : JSON.stringify(message);
      wsRef.current.send(data);
      console.log('[WebSocket] Message sent:', data);
    } else {
      console.warn('[WebSocket] Cannot send message - not connected');
    }
  }, []);

  /**
   * Clear message history
   */
  const clearMessages = useCallback(() => {
    setMessages([]);
  }, []);

  /**
   * Reset progress tracking
   */
  const resetProgress = useCallback(() => {
    setAgentProgress({});
    setWorkflowStatus(null);
    setError(null);
  }, []);

  // Auto-connect on mount if enabled
  useEffect(() => {
    if (autoConnect && sessionId) {
      connect();
    }

    // Cleanup on unmount
    return () => {
      disconnect();
    };
  }, [sessionId, autoConnect, connect, disconnect]);

  return {
    // Connection state
    connected,
    error,

    // Progress tracking
    agentProgress,
    workflowStatus,
    messages,

    // Methods
    connect,
    disconnect,
    send,
    clearMessages,
    resetProgress,
  };
};

export default useWebSocket;
