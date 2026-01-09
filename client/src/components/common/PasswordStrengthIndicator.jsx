import { useState, useEffect } from 'react';

const PasswordStrengthIndicator = ({ password, showRequirements = true }) => {
  const defaultRequirements = {
    length: false,
    lowercase: false,
    uppercase: false,
    number: false,
    special: false
  };
  const [strength, setStrength] = useState({ score: 0, label: '', color: '', textColor: '', requirements: defaultRequirements });

  const getPasswordStrength = (password) => {
    if (!password) return { score: 0, label: '', color: '', textColor: '', requirements: defaultRequirements };

    let score = 0;
    const requirements = {
      length: password.length >= 6,
      lowercase: /[a-z]/.test(password),
      uppercase: /[A-Z]/.test(password),
      number: /[0-9]/.test(password),
      special: /[^A-Za-z0-9]/.test(password)
    };

    // Calculate score based on requirements
    Object.values(requirements).forEach(met => {
      if (met) score++;
    });

    // Cap score at 4 for label lookup (0-4 = 5 labels)
    // Score 5 (all requirements met) should show "Very Good" same as score 4
    const labelIndex = Math.min(score, 4);

    const labels = ['Very Weak', 'Weak', 'Fair', 'Good', 'Very Good'];
    const colors = ['bg-red-500', 'bg-orange-500', 'bg-yellow-500', 'bg-blue-500', 'bg-green-500'];
    const textColors = ['text-red-500', 'text-orange-500', 'text-yellow-500', 'text-blue-500', 'text-green-500'];

    return {
      score,
      label: labels[labelIndex] || 'Very Weak',
      color: colors[labelIndex] || 'bg-red-500',
      textColor: textColors[labelIndex] || 'text-red-500',
      requirements
    };
  };

  useEffect(() => {
    setStrength(getPasswordStrength(password));
  }, [password]);

  return (
    <div className="mt-2">
      {/* Strength Bar */}
      <div className="flex space-x-1 mb-2">
        {[1, 2, 3, 4, 5].map(i => (
          <div
            key={i}
            className={`h-1 w-full rounded transition-all duration-300 ${
              i <= strength.score ? strength.color : 'bg-gray-300'
            }`}
          />
        ))}
      </div>

      {/* Strength Label */}
      <div className="flex items-center justify-between">
        <span className={`text-sm font-medium ${strength.textColor}`}>
          Password strength: {strength.label}
        </span>
        <span className="text-xs text-gray-400">
          {strength.score}/5
        </span>
      </div>

      {/* Requirements List */}
      {showRequirements && strength.requirements && (
        <div className="mt-3 space-y-1">
          <p className="text-xs text-gray-400 font-medium mb-2">Password requirements:</p>
          <div className="space-y-1">
            <div className={`flex items-center text-xs ${strength.requirements.length ? 'text-green-500' : 'text-gray-400'}`}>
              <svg className={`w-3 h-3 mr-2 ${strength.requirements.length ? 'text-green-500' : 'text-gray-400'}`} fill="currentColor" viewBox="0 0 20 20">
                {strength.requirements.length ? (
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                ) : (
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                )}
              </svg>
              At least 6 characters
            </div>
            <div className={`flex items-center text-xs ${strength.requirements.lowercase ? 'text-green-500' : 'text-gray-400'}`}>
              <svg className={`w-3 h-3 mr-2 ${strength.requirements.lowercase ? 'text-green-500' : 'text-gray-400'}`} fill="currentColor" viewBox="0 0 20 20">
                {strength.requirements.lowercase ? (
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                ) : (
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                )}
              </svg>
              One lowercase letter (a-z)
            </div>
            <div className={`flex items-center text-xs ${strength.requirements.uppercase ? 'text-green-500' : 'text-gray-400'}`}>
              <svg className={`w-3 h-3 mr-2 ${strength.requirements.uppercase ? 'text-green-500' : 'text-gray-400'}`} fill="currentColor" viewBox="0 0 20 20">
                {strength.requirements.uppercase ? (
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                ) : (
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                )}
              </svg>
              One uppercase letter (A-Z)
            </div>
            <div className={`flex items-center text-xs ${strength.requirements.number ? 'text-green-500' : 'text-gray-400'}`}>
              <svg className={`w-3 h-3 mr-2 ${strength.requirements.number ? 'text-green-500' : 'text-gray-400'}`} fill="currentColor" viewBox="0 0 20 20">
                {strength.requirements.number ? (
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                ) : (
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                )}
              </svg>
              One number (0-9)
            </div>
            <div className={`flex items-center text-xs ${strength.requirements.special ? 'text-green-500' : 'text-gray-400'}`}>
              <svg className={`w-3 h-3 mr-2 ${strength.requirements.special ? 'text-green-500' : 'text-gray-400'}`} fill="currentColor" viewBox="0 0 20 20">
                {strength.requirements.special ? (
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                ) : (
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                )}
              </svg>
              One special character (!@#$%^&*)
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PasswordStrengthIndicator;