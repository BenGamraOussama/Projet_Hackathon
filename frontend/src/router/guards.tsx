import type { ReactElement } from 'react';
import { Navigate } from 'react-router-dom';
import { authService } from '../services/auth.service';

export function RequireAuth({ children }: { children: ReactElement }) {
  if (!authService.isAuthenticated()) {
    return <Navigate to="/login" replace />;
  }
  return children;
}

export function RequireRole({ role, roles, children }: { role?: string; roles?: string[]; children: ReactElement }) {
  if (!authService.isAuthenticated()) {
    return <Navigate to="/login" replace />;
  }
  const userRole = authService.getUserRole();
  const allowedRoles = roles && roles.length > 0 ? roles : role ? [role] : [];
  if (allowedRoles.length > 0 && !allowedRoles.includes(userRole || '')) {
    return <Navigate to="/dashboard" replace />;
  }
  return children;
}
