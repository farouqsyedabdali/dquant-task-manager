import { useState } from 'react';

/**
 * Empty search state – when filters return no tasks
 * Current: "All Tasks (0)" + "No tasks found" – confusing
 */
const EmptySearchState = () => {
  const [search, setSearch] = useState('deploy v3');

  return (
    <div
      className="min-h-screen p-8"
      style={{ backgroundColor: 'var(--color-bg-primary)', color: 'var(--color-text-primary)' }}
    >
      <div className="max-w-2xl mx-auto">
        <div className="flex gap-3 mb-8">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search tasks..."
            className="flex-1 px-4 py-3 rounded-xl border"
            style={{
              backgroundColor: 'var(--color-bg-tertiary)',
              borderColor: 'var(--color-border-default)',
            }}
          />
          <button className="px-4 py-3 rounded-xl font-medium" style={{ backgroundColor: 'var(--color-primary)', color: 'white' }}>
            Search
          </button>
        </div>

        {/* Improved empty state */}
        <div
          className="p-12 rounded-2xl border text-center"
          style={{
            backgroundColor: 'var(--color-bg-secondary)',
            borderColor: 'var(--color-border-default)',
          }}
        >
          <div className="text-5xl mb-4 opacity-50">🔍</div>
          <h2 className="text-xl font-semibold mb-2">No tasks match "deploy v3"</h2>
          <p className="text-sm mb-6" style={{ color: 'var(--color-text-secondary)' }}>
            Try a different search term or clear your filters
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              className="px-4 py-2 rounded-full text-sm font-medium"
              style={{ borderColor: 'var(--color-border-default)', borderWidth: 1 }}
            >
              Clear search
            </button>
            <button
              className="px-4 py-2 rounded-full text-sm font-medium"
              style={{ backgroundColor: 'var(--color-primary)', color: 'white' }}
            >
              Create task
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmptySearchState;
