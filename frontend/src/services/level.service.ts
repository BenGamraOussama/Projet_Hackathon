import api from './api';

export const levelService = {
  getAll: async () => {
    const response = await api.get('/levels');
    return response.data;
  },

  getByTraining: async (trainingId: number) => {
    const response = await api.get('/levels', { params: { trainingId } });
    return response.data;
  },

  create: async (payload) => {
    const response = await api.post('/levels', payload);
    return response.data;
  }
};
