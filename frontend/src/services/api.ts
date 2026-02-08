import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:8080/api',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

const refreshClient = axios.create({
  baseURL: 'http://localhost:8080/api',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (error.response?.status === 401 && !originalRequest?._retry) {
      originalRequest._retry = true;
      try {
        const refreshResponse = await refreshClient.post('/auth/refresh');
        const accessToken = refreshResponse.data?.accessToken;
        if (accessToken) {
          localStorage.setItem('token', accessToken);
          if (refreshResponse.data?.user) {
            const user = refreshResponse.data.user;
            if (user.id !== undefined && user.id !== null) {
              localStorage.setItem('userId', String(user.id));
            }
            if (user.email) {
              localStorage.setItem('userEmail', user.email);
            }
            if (user.role) {
              localStorage.setItem('userRole', user.role);
              const rolePermissions = {
                ADMIN: ['ADMIN_DASHBOARD', 'MANAGE_USERS', 'TRAININGS_ALL', 'ATTENDANCE_ALL', 'REPORTS_VIEW'],
                RESPONSABLE: ['TRAININGS_MANAGE', 'ATTENDANCE_MANAGE', 'REPORTS_VIEW'],
                FORMATEUR: ['ATTENDANCE_MARK', 'TRAININGS_VIEW'],
                ELEVE: ['STUDENT_PORTAL'],
                VISITEUR: ['PUBLIC']
              };
              const permissions = rolePermissions[user.role] || [];
              localStorage.setItem('userPermissions', JSON.stringify(permissions));
            }
            if (user.firstName) {
              localStorage.setItem('userFirstName', user.firstName);
            }
            if (user.lastName) {
              localStorage.setItem('userLastName', user.lastName);
            }
          }
          originalRequest.headers.Authorization = `Bearer ${accessToken}`;
          return api(originalRequest);
        }
      } catch (refreshError) {
        localStorage.removeItem('token');
      }
    }
    return Promise.reject(error);
  }
);

export default api;
