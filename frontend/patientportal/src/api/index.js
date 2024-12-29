import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_PUBLIC_API_URL,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'Upgrade-Insecure-Requests': '1' 
  },
  withCredentials: false // false for cross-origin requests without credentials
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  } else {
    config.headers.Authorization = `Bearer GUEST`;
  }
  return config;
});

const toUrlEncoded = (obj) =>
    Object.keys(obj)
      .map((key) => `${encodeURIComponent(key)}=${encodeURIComponent(obj[key])}`)
      .join('&');
  
export const authApi = {
    login: (credentials) =>
      api.post('/auth/login', toUrlEncoded(credentials), {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      }),
  };

const filterEmptyValues = (obj) => {
    if (!obj || typeof obj !== 'object') return obj;
    return Object.fromEntries(
      Object.entries(obj).filter(([_, value]) => value !== undefined && value !== null && value !== '')
    );
};
  
export const requestsApi = {
    getRequests: (params) => api.get('/requests/', { params: filterEmptyValues(params) }),
    getRequest: (id) => api.get(`/requests/${id}`),
    createRequest: (data) => api.post('/requests/', filterEmptyValues(data)),
    updateRequest: (id, data) => api.put(`/requests/${id}`, filterEmptyValues(data)),
    getStats: () => api.get('/requests/stats'),
  };
  
  export const assigneesApi = {
    getAssignees: (params) => api.get('/assignees/', { params: filterEmptyValues(params) }),
    createAssignee: (data) => api.post('/assignees/', filterEmptyValues(data)),
    updateAssignee: (id, data) => api.put(`/assignees/${id}`, filterEmptyValues(data)),
    deleteAssignee: (id) => api.delete(`/assignees/${id}`),
    getStats: () => api.get('/assignees/stats'),
  };
  
  export const usersApi = {
    getMe: () => api.get('/users/me'),
    createUser: (data) => api.post('/users/', filterEmptyValues(data)),
    getUsers: (params) => api.get('/users/', { params: filterEmptyValues(params) }),
    deleteUser: (id) => api.delete(`/users/${id}`),
  };
  