/**
 * SkeletonList - Loading placeholder for list views
 * Provides visual feedback during data loading
 */

const SkeletonList = ({ count = 5, variant = 'default' }) => {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, index) => (
        <div
          key={index}
          className="rounded-lg border p-4 animate-pulse"
          style={{
            backgroundColor: 'var(--color-bg-secondary)',
            borderColor: 'var(--color-border-default)',
          }}
        >
          <div className="flex items-center space-x-4">
            {/* Avatar/Icon skeleton */}
            <div
              className="rounded-full flex-shrink-0"
              style={{
                backgroundColor: 'var(--color-bg-tertiary)',
                width: variant === 'contact' ? '48px' : '40px',
                height: variant === 'contact' ? '48px' : '40px',
              }}
            />
            
            {/* Content */}
            <div className="flex-1 space-y-2">
              {/* Title skeleton */}
              <div
                className="h-5 rounded"
                style={{
                  backgroundColor: 'var(--color-bg-tertiary)',
                  width: variant === 'contact' ? '40%' : '60%',
                }}
              />
              {/* Subtitle skeleton */}
              <div
                className="h-4 rounded"
                style={{
                  backgroundColor: 'var(--color-bg-tertiary)',
                  width: variant === 'contact' ? '50%' : '45%',
                }}
              />
            </div>

            {/* Action skeleton */}
            {variant !== 'contact' && (
              <div
                className="h-8 rounded"
                style={{
                  backgroundColor: 'var(--color-bg-tertiary)',
                  width: '80px',
                }}
              />
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

export default SkeletonList;
