import api from './api';

export const messageService = {
    getAll: async () => {
        const response = await api.get('/messages');
        return response.data;
    },

    sendMessage: async (message) => {
        const response = await api.post('/messages', message);
        return response.data;
    }
};
