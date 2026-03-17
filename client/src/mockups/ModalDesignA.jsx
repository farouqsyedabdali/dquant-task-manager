/**
 * Mockup: Alternative modal design
 * Idea: Softer corners, different header treatment, cleaner actions
 */
const ModalDesignA = () => {
  return (
    <div
      className="min-h-screen flex items-center justify-center p-8"
      style={{ backgroundColor: 'var(--color-bg-primary)', color: 'var(--color-text-primary)' }}
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 opacity-60"
        style={{ backgroundColor: 'black' }}
      />

      {/* Modal */}
      <div
        className="relative w-full max-w-md rounded-2xl shadow-2xl overflow-hidden"
        style={{
          backgroundColor: 'var(--color-bg-secondary)',
          borderColor: 'var(--color-border-default)',
          borderWidth: '1px',
        }}
      >
        {/* Header */}
        <div
          className="px-6 py-4 border-b"
          style={{ borderColor: 'var(--color-border-default)' }}
        >
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-semibold">Create Task</h2>
            <button
              className="w-8 h-8 rounded-lg flex items-center justify-center text-xl leading-none"
              style={{ color: 'var(--color-text-tertiary)' }}
            >
              ×
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text-secondary)' }}>
              Title
            </label>
            <input
              type="text"
              placeholder="What needs to be done?"
              className="w-full px-4 py-3 rounded-xl border"
              style={{
                backgroundColor: 'var(--color-bg-tertiary)',
                borderColor: 'var(--color-border-default)',
              }}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text-secondary)' }}>
              Due date
            </label>
            <input
              type="date"
              className="w-full px-4 py-3 rounded-xl border"
              style={{
                backgroundColor: 'var(--color-bg-tertiary)',
                borderColor: 'var(--color-border-default)',
              }}
            />
          </div>
        </div>

        {/* Footer */}
        <div
          className="px-6 py-4 border-t flex justify-end gap-3"
          style={{ borderColor: 'var(--color-border-default)' }}
        >
          <button
            className="px-4 py-2 rounded-xl font-medium"
            style={{ color: 'var(--color-text-secondary)' }}
          >
            Cancel
          </button>
          <button
            className="px-4 py-2 rounded-xl font-medium"
            style={{ backgroundColor: 'var(--color-primary)', color: 'white' }}
          >
            Create
          </button>
        </div>
      </div>
    </div>
  );
};

export default ModalDesignA;
