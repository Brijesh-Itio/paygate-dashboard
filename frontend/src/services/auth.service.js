import api from './api';

export const authService = {
  async login(email, password) {
    const res = await api.post('/auth/login', { email, password });
    return res.data;
  },

  async logout() {
    await api.post('/auth/logout');
  },

  async me() {
    const res = await api.get('/auth/me');
    return res.data.user;
  },

  async register(data) {
    const res = await api.post('/auth/register', data);
    return res.data;
  },
};
