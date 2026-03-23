/**
 * Mockup: Different empty state designs
 * Idea: Compare minimal, friendly, and actionable empty states
 */
const EmptyStateVariations = () => {
  return (
    <div
      className="min-h-screen p-8"
      style={{ backgroundColor: 'var(--color-bg-primary)', color: 'var(--color-text-primary)' }}
    >
      <h1 className="text-2xl font-bold mb-8">Empty State Variations</h1>

      <div className="space-y-12 max-w-2xl">
        {/* Variation A: Minimal */}
        <div
          className="p-8 rounded-xl border text-center"
          style={{
            backgroundColor: 'var(--color-bg-secondary)',
            borderColor: 'var(--color-border-default)',
          }}
        >
          <p className="text-4xl mb-4 opacity-50">📭</p>
          <h3 className="font-semibold mb-1">No tasks yet</h3>
          <p className="text-sm mb-4" style={{ color: 'var(--color-text-tertiary)' }}>
            Create your first task to get started
          </p>
          <button
            className="px-4 py-2 rounded-lg text-sm font-medium"
            style={{ backgroundColor: 'var(--color-primary)', color: 'white' }}
          >
            Add Task
          </button>
        </div>

        {/* Variation B: Friendly */}
        <div
          className="p-8 rounded-xl border text-center"
          style={{
            backgroundColor: 'var(--color-bg-secondary)',
            borderColor: 'var(--color-border-default)',
          }}
        >
          <p className="text-5xl mb-4">✨</p>
          <h3 className="text-xl font-semibold mb-2">You're all caught up!</h3>
          <p className="text-sm mb-6" style={{ color: 'var(--color-text-secondary)' }}>
            No tasks right now. Enjoy the calm—or add something new.
          </p>
          <div className="flex gap-3 justify-center">
            <button
              className="px-4 py-2 rounded-lg text-sm"
              style={{ borderColor: 'var(--color-border-default)', borderWidth: '1px' }}
            >
              Browse archive
            </button>
            <button
              className="px-4 py-2 rounded-lg text-sm font-medium"
              style={{ backgroundColor: 'var(--color-primary)', color: 'white' }}
            >
              New task
            </button>
          </div>
        </div>

        {/* Variation C: Action-focused */}
        <div
          className="p-8 rounded-xl border"
          style={{
            backgroundColor: 'var(--color-bg-secondary)',
            borderColor: 'var(--color-border-default)',
          }}
        >
          <div className="flex items-start gap-4">
            <div
              className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0"
              style={{ backgroundColor: 'var(--color-primary)', color: 'white', opacity: 0.9 }}
            >
              +
            </div>
            <div>
              <h3 className="font-semibold mb-1">Start with a task</h3>
              <p className="text-sm mb-4" style={{ color: 'var(--color-text-secondary)' }}>
                Paste from your clipboard or type to create one. AI will help structure it.
              </p>
              <button
                className="px-4 py-2 rounded-lg text-sm font-medium"
                style={{ backgroundColor: 'var(--color-primary)', color: 'white' }}
              >
                Create task
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmptyStateVariations;
