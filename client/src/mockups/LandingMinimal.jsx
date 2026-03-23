/**
 * Mockup: Minimal typography-focused landing
 * Idea: Bold, minimal, lots of whitespace. Single focal point.
 */
const LandingMinimal = () => {
  return (
    <div
      className="min-h-screen flex flex-col justify-between p-12 md:p-20"
      style={{ backgroundColor: 'var(--color-bg-primary)', color: 'var(--color-text-primary)' }}
    >
      <header className="flex justify-between items-center">
        <span className="text-2xl font-bold tracking-tight">TIALZ</span>
        <nav className="flex gap-8">
          <a href="#" style={{ color: 'var(--color-text-secondary)' }}>Features</a>
          <a href="#" style={{ color: 'var(--color-text-secondary)' }}>Pricing</a>
          <a href="#" style={{ color: 'var(--color-primary)' }}>Sign In</a>
        </nav>
      </header>

      <main className="flex-1 flex flex-col justify-center max-w-3xl">
        <h1 className="text-6xl md:text-8xl font-black leading-none tracking-tighter mb-8">
          Do more.<br />Worry less.
        </h1>
        <p className="text-xl mb-12" style={{ color: 'var(--color-text-tertiary)' }}>
          AI task management for people who ship.
        </p>
        <button
          className="w-fit px-6 py-3 rounded-full font-medium transition-all hover:brightness-95"
          style={{ backgroundColor: 'var(--color-text-primary)', color: 'var(--color-bg-primary)' }}
        >
          Get started
        </button>
      </main>

      <footer className="text-sm" style={{ color: 'var(--color-text-tertiary)' }}>
        © 2025 TIALZ.COM Inc.
      </footer>
    </div>
  );
};

export default LandingMinimal;
