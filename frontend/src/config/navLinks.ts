export type NavLinkItem = {
  path: string;
  label: string;
  icon: string;
  roles?: string[];
  badge?: number;
  category?: 'primary' | 'admin';
};

export const getNavLinks = (unreadCount: number): NavLinkItem[] => [
  { path: '/dashboard', label: 'Tableau de bord', icon: 'ri-dashboard-line', roles: ['ADMIN', 'FORMATEUR', 'RESPONSABLE'], category: 'primary' },
  { path: '/student-space', label: 'Espace étudiant', icon: 'ri-graduation-cap-line', roles: ['ELEVE'], category: 'primary' },
  { path: '/students', label: 'Élèves', icon: 'ri-user-line', roles: ['ADMIN', 'FORMATEUR', 'RESPONSABLE'], category: 'primary' },
  { path: '/trainings', label: 'Formations', icon: 'ri-book-line', roles: ['ADMIN', 'RESPONSABLE'], category: 'primary' },
  { path: '/attendance', label: 'Présences', icon: 'ri-calendar-check-line', roles: ['ADMIN', 'FORMATEUR', 'RESPONSABLE'], category: 'primary' },
  { path: '/certification', label: 'Certifications', icon: 'ri-award-line', roles: ['ADMIN', 'RESPONSABLE'], category: 'primary' },
  { path: '/reports', label: 'Rapports', icon: 'ri-bar-chart-2-line', roles: ['ADMIN', 'RESPONSABLE'], category: 'primary' },
  { path: '/users', label: 'Utilisateurs', icon: 'ri-team-line', roles: ['ADMIN'], category: 'admin' },
  { path: '/admin/job-applications', label: 'Demandes de travail', icon: 'ri-briefcase-line', roles: ['ADMIN'], category: 'admin' },
  { path: '/admin/applications', label: 'Inscriptions', icon: 'ri-file-list-3-line', roles: ['ADMIN'], category: 'admin' },
  { path: '/admin/user-status', label: 'Décisions', icon: 'ri-file-check-line', roles: ['ADMIN'], category: 'admin' },
  { path: '/audit-logs', label: 'Audit', icon: 'ri-shield-check-line', roles: ['ADMIN'], category: 'admin' },
  { path: '/messages', label: 'Messages', icon: 'ri-message-3-line', badge: unreadCount, roles: ['ADMIN', 'FORMATEUR', 'RESPONSABLE'], category: 'primary' }
];

