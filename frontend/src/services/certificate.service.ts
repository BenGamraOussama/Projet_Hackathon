import api from './api';

export const certificateService = {
  getAll: async () => {
    const response = await api.get('/certificates');
    return response.data;
  },

  getByStudent: async (studentId: number) => {
    const response = await api.get('/certificates', { params: { studentId } });
    return response.data;
  },

  create: async (payload) => {
    const response = await api.post('/certificates', payload);
    return response.data;
  }
};
