import api from './api';

export const authService = {
    login: async (email, password) => {
        const response = await api.post('/auth/login', { email, password });
        if (response.data.accessToken) {
            localStorage.setItem('token', response.data.accessToken);
            localStorage.setItem('userEmail', email);
        }
        return response.data;
    },

    logout: () => {
        localStorage.removeItem('token');
        localStorage.removeItem('userEmail');
    },

    getCurrentUser: () => {
        return localStorage.getItem('userEmail');
    },

    isAuthenticated: () => {
        return !!localStorage.getItem('token');
    }
};
