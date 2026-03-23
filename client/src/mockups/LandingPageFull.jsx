import { useState } from 'react';
import { Link } from 'react-router-dom';
import useThemeLogo from '../hooks/useThemeLogo';

/**
 * Full landing page mockup – Discord-inspired
 * Hero with two columns, alternating feature sections, theme-aware
 */
const LandingPageFull = () => {
  const tialzLogo = useThemeLogo();
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginErrors, setLoginErrors] = useState({});

  const scrollTo = (id) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleLoginSubmit = (e) => {
    e.preventDefault();
    const errs = {};
    if (!loginEmail.trim()) errs.email = 'Email required';
    else if (!/\S+@\S+\.\S+/.test(loginEmail)) errs.email = 'Invalid email';
    if (!loginPassword) errs.password = 'Password required';
    else if (loginPassword.length < 6) errs.password = 'Min 6 characters';
    setLoginErrors(errs);
    if (Object.keys(errs).length === 0) {
      alert('Mockup: Would sign in');
      setIsLoginOpen(false);
    }
  };

  return (
    <div
      className="min-h-screen"
      style={{ backgroundColor: 'var(--color-bg-primary)', color: 'var(--color-text-primary)' }}
    >
      {/* Header – Discord-style minimal */}
      <header
        className="fixed top-0 left-0 right-0 z-40"
        style={{
          backgroundColor: 'var(--color-bg-primary)',
          borderBottom: '1px solid var(--color-border-default)',
        }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <img src={tialzLogo} alt="TIALZ" className="h-8 w-auto" />
            <nav className="hidden md:flex items-center gap-6">
              <button onClick={() => scrollTo('features')} className="text-sm font-medium hover:underline" style={{ color: 'var(--color-text-secondary)' }}>
                Features
              </button>
              <button onClick={() => scrollTo('how-it-works')} className="text-sm font-medium hover:underline" style={{ color: 'var(--color-text-secondary)' }}>
                How it works
              </button>
              <button onClick={() => setIsLoginOpen(true)} className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>
                Login
              </button>
              <Link
                to="/signup"
                className="px-5 py-2.5 rounded-full font-medium text-sm transition-all hover:brightness-110"
                style={{ backgroundColor: 'var(--color-primary)', color: 'white' }}
              >
                Get started
              </Link>
            </nav>
          </div>
        </div>
      </header>

      {/* Hero – Discord-style: headline left, product mockup right */}
      <section className="pt-28 pb-20 px-4 sm:px-6 lg:px-8 overflow-hidden">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            <div>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight mb-6 leading-[1.1]">
                Task management that's all fun and games
              </h1>
              <p className="text-lg md:text-xl mb-8 max-w-xl" style={{ color: 'var(--color-text-secondary)' }}>
                Tialz is great for getting things done with your team—or even going solo. Create tasks from anywhere, let AI help, and actually finish what you start.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link
                  to="/signup"
                  className="inline-flex items-center justify-center px-8 py-4 rounded-full font-semibold text-base transition-all hover:brightness-110"
                  style={{ backgroundColor: 'var(--color-primary)', color: 'white' }}
                >
                  Get started
                </Link>
                <button
                  onClick={() => setIsLoginOpen(true)}
                  className="inline-flex items-center justify-center px-8 py-4 rounded-full font-semibold text-base border-2 transition-all"
                  style={{ borderColor: 'var(--color-border-default)', color: 'var(--color-text-primary)' }}
                >
                  Open in browser
                </button>
              </div>
            </div>
            {/* Product mockup – Discord-style floating window */}
            <div className="relative hidden lg:block">
              <div
                className="rounded-2xl border-2 overflow-hidden shadow-2xl"
                style={{
                  backgroundColor: 'var(--color-bg-secondary)',
                  borderColor: 'var(--color-border-default)',
                }}
              >
                {/* Mock app chrome */}
                <div className="flex items-center gap-2 px-4 py-3 border-b" style={{ borderColor: 'var(--color-border-default)' }}>
                  <div className="flex gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: 'var(--color-text-tertiary)' }} />
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: 'var(--color-text-tertiary)' }} />
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: 'var(--color-text-tertiary)' }} />
                  </div>
                  <span className="text-xs ml-4" style={{ color: 'var(--color-text-tertiary)' }}>Tialz — Dashboard</span>
                </div>
                <div className="flex p-4" style={{ minHeight: 320 }}>
                  {/* Sidebar */}
                  <div className="w-1/4 space-y-2 pr-4" style={{ borderRight: '1px solid var(--color-border-default)' }}>
                    {['Dashboard', 'Projects', 'Calendar'].map((item, i) => (
                      <div key={item} className="flex items-center gap-2 py-2 px-3 rounded-lg" style={{ backgroundColor: i === 0 ? 'var(--color-bg-tertiary)' : 'transparent' }}>
                        <div className="w-4 h-4 rounded" style={{ backgroundColor: 'var(--color-primary)', opacity: 0.6 }} />
                        <span className="text-sm" style={{ color: 'var(--color-text-primary)' }}>{item}</span>
                      </div>
                    ))}
                  </div>
                  {/* Main content */}
                  <div className="flex-1 pl-4">
                    <div className="h-4 w-1/3 rounded mb-6" style={{ backgroundColor: 'var(--color-bg-tertiary)' }} />
                    <div className="space-y-3">
                      {[1, 2, 3].map((i) => (
                        <div key={i} className="flex gap-3 p-3 rounded-lg" style={{ backgroundColor: 'var(--color-bg-tertiary)' }}>
                          <div className="w-8 h-8 rounded-full flex-shrink-0" style={{ backgroundColor: 'var(--color-primary)', opacity: 0.5 }} />
                          <div className="flex-1">
                            <div className="h-3 w-3/4 rounded mb-2" style={{ backgroundColor: 'var(--color-bg-quaternary)' }} />
                            <div className="h-2 w-1/2 rounded" style={{ backgroundColor: 'var(--color-bg-quaternary)', opacity: 0.7 }} />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features – alternating layout like Discord */}
      <section id="features" className="py-24 px-4 sm:px-6 lg:px-8" style={{ backgroundColor: 'var(--color-bg-secondary)' }}>
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-16 items-center mb-24">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold mb-4">Create tasks from anywhere</h2>
              <p className="text-lg mb-6" style={{ color: 'var(--color-text-secondary)' }}>
                Paste from email, Slack, or your clipboard. AI extracts the task—title, due date, priority—so you don't have to.
              </p>
              <ul className="space-y-3">
                {['Clipboard to task in one click', 'Works in browser extensions', 'Mobile-friendly'].map((item) => (
                  <li key={item} className="flex items-center gap-3" style={{ color: 'var(--color-text-secondary)' }}>
                    <span className="w-6 h-6 rounded-full flex items-center justify-center text-sm" style={{ backgroundColor: 'var(--color-primary)', color: 'white' }}>✓</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <div className="flex justify-center">
              <div className="w-full max-w-sm p-6 rounded-2xl border" style={{ backgroundColor: 'var(--color-bg-primary)', borderColor: 'var(--color-border-default)' }}>
                <div className="text-4xl mb-4">📋</div>
                <p className="font-medium mb-2">"Review PR #142 by Friday"</p>
                <p className="text-sm mb-4" style={{ color: 'var(--color-text-tertiary)' }}>Paste ↑ → AI creates task</p>
                <div className="h-2 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--color-bg-tertiary)' }}>
                  <div className="h-full rounded-full" style={{ width: '70%', backgroundColor: 'var(--color-primary)' }} />
                </div>
              </div>
            </div>
          </div>

          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div className="order-2 lg:order-1 flex justify-center">
              <div className="w-full max-w-sm p-6 rounded-2xl border" style={{ backgroundColor: 'var(--color-bg-primary)', borderColor: 'var(--color-border-default)' }}>
                <div className="text-4xl mb-4">👥</div>
                <p className="font-medium mb-2">Assign, comment, collaborate</p>
                <p className="text-sm" style={{ color: 'var(--color-text-tertiary)' }}>Real-time updates</p>
              </div>
            </div>
            <div className="order-1 lg:order-2">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">Hop in when you're free</h2>
              <p className="text-lg mb-6" style={{ color: 'var(--color-text-secondary)' }}>
                Invite your team, assign tasks, and leave comments. No need to schedule a call—just drop an update and move on.
              </p>
              <ul className="space-y-3">
                {['Real-time sync', 'Comments & updates', 'Project groups'].map((item) => (
                  <li key={item} className="flex items-center gap-3" style={{ color: 'var(--color-text-secondary)' }}>
                    <span className="w-6 h-6 rounded-full flex items-center justify-center text-sm" style={{ backgroundColor: 'var(--color-primary)', color: 'white' }}>✓</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* How it works – simple CTA block */}
      <section id="how-it-works" className="py-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">Ready to chill?</h2>
          <p className="text-lg mb-10" style={{ color: 'var(--color-text-secondary)' }}>
            Create your free account. No credit card, no hassle.
          </p>
          <Link
            to="/signup"
            className="inline-flex items-center justify-center px-10 py-4 rounded-full font-semibold text-lg transition-all hover:brightness-110"
            style={{ backgroundColor: 'var(--color-primary)', color: 'white' }}
          >
            Get started
          </Link>
        </div>
      </section>

      {/* Footer – Discord-style minimal */}
      <footer className="py-12 px-4 sm:px-6 lg:px-8 border-t" style={{ borderColor: 'var(--color-border-default)' }}>
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
          <img src={tialzLogo} alt="TIALZ" className="h-8 w-auto" />
          <div className="flex gap-8">
            <Link to="/privacy-policy" className="text-sm" style={{ color: 'var(--color-text-tertiary)' }}>Privacy</Link>
            <Link to="/terms-of-service" className="text-sm" style={{ color: 'var(--color-text-tertiary)' }}>Terms</Link>
            <a href="mailto:support@tialz.com" className="text-sm" style={{ color: 'var(--color-primary)' }}>Contact</a>
          </div>
        </div>
        <p className="text-center text-xs mt-6" style={{ color: 'var(--color-text-tertiary)' }}>© TIALZ.COM Inc.</p>
      </footer>

      {/* Login Modal */}
      {isLoginOpen && (
        <>
          <div className="fixed inset-0 z-50" style={{ backgroundColor: 'rgba(0,0,0,0.6)' }} onClick={() => setIsLoginOpen(false)} />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => setIsLoginOpen(false)}>
            <div
              className="relative w-full max-w-md rounded-2xl shadow-2xl p-8"
              style={{ backgroundColor: 'var(--color-bg-secondary)', borderColor: 'var(--color-border-default)', borderWidth: 1 }}
              onClick={(e) => e.stopPropagation()}
            >
              <button
                type="button"
                onClick={() => setIsLoginOpen(false)}
                className="absolute top-4 right-4 w-8 h-8 rounded-full flex items-center justify-center text-xl hover:bg-black/5 dark:hover:bg-white/5"
                style={{ color: 'var(--color-text-tertiary)' }}
              >
                ×
              </button>
              <h2 className="text-2xl font-bold mb-6">Welcome back</h2>
              <form onSubmit={handleLoginSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text-secondary)' }}>Email</label>
                  <input
                    type="email"
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    className="w-full px-4 py-3 rounded-lg border"
                    style={{
                      backgroundColor: 'var(--color-bg-tertiary)',
                      borderColor: loginErrors.email ? '#ef4444' : 'var(--color-border-default)',
                    }}
                    placeholder="you@company.com"
                  />
                  {loginErrors.email && <p className="text-sm mt-1" style={{ color: '#ef4444' }}>{loginErrors.email}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text-secondary)' }}>Password</label>
                  <input
                    type="password"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    className="w-full px-4 py-3 rounded-lg border"
                    style={{
                      backgroundColor: 'var(--color-bg-tertiary)',
                      borderColor: loginErrors.password ? '#ef4444' : 'var(--color-border-default)',
                    }}
                    placeholder="••••••••"
                  />
                  {loginErrors.password && <p className="text-sm mt-1" style={{ color: '#ef4444' }}>{loginErrors.password}</p>}
                </div>
                <button
                  type="submit"
                  className="w-full py-3 rounded-full font-medium"
                  style={{ backgroundColor: 'var(--color-primary)', color: 'white' }}
                >
                  Log In
                </button>
              </form>
              <p className="mt-4 text-sm text-center" style={{ color: 'var(--color-text-tertiary)' }}>
                Need an account? <Link to="/signup" className="font-medium" style={{ color: 'var(--color-primary)' }}>Register</Link>
              </p>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default LandingPageFull;
