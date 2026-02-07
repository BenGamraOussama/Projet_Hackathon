import api from './api';

export const trainingService = {
    getAll: async () => {
        const response = await api.get('/trainings');
        return response.data;
    }
};
