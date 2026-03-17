import { useState } from 'react';

/**
 * Bulk Actions Bar – multi-select tasks, complete/archive in batch
 * Current: no bulk actions in the app
 */
const BulkActionsBar = () => {
  const [selectedCount, setSelectedCount] = useState(3);

  return (
    <div
      className="min-h-screen p-8"
      style={{ backgroundColor: 'var(--color-bg-primary)', color: 'var(--color-text-primary)' }}
    >
      <div className="max-w-3xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">Bulk actions (proposed)</h1>

        {/* Floating bar – appears when tasks selected */}
        <div
          className="sticky top-4 z-10 flex items-center justify-between gap-4 p-4 rounded-2xl border shadow-lg mb-8"
          style={{
            backgroundColor: 'var(--color-bg-secondary)',
            borderColor: 'var(--color-primary)',
          }}
        >
          <div className="flex items-center gap-3">
            <span className="font-semibold">{selectedCount} selected</span>
            <button className="text-sm" style={{ color: 'var(--color-text-tertiary)' }}>
              Clear selection
            </button>
          </div>
          <div className="flex gap-2">
            <button
              className="px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2"
              style={{ backgroundColor: 'var(--color-primary)', color: 'white' }}
            >
              ✓ Complete
            </button>
            <button
              className="px-4 py-2 rounded-lg text-sm font-medium border"
              style={{ borderColor: 'var(--color-border-default)', color: 'var(--color-text-secondary)' }}
            >
              Archive
            </button>
            <button
              className="px-4 py-2 rounded-lg text-sm font-medium border"
              style={{ borderColor: 'var(--color-border-default)', color: 'var(--color-text-secondary)' }}
            >
              Reassign
            </button>
          </div>
        </div>

        {/* Simulated task list with checkboxes */}
        <div className="space-y-2">
          {[
            { title: 'Review PR #142', checked: true },
            { title: 'Deploy v3 to staging', checked: true },
            { title: 'Update docs for API', checked: true },
            { title: 'Fix login bug on mobile', checked: false },
          ].map((t, i) => (
            <div
              key={i}
              className="flex items-center gap-4 p-4 rounded-xl border"
              style={{
                backgroundColor: t.checked ? 'var(--color-bg-tertiary)' : 'var(--color-bg-secondary)',
                borderColor: t.checked ? 'var(--color-primary)' : 'var(--color-border-default)',
              }}
            >
              <input type="checkbox" defaultChecked={t.checked} className="w-4 h-4 rounded" />
              <span className="flex-1">{t.title}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default BulkActionsBar;
