/**
 * Mockup: Social proof / testimonials section for landing
 * Idea: Testimonials, logos, or stats to build trust
 */
const SocialProofSection = () => {
  const testimonials = [
    {
      quote: "Tialz cut our meeting prep time in half. We just paste notes and go.",
      author: "Sarah K.",
      role: "Product Manager",
    },
    {
      quote: "Finally, task management that doesn't feel like work.",
      author: "Marcus J.",
      role: "Design Lead",
    },
  ];

  const stats = [
    { value: "10K+", label: "Tasks created" },
    { value: "500+", label: "Teams" },
    { value: "99.9%", label: "Uptime" },
  ];

  return (
    <div
      className="min-h-screen py-16 px-6"
      style={{ backgroundColor: 'var(--color-bg-primary)', color: 'var(--color-text-primary)' }}
    >
      <div className="max-w-4xl mx-auto">
        <h2 className="text-3xl font-bold text-center mb-12">
          Trusted by teams that ship
        </h2>

        {/* Stats */}
        <div className="flex justify-center gap-12 mb-16">
          {stats.map((s) => (
            <div key={s.label} className="text-center">
              <div className="text-3xl font-bold" style={{ color: 'var(--color-primary)' }}>
                {s.value}
              </div>
              <div className="text-sm" style={{ color: 'var(--color-text-tertiary)' }}>
                {s.label}
              </div>
            </div>
          ))}
        </div>

        {/* Testimonials */}
        <div className="grid md:grid-cols-2 gap-6">
          {testimonials.map((t) => (
            <div
              key={t.author}
              className="p-6 rounded-2xl border"
              style={{
                backgroundColor: 'var(--color-bg-secondary)',
                borderColor: 'var(--color-border-default)',
              }}
            >
              <p className="text-lg mb-4 italic" style={{ color: 'var(--color-text-secondary)' }}>
                "{t.quote}"
              </p>
              <div>
                <span className="font-semibold">{t.author}</span>
                <span className="text-sm ml-2" style={{ color: 'var(--color-text-tertiary)' }}>
                  {t.role}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default SocialProofSection;
