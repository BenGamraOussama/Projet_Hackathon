import api from './api';

export const preferenceService = {
  get: async () => {
    const response = await api.get('/preferences/me');
    return response.data;
  },

  update: async (payload) => {
    const response = await api.put('/preferences/me', payload);
    return response.data;
  }
};
