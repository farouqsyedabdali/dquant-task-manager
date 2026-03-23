/**
 * Mockup: Feature highlight cards for landing/marketing
 * Idea: Grid of feature cards with icons, titles, descriptions
 */
const FeatureCards = () => {
  const features = [
    {
      icon: '📋',
      title: 'Create from anywhere',
      desc: 'Clipboard, email, Slack. Paste and AI extracts tasks automatically.',
    },
    {
      icon: '🤝',
      title: 'Share & collaborate',
      desc: 'Invite teammates, assign tasks, add comments. Real-time updates.',
    },
    {
      icon: '📅',
      title: 'Calendar & deadlines',
      desc: 'See tasks on a calendar. Never miss a due date.',
    },
    {
      icon: '🏷️',
      title: 'Projects & events',
      desc: 'Group tasks into projects. Plan events with templates.',
    },
  ];

  return (
    <div
      className="min-h-screen py-16 px-6"
      style={{ backgroundColor: 'var(--color-bg-primary)', color: 'var(--color-text-primary)' }}
    >
      <div className="max-w-6xl mx-auto">
        <h2 className="text-3xl font-bold text-center mb-4">Everything you need</h2>
        <p className="text-center mb-12" style={{ color: 'var(--color-text-secondary)' }}>
          Built for individuals and teams
        </p>

        <div className="grid md:grid-cols-2 gap-6">
          {features.map((f) => (
            <div
              key={f.title}
              className="flex gap-6 p-6 rounded-2xl border transition-all hover:shadow-md"
              style={{
                backgroundColor: 'var(--color-bg-secondary)',
                borderColor: 'var(--color-border-default)',
              }}
            >
              <div
                className="w-14 h-14 rounded-xl flex items-center justify-center text-2xl flex-shrink-0"
                style={{ backgroundColor: 'var(--color-bg-tertiary)' }}
              >
                {f.icon}
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-2">{f.title}</h3>
                <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                  {f.desc}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default FeatureCards;
