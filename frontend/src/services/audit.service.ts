import api from './api';

export const auditService = {
  getAll: async () => {
    const response = await api.get('/audit-logs');
    return response.data;
  }
};
