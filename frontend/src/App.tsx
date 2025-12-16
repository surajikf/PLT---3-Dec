import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { lazy, Suspense, useEffect } from 'react';
import { authService } from './services/authService';
import { ProtectedRoute } from './components/ProtectedRoute';
import { UserRole } from './utils/roles';
import ErrorBoundary from './components/ErrorBoundary';
import LoadingSkeleton from './components/LoadingSkeleton';

// Lazy load pages for code splitting
const LoginPage = lazy(() => import('./pages/LoginPage'));
const RegisterPage = lazy(() => import('./pages/RegisterPage'));
const ForgotPasswordPage = lazy(() => import('./pages/ForgotPasswordPage'));
const ResetPasswordPage = lazy(() => import('./pages/ResetPasswordPage'));
const DashboardPage = lazy(() => import('./pages/DashboardPage'));
const ProjectsPage = lazy(() => import('./pages/ProjectsPage'));
const ProjectDetailPage = lazy(() => import('./pages/ProjectDetailPage'));
const TimesheetsPage = lazy(() => import('./pages/TimesheetsPage'));
const CustomersPage = lazy(() => import('./pages/CustomersPage'));
const ResourcesPage = lazy(() => import('./pages/ResourcesPage'));
const ReportsPage = lazy(() => import('./pages/ReportsPage'));
const UsersPage = lazy(() => import('./pages/UsersPage'));
const DepartmentsPage = lazy(() => import('./pages/DepartmentsPage'));
const ProfitLossPage = lazy(() => import('./pages/ProfitLossPage'));
const ProjectCreatePage = lazy(() => import('./pages/ProjectCreatePage'));
const MasterManagementPage = lazy(() => import('./pages/MasterManagementPage'));
const EmailMasterPage = lazy(() => import('./pages/EmailMasterPage'));
const ProfilePage = lazy(() => import('./pages/ProfilePage'));
const Layout = lazy(() => import('./components/Layout'));

function App() {
  const isAuthenticated = authService.isAuthenticated();

  // Global cleanup: Ensure no stuck dialogs or overlays on mount
  useEffect(() => {
    // Reset body overflow in case a dialog was stuck
    document.body.style.overflow = '';
    
    // Remove any stuck backdrop overlays (safety measure)
    const stuckOverlays = document.querySelectorAll('.fixed.inset-0[class*="bg-black"], .fixed.inset-0[class*="bg-gray"]');
    stuckOverlays.forEach((overlay) => {
      const zIndex = window.getComputedStyle(overlay).zIndex;
      // Only remove if it's a high z-index overlay (likely a stuck dialog)
      if (parseInt(zIndex) >= 40) {
        const parent = overlay.parentElement;
        if (parent && parent.classList.contains('fixed')) {
          // Check if it's a dialog container
          const hasDialogContent = parent.querySelector('.bg-white.rounded-lg, .bg-white.rounded-md');
          if (!hasDialogContent) {
            // Dialog content is missing but backdrop exists - remove it
            overlay.remove();
          }
        }
      }
    });
  }, []);

  return (
    <ErrorBoundary>
      <BrowserRouter
        future={{
          v7_startTransition: true,
          v7_relativeSplatPath: true,
        }}
      >
        <Suspense fallback={<LoadingSkeleton />}>
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
          path="/forgot-password"
          element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <ForgotPasswordPage />}
        />
        <Route
          path="/reset-password"
          element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <ResetPasswordPage />}
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
          <Route path="projects/new" element={<ProjectCreatePage />} />
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
          <Route
            path="profit-loss"
            element={
              <ProtectedRoute allowedRoles={[UserRole.SUPER_ADMIN, UserRole.ADMIN]}>
                <ProfitLossPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="master-management"
            element={
              <ProtectedRoute allowedRoles={[UserRole.SUPER_ADMIN, UserRole.ADMIN]}>
                <MasterManagementPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="email-master"
            element={
              <ProtectedRoute allowedRoles={[UserRole.SUPER_ADMIN, UserRole.ADMIN]}>
                <EmailMasterPage />
              </ProtectedRoute>
            }
          />
          <Route path="profile" element={<ProfilePage />} />
          </Route>
        </Routes>
        </Suspense>
      </BrowserRouter>
    </ErrorBoundary>
  );
}

export default App;

