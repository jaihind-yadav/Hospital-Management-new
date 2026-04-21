import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import LoginPage from "../pages/LoginPage";
import DashboardPage from "../pages/DashboardPage";
import PatientRegisterPage from "../pages/PatientRegisterPage";
import SuperAdminPage from "../pages/SuperAdminPage";
import DoctorSlotsPage from "../pages/DoctorSlotsPage";
import DoctorAppointmentsPage from "../pages/DoctorAppointmentsPage";
import ExecutiveAttendancePage from "../pages/ExecutiveAttendancePage";
import ExecutiveReportsPage from "../pages/ExecutiveReportsPage";
import ExecutiveBookingPage from "../pages/ExecutiveBookingPage";
import PatientPage from "../pages/PatientPage";
import { getStoredUser, roleHomeRoute } from "../utils/auth";

const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem("token");
  if (!token) return <Navigate to="/login" replace />;
  return children;
};

const RoleRoute = ({ role, children }) => {
  const user = getStoredUser();
  if (!user) return <Navigate to="/login" replace />;
  if (user.role !== role) return <Navigate to={roleHomeRoute(user.role)} replace />;
  return children;
};

const AppRouter = () => (
  <BrowserRouter>
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/patient/register" element={<PatientRegisterPage />} />
      <Route
        path="/super-admin"
        element={
          <ProtectedRoute>
            <RoleRoute role="super_admin">
              <SuperAdminPage />
            </RoleRoute>
          </ProtectedRoute>
        }
      />
      <Route
        path="/doctor"
        element={
          <ProtectedRoute>
            <RoleRoute role="admin">
              <Navigate to="/doctor/slots" replace />
            </RoleRoute>
          </ProtectedRoute>
        }
      />
      <Route
        path="/doctor/slots"
        element={
          <ProtectedRoute>
            <RoleRoute role="admin">
              <DoctorSlotsPage />
            </RoleRoute>
          </ProtectedRoute>
        }
      />
      <Route
        path="/doctor/appointments"
        element={
          <ProtectedRoute>
            <RoleRoute role="admin">
              <DoctorAppointmentsPage />
            </RoleRoute>
          </ProtectedRoute>
        }
      />
      <Route
        path="/patient"
        element={
          <ProtectedRoute>
            <RoleRoute role="patient">
              <PatientPage />
            </RoleRoute>
          </ProtectedRoute>
        }
      />
      <Route
        path="/executive"
        element={
          <ProtectedRoute>
            <RoleRoute role="executive">
              <Navigate to="/executive/attendance" replace />
            </RoleRoute>
          </ProtectedRoute>
        }
      />
      <Route
        path="/executive/attendance"
        element={
          <ProtectedRoute>
            <RoleRoute role="executive">
              <ExecutiveAttendancePage />
            </RoleRoute>
          </ProtectedRoute>
        }
      />
      <Route
        path="/executive/reports"
        element={
          <ProtectedRoute>
            <RoleRoute role="executive">
              <ExecutiveReportsPage />
            </RoleRoute>
          </ProtectedRoute>
        }
      />
      <Route
        path="/executive/booking"
        element={
          <ProtectedRoute>
            <RoleRoute role="executive">
              <ExecutiveBookingPage />
            </RoleRoute>
          </ProtectedRoute>
        }
      />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <DashboardPage />
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<Navigate to={roleHomeRoute(getStoredUser()?.role)} replace />} />
    </Routes>
  </BrowserRouter>
);

export default AppRouter;
