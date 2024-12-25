import { useState, useEffect, useCallback } from 'react';

export const useRequests = () => {
  const [requests, setRequests] = useState([]);
  const [savedRequests, setSavedRequests] = useState([]);

  const mockWebSocket = useCallback(() => {
    const interval = setInterval(() => {
      const newRequest = {
        id: Date.now(),
        fullName: `User ${Math.floor(Math.random() * 1000)}`,
        nationalId: `${Math.floor(Math.random() * 100000000)}`,
        fileId: Math.floor(Math.random() * 10) + 1,
        notes: '',
        status: 'waiting',  // All new requests start as waiting
        timestamp: new Date().toISOString(),
      };
      setRequests(prev => [...prev, newRequest]);
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const cleanup = mockWebSocket();
    return () => cleanup();
  }, [mockWebSocket]);

  const saveRequest = useCallback((request) => {
    setSavedRequests(prev => [...prev, { ...request, timeSaved: new Date() }]);
    setRequests(prev => prev.filter(r => r.id !== request.id));
  }, []);

  const updateRequest = useCallback((id, updates) => {
    setRequests(prev =>
      prev.map(request => {
        if (request.id === id) {
          const updatedRequest = { ...request, ...updates };
          if (updates.status && updates.status !== request.status) {

          }
          return updatedRequest;
        }
        return request;
      })
    );
  }, []);

  return { requests, savedRequests, saveRequest, updateRequest };
};