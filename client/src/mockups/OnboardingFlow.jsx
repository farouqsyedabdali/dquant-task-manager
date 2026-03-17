import { useState } from 'react';

/**
 * Onboarding flow mockup – welcome steps for new users
 */
const OnboardingFlow = () => {
  const [step, setStep] = useState(0);
  const [name, setName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const steps = [
    { title: 'Welcome!', desc: "Let's get you set up in under a minute.", cta: 'Get started' },
    { title: "What's your name?", desc: "We'll use this to personalize your experience.", field: 'name', placeholder: 'John Doe', value: name, setValue: setName, cta: 'Continue' },
    { title: 'Company or personal?', desc: 'Choose how you\'ll use Tialz.', cta: 'Continue' },
    { title: "You're all set!", desc: "Here's a quick tip to get started.", cta: 'Go to dashboard' },
  ];

  const currentStep = steps[step];

  return (
    <div
      className="min-h-screen flex items-center justify-center p-8"
      style={{
        background: 'linear-gradient(180deg, var(--color-bg-primary) 0%, var(--color-bg-tertiary) 100%)',
        color: 'var(--color-text-primary)',
      }}
    >
      <div className="w-full max-w-md">
        {/* Progress */}
        <div className="flex gap-2 mb-12">
          {steps.map((_, i) => (
            <div
              key={i}
              className="flex-1 h-1 rounded-full transition-colors"
              style={{
                backgroundColor: i <= step ? 'var(--color-primary)' : 'var(--color-bg-tertiary)',
              }}
            />
          ))}
        </div>

        {/* Content */}
        <div
          className="p-8 rounded-2xl border text-center"
          style={{
            backgroundColor: 'var(--color-bg-secondary)',
            borderColor: 'var(--color-border-default)',
          }}
        >
          <h1 className="text-2xl font-bold mb-2">{currentStep.title}</h1>
          <p className="mb-6" style={{ color: 'var(--color-text-secondary)' }}>{currentStep.desc}</p>

          {currentStep.field === 'name' && (
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={currentStep.placeholder}
              className="w-full px-4 py-3 rounded-xl border mb-6 text-center"
              style={{
                backgroundColor: 'var(--color-bg-tertiary)',
                borderColor: 'var(--color-border-default)',
              }}
              autoFocus
            />
          )}

          {step === 2 && (
            <div className="flex gap-4 mb-6">
              <button
                className="flex-1 p-6 rounded-xl border-2 transition-all"
                style={{
                  backgroundColor: 'var(--color-bg-tertiary)',
                  borderColor: 'var(--color-primary)',
                }}
              >
                <span className="text-3xl block mb-2">🏢</span>
                Company
              </button>
              <button
                className="flex-1 p-6 rounded-xl border transition-all"
                style={{
                  backgroundColor: 'var(--color-bg-tertiary)',
                  borderColor: 'var(--color-border-default)',
                }}
              >
                <span className="text-3xl block mb-2">👤</span>
                Personal
              </button>
            </div>
          )}

          {step === 3 && (
            <div className="p-6 rounded-xl mb-6 text-left" style={{ backgroundColor: 'var(--color-bg-tertiary)' }}>
              <p className="text-sm">
                <strong>Pro tip:</strong> Copy any text (email, Slack, notes) and use <strong>AI Actions</strong> in the header to create tasks instantly.
              </p>
            </div>
          )}

          <button
            onClick={() => setStep((s) => Math.min(s + 1, steps.length - 1))}
            className="w-full py-4 rounded-xl font-medium"
            style={{ backgroundColor: 'var(--color-primary)', color: 'white' }}
          >
            {currentStep.cta}
          </button>
          {step > 0 && (
            <button
              onClick={() => setStep((s) => s - 1)}
              className="mt-4 text-sm"
              style={{ color: 'var(--color-text-tertiary)' }}
            >
              Back
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default OnboardingFlow;
