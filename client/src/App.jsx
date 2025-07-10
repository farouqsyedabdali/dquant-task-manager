import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useEffect } from 'react';
import useAuthStore from './context/authStore';
import ProtectedRoute from './layouts/ProtectedRoute';
import Header from './components/layout/Header';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import './App.css';

function App() {
  const { getMe, isAuthenticated } = useAuthStore();

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
      </div>
    </Router>
  );
}

export default App;
