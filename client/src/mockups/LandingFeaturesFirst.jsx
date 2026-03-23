/**
 * Mockup: Features-first landing
 * Idea: Show value proposition before any auth. Feature cards with icons.
 */
const LandingFeaturesFirst = () => {
  const features = [
    { icon: '🤖', title: 'AI-Powered', desc: 'Create tasks from natural language' },
    { icon: '⚡', title: 'Real-Time Sync', desc: 'Collaborate live with your team' },
    { icon: '📱', title: 'Everywhere', desc: 'Web, mobile, extensions' },
  ];

  return (
    <div
      className="min-h-screen py-16 px-6"
      style={{ backgroundColor: 'var(--color-bg-primary)', color: 'var(--color-text-primary)' }}
    >
      <div className="max-w-4xl mx-auto text-center mb-16">
        <h1 className="text-4xl md:text-5xl font-bold mb-4">
          Task management that thinks with you
        </h1>
        <p className="text-xl" style={{ color: 'var(--color-text-secondary)' }}>
          Stop copying. Start doing. Tialz understands what you mean.
        </p>
      </div>

      <div className="max-w-5xl mx-auto grid md:grid-cols-3 gap-8 mb-16">
        {features.map((f) => (
          <div
            key={f.title}
            className="p-6 rounded-2xl border transition-all hover:shadow-lg"
            style={{
              backgroundColor: 'var(--color-bg-secondary)',
              borderColor: 'var(--color-border-default)',
            }}
          >
            <span className="text-4xl mb-4 block">{f.icon}</span>
            <h3 className="text-xl font-semibold mb-2">{f.title}</h3>
            <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
              {f.desc}
            </p>
          </div>
        ))}
      </div>

      <div className="text-center">
        <button
          className="px-10 py-4 rounded-full font-semibold text-lg transition-all hover:brightness-110"
          style={{ backgroundColor: 'var(--color-primary)', color: 'white' }}
        >
          Try it free
        </button>
      </div>
    </div>
  );
};

export default LandingFeaturesFirst;
