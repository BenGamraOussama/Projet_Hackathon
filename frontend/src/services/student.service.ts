import api from './api';

export const studentService = {
    getAll: async () => {
        const response = await api.get('/students');
        return response.data;
    },

    getProgressAll: async () => {
        const response = await api.get('/students/progress');
        return response.data;
    },

    getById: async (id) => {
        const response = await api.get(`/students/${id}`);
        return response.data;
    },

    getProgressById: async (id) => {
        const response = await api.get(`/students/${id}/progress`);
        return response.data;
    },

    create: async (student) => {
        const response = await api.post('/students', student);
        return response.data;
    },

    update: async (id, student) => {
        const response = await api.put(`/students/${id}`, student);
        return response.data;
    }
};
