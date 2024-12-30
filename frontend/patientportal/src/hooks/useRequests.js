import { create } from 'zustand';
import { requestsApi } from '../api';

const convertUTCToLocal = (utcDate) => {
  if (!utcDate) return null;
  const date = new Date(utcDate);
  return new Date(date.getTime() - date.getTimezoneOffset() * 60000);
};

const processRequest = (request) => ({
  ...request,
  created_at: request.created_at ? convertUTCToLocal(request.created_at) : null,
  updated_at: request.updated_at ? convertUTCToLocal(request.updated_at) : null,
});

export const useRequests = create((set, get) => ({
  requests: [],
  isLoading: false,
  error: null,
  totalRequest: 0,
  totalPending: 0,
  totalCompleted: 0,
  remaining: 0,

  fetchRequests: async (params = { skip: 0 }) => {
    set({ isLoading: true, error: null });
    try {
      const response = await requestsApi.getRequests(params);
      const processedRequests = response.data.results.map(processRequest);
      
      set(state => {
        if (params.skip === 0) {
          return {
            requests: processedRequests,
            totalRequest: response.data.length,
            remaining: response.data.remaining,
            isLoading: false
          };
        }
        
        // Deduplicate when adding more requests
        const existingIds = new Set(state.requests.map(req => req.id));
        const uniqueNewRequests = processedRequests.filter(req => !existingIds.has(req.id));
        
        return {
          requests: [...state.requests, ...uniqueNewRequests],
          totalRequest: response.data.length,
          remaining: response.data.remaining,
          isLoading: false
        };
      });
    } catch (error) {
      set({ 
        error: error.response?.data?.detail || 'Failed to fetch requests', 
        isLoading: false 
      });
    }
  },

  createRequest: async (data) => {
    set({ isLoading: true, error: null });
    try {
      const response = await requestsApi.createRequest(data);
      const processedRequest = processRequest(response.data);
      
      set(state => ({
        totalRequest: state.totalRequest + 1,
        totalPending: state.totalPending + 1,
        isLoading: false
      }));
      
      return processedRequest;
    } catch (error) {
      set({ 
        error: error.response?.data?.detail || 'Failed to create request', 
        isLoading: false 
      });
      throw error;
    }
  },

  updateRequest: async (id, data) => {
    set({ isLoading: true, error: null });
    try {
      const response = await requestsApi.updateRequest(id, data);
      const processedRequest = processRequest(response.data);
      
      set(state => {
        const updatedRequests = state.requests.map(req =>
          req.id === id ? processedRequest : req
        );
        
        const wasCompleted = state.requests.find(req => req.id === id)?.status === 'completed';
        const isNowCompleted = processedRequest.status === 'completed';
        
        return {
          requests: updatedRequests,
          totalCompleted: wasCompleted === isNowCompleted 
            ? state.totalCompleted 
            : isNowCompleted 
              ? state.totalCompleted + 1 
              : state.totalCompleted - 1,
          totalPending: wasCompleted === isNowCompleted
            ? state.totalPending
            : isNowCompleted
              ? Math.max(0, state.totalPending - 1)
              : state.totalPending + 1,
          isLoading: false
        };
      });
      
      return processedRequest;
    } catch (error) {
      set({ 
        error: error.response?.data?.detail || 'Failed to update request', 
        isLoading: false 
      });
      throw error;
    }
  },

  fetchStats: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await requestsApi.getStats();
      set({ 
        totalRequest: response.data.total, 
        totalPending: response.data.pending,
        totalCompleted: response.data.completed, 
        isLoading: false 
      });
    } catch (error) {
      set({ 
        error: error.response?.data?.detail || 'Failed to fetch stats',
        totalRequest: 0, 
        totalPending: 0, 
        totalCompleted: 0, 
        isLoading: false 
      });
    }
  },

  // New method to handle WebSocket updates
  handleWebSocketUpdate: (request, type) => {
    const processedRequest = processRequest(request);
    
    set(state => {
      const currentRequests = state.requests;
      const existingRequest = currentRequests.find(req => req.id === processedRequest.id);
      
      if (type === 'new_request' && !existingRequest) {
        return {
          requests: [processedRequest, ...currentRequests],
          totalRequest: state.totalRequest + 1,
          totalPending: state.totalPending + 1
        };
      }
      
      if (type === 'updated_request' && existingRequest) {
        const wasCompleted = existingRequest.status === 'completed';
        const isNowCompleted = processedRequest.status === 'completed';
        
        const updatedRequests = currentRequests.map(req =>
          req.id === processedRequest.id ? processedRequest : req
        );
        
        return {
          requests: updatedRequests,
          totalCompleted: wasCompleted === isNowCompleted 
            ? state.totalCompleted 
            : isNowCompleted 
              ? state.totalCompleted + 1 
              : state.totalCompleted - 1,
          totalPending: wasCompleted === isNowCompleted
            ? state.totalPending
            : isNowCompleted
              ? Math.max(0, state.totalPending - 1)
              : state.totalPending + 1
        };
      }
      
      return state;
    });
  }
}));