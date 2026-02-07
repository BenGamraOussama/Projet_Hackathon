import api from './api';

export const trainingService = {
    getAll: async () => {
        const response = await api.get('/trainings');
        return response.data;
    },

    getById: async (id: number) => {
        const response = await api.get(`/trainings/${id}`);
        return response.data;
    },

    create: async (training) => {
        const response = await api.post('/trainings', training);
        return response.data;
    },

    update: async (id, training) => {
        const response = await api.put(`/trainings/${id}`, training);
        return response.data;
    },

    createLevel: async (trainingId: number, payload) => {
        const response = await api.post(`/trainings/${trainingId}/levels`, payload);
        return response.data;
    },

    generateStructure: async (id: number) => {
        const response = await api.post(`/trainings/${id}/generate-structure`);
        return response.data;
    },

    requestAiPlan: async (id: number, payload) => {
        const response = await api.post(`/trainings/${id}/ai-plan`, payload);
        return response.data;
    },

    applyAiPlan: async (id: number, approvedPlan) => {
        const response = await api.post(`/trainings/${id}/apply-ai-plan`, { approvedPlan });
        return response.data;
    }
};
