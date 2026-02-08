import api from './api';
import axios from 'axios';

const USER_KEYS = {
    token: 'token',
    email: 'userEmail',
    role: 'userRole',
    firstName: 'userFirstName',
    lastName: 'userLastName',
    id: 'userId',
    permissions: 'userPermissions'
};

const rolePermissions = {
    ADMIN: ['ADMIN_DASHBOARD', 'MANAGE_USERS', 'TRAININGS_ALL', 'ATTENDANCE_ALL', 'REPORTS_VIEW'],
    RESPONSABLE: ['TRAININGS_MANAGE', 'ATTENDANCE_MANAGE', 'REPORTS_VIEW'],
    FORMATEUR: ['ATTENDANCE_MARK', 'TRAININGS_VIEW'],
    ELEVE: ['STUDENT_PORTAL'],
    VISITEUR: ['PUBLIC']
};

const getPermissionsForRole = (role) => {
    if (!role) return [];
    return rolePermissions[role] || [];
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
            localStorage.setItem(USER_KEYS.permissions, JSON.stringify(getPermissionsForRole(user.role)));
        }
        if (user.firstName) {
            localStorage.setItem(USER_KEYS.firstName, user.firstName);
        }
        if (user.lastName) {
            localStorage.setItem(USER_KEYS.lastName, user.lastName);
        }
    }
};

const getDefaultRouteForRole = (role) => {
    switch (role) {
        case 'ADMIN':
            return '/dashboard';
        case 'RESPONSABLE':
            return '/trainings';
        case 'FORMATEUR':
            return '/attendance';
        case 'ELEVE':
            return '/student-space';
        default:
            return '/';
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

    logout: async () => {
        try {
            await api.post('/auth/logout');
        } catch (error) {
            // ignore logout failures
        }
        localStorage.removeItem(USER_KEYS.token);
        localStorage.removeItem(USER_KEYS.email);
        localStorage.removeItem(USER_KEYS.role);
        localStorage.removeItem(USER_KEYS.firstName);
        localStorage.removeItem(USER_KEYS.lastName);
        localStorage.removeItem(USER_KEYS.id);
        localStorage.removeItem(USER_KEYS.permissions);
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

    getPermissions: () => {
        const raw = localStorage.getItem(USER_KEYS.permissions);
        if (!raw) return [];
        try {
            return JSON.parse(raw);
        } catch {
            return [];
        }
    },

    getUserRole: () => {
        return localStorage.getItem(USER_KEYS.role);
    },

    hasRole: (role) => {
        return localStorage.getItem(USER_KEYS.role) === role;
    },

    getDefaultRoute: (role) => getDefaultRouteForRole(role),

    refresh: async () => {
        const refreshClient = axios.create({
            baseURL: 'http://localhost:8080/api',
            withCredentials: true,
            headers: { 'Content-Type': 'application/json' }
        });
        const response = await refreshClient.post('/auth/refresh');
        setUserSession(response.data);
        return response.data;
    },

    isAuthenticated: () => {
        return !!localStorage.getItem(USER_KEYS.token);
    }
};
