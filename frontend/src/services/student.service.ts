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
    },
    getPending: async (query?: string) => {
        const response = await api.get('/students/pending', { params: query ? { query } : undefined });
        return response.data;
    },

    getPendingCount: async () => {
        const response = await api.get('/students/pending/count');
        return response.data;
    },

    updateStatus: async (id, status: 'APPROVED' | 'REJECTED') => {
        const response = await api.post(`/students/${id}/status`, { status });
        return response.data;
    }
};
