import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { authService } from './services/authService';
import { ProtectedRoute } from './components/ProtectedRoute';
import { UserRole } from './utils/roles';

// Pages
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import ProjectsPage from './pages/ProjectsPage';
import ProjectDetailPage from './pages/ProjectDetailPage';
import TimesheetsPage from './pages/TimesheetsPage';
import CustomersPage from './pages/CustomersPage';
import ResourcesPage from './pages/ResourcesPage';
import ReportsPage from './pages/ReportsPage';
import UsersPage from './pages/UsersPage';
import DepartmentsPage from './pages/DepartmentsPage';
import Layout from './components/Layout';

function App() {
  const isAuthenticated = authService.isAuthenticated();

  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/login"
          element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <LoginPage />}
        />
        <Route
          path="/register"
          element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <RegisterPage />}
        />
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<DashboardPage />} />
          <Route path="projects" element={<ProjectsPage />} />
          <Route path="projects/:id" element={<ProjectDetailPage />} />
          <Route path="timesheets" element={<TimesheetsPage />} />
          <Route path="resources" element={<ResourcesPage />} />
          <Route
            path="customers"
            element={
              <ProtectedRoute allowedRoles={[UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.PROJECT_MANAGER]}>
                <CustomersPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="reports"
            element={
              <ProtectedRoute allowedRoles={[UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.PROJECT_MANAGER]}>
                <ReportsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="users"
            element={
              <ProtectedRoute allowedRoles={[UserRole.SUPER_ADMIN, UserRole.ADMIN]}>
                <UsersPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="departments"
            element={
              <ProtectedRoute allowedRoles={[UserRole.SUPER_ADMIN, UserRole.ADMIN]}>
                <DepartmentsPage />
              </ProtectedRoute>
            }
          />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;

