import api from './api';

export const attendanceService = {
  getAll: async () => {
    const response = await api.get('/attendance');
    return response.data;
  },

  getByStudent: async (studentId: number) => {
    const response = await api.get('/attendance', { params: { studentId } });
    return response.data;
  },

  getBySession: async (sessionId: number) => {
    const response = await api.get('/attendance', { params: { sessionId } });
    return response.data;
  },

  saveBulk: async (payload) => {
    const response = await api.post('/attendance/bulk', payload);
    return response.data;
  }
};
