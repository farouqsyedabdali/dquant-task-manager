import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate, Link } from 'react-router-dom';
import useAuthStore from '../context/authStore';
import ForgotPasswordModal from '../components/modals/ForgotPasswordModal';

// Use VITE_API_URL environment variable, or detect environment
const API_BASE_URL = import.meta.env.VITE_API_URL || 
  (import.meta.env.MODE === 'production' 
    ? 'https://dquant-task-manager-production.up.railway.app/api' 
    : 'http://localhost:3000/api');

// No OS icons needed - web-focused

const LandingPage = () => {
  const navigate = useNavigate();
  const { login, isLoading, error, clearError, isAuthenticated } = useAuthStore();
  
  const [loginFormData, setLoginFormData] = useState({
    email: '',
    password: '',
    rememberMe: false
  });
  const [loginErrors, setLoginErrors] = useState({});
  const [isForgotPasswordModalOpen, setIsForgotPasswordModalOpen] = useState(false);

  useEffect(() => {
    if (isAuthenticated()) {
      navigate('/dashboard');
    }
    clearError();
  }, [isAuthenticated, navigate, clearError]);

  const scrollToSection = (sectionId) => {
    document.getElementById(sectionId)?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleOpenInBrowser = () => {
    navigate('/login');
  };

  const handleLoginChange = (e) => {
    const { name, value, type, checked } = e.target;
    setLoginFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    
    if (loginErrors[name]) {
      setLoginErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateLoginForm = () => {
    const newErrors = {};
    
    if (!loginFormData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(loginFormData.email)) {
      newErrors.email = 'Email is invalid';
    }
    
    if (!loginFormData.password) {
      newErrors.password = 'Password is required';
    } else if (loginFormData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }
    
    setLoginErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateLoginForm()) {
      return;
    }

    const result = await login(loginFormData);
    if (result.success) {
      navigate('/dashboard');
    } else if (result.requiresVerification) {
      navigate(`/verify-email?email=${encodeURIComponent(result.email)}&resend=true`);
    }
  };

  const handleGoogleSignIn = () => {
    window.location.href = `${API_BASE_URL}/auth/google`;
  };

    return (
    <>
      <style>{`
        * {
          font-display: swap;
        }
        .hero-title {
          font-size: clamp(2.5rem, 6vw, 4rem) !important;
          line-height: 1.1 !important;
          font-weight: 900 !important;
        }
        
        @keyframes float-cursor {
          0%, 100% { transform: translate(0, 0); }
          25% { transform: translate(20px, -10px); }
          50% { transform: translate(40px, 10px); }
          75% { transform: translate(60px, -5px); }
        }
        
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        
        @keyframes move-avatar-1 {
          0%, 100% { transform: translate(0, 0); }
          50% { transform: translate(30px, 20px); }
        }
        
        @keyframes move-avatar-2 {
          0%, 100% { transform: translate(0, 0); }
          50% { transform: translate(-20px, -15px); }
        }
        
        @keyframes move-avatar-3 {
          0%, 100% { transform: translate(0, 0); }
          50% { transform: translate(15px, -25px); }
        }
        
        @keyframes bar-grow {
          0%, 100% { transform: scaleY(0.6); }
          50% { transform: scaleY(1); }
        }
        
        @keyframes pulse-shield {
          0%, 100% { border-color: rgba(34, 197, 94, 0.6); }
          50% { border-color: rgba(34, 197, 94, 1); }
        }
        
        @keyframes sync-pulse {
          0%, 100% { opacity: 0.3; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.2); }
        }

        /* Additional keyframes for richer feature animations */
        @keyframes cursor-move {
          0%, 12% { top: 30%; left: 5%; }
          18% { top: 30%; left: 75%; }
          20%, 24% { top: 30%; left: 75%; }
          28% { top: 42%; left: 5%; }
          33% { top: 42%; left: 55%; }
          35%, 39% { top: 42%; left: 55%; }
          43% { top: 54%; left: 5%; }
          48% { top: 54%; left: 88%; }
          50%, 55% { top: 54%; left: 88%; }
          60% { top: 54%; left: 5%; }
          65% { top: 42%; left: 5%; }
          70% { top: 30%; left: 5%; }
          72%, 100% { top: 30%; left: 5%; opacity: 1; }
        }
        @keyframes highlight-line-1 {
          0%, 15% { width: 0%; opacity: 1; }
          18%, 55% { width: 70%; opacity: 1; }
          60%, 100% { width: 0%; opacity: 0; }
        }
        @keyframes highlight-line-2 {
          0%, 26% { width: 0%; opacity: 1; }
          33%, 55% { width: 50%; opacity: 1; }
          60%, 100% { width: 0%; opacity: 0; }
        }
        @keyframes highlight-line-3 {
          0%, 41% { width: 0%; opacity: 1; }
          48%, 55% { width: 83%; opacity: 1; }
          60%, 100% { width: 0%; opacity: 0; }
        }
        @keyframes ai-window-appear {
          0%, 40% { transform: translateY(100%) scale(0.8); opacity: 0; }
          45%, 85% { transform: translateY(0) scale(1); opacity: 1; }
          90%, 100% { transform: translateY(100%) scale(0.8); opacity: 0; }
        }
        @keyframes ai-type-line-1 {
          0%, 50% { width: 0%; }
          55%, 100% { width: 100%; }
        }
        @keyframes ai-type-line-2 {
          0%, 60% { width: 0%; }
          65%, 100% { width: 85%; }
        }
        @keyframes ai-type-line-3 {
          0%, 70% { width: 0%; }
          75%, 100% { width: 90%; }
        }
        @keyframes ai-type-line-4 {
          0%, 80% { width: 0%; }
          85%, 100% { width: 65%; }
        }
        @keyframes user-message-appear {
          0%, 8% { transform: translateY(20px); opacity: 0; }
          12%, 75% { transform: translateY(0); opacity: 1; }
          80%, 100% { transform: translateY(-10px); opacity: 0; }
        }
        @keyframes ai-message-appear {
          0%, 25% { transform: translateY(20px); opacity: 0; }
          30%, 75% { transform: translateY(0); opacity: 1; }
          80%, 100% { transform: translateY(-10px); opacity: 0; }
        }
        @keyframes ai-text-type {
          0%, 30% { width: 0; }
          35%, 75% { width: 100%; }
          80%, 100% { width: 100%; }
        }
        @keyframes connection-pulse {
          0%, 100% { stroke-opacity: 0.3; }
          50% { stroke-opacity: 1; }
        }
        @keyframes number-change {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.1); }
        }
        @keyframes lock-shackle-open {
          0%, 30% { transform: translateX(-50%) rotate(0deg); }
          40%, 60% { transform: translateX(-50%) rotate(-45deg); }
          70%, 100% { transform: translateX(-50%) rotate(0deg); }
        }
        @keyframes security-blink {
          0%, 100% { opacity: 0.3; }
          50% { opacity: 1; }
        }
        @keyframes pulse-send {
          0%, 20% { opacity: 0; r: 2; }
          30%, 50% { opacity: 1; r: 8; }
          60%, 100% { opacity: 0; r: 2; }
        }
        @keyframes screen-flash-left {
          0%, 50% { opacity: 0.1; }
          60%, 75% { opacity: 1; background-color: rgba(59, 130, 246, 0.4); }
          85%, 100% { opacity: 0.1; }
        }
        @keyframes screen-flash-right {
          0%, 70% { opacity: 0.1; }
          80%, 95% { opacity: 1; background-color: rgba(59, 130, 246, 0.4); }
          100% { opacity: 0.1; }
        }
        @keyframes dashboard-card-appear {
          0%, 100% { transform: translateY(0); opacity: 1; }
          50% { transform: translateY(-5px); opacity: 0.8; }
        }
      `}</style>
      <div className="min-h-screen bg-gradient-to-br from-[#0a0a1f] via-[#15152b] to-[#1f1f35] text-white">
      {/* Fixed Company Logo in Top Left */}
      <div className="fixed top-4 left-4 z-50">
        <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">CN</span>
              </div>
              <span className="text-white font-bold text-xl">Tialz</span>
        </div>
      </div>

      {/* Fixed Launch App Button in Top Right */}
      <div className="fixed top-4 right-4 z-50">
        <button
          onClick={handleOpenInBrowser}
          className="bg-[#5865f2] hover:bg-[#4752c4] text-white px-4 py-2 rounded-lg font-semibold text-sm md:text-base"
        >
          Launch App
        </button>
          </div>


      {/* Hero Section */}
      <section className="pt-16 pb-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          {/* Text and Mockup Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center mb-16">
            {/* Left - Text */}
            <div>
              <h1 className="hero-title text-white mb-6 leading-tight">
                AI-POWERED TASK MANAGEMENT FOR MODERN TEAMS
              </h1>
              <p className="text-lg md:text-xl text-white/70 leading-relaxed max-w-2xl">
                Transform how you work with intelligent task management. Create tasks from any text, 
                collaborate with your team in real-time, and let AI handle the complexity. 
                Access from any browser, anywhere.
              </p>
              </div>

            {/* Right - Login Form */}
            <div className="relative">
              <div
                className="rounded-lg shadow-xl p-8 transition-all duration-300 w-full"
                style={{
                  backgroundColor: 'rgba(255, 255, 255, 0.1)',
                  backdropFilter: 'blur(10px)',
                  borderColor: 'rgba(255, 255, 255, 0.2)',
                  borderWidth: 1,
                }}
              >
                {/* Header */}
                <div className="text-center mb-8">
                  <h2 className="text-3xl font-bold mb-2 text-white">
                    Welcome Back
                  </h2>
                  <p className="text-white/70">
                    Sign in to your account to continue
                  </p>
                </div>

                {/* Error Alert */}
                {error && (
                  <div className="alert bg-red-900/50 border-red-700 text-red-200 mb-6">
                    <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>{error}</span>
                  </div>
                )}

                {/* Google Sign-In Button */}
                <button
                  type="button"
                  onClick={handleGoogleSignIn}
                  className="btn border w-full mb-6 flex items-center justify-center gap-3 bg-white text-black hover:bg-gray-100"
                >
                  <svg width="18" height="18" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
                    <g fill="none" fillRule="evenodd">
                      <path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z"/>
                      <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332C2.438 15.983 5.482 18 9 18z"/>
                      <path fill="#FBBC05" d="M3.964 10.707c-.18-.54-.282-1.117-.282-1.707s.102-1.167.282-1.707V4.961H.957C.348 6.175 0 7.55 0 9s.348 2.825.957 4.039l3.007-2.332z"/>
                      <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0 5.482 0 2.438 2.017.957 4.961L3.964 7.293C4.672 5.163 6.656 3.58 9 3.58z"/>
                    </g>
                  </svg>
                  <span className="font-medium">Sign in with Google</span>
                  <span className="text-sm text-gray-600">(Personal Accounts)</span>
                </button>

                <div className="divider text-white/50">OR</div>

                {/* Login Form */}
                <form onSubmit={handleLoginSubmit} className="space-y-6">
                  <div>
                    <label 
                      htmlFor="email" 
                      className="block text-sm font-medium mb-2 text-white/80"
                    >
                      Your Email Address
                    </label>
                    <input
                      id="email"
                      name="email"
                      type="email"
                      autoComplete="email"
                      required
                      value={loginFormData.email}
                      onChange={handleLoginChange}
                      className={`input w-full ${loginErrors.email ? 'border-red-500' : ''}`}
                      style={{
                        backgroundColor: 'rgba(255, 255, 255, 0.1)',
                        borderColor: loginErrors.email ? '#ef4444' : 'rgba(255, 255, 255, 0.2)',
                        color: 'white',
                      }}
                      placeholder="Enter your email"
                    />
                    {loginErrors.email && (
                      <p className="text-red-400 text-sm mt-1">{loginErrors.email}</p>
                    )}
                  </div>

                  <div>
                    <label 
                      htmlFor="password" 
                      className="block text-sm font-medium mb-2 text-white/80"
                    >
                      Password
                    </label>
                    <input
                      id="password"
                      name="password"
                      type="password"
                      autoComplete="current-password"
                      required
                      value={loginFormData.password}
                      onChange={handleLoginChange}
                      className={`input w-full ${loginErrors.password ? 'border-red-500' : ''}`}
                      style={{
                        backgroundColor: 'rgba(255, 255, 255, 0.1)',
                        borderColor: loginErrors.password ? '#ef4444' : 'rgba(255, 255, 255, 0.2)',
                        color: 'white',
                      }}
                      placeholder="Enter your password"
                    />
                    {loginErrors.password && (
                      <p className="text-red-400 text-sm mt-1">{loginErrors.password}</p>
                    )}
                  </div>

                  {/* Remember Me and Forgot Password */}
                  <div className="flex items-center justify-between">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        name="rememberMe"
                        checked={loginFormData.rememberMe}
                        onChange={handleLoginChange}
                        className="h-4 w-4 rounded"
                        style={{
                          accentColor: '#5865f2',
                        }}
                      />
                      <span className="ml-2 text-sm text-white/70">
                        Remember me for 30 days
                      </span>
                    </label>
                    <button
                      type="button"
                      onClick={() => setIsForgotPasswordModalOpen(true)}
                      className="text-sm font-medium text-[#5865f2] hover:text-[#4752c4] transition-colors"
                    >
                      Forgot password?
                    </button>
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="btn bg-[#5865f2] hover:bg-[#4752c4] text-white border-0 w-full"
                  >
                    {isLoading ? (
                      <>
                        <span className="loading loading-spinner loading-sm"></span>
                        Signing in...
                      </>
                    ) : (
                      'Sign In'
                    )}
                  </button>
                </form>

                {/* Signup Link */}
                <div className="mt-6 text-center">
                  <p className="text-white/70">
                    Don't have an account?{' '}
                    <Link 
                      to="/signup" 
                      className="font-medium text-[#5865f2] hover:text-[#4752c4] transition-colors"
                    >
                      Sign up now
                    </Link>
                  </p>
                </div>
              </div>
            </div>
          </div>
          
          {/* Centered Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={handleOpenInBrowser}
              className="bg-[#5865f2] hover:bg-[#4752c4] text-white px-8 py-3 rounded-lg font-semibold text-lg flex items-center justify-center gap-2 transition-colors"
            >
              <span>🚀</span>
              Get Started Free
            </button>
          </div>
        </div>
      </section>

      {/* Forgot Password Modal */}
      <ForgotPasswordModal
        isOpen={isForgotPasswordModalOpen}
        onClose={() => setIsForgotPasswordModalOpen(false)}
      />
    </div>
    </>
  );
};

export default LandingPage;
