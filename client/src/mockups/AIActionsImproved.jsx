import { useState } from 'react';

/**
 * AI Actions Improved – paste area fallback, clearer CTAs
 * Current: clipboard-only, fails when empty; no paste alternative
 */
const AIActionsImproved = () => {
  const [pasteText, setPasteText] = useState('');
  const [activeAction, setActiveAction] = useState(null);

  const actions = [
    { id: 'create', label: 'Create Task', desc: 'From your text', icon: '➕' },
    { id: 'update', label: 'Add Update', desc: 'To existing task', icon: '✏️' },
    { id: 'subtask', label: 'Add Subtask', desc: 'Under a parent', icon: '📎' },
    { id: 'project', label: 'Create Project', desc: 'With tasks', icon: '📁' },
  ];

  return (
    <div
      className="min-h-screen p-8"
      style={{ backgroundColor: 'var(--color-bg-primary)', color: 'var(--color-text-primary)' }}
    >
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold mb-2">AI Actions (improved)</h1>
        <p className="text-sm mb-8" style={{ color: 'var(--color-text-tertiary)' }}>
          Paste text below, or copy to clipboard first
        </p>

        {/* Paste area fallback */}
        <div
          className="rounded-2xl border p-4 mb-6"
          style={{
            backgroundColor: 'var(--color-bg-secondary)',
            borderColor: 'var(--color-border-default)',
          }}
        >
          <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text-secondary)' }}>
            Paste your text here
          </label>
          <textarea
            value={pasteText}
            onChange={(e) => setPasteText(e.target.value)}
            placeholder="e.g. Review PR #142 by Friday. Assign to Sarah."
            rows={4}
            className="w-full px-4 py-3 rounded-xl border text-sm resize-none"
            style={{
              backgroundColor: 'var(--color-bg-tertiary)',
              borderColor: 'var(--color-border-default)',
            }}
          />
          <p className="text-xs mt-2" style={{ color: 'var(--color-text-tertiary)' }}>
            Or copy to clipboard and use the AI Actions button in the header
          </p>
        </div>

        {/* Action buttons */}
        <div className="grid gap-3">
          {actions.map((a) => (
            <button
              key={a.id}
              onClick={() => setActiveAction(a.id)}
              className="flex items-center gap-4 p-4 rounded-xl border text-left transition-all hover:shadow-md"
              style={{
                backgroundColor: activeAction === a.id ? 'var(--color-bg-tertiary)' : 'var(--color-bg-secondary)',
                borderColor: activeAction === a.id ? 'var(--color-primary)' : 'var(--color-border-default)',
              }}
            >
              <span className="text-2xl">{a.icon}</span>
              <div>
                <div className="font-semibold">{a.label}</div>
                <div className="text-xs" style={{ color: 'var(--color-text-tertiary)' }}>{a.desc}</div>
              </div>
              <span className="ml-auto text-sm" style={{ color: 'var(--color-primary)' }}>Run →</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AIActionsImproved;
