import { useState } from 'react';

/**
 * Simplified dashboard filters – presets instead of 6 dropdowns
 * Current: Status, Priority, Due Date, Task Type, Sort By, Search – overwhelming
 */
const DashboardFiltersSimplified = () => {
  const [activePreset, setActivePreset] = useState('active');
  const [search, setSearch] = useState('');

  const presets = [
    { id: 'active', label: 'Active', desc: 'To do + In progress' },
    { id: 'due-soon', label: 'Due soon', desc: 'Next 7 days' },
    { id: 'mine', label: 'Assigned to me', desc: 'Your tasks' },
    { id: 'high', label: 'High priority', desc: 'Urgent first' },
    { id: 'all', label: 'All tasks', desc: 'Everything' },
  ];

  return (
    <div
      className="min-h-screen p-8"
      style={{ backgroundColor: 'var(--color-bg-primary)', color: 'var(--color-text-primary)' }}
    >
      <div className="max-w-3xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">Simplified filters</h1>

        {/* Search bar */}
        <div className="relative mb-8">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search tasks..."
            className="w-full pl-10 pr-4 py-3 rounded-xl border"
            style={{
              backgroundColor: 'var(--color-bg-secondary)',
              borderColor: 'var(--color-border-default)',
            }}
          />
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-lg opacity-50">🔍</span>
        </div>

        {/* Quick presets */}
        <p className="text-sm font-medium mb-3" style={{ color: 'var(--color-text-secondary)' }}>
          Quick view
        </p>
        <div className="flex flex-wrap gap-2 mb-8">
          {presets.map((p) => (
            <button
              key={p.id}
              onClick={() => setActivePreset(p.id)}
              className="px-4 py-2 rounded-full text-sm font-medium transition-all"
              style={{
                backgroundColor: activePreset === p.id ? 'var(--color-primary)' : 'var(--color-bg-tertiary)',
                color: activePreset === p.id ? 'white' : 'var(--color-text-secondary)',
              }}
            >
              {p.label}
            </button>
          ))}
        </div>

        {/* Expandable advanced */}
        <details className="rounded-xl border" style={{ borderColor: 'var(--color-border-default)' }}>
          <summary className="px-4 py-3 cursor-pointer text-sm" style={{ color: 'var(--color-text-secondary)' }}>
            Advanced filters (status, priority, date, sort)
          </summary>
          <div className="p-4 pt-0 space-y-4" style={{ borderTop: '1px solid var(--color-border-default)' }}>
            <div>
              <label className="block text-xs font-medium mb-2" style={{ color: 'var(--color-text-tertiary)' }}>Status</label>
              <div className="flex gap-2">
                {['To do', 'In progress', 'Done'].map((s) => (
                  <button key={s} className="px-3 py-1.5 rounded-lg text-xs" style={{ backgroundColor: 'var(--color-bg-tertiary)' }}>{s}</button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium mb-2" style={{ color: 'var(--color-text-tertiary)' }}>Sort by</label>
              <select className="px-3 py-2 rounded-lg text-sm border" style={{ backgroundColor: 'var(--color-bg-tertiary)', borderColor: 'var(--color-border-default)' }}>
                <option>Urgency</option>
                <option>Due date</option>
                <option>Created</option>
              </select>
            </div>
          </div>
        </details>
      </div>
    </div>
  );
};

export default DashboardFiltersSimplified;
