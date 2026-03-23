import { useState } from 'react';
import { Link } from 'react-router-dom';
import useThemeLogo from '../hooks/useThemeLogo';

/**
 * Full login page mockup – sign in form, Google button, signup link
 * Functional: validation, hover states, tabs for sign in vs sign up
 */
const LoginPageFull = () => {
  const tialzLogo = useThemeLogo();
  const [mode, setMode] = useState('signin'); // 'signin' | 'signup'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    const errs = {};
    if (mode === 'signup' && !name.trim()) errs.name = 'Name required';
    if (!email.trim()) errs.email = 'Email required';
    else if (!/\S+@\S+\.\S+/.test(email)) errs.email = 'Invalid email';
    if (!password) errs.password = 'Password required';
    else if (password.length < 6) errs.password = 'At least 6 characters';
    setErrors(errs);
    if (Object.keys(errs).length === 0) {
      alert(`Mockup: Would ${mode === 'signin' ? 'sign in' : 'sign up'}`);
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center p-6"
      style={{
        background: 'linear-gradient(135deg, var(--color-bg-primary) 0%, var(--color-bg-tertiary) 100%)',
        color: 'var(--color-text-primary)',
      }}
    >
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <img src={tialzLogo} alt="TIALZ" className="h-16 mx-auto mb-4" />
          <h1 className="text-2xl font-bold">{mode === 'signin' ? 'Welcome back' : 'Create account'}</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--color-text-tertiary)' }}>
            {mode === 'signin' ? 'Sign in to continue' : 'Get started in under a minute'}
          </p>
        </div>

        {/* Card */}
        <div
          className="rounded-2xl border p-8 shadow-xl"
          style={{
            backgroundColor: 'var(--color-bg-secondary)',
            borderColor: 'var(--color-border-default)',
          }}
        >
          {/* Tabs */}
          <div className="flex gap-2 mb-6 p-1 rounded-xl" style={{ backgroundColor: 'var(--color-bg-tertiary)' }}>
            <button
              onClick={() => { setMode('signin'); setErrors({}); }}
              className="flex-1 py-2 rounded-lg font-medium text-sm transition-all"
              style={{
                backgroundColor: mode === 'signin' ? 'var(--color-primary)' : 'transparent',
                color: mode === 'signin' ? 'white' : 'var(--color-text-secondary)',
              }}
            >
              Sign In
            </button>
            <button
              onClick={() => { setMode('signup'); setErrors({}); }}
              className="flex-1 py-2 rounded-lg font-medium text-sm transition-all"
              style={{
                backgroundColor: mode === 'signup' ? 'var(--color-primary)' : 'transparent',
                color: mode === 'signup' ? 'white' : 'var(--color-text-secondary)',
              }}
            >
              Sign Up
            </button>
          </div>

          {/* Google */}
          <button
            type="button"
            className="w-full py-3 px-4 rounded-xl border flex items-center justify-center gap-3 mb-6"
            style={{
              backgroundColor: 'var(--color-bg-primary)',
              borderColor: 'var(--color-border-default)',
              color: 'var(--color-text-primary)',
            }}
          >
            <svg width="20" height="20" viewBox="0 0 18 18">
              <path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z"/>
              <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332C2.438 15.983 5.482 18 9 18z"/>
              <path fill="#FBBC05" d="M3.964 10.707c-.18-.54-.282-1.117-.282-1.707s.102-1.167.282-1.707V4.961H.957C.348 6.175 0 7.55 0 9s.348 2.825.957 4.039l3.007-2.332z"/>
              <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0 5.482 0 2.438 2.017.957 4.961L3.964 7.293C4.672 5.163 6.656 3.58 9 3.58z"/>
            </svg>
            Continue with Google
          </button>

          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t" style={{ borderColor: 'var(--color-border-default)' }} />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2" style={{ backgroundColor: 'var(--color-bg-secondary)', color: 'var(--color-text-tertiary)' }}>or</span>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'signup' && (
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text-secondary)' }}>Full name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border"
                  style={{
                    backgroundColor: 'var(--color-bg-tertiary)',
                    borderColor: errors.name ? '#ef4444' : 'var(--color-border-default)',
                  }}
                  placeholder="John Doe"
                />
                {errors.name && <p className="text-sm mt-1 text-red-500">{errors.name}</p>}
              </div>
            )}
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text-secondary)' }}>Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border"
                style={{
                  backgroundColor: 'var(--color-bg-tertiary)',
                  borderColor: errors.email ? '#ef4444' : 'var(--color-border-default)',
                }}
                placeholder="you@example.com"
              />
              {errors.email && <p className="text-sm mt-1 text-red-500">{errors.email}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text-secondary)' }}>Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border pr-12"
                  style={{
                    backgroundColor: 'var(--color-bg-tertiary)',
                    borderColor: errors.password ? '#ef4444' : 'var(--color-border-default)',
                  }}
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-sm"
                  style={{ color: 'var(--color-text-tertiary)' }}
                >
                  {showPassword ? 'Hide' : 'Show'}
                </button>
              </div>
              {errors.password && <p className="text-sm mt-1 text-red-500">{errors.password}</p>}
            </div>
            {mode === 'signin' && (
              <div className="flex justify-end">
                <button type="button" className="text-sm" style={{ color: 'var(--color-primary)' }}>
                  Forgot password?
                </button>
              </div>
            )}
            <button
              type="submit"
              className="w-full py-3 rounded-xl font-medium"
              style={{ backgroundColor: 'var(--color-primary)', color: 'white' }}
            >
              {mode === 'signin' ? 'Sign In' : 'Create account'}
            </button>
          </form>
        </div>

        <p className="mt-6 text-center text-sm" style={{ color: 'var(--color-text-tertiary)' }}>
          <Link to="/" style={{ color: 'var(--color-primary)' }}>← Back to home</Link>
        </p>
      </div>
    </div>
  );
};

export default LoginPageFull;
