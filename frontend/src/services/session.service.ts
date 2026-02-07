import api from './api';

export const sessionService = {
  getAll: async () => {
    const response = await api.get('/sessions');
    return response.data;
  },

  getByTraining: async (trainingId: number) => {
    const response = await api.get('/sessions', { params: { trainingId } });
    return response.data;
  },

  getByTrainingLevel: async (trainingId: number, levelNumber: number) => {
    const response = await api.get('/sessions', { params: { trainingId, levelNumber } });
    return response.data;
  },

  create: async (payload) => {
    const response = await api.post('/sessions', payload);
    return response.data;
  },

  createForLevel: async (levelId: number, payload) => {
    const response = await api.post(`/levels/${levelId}/sessions`, payload);
    return response.data;
  },

  updateSchedule: async (sessionId: number, payload) => {
    const response = await api.put(`/sessions/${sessionId}`, payload);
    return response.data;
  }
};
