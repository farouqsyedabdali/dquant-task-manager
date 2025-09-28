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
    <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
      {/* Company Branding */}
      <div className="absolute top-6 left-6 flex items-center space-x-3">
        <div className="w-10 h-10 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center">
          <span className="text-white font-bold text-lg">CN</span>
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white">COMPANY NAME</h1>
          <p className="text-gray-400 text-sm">Task Manager</p>
        </div>
      </div>

      <div className="max-w-6xl w-full">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-white mb-4">
            Choose Your Plan
          </h1>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto">
            Select the plan that best fits your needs. Start with Business for full team collaboration, 
            or wait for Personal plans coming soon.
          </p>
        </div>

        {/* Plans Grid */}
        <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
          {plans.map((plan) => (
            <div
              key={plan.id}
              className={`relative bg-gray-800 border-2 rounded-xl p-8 transition-all duration-300 ${
                selectedPlan === plan.id
                  ? 'border-indigo-500 shadow-2xl shadow-indigo-500/20'
                  : 'border-gray-700 hover:border-gray-600'
              }`}
            >
              {/* Plan Badge */}
              {plan.id === 'business' && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <span className="bg-indigo-600 text-white px-4 py-2 rounded-full text-sm font-medium">
                    Recommended
                  </span>
                </div>
              )}

              {/* Plan Header */}
              <div className="text-center mb-8">
                <h2 className="text-3xl font-bold text-white mb-2">{plan.name}</h2>
                <div className="text-4xl font-bold text-indigo-400 mb-2">{plan.price}</div>
                <p className="text-gray-400">{plan.description}</p>
              </div>

              {/* Features */}
              <div className="mb-8">
                <h3 className="text-lg font-semibold text-white mb-4">What's Included:</h3>
                <ul className="space-y-3">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-center text-gray-300">
                      <svg className="w-5 h-5 text-green-400 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                  <h3 className="text-lg font-semibold text-white mb-4">Limitations:</h3>
                  <ul className="space-y-2">
                    {plan.limitations.map((limitation, index) => (
                      <li key={index} className="flex items-center text-gray-400">
                        <svg className="w-4 h-4 text-yellow-400 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                    className={`btn ${plan.buttonVariant} w-full text-lg py-4`}
                  >
                    {plan.buttonText}
                  </Link>
                ) : plan.id === 'personal' ? (
                  <Link
                    to="/personal-signup"
                    className={`btn ${plan.buttonVariant} w-full text-lg py-4`}
                  >
                    {plan.buttonText}
                  </Link>
                ) : (
                  <button
                    onClick={() => handlePlanSelect(plan.id)}
                    disabled={plan.disabled}
                    className={`btn ${plan.buttonVariant} w-full text-lg py-4 ${
                      plan.disabled ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
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
          <p className="text-gray-500 mb-4">
            Already have an account?{' '}
            <Link to="/login" className="text-indigo-400 hover:text-indigo-300 font-medium">
              Sign in here
            </Link>
          </p>
          <p className="text-sm text-gray-600">
            Need help choosing? Contact our support team for guidance.
          </p>
        </div>
      </div>
    </div>
  );
};

export default SignupOptions;
