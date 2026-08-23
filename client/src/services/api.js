import axios from 'axios';
import tokenManager from './tokenManager';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(
  (config) => {
    const token = tokenManager.get();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const originalUrl = error.config?.url || '';
    const isAuthRequest = originalUrl.includes('/auth/login') || originalUrl.includes('/auth/register') || originalUrl.includes('/auth/google');
    
    if (error.response?.status === 401 && !isAuthRequest) {
      tokenManager.remove();
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
