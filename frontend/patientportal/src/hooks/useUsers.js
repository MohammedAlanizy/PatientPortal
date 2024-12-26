import { create } from 'zustand';
import { usersApi } from '../api';

export const useUsers = create((set) => ({
    users: [],
    isLoading: false,
    error: null,
    
    fetchUsers: async () => {
      set({ isLoading: true, error: null });
      try {
        const response = await usersApi.getUsers();
        set({ users: response.data.results, isLoading: false });
      } catch (error) {
        set({ 
          error: error.response?.data?.detail || 'Failed to fetch users', 
          isLoading: false 
        });
        throw error;
      }
    },
  
    createUser: async (userData) => {
      set({ isLoading: true, error: null });
      try {
        const response = await usersApi.createUser(userData);
        set(state => ({
          users: [...state.users, response.data],
          isLoading: false
        }));
        return response.data;
      } catch (error) {
        set({ 
          error: error.response?.data?.detail || 'Failed to create user', 
          isLoading: false 
        });
        throw error;
      }
    },

    deleteUser: async (userId) => {
      set({ isLoading: true, error: null });
      try {
        await usersApi.deleteUser(userId);
        set(state => ({
          users: state.users.filter(user => user.id !== userId),
          isLoading: false
        }));
      } catch (error) {
        set({ 
          error: error.response?.data?.detail || 'Failed to delete user', 
          isLoading: false 
        });
        throw error;
      }
    }
}));

  