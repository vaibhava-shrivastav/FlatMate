import api from './api';
import tokenManager from './tokenManager';

const authService = {
  async login(email, password) {
    const { data } = await api.post('/auth/login', { email, password });
    tokenManager.set(data.token);
    const user = await this.getCurrentUser();
    return { user, token: data.token };
  },

  async register(payload) {
    const { data } = await api.post('/auth/register', payload);
    tokenManager.set(data.token);
    const user = await this.getCurrentUser();
    return { user, token: data.token, isNewUser: data.isNewUser ?? true };
  },

  async googleLogin(credential) {
    const { data } = await api.post('/auth/google', { credential });
    tokenManager.set(data.token);
    const user = await this.getCurrentUser();
    return { user, token: data.token, isNewUser: data.isNewUser ?? false };
  },

  async getCurrentUser() {
    const { data } = await api.get('/users/me');
    return data.user ?? data;
  },

  async logout() {
    // No /auth/logout endpoint exists on the backend — client-side only
  },

  async refreshProfile() {
    return this.getCurrentUser();
  },
};

export default authService;
