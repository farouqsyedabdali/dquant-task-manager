import React from 'react';
import IconButton from './IconButton';
import { FaPlus, FaSearch, FaInbox } from 'react-icons/fa';

/**
 * EmptyState - Standardized empty state component with actionable CTAs
 * 
 * @param {string} icon - Icon name or custom React element
 * @param {string} title - Main title text
 * @param {string} description - Description text
 * @param {string} actionLabel - Label for primary action button
 * @param {Function} onAction - Callback for primary action
 * @param {string} secondaryActionLabel - Label for secondary action (optional)
 * @param {Function} onSecondaryAction - Callback for secondary action (optional)
 * @param {ReactNode} children - Additional custom content
 */
const EmptyState = ({
  icon = <FaInbox className="w-16 h-16" />,
  title,
  description,
  actionLabel,
  onAction,
  secondaryActionLabel,
  onSecondaryAction,
  children
}) => {
  // Default icon if none provided
  const defaultIcon = typeof icon === 'string' ? (
    <FaInbox className="w-16 h-16" />
  ) : icon;

  return (
    <div className="text-center py-12 px-4">
      {/* Icon */}
      <div
        className="mx-auto mb-6 flex items-center justify-center opacity-50"
        style={{ color: 'var(--color-text-tertiary)' }}
      >
        {defaultIcon}
      </div>

      {/* Title */}
      <h3
        className="text-xl font-semibold mb-2 transition-colors duration-200"
        style={{ color: 'var(--color-text-primary)' }}
      >
        {title}
      </h3>

      {/* Description */}
      {description && (
        <p
          className="mb-6 max-w-md mx-auto transition-colors duration-200"
          style={{ color: 'var(--color-text-secondary)' }}
        >
          {description}
        </p>
      )}

      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
        {actionLabel && onAction && (
          <IconButton
            icon={<FaPlus />}
            label={actionLabel}
            variant="primary"
            onClick={onAction}
            size="md"
          />
        )}
        {secondaryActionLabel && onSecondaryAction && (
          <IconButton
            icon={<FaSearch />}
            label={secondaryActionLabel}
            variant="secondary"
            onClick={onSecondaryAction}
            size="md"
          />
        )}
      </div>

      {/* Custom content */}
      {children && (
        <div className="mt-6">
          {children}
        </div>
      )}
    </div>
  );
};

export default EmptyState;
