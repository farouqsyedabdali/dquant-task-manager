import { useState } from 'react';
import { Link } from 'react-router-dom';
import tialzLogo from '../assets/Cover (1)-Photoroom.png';

const SignupOptions = () => {
  const [selectedPlan, setSelectedPlan] = useState(null);

  const plans = [
    {
      id: 'personal',
      name: 'Personal',
      price: 'Free',
      description: 'Revolutionary AI-powered task management',
      features: [
        'AI creates tasks from any text automatically',
        'One-click creation from browser extension',
        'Assign to anyone via email',
        'Share tasks via instant email invitations',
        'Create up to 100 tasks/month, 5 projects/month',
        'AI transforms ideas into structured project plans',
        'AI matches text to existing tasks and suggests updates',
        'Perfect for freelancers, consultants & solo professionals'
      ],
      limitations: [
        'No internal employees/teams',
        'No role-based access control',
        'No bulk import/export',
        'No audit logs/advanced analytics'
      ],
      buttonText: 'Get Started',
      buttonVariant: 'btn-primary',
      disabled: false
    },
    {
      id: 'business',
      name: 'Business',
      price: 'Free*',
      description: 'Enterprise-grade AI automation that transforms how teams work',
      features: [
        'AI transforms any text into tasks instantly',
        'Create tasks from browser extension',
        'Assign to external partners via email',
        'Unlimited team members with role-based access control',
        'Complete audit logs and analytics for compliance',
        'Bulk import - onboard entire teams in minutes',
        'Create up to 300 tasks/month/user, 15 projects/month/user',
        'Real-time notifications and task invitations',
        'Enterprise multi-tenant architecture with data isolation'
      ],
      limitations: [],
      buttonText: 'Get Started',
      buttonVariant: 'btn-primary',
      disabled: false
    }
  ];

  const handlePlanSelect = (planId) => {
    setSelectedPlan(planId);
  };

  return (
    <div 
      className="min-h-screen flex items-center justify-center p-4"
      style={{ backgroundColor: 'var(--color-bg-primary)' }}
    >
      {/* Company Branding */}
      <div className="absolute top-6 left-6 flex items-center">
        <img 
          src={tialzLogo}
          alt="TIALZ Logo"
          className="h-20 w-auto object-contain"
          style={{ maxHeight: '80px' }}
        />
      </div>

      <div className="max-w-6xl w-full">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 
            className="text-4xl font-bold mb-4"
            style={{ color: 'var(--color-text-primary)' }}
          >
            Choose Your Plan
          </h1>
          <p 
            className="text-xl max-w-2xl mx-auto"
            style={{ color: 'var(--color-text-secondary)' }}
          >
            The only task manager where AI creates tasks from any text automatically. Work with anyone via email - no signups required. Experience the future of productivity - completely free during our exclusive beta phase.
          </p>
        </div>

        {/* Plans Grid */}
        <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
          {plans.map((plan) => (
            <div
              key={plan.id}
              className={`relative border-2 rounded-xl p-8 transition-all duration-300 ${
                selectedPlan === plan.id ? 'shadow-2xl' : ''
              }`}
              style={{
                backgroundColor: 'var(--color-bg-secondary)',
                borderColor: selectedPlan === plan.id 
                  ? 'var(--color-primary)' 
                  : 'var(--color-border-default)',
                boxShadow: selectedPlan === plan.id 
                  ? '0 25px 50px -12px rgba(99, 102, 241, 0.2)' 
                  : 'none'
              }}
            >
              {/* Plan Badge */}
              {plan.id === 'business' && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <span 
                    className="px-4 py-2 rounded-full text-sm font-medium"
                    style={{ 
                      backgroundColor: 'var(--color-primary)',
                      color: 'white'
                    }}
                  >
                    Recommended
                  </span>
                </div>
              )}

              {/* Plan Header */}
              <div className="text-center mb-8">
                <h2 
                  className="text-3xl font-bold mb-2"
                  style={{ color: 'var(--color-text-primary)' }}
                >
                  {plan.name}
                </h2>
                <div 
                  className="text-4xl font-bold mb-2"
                  style={{ color: 'var(--color-primary)' }}
                >
                  {plan.price}
                </div>
                <p style={{ color: 'var(--color-text-secondary)' }}>{plan.description}</p>
              </div>

              {/* Features */}
              <div className="mb-8">
                <h3 
                  className="text-lg font-semibold mb-4"
                  style={{ color: 'var(--color-text-primary)' }}
                >
                  What's Included:
                </h3>
                <ul className="space-y-3">
                  {plan.features.map((feature, index) => (
                    <li 
                      key={index} 
                      className="flex items-center"
                      style={{ color: 'var(--color-text-secondary)' }}
                    >
                      <svg 
                        className="w-5 h-5 text-green-400 mr-3 flex-shrink-0" 
                        fill="none" 
                        stroke="currentColor" 
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Action Button */}
              <div className="text-center">
                {plan.id === 'business' ? (
                  <Link
                    to="/company-signup"
                    className="btn border-0 w-full text-lg py-4"
                    style={{ 
                      backgroundColor: 'var(--color-primary)',
                      color: 'white'
                    }}
                    onMouseEnter={(e) => e.target.style.opacity = '0.9'}
                    onMouseLeave={(e) => e.target.style.opacity = '1'}
                  >
                    {plan.buttonText}
                  </Link>
                ) : plan.id === 'personal' ? (
                  <Link
                    to="/personal-signup"
                    className="btn border-0 w-full text-lg py-4"
                    style={{ 
                      backgroundColor: 'var(--color-primary)',
                      color: 'white'
                    }}
                    onMouseEnter={(e) => e.target.style.opacity = '0.9'}
                    onMouseLeave={(e) => e.target.style.opacity = '1'}
                  >
                    {plan.buttonText}
                  </Link>
                ) : (
                  <button
                    onClick={() => handlePlanSelect(plan.id)}
                    disabled={plan.disabled}
                    className={`btn border-0 w-full text-lg py-4 ${
                      plan.disabled ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                    style={{ 
                      backgroundColor: 'var(--color-primary)',
                      color: 'white'
                    }}
                    onMouseEnter={(e) => !plan.disabled && (e.target.style.opacity = '0.9')}
                    onMouseLeave={(e) => !plan.disabled && (e.target.style.opacity = '1')}
                  >
                    {plan.buttonText}
                  </button>
                )}
              </div>

            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="text-center mt-12">
          <p 
            className="mb-4"
            style={{ color: 'var(--color-text-muted)' }}
          >
            Already have an account?{' '}
            <Link 
              to="/login" 
              className="font-medium"
              style={{ color: 'var(--color-primary)' }}
              onMouseEnter={(e) => e.target.style.opacity = '0.8'}
              onMouseLeave={(e) => e.target.style.opacity = '1'}
            >
              Sign in here
            </Link>
          </p>
          <p 
            className="text-sm"
            style={{ color: 'var(--color-text-muted)' }}
          >
            Need help choosing? Contact our{' '}
            <a 
              href="mailto:support@tialz.com"
              className="font-medium"
              style={{ color: 'var(--color-primary)' }}
              onMouseEnter={(e) => e.target.style.opacity = '0.8'}
              onMouseLeave={(e) => e.target.style.opacity = '1'}
            >
              support team
            </a>
            {' '}for guidance.
          </p>
          <p 
            className="text-xs mt-6 max-w-3xl mx-auto"
            style={{ color: 'var(--color-text-tertiary)' }}
          >
            *Free during beta phase. By creating a Business account, you acknowledge and agree that TIALZ.COM INC. reserves the right to modify pricing and implement subscription fees upon conclusion of the beta development phase. You will be notified at least 30 days in advance of any pricing changes.
          </p>
        </div>
      </div>
    </div>
  );
};

export default SignupOptions;
