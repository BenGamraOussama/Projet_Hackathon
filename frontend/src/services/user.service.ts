import api from './api';

export const userService = {
  getMe: async () => {
    const response = await api.get('/users/me');
    return response.data;
  },

  getByRole: async (role: string) => {
    const response = await api.get('/users', { params: { role } });
    return response.data;
  },

  getAll: async () => {
    const response = await api.get('/users');
    return response.data;
  },

  createUser: async (payload) => {
    const response = await api.post('/users', {
      ...payload,
      generatePassword: true,
      sendEmail: true
    });
    return response.data;
  },

  updateUser: async (id, payload) => {
    const response = await api.put(`/users/${id}`, payload);
    return response.data;
  },

  deleteUser: async (id) => {
    const response = await api.delete(`/users/${id}`);
    return response.data;
  },

  createTrainer: async (payload) => {
    const role = payload?.role || 'FORMATEUR';
    const response = await api.post('/users', {
      ...payload,
      role,
      generatePassword: true,
      sendEmail: true
    });
    return response.data;
  }
};
