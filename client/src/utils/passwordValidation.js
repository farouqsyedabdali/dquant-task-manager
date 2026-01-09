// Password validation utility functions
export const validatePassword = (password) => {
  const requirements = {
    length: password.length >= 6,
    lowercase: /[a-z]/.test(password),
    uppercase: /[A-Z]/.test(password),
    number: /[0-9]/.test(password),
    special: /[^A-Za-z0-9]/.test(password)
  };

  const isValid = Object.values(requirements).every(met => met);
  
  return {
    isValid,
    requirements,
    errors: getPasswordErrors(requirements)
  };
};

export const getPasswordErrors = (requirements) => {
  const errors = [];
  
  if (!requirements.length) {
    errors.push('Password must be at least 6 characters long');
  }
  if (!requirements.lowercase) {
    errors.push('Password must contain at least one lowercase letter (a-z)');
  }
  if (!requirements.uppercase) {
    errors.push('Password must contain at least one uppercase letter (A-Z)');
  }
  if (!requirements.number) {
    errors.push('Password must contain at least one number (0-9)');
  }
  if (!requirements.special) {
    errors.push('Password must contain at least one special character (!@#$%^&*)');
  }
  
  return errors;
};

export const getPasswordStrength = (password) => {
  if (!password) return { score: 0, label: '', color: '' };

  const validation = validatePassword(password);
  const score = Object.values(validation.requirements).filter(met => met).length;

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
    requirements: validation.requirements,
    isValid: validation.isValid
  };
};
