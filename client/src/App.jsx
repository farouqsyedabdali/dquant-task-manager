import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import useAuthStore from './context/authStore';
import ProtectedRoute from './layouts/ProtectedRoute';
import Header from './components/layout/Header';
import Login from './pages/Login';
import CompanySignup from './pages/CompanySignup';
import Dashboard from './pages/Dashboard';
import Employees from './pages/Employees';
import AIModal from './components/tasks/AIModal';
import { FaRobot } from 'react-icons/fa';
import './App.css';

function App() {
  const { getMe, isAuthenticated } = useAuthStore();
  const [isAIModalOpen, setIsAIModalOpen] = useState(false);

  useEffect(() => {
    // Check if user is authenticated and get user info
    if (isAuthenticated()) {
      getMe();
    }
  }, [getMe, isAuthenticated]);

  return (
    <Router>
      <div className="App bg-gray-900 min-h-screen">
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<CompanySignup />} />
          
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
            path="/admin"
            element={
              <ProtectedRoute allowedRoles={['ADMIN']}>
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
              <ProtectedRoute allowedRoles={['ADMIN']}>
                <div className="min-h-screen bg-gray-900">
                  <Header />
                  <Employees />
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

        {/* Floating AI Button - Only show when authenticated */}
        {isAuthenticated() && (
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
  );
}

export default App;
