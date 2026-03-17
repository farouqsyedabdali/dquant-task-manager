import { Link } from 'react-router-dom';

/**
 * 404 Not Found – friendly error page
 * Current: redirects to / – could have dedicated 404
 */
const NotFoundPage = () => {
  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center p-8"
      style={{
        backgroundColor: 'var(--color-bg-primary)',
        color: 'var(--color-text-primary)',
      }}
    >
      <div className="text-center max-w-md">
        <div className="text-8xl font-black mb-4" style={{ color: 'var(--color-primary)', opacity: 0.5 }}>
          404
        </div>
        <h1 className="text-2xl font-bold mb-2">Page not found</h1>
        <p className="mb-8" style={{ color: 'var(--color-text-secondary)' }}>
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            to="/dashboard"
            className="px-6 py-3 rounded-full font-medium"
            style={{ backgroundColor: 'var(--color-primary)', color: 'white' }}
          >
            Go to Dashboard
          </Link>
          <Link
            to="/"
            className="px-6 py-3 rounded-full font-medium border"
            style={{ borderColor: 'var(--color-border-default)', color: 'var(--color-text-secondary)' }}
          >
            Home
          </Link>
        </div>
      </div>
    </div>
  );
};

export default NotFoundPage;
