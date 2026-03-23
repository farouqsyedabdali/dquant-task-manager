import { Link } from 'react-router-dom';
import useAuthStore from '../context/authStore';
import useThemeLogo from '../hooks/useThemeLogo';

/**
 * 404 – unknown routes (replaces silent redirect to `/`).
 */
const NotFound = () => {
  const { isAuthenticated, user } = useAuthStore();
  const authed = isAuthenticated();
  const tialzLogo = useThemeLogo();

  const dashboardPath = user?.isPersonal ? '/personal-dashboard' : '/dashboard';

  return (
    <div
      className="relative min-h-screen overflow-x-hidden"
      style={{
        backgroundColor: 'var(--color-bg-primary)',
        color: 'var(--color-text-primary)',
      }}
    >
      <div className="min-h-screen flex flex-col items-center justify-center p-8">
        <div className="text-center max-w-2xl w-full flex flex-col items-center">
          <img
            src={tialzLogo}
            alt=""
            className="h-20 sm:h-24 md:h-28 w-auto object-contain mb-8 sm:mb-10"
          />

          <div
            className="not-found-code-404 mb-4 tracking-tight select-none w-full"
            style={{ color: 'var(--color-text-primary)' }}
          >
            404
          </div>

          <h1 className="text-2xl sm:text-3xl font-bold mb-2">Page not found</h1>
          <p className="mb-10 text-sm sm:text-base max-w-md" style={{ color: 'var(--color-text-secondary)' }}>
            The page you&apos;re looking for doesn&apos;t exist or has been moved.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            {authed ? (
              <Link
                to={dashboardPath}
                className="px-6 py-3 rounded-full font-medium text-center"
                style={{ backgroundColor: 'var(--color-primary)', color: 'white' }}
              >
                Go to dashboard
              </Link>
            ) : (
              <Link
                to="/login"
                className="px-6 py-3 rounded-full font-medium text-center"
                style={{ backgroundColor: 'var(--color-primary)', color: 'white' }}
              >
                Sign in
              </Link>
            )}
            <Link
              to="/"
              className="px-6 py-3 rounded-full font-medium border text-center"
              style={{
                borderColor: 'var(--color-border-default)',
                color: 'var(--color-text-secondary)',
              }}
            >
              Home
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
