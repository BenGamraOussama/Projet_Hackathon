import api from './api';

export const reportService = {
  getSummary: async () => {
    const response = await api.get('/reports/summary');
    return response.data;
  }
};
