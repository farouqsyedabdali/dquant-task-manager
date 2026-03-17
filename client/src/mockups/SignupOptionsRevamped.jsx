import { Link } from 'react-router-dom';

/**
 * Signup Options Revamped – clearer Company vs Personal choice
 * Current: can be unclear which account type to choose
 */
const SignupOptionsRevamped = () => {
  return (
    <div
      className="min-h-screen flex items-center justify-center p-6"
      style={{
        backgroundColor: 'var(--color-bg-primary)',
        color: 'var(--color-text-primary)',
      }}
    >
      <div className="w-full max-w-2xl">
        <div className="text-center mb-12">
          <h1 className="text-3xl font-bold mb-2">Create your account</h1>
          <p className="text-base" style={{ color: 'var(--color-text-secondary)' }}>
            Choose how you'll use Tialz
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <Link
            to="/company-signup"
            className="block p-8 rounded-2xl border-2 transition-all hover:shadow-lg hover:scale-[1.02]"
            style={{
              backgroundColor: 'var(--color-bg-secondary)',
              borderColor: 'var(--color-primary)',
            }}
          >
            <div className="text-4xl mb-4">🏢</div>
            <h2 className="text-xl font-bold mb-2">Company</h2>
            <p className="text-sm mb-6" style={{ color: 'var(--color-text-secondary)' }}>
              For teams. Invite employees, assign tasks, manage projects together.
            </p>
            <span className="text-sm font-medium" style={{ color: 'var(--color-primary)' }}>Get started →</span>
          </Link>

          <Link
            to="/personal-signup"
            className="block p-8 rounded-2xl border transition-all hover:shadow-lg hover:scale-[1.02]"
            style={{
              backgroundColor: 'var(--color-bg-secondary)',
              borderColor: 'var(--color-border-default)',
            }}
          >
            <div className="text-4xl mb-4">👤</div>
            <h2 className="text-xl font-bold mb-2">Personal</h2>
            <p className="text-sm mb-6" style={{ color: 'var(--color-text-secondary)' }}>
              Just for you. Tasks, projects, and contacts. No team required.
            </p>
            <span className="text-sm font-medium" style={{ color: 'var(--color-primary)' }}>Get started →</span>
          </Link>
        </div>

        <p className="mt-8 text-center text-sm" style={{ color: 'var(--color-text-tertiary)' }}>
          Already have an account? <Link to="/login" style={{ color: 'var(--color-primary)' }}>Log in</Link>
        </p>
      </div>
    </div>
  );
};

export default SignupOptionsRevamped;
