import type { RouteObject } from "react-router-dom";
import NotFound from "../pages/NotFound";
import Home from "../pages/home/page";
import Dashboard from "../pages/dashboard/page";
import Login from "../pages/login/page";
import Students from "../pages/students/page";
import StudentDetail from "../pages/students/[id]/page";
import Trainings from "../pages/trainings/page";
import TrainingCreatePage from "../pages/trainings/new/page";
import TrainingDetailPage from "../pages/trainings/[id]/page";
import Attendance from "../pages/attendance/page";
import Certification from "../pages/certification/page";
import Accessibility from "../pages/accessibility/page";
import Profile from "../pages/profile/page";
import Messages from "../pages/messages/page";
import ConversationDetail from "../pages/messages/[id]/page";
import Users from "../pages/users/page";
import Reports from "../pages/reports/page";
import AuditLogs from "../pages/audit/page";
import { RequireAuth, RequireRole } from "./guards";

const routes: RouteObject[] = [
  {
    path: "/",
    element: <Home />,
  },
  {
    path: "/dashboard",
    element: (
      <RequireAuth>
        <Dashboard />
      </RequireAuth>
    ),
  },
  {
    path: "/login",
    element: <Login />,
  },
  {
    path: "/students",
    element: (
      <RequireAuth>
        <Students />
      </RequireAuth>
    ),
  },
  {
    path: "/students/:id",
    element: (
      <RequireAuth>
        <StudentDetail />
      </RequireAuth>
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
      <RequireAuth>
        <Attendance />
      </RequireAuth>
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
