import { useState } from 'react';
import { Link } from 'react-router-dom';

const SignupOptions = () => {
  const [selectedPlan, setSelectedPlan] = useState(null);

  const plans = [
    {
      id: 'personal',
      name: 'Personal',
      price: 'Free',
      description: 'Perfect for individual task management',
      features: [
        'Up to 10 tasks',
        'Basic task management',
        'Simple interface',
        'Local storage',
        'No collaboration'
      ],
      limitations: [
        'Limited to personal use only',
        'No team features',
        'No advanced analytics'
      ],
      buttonText: 'Get Started',
      buttonVariant: 'btn-primary',
      disabled: false
    },
    {
      id: 'business',
      name: 'Business',
      price: 'Starting at $9/month',
      description: 'Complete team collaboration platform',
      features: [
        'Unlimited tasks and projects',
        'Team collaboration',
        'Role-based access control',
        'Advanced analytics & reporting',
        'CSV import/export',
        'Priority management',
        'Due date tracking',
        'Comment system',
        'Subtasks & hierarchies',
        'Multi-tenant architecture'
      ],
      limitations: [
        'Requires company setup',
        'Admin management required'
      ],
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
      <div className="absolute top-6 left-6 flex items-center space-x-3">
        <div 
          className="w-10 h-10 rounded-lg flex items-center justify-center"
          style={{ 
            background: 'linear-gradient(to right, var(--color-primary), #9333ea)'
          }}
        >
          <span 
            className="font-bold text-lg"
            style={{ color: 'white' }}
          >
            CN
          </span>
        </div>
        <div>
          <h1 
            className="text-2xl font-bold"
            style={{ color: 'var(--color-text-primary)' }}
          >
            Tialz
          </h1>
          <p 
            className="text-sm"
            style={{ color: 'var(--color-text-secondary)' }}
          >
            Task Manager
          </p>
        </div>
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
            Select the plan that best fits your needs. Start with Business for full team collaboration, 
            or wait for Personal plans coming soon.
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

              {/* Limitations */}
              {plan.limitations.length > 0 && (
                <div className="mb-8">
                  <h3 
                    className="text-lg font-semibold mb-4"
                    style={{ color: 'var(--color-text-primary)' }}
                  >
                    Limitations:
                  </h3>
                  <ul className="space-y-2">
                    {plan.limitations.map((limitation, index) => (
                      <li 
                        key={index} 
                        className="flex items-center"
                        style={{ color: 'var(--color-text-tertiary)' }}
                      >
                        <svg 
                          className="w-4 h-4 text-yellow-400 mr-3 flex-shrink-0" 
                          fill="none" 
                          stroke="currentColor" 
                          viewBox="0 0 24 24"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                        </svg>
                        {limitation}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

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
            Need help choosing? Contact our support team for guidance.
          </p>
        </div>
      </div>
    </div>
  );
};

export default SignupOptions;
