import { useState } from 'react';

/**
 * Full projects page mockup – project cards, create modal, filters
 */
const ProjectsPageFull = () => {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [search, setSearch] = useState('');

  const projects = [
    { id: 1, name: 'Q1 Product Launch', taskCount: 12, doneCount: 8, color: 'var(--color-primary)' },
    { id: 2, name: 'Mobile App Redesign', taskCount: 5, doneCount: 2, color: 'var(--color-accent)' },
    { id: 3, name: 'Team Offsite 2025', taskCount: 8, doneCount: 3, color: 'var(--color-primary-light)' },
    { id: 4, name: 'API v3 Migration', taskCount: 15, doneCount: 10, color: 'var(--color-primary-dark)' },
  ];

  return (
    <div
      className="min-h-screen p-8"
      style={{ backgroundColor: 'var(--color-bg-primary)', color: 'var(--color-text-primary)' }}
    >
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-2xl font-bold">Projects</h1>
          <div className="flex gap-3">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search projects..."
              className="px-4 py-2 rounded-lg border w-64"
              style={{
                backgroundColor: 'var(--color-bg-tertiary)',
                borderColor: 'var(--color-border-default)',
              }}
            />
            <button
              onClick={() => setIsCreateOpen(true)}
              className="px-4 py-2 rounded-lg font-medium"
              style={{ backgroundColor: 'var(--color-primary)', color: 'white' }}
            >
              + New Project
            </button>
          </div>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((p) => (
            <div
              key={p.id}
              className="p-6 rounded-2xl border cursor-pointer transition-all hover:shadow-lg"
              style={{
                backgroundColor: 'var(--color-bg-secondary)',
                borderColor: 'var(--color-border-default)',
              }}
            >
              <div
                className="w-12 h-12 rounded-xl mb-4 flex items-center justify-center text-white font-bold"
                style={{ backgroundColor: p.color }}
              >
                {p.name[0]}
              </div>
              <h2 className="text-lg font-semibold mb-2">{p.name}</h2>
              <div className="flex gap-4 text-sm" style={{ color: 'var(--color-text-tertiary)' }}>
                <span>{p.doneCount}/{p.taskCount} tasks</span>
                <div className="flex-1 rounded-full h-2 mt-1" style={{ backgroundColor: 'var(--color-bg-tertiary)', opacity: 0.8 }}>
                  <div
                    className="h-full rounded-full"
                    style={{ width: `${(p.doneCount / p.taskCount) * 100}%`, backgroundColor: p.color }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {isCreateOpen && (
        <>
          <div className="fixed inset-0 bg-black/50 z-50" onClick={() => setIsCreateOpen(false)} />
          <div
            className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-md rounded-2xl p-6"
            style={{
              backgroundColor: 'var(--color-bg-secondary)',
              borderColor: 'var(--color-border-default)',
              borderWidth: 1,
            }}
          >
            <h2 className="text-xl font-bold mb-6">Create project</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text-secondary)' }}>Name</label>
                <input
                  type="text"
                  placeholder="e.g. Q2 Campaign"
                  className="w-full px-4 py-3 rounded-xl border"
                  style={{
                    backgroundColor: 'var(--color-bg-tertiary)',
                    borderColor: 'var(--color-border-default)',
                  }}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text-secondary)' }}>Due date</label>
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
            <div className="flex justify-end gap-3 mt-6">
              <button onClick={() => setIsCreateOpen(false)} className="px-4 py-2 rounded-lg" style={{ color: 'var(--color-text-secondary)' }}>Cancel</button>
              <button className="px-4 py-2 rounded-lg font-medium" style={{ backgroundColor: 'var(--color-primary)', color: 'white' }}>Create</button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default ProjectsPageFull;
