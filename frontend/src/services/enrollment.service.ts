import api from './api';

export const enrollmentService = {
  getByStudent: async (studentId: number | string) => {
    const response = await api.get(`/enrollments/student/${studentId}`);
    return response.data;
  }
};
