/**
 * Mockup: Create Task modal — assignee dropdown + zoom / short viewport
 *
 * Problem: Fixed dropdown below the button + fixed max-height could extend past
 * the bottom of the viewport when zoomed in, so the list looked “cut off” inside
 * the modal.
 *
 * Fixes (implemented in app):
 * 1. SearchableDropdown: compute placement from getBoundingClientRect — flip
 *    upward when space below is tight, clamp total height to available viewport.
 * 2. AddTaskModal: modal max-height + scrollable body + sticky footer buttons.
 */
import { useState } from 'react';

const CreateTaskModalAssignDropdownFix = () => {
  const [showProblem, setShowProblem] = useState(true);

  return (
    <div
      className="min-h-screen p-6 md:p-10"
      style={{ backgroundColor: 'var(--color-bg-primary)', color: 'var(--color-text-primary)' }}
    >
      <div className="max-w-3xl mx-auto space-y-10">
        <header>
          <p className="text-sm font-semibold uppercase tracking-wider mb-2" style={{ color: 'var(--color-primary)' }}>
            UX / Components
          </p>
          <h1 className="text-3xl font-bold mb-3">Create Task — assign dropdown (zoom-safe)</h1>
          <p style={{ color: 'var(--color-text-secondary)' }}>
            Reference mockup for the clipping issue when the browser is zoomed or the viewport is short.
            The live app uses the same principles below.
          </p>
        </header>

        <section
          className="rounded-xl border p-6 space-y-4"
          style={{ borderColor: 'var(--color-border-default)', backgroundColor: 'var(--color-bg-secondary)' }}
        >
          <h2 className="text-lg font-semibold">What went wrong</h2>
          <ul className="list-disc list-inside space-y-2 text-sm" style={{ color: 'var(--color-text-secondary)' }}>
            <li>
              The contact list was rendered in a <strong className="text-[var(--color-text-primary)]">fixed</strong> panel
              anchored <strong className="text-[var(--color-text-primary)]">below</strong> the trigger, with a fixed max height.
            </li>
            <li>
              With <strong className="text-[var(--color-text-primary)]">zoom</strong> or a low button on the screen, the panel
              extended past the <strong className="text-[var(--color-text-primary)]">bottom of the viewport</strong> — the rest
              of the list was unreachable (not a modal overflow bug — viewport clipping).
            </li>
            <li>
              A tall Create Task modal also made it feel like the list was “inside” the modal scroll area;
              bounding the modal and scrolling the form body separates concerns.
            </li>
          </ul>
        </section>

        <section
          className="rounded-xl border p-6 space-y-6"
          style={{ borderColor: 'var(--color-border-default)', backgroundColor: 'var(--color-bg-secondary)' }}
        >
          <h2 className="text-lg font-semibold">Fixes (implemented)</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <h3 className="font-medium text-sm" style={{ color: 'var(--color-primary)' }}>
                1. Dropdown placement
              </h3>
              <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                Measure <code className="text-xs px-1 rounded" style={{ backgroundColor: 'var(--color-bg-tertiary)' }}>getBoundingClientRect()</code> and
                available space above/below. Open <strong>upward</strong> when there is more room above. Set{' '}
                <code className="text-xs px-1 rounded" style={{ backgroundColor: 'var(--color-bg-tertiary)' }}>maxHeight</code>{' '}
                on the panel to the remaining viewport space so the list scrolls <em>inside</em> the panel.
              </p>
            </div>
            <div className="space-y-2">
              <h3 className="font-medium text-sm" style={{ color: 'var(--color-primary)' }}>
                2. Modal layout
              </h3>
              <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                <code className="text-xs px-1 rounded" style={{ backgroundColor: 'var(--color-bg-tertiary)' }}>max-h-[min(92dvh,900px)]</code> on{' '}
                <code className="text-xs px-1 rounded" style={{ backgroundColor: 'var(--color-bg-tertiary)' }}>modal-box</code>, scrollable
                middle section, <strong>sticky footer</strong> for Create / Cancel / Smart Pre-fill.
              </p>
            </div>
          </div>

          {/* Visual diagram */}
          <div
            className="rounded-lg p-4 font-mono text-xs leading-relaxed overflow-x-auto"
            style={{ backgroundColor: 'var(--color-bg-tertiary)', color: 'var(--color-text-secondary)' }}
          >
            <pre className="whitespace-pre">
{`Viewport (browser window, after zoom)
┌─────────────────────────────┐
│  ... modal ...              │
│  [ Assign ▼ ]  ← trigger     │
│       ┌──────────────┐       │
│       │ Search  ↑    │       │  ← flip up if spaceBelow < spaceAbove
│       │ ───────────  │       │
│       │ Contact A    │       │
│       │ Contact B    │  scroll│  ← list scrolls inside panel
│       │ Contact C    │  inside│
│       └──────────────┘       │
│  ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─   │
│  [Cancel] [Create Task]     │  ← footer stays visible (sticky)
└─────────────────────────────┘`}
            </pre>
          </div>
        </section>

        {/* Mini interactive demo: fake modal */}
        <section
          className="rounded-xl border p-6 space-y-4"
          style={{ borderColor: 'var(--color-border-default)', backgroundColor: 'var(--color-bg-secondary)' }}
        >
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <h2 className="text-lg font-semibold">Layout preview (static)</h2>
            <label className="flex items-center gap-2 text-sm cursor-pointer" style={{ color: 'var(--color-text-secondary)' }}>
              <input
                type="checkbox"
                checked={showProblem}
                onChange={(e) => setShowProblem(e.target.checked)}
                className="checkbox checkbox-sm"
              />
              Highlight “bad” vs “good” regions
            </label>
          </div>

          <div className="flex justify-center py-4">
            <div
              className="w-full max-w-lg rounded-xl border shadow-xl flex flex-col overflow-hidden"
              style={{
                maxHeight: 'min(70vh, 420px)',
                backgroundColor: 'var(--color-bg-secondary)',
                borderColor: 'var(--color-border-default)',
              }}
            >
              <div className="px-4 py-3 flex-shrink-0 border-b" style={{ borderColor: 'var(--color-border-default)' }}>
                <span className="font-semibold">Create New Task</span>
              </div>
              <div className="flex-1 min-h-0 overflow-y-auto px-4 py-3 space-y-3 scrollbar-thin">
                <div className="h-8 rounded" style={{ backgroundColor: 'var(--color-bg-tertiary)' }} title="Title field" />
                <div className="h-16 rounded" style={{ backgroundColor: 'var(--color-bg-tertiary)' }} title="Description" />
                <div className="h-8 rounded w-1/2" style={{ backgroundColor: 'var(--color-bg-tertiary)' }} title="Priority" />
                <div>
                  <div className="text-xs mb-1" style={{ color: 'var(--color-text-tertiary)' }}>Assign to contact</div>
                  <div
                    className="h-10 rounded border flex items-center px-2 text-sm"
                    style={{ borderColor: 'var(--color-border-default)', backgroundColor: 'var(--color-bg-tertiary)' }}
                  >
                    Select a contact…
                  </div>
                  {/* Fake dropdown */}
                  <div
                    className="mt-1 rounded border border-dashed p-2 space-y-1"
                    style={{
                      borderColor: showProblem ? 'rgba(239,68,68,0.5)' : 'rgba(99,102,241,0.5)',
                      backgroundColor: showProblem ? 'rgba(239,68,68,0.06)' : 'rgba(99,102,241,0.06)',
                      maxHeight: '140px',
                      overflowY: 'auto',
                    }}
                  >
                    <div className="text-[10px] uppercase px-1" style={{ color: 'var(--color-text-tertiary)' }}>
                      {showProblem ? 'Clipped: panel exceeded viewport' : 'Fixed: panel height ≤ viewport, scroll inside'}
                    </div>
                    {['Baby Doe', 'Jane Smith', 'Bob Wilson', 'Alex Kim', 'Sam Lee'].map((name) => (
                      <div
                        key={name}
                        className="text-xs py-2 px-2 rounded"
                        style={{ backgroundColor: 'var(--color-bg-primary)' }}
                      >
                        {name}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <div
                className="px-4 py-3 flex-shrink-0 border-t flex justify-end gap-2"
                style={{ borderColor: 'var(--color-border-default)', backgroundColor: 'var(--color-bg-secondary)' }}
              >
                <span className="text-xs px-3 py-1.5 rounded" style={{ backgroundColor: 'var(--color-bg-tertiary)' }}>Cancel</span>
                <span className="text-xs px-3 py-1.5 rounded text-white" style={{ backgroundColor: 'var(--color-primary)' }}>Create</span>
              </div>
            </div>
          </div>
          <p className="text-xs text-center" style={{ color: 'var(--color-text-tertiary)' }}>
            Real dropdown is portaled to <code>document.body</code> with dynamic top/height; this box only illustrates modal structure.
          </p>
        </section>
      </div>
    </div>
  );
};

export default CreateTaskModalAssignDropdownFix;
