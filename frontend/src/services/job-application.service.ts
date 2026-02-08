import api from './api';

export type JobApplicationMatch = {
  id: number;
  email: string;
  role: string;
  firstName: string;
  lastName: string;
  status: string;
  gender?: string;
  birthDate?: string;
  phone?: string;
  address?: string;
  careerDescription?: string;
  score: number;
  matched: boolean;
};

export type JobApplicationFilterRequest = {
  role?: string;
  adminChoice?: string;
  minScore?: number;
};

export type JobApplicationDecisionResponse = {
  user: {
    id: number;
    email: string;
    role: string;
    firstName?: string;
    lastName?: string;
    status?: string;
  };
  emailSent: boolean;
  emailError?: string | null;
  message?: string;
};

const filter = async (payload: JobApplicationFilterRequest) => {
  const response = await api.post<JobApplicationMatch[]>('/job-applications/filter', payload);
  return response.data || [];
};

const approve = async (id: number) => {
  const response = await api.post<JobApplicationDecisionResponse>(`/job-applications/${id}/approve`);
  return response.data;
};

const reject = async (id: number) => {
  const response = await api.post<JobApplicationDecisionResponse>(`/job-applications/${id}/reject`);
  return response.data;
};

export const jobApplicationService = {
  filter,
  approve,
  reject,
};

