import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { useEffect, useState } from 'react';
import useAuthStore from './context/authStore';
import ProtectedRoute from './layouts/ProtectedRoute';
import AuthenticatedShell from './layouts/AuthenticatedShell';
import FontSizeProvider from './components/FontSizeProvider';
import Login from './pages/Login';
import CompanySignup from './pages/CompanySignup';
import PersonalSignup from './pages/PersonalSignup';
import SignupOptions from './pages/SignupOptions';
import Dashboard from './pages/Dashboard';
import TaskPopup from './pages/TaskPopup';
import CalendarPage from './pages/Calendar';
import Contacts from './pages/Contacts';
import Projects from './pages/Projects';
import Employees from './pages/Employees';
import Settings from './pages/Settings';
import LandingPage from './pages/LandingPage';
import TaskInvitation from './pages/TaskInvitation';
import EmailVerification from './pages/EmailVerification';
import EmployeeSetup from './pages/EmployeeSetup';
import SuperAdminDashboard from './pages/SuperAdminDashboard';
import ColorPaletteTester from './pages/ColorPaletteTester';
import TestStaging from './pages/TestStaging';
import GoogleCallback from './pages/GoogleCallback';
import LegalDocumentPage from './pages/LegalDocumentPage';
import ToastContainer from './components/common/ToastContainer';
import { ToastProvider, useToastContext } from './context/ToastContext';
import AuthRedirect from './components/AuthRedirect';
import EmailMockup from './pages/EmailMockup';
import MockupViewer from './mockups/MockupViewer';
import NotFound from './pages/NotFound';
import { tialzFavicon } from './hooks/useThemeLogo';
import { useAssistantStore } from './stores/assistantStore';
import './App.css';

function AppContent() {
  const { getMe, isAuthenticated, token } = useAuthStore();
  const [taskbarAction, setTaskbarAction] = useState(null);
  const { toasts, hideToast } = useToastContext();
  const showDevRoutes = import.meta.env.DEV;

  useEffect(() => {
    if (isAuthenticated()) {
      getMe();
    }
  }, [getMe, isAuthenticated]);

  useEffect(() => {
    document
      .querySelectorAll('link[rel="icon"], link[rel="apple-touch-icon"]')
      .forEach((link) => {
        link.href = tialzFavicon;
      });
  }, []);

  useEffect(() => {
    if (!token) return undefined;
    const onKey = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === '/') {
        e.preventDefault();
        useAssistantStore.getState().toggle();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [token]);

  useEffect(() => {
    if (window.desktop && window.desktop.onTaskbarAction) {
      window.desktop.onTaskbarAction((data) => {
        setTaskbarAction(data);
      });
    }
    return () => {
      if (window.desktop && window.desktop.removeAllListeners) {
        window.desktop.removeAllListeners('taskbar-action');
      }
    };
  }, []);

  return (
    <FontSizeProvider>
      <Router>
        <div
          className="App min-h-screen app-root-shell"
          style={{ backgroundColor: 'var(--color-bg-primary)' }}
        >
          <Routes>
            <Route path="/" element={<AuthRedirect />} />
            <Route path="/landing" element={<LandingPage />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<SignupOptions />} />
            <Route path="/company-signup" element={<CompanySignup />} />
            <Route path="/personal-signup" element={<PersonalSignup />} />
            <Route path="/auth/google/callback" element={<GoogleCallback />} />
            <Route path="/task-invitation/:token" element={<TaskInvitation />} />
            <Route path="/verify-email" element={<EmailVerification />} />
            <Route path="/complete-employee-setup" element={<EmployeeSetup />} />

            <Route path="/privacy-policy" element={<LegalDocumentPage documentType="privacy" />} />
            <Route path="/terms-of-service" element={<LegalDocumentPage documentType="terms" />} />

            <Route path="/popup" element={<TaskPopup />} />

            {showDevRoutes && (
              <>
                <Route path="/test" element={<ColorPaletteTester />} />
                <Route path="/test-staging" element={<TestStaging />} />
                <Route path="/email-mockup" element={<EmailMockup />} />
                <Route path="/mockups/*" element={<MockupViewer />} />
              </>
            )}

            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <AuthenticatedShell>
                    <Dashboard
                      taskbarAction={taskbarAction}
                      onTaskbarActionHandled={() => setTaskbarAction(null)}
                    />
                  </AuthenticatedShell>
                </ProtectedRoute>
              }
            />

            <Route
              path="/admin"
              element={
                <ProtectedRoute allowedRoles={['ADMIN', 'SYSDMIN']}>
                  <AuthenticatedShell>
                    <Dashboard
                      taskbarAction={taskbarAction}
                      onTaskbarActionHandled={() => setTaskbarAction(null)}
                    />
                  </AuthenticatedShell>
                </ProtectedRoute>
              }
            />

            <Route
              path="/employees"
              element={
                <ProtectedRoute allowedRoles={['ADMIN', 'SYSDMIN']}>
                  <AuthenticatedShell>
                    <Employees />
                  </AuthenticatedShell>
                </ProtectedRoute>
              }
            />

            <Route
              path="/super-admin"
              element={
                <ProtectedRoute allowedRoles={['SUPER_ADMIN']}>
                  <SuperAdminDashboard />
                </ProtectedRoute>
              }
            />

            <Route
              path="/settings"
              element={
                <ProtectedRoute>
                  <AuthenticatedShell>
                    <Settings />
                  </AuthenticatedShell>
                </ProtectedRoute>
              }
            />

            <Route
              path="/calendar"
              element={
                <ProtectedRoute>
                  <AuthenticatedShell>
                    <CalendarPage />
                  </AuthenticatedShell>
                </ProtectedRoute>
              }
            />

            <Route
              path="/contacts"
              element={
                <ProtectedRoute>
                  <AuthenticatedShell>
                    <Contacts />
                  </AuthenticatedShell>
                </ProtectedRoute>
              }
            />

            <Route
              path="/projects"
              element={
                <ProtectedRoute>
                  <AuthenticatedShell>
                    <Projects />
                  </AuthenticatedShell>
                </ProtectedRoute>
              }
            />

            <Route
              path="/employee"
              element={
                <ProtectedRoute allowedRoles={['EMPLOYEE']}>
                  <AuthenticatedShell>
                    <Dashboard
                      taskbarAction={taskbarAction}
                      onTaskbarActionHandled={() => setTaskbarAction(null)}
                    />
                  </AuthenticatedShell>
                </ProtectedRoute>
              }
            />

            <Route path="*" element={<NotFound />} />
          </Routes>

          {/* Floating Tialz logo FAB (toggle assistant) — commented out
          {isAuthenticated() && window.location.pathname !== '/popup' && (
            <button
              type="button"
              className="fixed bottom-6 right-6 z-40 text-white rounded-full p-4 shadow-lg flex items-center justify-center floating-ai-button lg:bottom-6"
              style={{
                backgroundColor: 'var(--color-primary)',
                boxShadow: '0 4px 24px rgba(79, 102, 241, 0.4)',
              }}
              onClick={() => useAssistantStore.getState().toggle()}
              title="Toggle AI assistant (Ctrl+/)"
            >
              <img src={tialzFavicon} alt="" className="w-8 h-8 object-contain" />
            </button>
          )}
          */}

          <ToastContainer toasts={toasts} onClose={hideToast} />
        </div>
      </Router>
    </FontSizeProvider>
  );
}

function App() {
  return (
    <ToastProvider>
      <AppContent />
    </ToastProvider>
  );
}

export default App;
