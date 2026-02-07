import api from './api';

export const studentService = {
    getAll: async () => {
        const response = await api.get('/students');
        return response.data;
    },

    getById: async (id) => {
        const response = await api.get(`/students/${id}`);
        return response.data;
    },

    create: async (student) => {
        const response = await api.post('/students', student);
        return response.data;
    }
};
