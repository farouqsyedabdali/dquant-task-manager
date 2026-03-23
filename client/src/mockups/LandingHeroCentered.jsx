/**
 * Mockup: Hero-first landing with centered CTA
 * Idea: Full-viewport hero, no login on first screen. Single CTA to "Get Started"
 */
const LandingHeroCentered = () => {
  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center p-8 text-center"
      style={{
        background: 'linear-gradient(135deg, var(--color-bg-primary) 0%, var(--color-bg-tertiary) 100%)',
        color: 'var(--color-text-primary)',
      }}
    >
      <h1 className="text-5xl md:text-7xl font-black tracking-tight mb-6">
        INTELLIGENT TASK MANAGEMENT
      </h1>
      <p className="text-xl md:text-2xl max-w-2xl mb-10" style={{ color: 'var(--color-text-secondary)' }}>
        AI-powered. Real-time. Built for modern teams.
      </p>
      <div className="flex flex-col sm:flex-row gap-4">
        <button
          className="px-8 py-4 rounded-full font-bold text-lg transition-all hover:brightness-110"
          style={{
            backgroundColor: 'var(--color-primary)',
            color: 'white',
          }}
        >
          Get Started Free
        </button>
        <button
          className="px-8 py-4 rounded-full font-bold text-lg border-2 transition-all hover:brightness-95"
          style={{
            borderColor: 'var(--color-border-default)',
            color: 'var(--color-text-primary)',
          }}
        >
          Sign In
        </button>
      </div>
      <p className="mt-8 text-sm" style={{ color: 'var(--color-text-tertiary)' }}>
        No credit card required · Free tier available
      </p>
    </div>
  );
};

export default LandingHeroCentered;
