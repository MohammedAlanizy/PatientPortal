import { create } from 'zustand';
import { assigneesApi } from '../api';

export const useAssignees = create((set) => ({
    assignees: [],
    isLoading: false,
    error: null,
    
    fetchAssignees: async () => {
      set({ isLoading: true });
      try {
        const response = await assigneesApi.getAssignees();
        set({ remaining	: response.data.remaining, assignees: response.data.results, isLoading: false });
      } catch (error) {
        set({ error: error.message, isLoading: false });
      }
    },
    createAssignee: async (assigneesData) => {
          set({ isLoading: true, error: null });
          try {
            const response = await assigneesApi.createAssignee(assigneesData);
            set(state => ({
              assignees: [...state.assignees, response.data],
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
    deleteAssignee: async (id) => {
        set({ isLoading: true, error: null });
        try {
          await assigneesApi.deleteAssignee(id);
          set(state => ({
            assignees: state.assignees.filter(assignee => assignee.id !== id),
            isLoading: false
          }));
        } catch (error) {
          set({ error: error.message, isLoading: false });
        }
      },
    fetchStats: async () => {
        set({ isLoading: true });
        try {
            const response = await assigneesApi.getStats();
            set({ stats: response.data, isLoading: false });
        } catch (error) {
            set({ error: error.message, isLoading: false });
        }
    }
  }));