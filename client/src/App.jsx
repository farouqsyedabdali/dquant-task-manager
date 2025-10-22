import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import useAuthStore from './context/authStore';
import './debug-env'; // Debug environment variables
import ProtectedRoute from './layouts/ProtectedRoute';
import FontSizeProvider from './components/FontSizeProvider';
import Header from './components/layout/Header';
import Login from './pages/Login';
import CompanySignup from './pages/CompanySignup';
import PersonalSignup from './pages/PersonalSignup';
import SignupOptions from './pages/SignupOptions';
import Dashboard from './pages/Dashboard';
import PersonalDashboard from './pages/PersonalDashboard';
import Employees from './pages/Employees';
import TaskPopup from './pages/TaskPopup';
import Settings from './pages/Settings';
import Calendar from './pages/Calendar';
import LandingPage from './pages/LandingPage';
import TaskInvitation from './pages/TaskInvitation';
import EmailVerification from './pages/EmailVerification';
import SuperAdminDashboard from './pages/SuperAdminDashboard';
import Contacts from './pages/Contacts';
import AIModal from './components/tasks/AIModal';
import AccessCodeModal from './components/AccessCodeModal';
import { FaRobot } from 'react-icons/fa';
import './App.css';

function App() {
  const { getMe, isAuthenticated } = useAuthStore();
  const [isAIModalOpen, setIsAIModalOpen] = useState(false);
  const [showAccessCode, setShowAccessCode] = useState(false);

  // Always show access code modal - no session persistence
  useEffect(() => {
    setShowAccessCode(true);
  }, []);

  useEffect(() => {
    // Check if user is authenticated and get user info
    if (isAuthenticated()) {
      getMe();
    }
  }, [getMe, isAuthenticated]);

  const handleAccessCodeVerified = () => {
    setShowAccessCode(false);
  };

  return (
    <FontSizeProvider>
      <Router>
        <div className="App bg-gray-900 min-h-screen">
        {/* Access Code Modal - Show before any content if not verified */}
        {showAccessCode && (
          <AccessCodeModal onCodeVerified={handleAccessCodeVerified} />
        )}
        
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/landing" element={<LandingPage />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<SignupOptions />} />
          <Route path="/company-signup" element={<CompanySignup />} />
          <Route path="/personal-signup" element={<PersonalSignup />} />
          <Route path="/task-invitation/:token" element={<TaskInvitation />} />
          <Route path="/verify-email" element={<EmailVerification />} />
          
          {/* Popup Route (no header/layout) */}
          <Route path="/popup" element={<TaskPopup />} />
          
          {/* Protected Routes */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <div className="min-h-screen bg-gray-900">
                  <Header />
                  <Dashboard />
                </div>
              </ProtectedRoute>
            }
          />
          
          <Route
            path="/personal-dashboard"
            element={
              <ProtectedRoute>
                <PersonalDashboard />
              </ProtectedRoute>
            }
          />
          
          <Route
            path="/admin"
            element={
              <ProtectedRoute allowedRoles={['ADMIN', 'SYSDMIN']}>
                <div className="min-h-screen bg-gray-900">
                  <Header />
                  <Dashboard />
                </div>
              </ProtectedRoute>
            }
          />
          
          <Route
            path="/employees"
            element={
              <ProtectedRoute allowedRoles={['ADMIN', 'SYSDMIN']}>
                <div className="min-h-screen bg-gray-900">
                  <Header />
                  <Employees />
                </div>
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
                <div className="min-h-screen bg-gray-900">
                  <Header />
                  <Settings />
                </div>
              </ProtectedRoute>
            }
          />
          
          <Route
            path="/calendar"
            element={
              <ProtectedRoute>
                <div className="min-h-screen bg-gray-900">
                  <Header />
                  <Calendar />
                </div>
              </ProtectedRoute>
            }
          />
          
          <Route
            path="/contacts"
            element={
              <ProtectedRoute>
                <div className="min-h-screen bg-gray-900">
                  <Header />
                  <Contacts />
                </div>
              </ProtectedRoute>
            }
          />
          
          <Route
            path="/employee"
            element={
              <ProtectedRoute allowedRoles={['EMPLOYEE']}>
                <div className="min-h-screen bg-gray-900">
                  <Header />
                  <Dashboard />
                </div>
              </ProtectedRoute>
            }
          />
          
          {/* Default redirect */}
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>

        {/* Floating AI Button - Only show when authenticated and not on popup */}
        {isAuthenticated() && window.location.pathname !== '/popup' && (
          <button
            className="fixed bottom-6 right-6 z-50 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full p-4 shadow-lg flex items-center justify-center"
            style={{ boxShadow: '0 4px 24px rgba(80, 80, 2)' }}
            onClick={() => setIsAIModalOpen(true)}
            title="Open AI Assistant"
          >
            <FaRobot size={28} />
          </button>
        )}

        {/* AI Modal */}
        {isAIModalOpen && (
          <AIModal isOpen={isAIModalOpen} onClose={() => setIsAIModalOpen(false)} />
        )}
      </div>
    </Router>
    </FontSizeProvider>
  );
}

export default App;
