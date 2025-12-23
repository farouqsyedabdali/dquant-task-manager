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

  // Variant classes - using inline styles for theme consistency
  const getVariantStyles = (variant) => {
    const styles = {
      primary: {
        backgroundColor: 'var(--color-primary)',
        color: 'white',
      },
      secondary: {
        backgroundColor: 'var(--color-bg-tertiary)',
        color: 'var(--color-text-primary)',
        border: '1px solid var(--color-border-default)',
      },
      danger: {
        backgroundColor: '#dc2626',
        color: 'white',
      },
      ghost: {
        backgroundColor: 'transparent',
        color: 'var(--color-text-secondary)',
      },
      success: {
        backgroundColor: '#16a34a',
        color: 'white',
      },
      warning: {
        backgroundColor: '#ca8a04',
        color: 'white',
      }
    };
    return styles[variant] || styles.primary;
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
    focus:outline-none focus:ring-2 focus:ring-offset-2
    disabled:opacity-50 disabled:cursor-not-allowed
    ${sizeClasses[size]}
    ${className}
  `.trim().replace(/\s+/g, ' ');

  // Render icon with proper size and spacing
  const iconElement = icon && React.cloneElement(icon, {
    size: iconSizes[size],
    className: `${iconOnly ? '' : 'mr-2'} ${icon.props?.className || ''}`
  });

  const variantStyles = getVariantStyles(variant);
  const [isHovered, setIsHovered] = React.useState(false);

  // Calculate hover styles
  const getHoverStyles = () => {
    if (!isHovered || disabled || loading) return variantStyles;
    
    const hoverStyles = { ...variantStyles };
    
    if (variant === 'primary') {
      hoverStyles.filter = 'brightness(0.9)';
    } else if (variant === 'secondary') {
      hoverStyles.backgroundColor = 'var(--color-bg-secondary)';
    } else if (variant === 'ghost') {
      hoverStyles.backgroundColor = 'var(--color-bg-tertiary)';
      hoverStyles.color = 'var(--color-text-primary)';
    } else {
      hoverStyles.filter = 'brightness(0.9)';
    }
    
    return hoverStyles;
  };

  return (
    <button
      className={baseClasses}
      style={getHoverStyles()}
      disabled={disabled || loading}
      title={iconOnly ? label : undefined}
      aria-label={label}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
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

