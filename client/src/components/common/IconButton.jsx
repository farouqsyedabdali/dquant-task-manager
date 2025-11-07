import React from 'react';

/**
 * IconButton - A reusable button component that supports icons with optional text
 * 
 * @param {Object} props
 * @param {ReactNode} props.icon - The icon component (from react-icons)
 * @param {string} props.label - Text label (optional, shows as tooltip if iconOnly)
 * @param {boolean} props.iconOnly - Show only icon (default: false)
 * @param {string} props.variant - Button style: 'primary', 'secondary', 'danger', 'ghost', 'success'
 * @param {string} props.size - Size: 'sm', 'md', 'lg'
 * @param {boolean} props.disabled - Disabled state
 * @param {boolean} props.loading - Loading state
 * @param {string} props.className - Additional CSS classes
 * @param {Object} props - All other button props
 */
const IconButton = ({
  icon,
  label,
  iconOnly = false,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  className = '',
  ...props
}) => {
  // Size classes
  const sizeClasses = {
    sm: iconOnly ? 'p-1.5' : 'px-2 py-1.5 text-sm',
    md: iconOnly ? 'p-2' : 'px-3 py-2',
    lg: iconOnly ? 'p-3' : 'px-4 py-3 text-lg'
  };

  // Variant classes
  const variantClasses = {
    primary: 'bg-indigo-600 hover:bg-indigo-700 text-white',
    secondary: 'bg-gray-700 hover:bg-gray-600 text-white',
    danger: 'bg-red-600 hover:bg-red-700 text-white',
    ghost: 'bg-transparent hover:bg-gray-700 text-gray-300 hover:text-white',
    success: 'bg-green-600 hover:bg-green-700 text-white',
    warning: 'bg-yellow-600 hover:bg-yellow-700 text-white'
  };

  // Icon size based on button size
  const iconSizes = {
    sm: 16,
    md: 20,
    lg: 24
  };

  const baseClasses = `
    inline-flex items-center justify-center
    rounded-lg font-medium
    transition-all duration-200
    focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500
    disabled:opacity-50 disabled:cursor-not-allowed
    ${sizeClasses[size]}
    ${variantClasses[variant]}
    ${className}
  `.trim().replace(/\s+/g, ' ');

  // Render icon with proper size and spacing
  const iconElement = icon && React.cloneElement(icon, {
    size: iconSizes[size],
    className: `${iconOnly ? '' : 'mr-2'} ${icon.props?.className || ''}`
  });

  return (
    <button
      className={baseClasses}
      disabled={disabled || loading}
      title={iconOnly ? label : undefined}
      aria-label={label}
      {...props}
    >
      {loading ? (
        <span className="loading loading-spinner loading-sm"></span>
      ) : (
        <>
          {iconElement}
          {!iconOnly && label && <span>{label}</span>}
        </>
      )}
    </button>
  );
};

export default IconButton;

