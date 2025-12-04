import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Handle network errors
    if (!error.response) {
      // Network error - no response from server
      if (error.message === 'Network Error' || error.code === 'ERR_NETWORK') {
        error.networkError = true;
        error.userMessage = 'Unable to connect to server. Please check your internet connection and try again.';
      }
      return Promise.reject(error);
    }

    // Handle HTTP status codes
    if (error.response?.status === 401) {
      // Don't logout on 401 if it's a silent failure (like /users endpoint for non-admins)
      // Only logout if it's a real authentication failure
      const isSilentFailure = error.config?.url?.includes('/users') && 
                               error.response?.data?.error?.includes('permission');
      
      if (!isSilentFailure) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        // Only redirect if not already on login page
        if (window.location.pathname !== '/login') {
          window.location.href = '/login';
        }
      }
    } else if (error.response?.status === 403) {
      error.userMessage = error.response?.data?.error || 'You do not have permission to perform this action.';
    } else if (error.response?.status === 404) {
      error.userMessage = error.response?.data?.error || 'The requested resource was not found.';
    } else if (error.response?.status === 422) {
      // Validation errors
      error.userMessage = error.response?.data?.error || 'Please check your input and try again.';
    } else if (error.response?.status >= 500) {
      error.userMessage = 'A server error occurred. Please try again later or contact support if the problem persists.';
    } else {
      error.userMessage = error.response?.data?.error || 'An unexpected error occurred. Please try again.';
    }

    return Promise.reject(error);
  }
);

export default api;

