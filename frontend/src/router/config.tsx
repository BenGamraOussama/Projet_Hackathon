import type { RouteObject } from "react-router-dom";
import NotFound from "../pages/NotFound";
import Home from "../pages/home/page";
import Dashboard from "../pages/dashboard/page";
import Login from "../pages/login/page";
import Students from "../pages/students/page";
import StudentDetail from "../pages/students/[id]/page";
import Trainings from "../pages/trainings/page";
import Attendance from "../pages/attendance/page";
import Certification from "../pages/certification/page";
import Accessibility from "../pages/accessibility/page";
import Profile from "../pages/profile/page";
import Messages from "../pages/messages/page";
import ConversationDetail from "../pages/messages/[id]/page";

const routes: RouteObject[] = [
  {
    path: "/",
    element: <Home />,
  },
  {
    path: "/dashboard",
    element: <Dashboard />,
  },
  {
    path: "/login",
    element: <Login />,
  },
  {
    path: "/students",
    element: <Students />,
  },
  {
    path: "/students/:id",
    element: <StudentDetail />,
  },
  {
    path: "/trainings",
    element: <Trainings />,
  },
  {
    path: "/attendance",
    element: <Attendance />,
  },
  {
    path: "/certification",
    element: <Certification />,
  },
  {
    path: "/accessibility",
    element: <Accessibility />,
  },
  {
    path: "/profile",
    element: <Profile />,
  },
  {
    path: "/messages",
    element: <Messages />,
  },
  {
    path: "/messages/:id",
    element: <ConversationDetail />,
  },
  {
    path: "*",
    element: <NotFound />,
  },
];

export default routes;
