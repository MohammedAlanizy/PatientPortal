import { create } from 'zustand';
import { authApi } from '../api';

export const useAuth = create((set) => ({
  user: null,
  isLoading: false,
  token: localStorage.getItem('token') || null,
  error: null,
  login: async (credentials) => {
    set({ isLoading: true, error: null });
    try {
      const response = await authApi.login(credentials);
      localStorage.setItem('token', response.data.access_token);
      localStorage.setItem('role', response.data.role);
      set({ user: response.data.user, isLoading: false });
      return response.data;
    } catch (error) {
      set({ error: error.response?.data?.detail || 'Login failed', isLoading: false });
      throw error;
    }
  },
  logout: () => {
    localStorage.removeItem('token');
    set({ user: null });
    if (socket) {
        socket.close();
    }
  },
}));