import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { axe } from 'jest-axe';
import Presence from './page';

vi.mock('../../services/student.service', () => ({
  studentService: {
    getAll: vi.fn(),
  },
}));

vi.mock('../../services/training.service', () => ({
  trainingService: {
    getAll: vi.fn(),
  },
}));

vi.mock('../../services/session.service', () => ({
  sessionService: {
    getByTraining: vi.fn(),
  },
}));

vi.mock('../../services/attendance.service', () => ({
  attendanceService: {
    getBySession: vi.fn(),
    saveBulk: vi.fn(),
  },
}));

vi.mock('../../services/auth.service', () => ({
  authService: {
    getUserRole: vi.fn(() => 'ADMIN'),
    getUserProfile: vi.fn(() => ({ firstName: 'Test', lastName: 'User', role: 'ADMIN' })),
    isAuthenticated: vi.fn(() => false),
    getCurrentUser: vi.fn(() => 'formateur@astba.tn'),
    logout: vi.fn(),
  },
}));

vi.mock('../../services/message.service', () => ({
  messageService: {
    getAll: vi.fn(() => Promise.resolve([])),
  },
}));

describe('Presence accessibility', () => {
  beforeEach(async () => {
    const { studentService } = await import('../../services/student.service');
    const { trainingService } = await import('../../services/training.service');
    const { sessionService } = await import('../../services/session.service');
    const { attendanceService } = await import('../../services/attendance.service');

    vi.mocked(studentService.getAll).mockResolvedValue([
      { id: 1, firstName: 'Ahmed', lastName: 'Ben Ali', currentLevel: 1, trainingId: 1 },
      { id: 2, firstName: 'Sara', lastName: 'Mansour', currentLevel: 1, trainingId: 1 },
    ]);
    vi.mocked(trainingService.getAll).mockResolvedValue([
      { id: 1, name: 'Advanced Web Development' },
    ]);
    vi.mocked(sessionService.getByTraining).mockResolvedValue([
      { id: 10, levelNumber: 1, sessionNumber: 1, title: 'Intro', startAt: '2026-02-01T09:00:00.000Z', durationMin: 60 },
    ]);
    vi.mocked(attendanceService.getBySession).mockResolvedValue([]);
    vi.mocked(attendanceService.saveBulk).mockResolvedValue({ ok: true });
  });

  it('has no obvious axe violations', async () => {
    const { container } = render(
      <MemoryRouter>
        <Presence />
      </MemoryRouter>
    );

    await screen.findByText('Ahmed Ben Ali');

    const results = await axe(container);
    expect(results.violations).toHaveLength(0);
  });
});

