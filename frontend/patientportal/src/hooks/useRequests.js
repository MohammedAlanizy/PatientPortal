import { create } from 'zustand';
import { requestsApi } from '../api';
const convertUTCToLocal = (utcDate) => {
    if (!utcDate) return null;
    const date = new Date(utcDate);
    return new Date(date.getTime() - date.getTimezoneOffset() * 60000);
};
export const useRequests = create((set, get) => ({
  requests: [],
  isLoading: false,
  error: null,
  totalRequests: 0,
  remaining: 0,
  
  fetchRequests: async (params = { skip: 0 }) => {
    set({ isLoading: true, error: null });
    try {
      const response = await requestsApi.getRequests(params);
  
      // Process the response to convert created_at and updated_at fields
      const processedRequests = response.data.results.map(request => ({
        ...request,
        created_at: request.created_at ? convertUTCToLocal(request.created_at) : null,
        updated_at: request.updated_at ? convertUTCToLocal(request.updated_at) : null,
      }));
  
      set(state => ({ 
        requests: params.skip === 0 ? processedRequests : [...state.requests, ...processedRequests],
        totalRequests: response.data.length,
        remaining: response.data.remaining,
        isLoading: false 
      }));
    } catch (error) {
      set({ error: error.response?.data?.detail || 'Failed to fetch requests', isLoading: false });
    }
  },  

  createRequest: async (data) => {
    set({ isLoading: true, error: null });
    try {
      const response = await requestsApi.createRequest(data);
      set(state => ({
        requests: [...state.requests, response.data],
        totalRequests: state.totalRequests + 1,
        isLoading: false
      }));
      return response.data;
    } catch (error) {
      set({ error: error.response?.data?.detail || 'Failed to create request', isLoading: false });
      throw error;
    }
  },

  updateRequest: async (id, data) => {
    set({ isLoading: false, error: null });
    try {
      const response = await requestsApi.updateRequest(id, data);
      set(state => ({
        requests: state.requests.map(req => 
          req.id === id ? response.data : req
        ),
        totalCompleted: state.totalCompleted + 1,
        totalPending: state.totalPending - 1,
        isLoading: false
      }));
      return response.data;
    } catch (error) {
      set({ error: error.response?.data?.detail || 'Failed to update request', isLoading: false });
      throw error;
    }
  },
  fetchStats: async () => {
    set({ isLoading: false, error: null });
    try {
      const response = await requestsApi.getStats();
      set({ totalRequest: response.data.total, totalPending: response.data.pending,totalCompleted: response.data.completed, isLoading: false });
    } catch (error) {
      set({ error: error.response?.data?.detail || 'Failed to fetch stats',totalRequests:0, totalPending:0, totalCompleted:0, isLoading: false });
    }
  }
}));