import React from 'react';

/**
 * LoadingSpinner - A consistent loading spinner component
 * 
 * @param {Object} props
 * @param {string} props.size - Size: 'sm', 'md', 'lg', 'xl' (default: 'md')
 * @param {string} props.variant - Variant: 'spinner', 'dots', 'ring' (default: 'spinner')
 * @param {string} props.className - Additional CSS classes
 * @param {string} props.text - Optional text to display below spinner
 */
const LoadingSpinner = ({
  size = 'md',
  variant = 'spinner',
  className = '',
  text = null
}) => {
  const sizeClasses = {
    sm: 'loading-sm',
    md: 'loading-md',
    lg: 'loading-lg',
    xl: 'loading-lg' // DaisyUI doesn't have xl, use lg
  };

  const variantClasses = {
    spinner: 'loading-spinner',
    dots: 'loading-dots',
    ring: 'loading-ring'
  };

  return (
    <div className={`flex flex-col items-center justify-center ${className}`}>
      <span 
        className={`loading ${variantClasses[variant]} ${sizeClasses[size]}`}
        style={{ color: 'var(--color-primary)' }}
      />
      {text && (
        <p 
          className="mt-2 text-sm transition-colors duration-200"
          style={{ color: 'var(--color-text-secondary)' }}
        >
          {text}
        </p>
      )}
    </div>
  );
};

export default LoadingSpinner;



