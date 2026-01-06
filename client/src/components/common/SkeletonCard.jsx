/**
 * SkeletonCard - Loading placeholder for task/project cards
 * Provides visual feedback during data loading
 */

const SkeletonCard = ({ variant = 'task' }) => {
  return (
    <div
      className="rounded-lg border p-4 animate-pulse"
      style={{
        backgroundColor: 'var(--color-bg-secondary)',
        borderColor: 'var(--color-border-default)',
      }}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          {/* Title skeleton */}
          <div
            className="h-5 rounded mb-2"
            style={{
              backgroundColor: 'var(--color-bg-tertiary)',
              width: variant === 'task' ? '70%' : '60%',
            }}
          />
          {/* Subtitle skeleton */}
          <div
            className="h-4 rounded"
            style={{
              backgroundColor: 'var(--color-bg-tertiary)',
              width: '50%',
            }}
          />
        </div>
        {/* Badge skeleton */}
        <div
          className="h-6 rounded-full"
          style={{
            backgroundColor: 'var(--color-bg-tertiary)',
            width: '60px',
          }}
        />
      </div>

      {/* Description skeleton */}
      {variant === 'task' && (
        <div className="mb-3 space-y-2">
          <div
            className="h-3 rounded"
            style={{
              backgroundColor: 'var(--color-bg-tertiary)',
              width: '100%',
            }}
          />
          <div
            className="h-3 rounded"
            style={{
              backgroundColor: 'var(--color-bg-tertiary)',
              width: '80%',
            }}
          />
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between mt-4">
        <div className="flex items-center space-x-2">
          {/* Avatar skeleton */}
          <div
            className="rounded-full"
            style={{
              backgroundColor: 'var(--color-bg-tertiary)',
              width: '24px',
              height: '24px',
            }}
          />
          {/* Name skeleton */}
          <div
            className="h-4 rounded"
            style={{
              backgroundColor: 'var(--color-bg-tertiary)',
              width: '80px',
            }}
          />
        </div>
        {/* Date skeleton */}
        <div
          className="h-4 rounded"
          style={{
            backgroundColor: 'var(--color-bg-tertiary)',
            width: '100px',
          }}
        />
      </div>
    </div>
  );
};

export default SkeletonCard;
