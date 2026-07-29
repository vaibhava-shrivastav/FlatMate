import api from './api';

const authService = {
  async login(email, password) {
    const { data } = await api.post('/auth/login', { email, password });
    return data;
  },

  async register(payload) {
    const { data } = await api.post('/auth/register', payload);
    return data;
  },

  async googleLogin(accessToken) {
    const { data } = await api.post('/auth/google', { access_token: accessToken });
    return data;
  },

  async getCurrentUser() {
    const { data } = await api.get('/auth/me');
    return data.user ?? data;
  },

  async logout() {
    try {
      await api.post('/auth/logout');
    } catch {
      // Server-side logout is best-effort; client always clears state
    }
  },

  async refreshProfile() {
    return this.getCurrentUser();
  },
};

export default authService;
