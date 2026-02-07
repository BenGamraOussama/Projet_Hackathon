import api from './api';

const USER_KEYS = {
    token: 'token',
    email: 'userEmail',
    role: 'userRole',
    firstName: 'userFirstName',
    lastName: 'userLastName',
    id: 'userId'
};

const setUserSession = (data) => {
    if (data?.accessToken) {
        localStorage.setItem(USER_KEYS.token, data.accessToken);
    }

    if (data?.user) {
        const { user } = data;
        if (user.id !== undefined && user.id !== null) {
            localStorage.setItem(USER_KEYS.id, String(user.id));
        }
        if (user.email) {
            localStorage.setItem(USER_KEYS.email, user.email);
        }
        if (user.role) {
            localStorage.setItem(USER_KEYS.role, user.role);
        }
        if (user.firstName) {
            localStorage.setItem(USER_KEYS.firstName, user.firstName);
        }
        if (user.lastName) {
            localStorage.setItem(USER_KEYS.lastName, user.lastName);
        }
    }
};

export const authService = {
    login: async (email, password) => {
        const response = await api.post('/auth/login', { email, password });
        setUserSession(response.data);
        if (!response.data?.user && email) {
            localStorage.setItem(USER_KEYS.email, email);
        }
        return response.data;
    },

    logout: () => {
        localStorage.removeItem(USER_KEYS.token);
        localStorage.removeItem(USER_KEYS.email);
        localStorage.removeItem(USER_KEYS.role);
        localStorage.removeItem(USER_KEYS.firstName);
        localStorage.removeItem(USER_KEYS.lastName);
        localStorage.removeItem(USER_KEYS.id);
    },

    getCurrentUser: () => {
        return localStorage.getItem(USER_KEYS.email);
    },

    getUserProfile: () => {
        return {
            id: localStorage.getItem(USER_KEYS.id),
            email: localStorage.getItem(USER_KEYS.email),
            role: localStorage.getItem(USER_KEYS.role),
            firstName: localStorage.getItem(USER_KEYS.firstName),
            lastName: localStorage.getItem(USER_KEYS.lastName)
        };
    },

    getUserRole: () => {
        return localStorage.getItem(USER_KEYS.role);
    },

    hasRole: (role) => {
        return localStorage.getItem(USER_KEYS.role) === role;
    },

    isAuthenticated: () => {
        return !!localStorage.getItem(USER_KEYS.token);
    }
};
