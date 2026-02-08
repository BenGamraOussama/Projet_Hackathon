import type { RouteObject } from "react-router-dom";
import NotFound from "../pages/NotFound";
import Home from "../pages/home/page";
import Dashboard from "../pages/dashboard/page";
import Login from "../pages/login/page";
import ForgotPassword from "../pages/forgot-password/page";
import ResetPassword from "../pages/reset-password/page";
import Eleves from "../pages/students/page";
import StudentDetail from "../pages/students/[id]/page";
import Trainings from "../pages/trainings/page";
import TrainingCreatePage from "../pages/trainings/new/page";
import TrainingDetailPage from "../pages/trainings/[id]/page";
import Presence from "../pages/attendance/page";
import Certification from "../pages/certification/page";
import Accessibility from "../pages/accessibility/page";
import Profile from "../pages/profile/page";
import Messages from "../pages/messages/page";
import ConversationDetail from "../pages/messages/[id]/page";
import Users from "../pages/users/page";
import Reports from "../pages/reports/page";
import AuditLogs from "../pages/audit/page";
import StudentSpace from "../pages/student-space/page";
import PendingApplications from "../pages/admin/applications/page";
import JobApplicationsPage from "../pages/admin/job-applications/page";
import UserStatusPage from "../pages/admin/user-status/page";
import { RequireAuth, RequireRole } from "./guards";

const routes: RouteObject[] = [
  {
    path: "/",
    element: <Home />,
  },
  {
    path: "/dashboard",
    element: (
      <RequireRole role="ADMIN">
        <Dashboard />
      </RequireRole>
    ),
  },
  {
    path: "/login",
    element: <Login />,
  },
  {
    path: "/forgot-password",
    element: <ForgotPassword />,
  },
  {
    path: "/reset-password",
    element: <ResetPassword />,
  },
  {
    path: "/students",
    element: (
      <RequireRole roles={["ADMIN", "RESPONSABLE", "FORMATEUR"]}>
        <Eleves />
      </RequireRole>
    ),
  },
  {
    path: "/students/:id",
    element: (
      <RequireRole roles={["ADMIN", "RESPONSABLE", "FORMATEUR"]}>
        <StudentDetail />
      </RequireRole>
    ),
  },
  {
    path: "/trainings",
    element: (
      <RequireRole roles={["ADMIN", "RESPONSABLE"]}>
        <Trainings />
      </RequireRole>
    ),
  },
  {
    path: "/trainings/new",
    element: (
      <RequireRole roles={["ADMIN", "RESPONSABLE"]}>
        <TrainingCreatePage />
      </RequireRole>
    ),
  },
  {
    path: "/trainings/:id",
    element: (
      <RequireRole roles={["ADMIN", "RESPONSABLE", "FORMATEUR"]}>
        <TrainingDetailPage />
      </RequireRole>
    ),
  },
  {
    path: "/attendance",
    element: (
      <RequireRole roles={["FORMATEUR", "RESPONSABLE"]}>
        <Presence />
      </RequireRole>
    ),
  },
  {
    path: "/student-space",
    element: (
      <RequireRole role="ELEVE">
        <StudentSpace />
      </RequireRole>
    ),
  },
  {
    path: "/certification",
    element: (
      <RequireRole roles={["ADMIN", "RESPONSABLE"]}>
        <Certification />
      </RequireRole>
    ),
  },
  {
    path: "/users",
    element: (
      <RequireRole role="ADMIN">
        <Users />
      </RequireRole>
    ),
  },
  {
    path: "/reports",
    element: (
      <RequireRole roles={["ADMIN", "RESPONSABLE"]}>
        <Reports />
      </RequireRole>
    ),
  },
  {
    path: "/audit-logs",
    element: (
      <RequireRole role="ADMIN">
        <AuditLogs />
      </RequireRole>
    ),
  },
  {
    path: "/admin/job-applications",
    element: (
      <RequireRole role="ADMIN">
        <JobApplicationsPage />
      </RequireRole>
    ),
  },
  {
    path: "/admin/applications",
    element: (
      <RequireRole role="ADMIN">
        <PendingApplications />
      </RequireRole>
    ),
  },
  {
    path: "/admin/user-status",
    element: (
      <RequireRole role="ADMIN">
        <UserStatusPage />
      </RequireRole>
    ),
  },
  {
    path: "/accessibility",
    element: (
      <RequireAuth>
        <Accessibility />
      </RequireAuth>
    ),
  },
  {
    path: "/profile",
    element: (
      <RequireAuth>
        <Profile />
      </RequireAuth>
    ),
  },
  {
    path: "/messages",
    element: (
      <RequireAuth>
        <Messages />
      </RequireAuth>
    ),
  },
  {
    path: "/messages/:id",
    element: (
      <RequireAuth>
        <ConversationDetail />
      </RequireAuth>
    ),
  },
  {
    path: "*",
    element: <NotFound />,
  },
];

export default routes;

