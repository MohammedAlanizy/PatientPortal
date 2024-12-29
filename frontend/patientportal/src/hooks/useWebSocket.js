import { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useNotification } from '@/contexts/NotificationContext';

export const useWebSocket = () => {
  const { token } = useAuth();
  const { showNotification } = useNotification();
  const [isConnected, setIsConnected] = useState(false);
  const wsRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);
  const messageListenersRef = useRef(new Set());

  const cleanupWebSocket = useCallback(() => {
    if (wsRef.current) {
      wsRef.current.onclose = null; // Remove close handler to prevent reconnection
      wsRef.current.onerror = null;
      wsRef.current.onopen = null;
      wsRef.current.close();
      wsRef.current = null;
    }
    clearTimeout(reconnectTimeoutRef.current);
    setIsConnected(false);
  }, []);

  const connect = useCallback(() => {
    if (!token) return;
    // Clean up existing connection if any
    cleanupWebSocket();

    try {
      console.log('Attempting to connect WebSocket...');
      const ws = new WebSocket(`${import.meta.env.VITE_PUBLIC_WS_URL}/ws?token=${token}`);

      ws.onopen = () => {
        console.log('WebSocket Connected Successfully');
        setIsConnected(true);
        // showNotification('Connected to real-time updates', 'success');
      };

      ws.onclose = (event) => {
        console.log('WebSocket Closed:', event.code, event.reason);
        setIsConnected(false);

        // Only reconnect if not intentionally closed
        if (!ws.intentionalClosure && event.code !== 1000) {
          console.log('Scheduling reconnection...');
          reconnectTimeoutRef.current = setTimeout(() => {
            console.log('Attempting to reconnect...');
            connect();
          }, 3000);
        }
      };

      ws.onerror = (error) => {
        console.error('WebSocket Error:', error);
        setIsConnected(false);
      };

      ws.onmessage = (event) => {
        messageListenersRef.current.forEach(listener => {
          try {
            listener(event);
          } catch (error) {
            console.error('Error in message listener:', error);
          }
        });
      };

      wsRef.current = ws;

    } catch (error) {
      console.error('WebSocket connection error:', error);
      setIsConnected(false);
    }
  }, [token, cleanupWebSocket, showNotification]);

  // Connect when component mounts or token changes
  useEffect(() => {
    console.log('Token changed or component mounted, connecting...');
    if (isConnected) return; // Already connected
    connect();

    // Cleanup function
    return () => {
      console.log('Component unmounting, cleaning up WebSocket...');
      if (wsRef.current) {
        wsRef.current.intentionalClosure = true;
        cleanupWebSocket();
      }
    };
  }, [ cleanupWebSocket]);

  // Add message listener
  const addMessageListener = useCallback((handler) => {
    messageListenersRef.current.add(handler);
    
    return () => {
      messageListenersRef.current.delete(handler);
    };
  }, []);

  // Heart beat to check connection
  useEffect(() => {
    const heartbeat = setInterval(() => {
      if (wsRef.current?.readyState === WebSocket.CLOSED) {
        console.log('Heartbeat detected closed connection, reconnecting...');
        connect();
      }
    }, 30000); // Check every 30 seconds

    return () => clearInterval(heartbeat);
  }, [connect]);

  return {
    isConnected,
    addMessageListener,
    getConnectionState: () => wsRef.current?.readyState,
    connect
  };
};