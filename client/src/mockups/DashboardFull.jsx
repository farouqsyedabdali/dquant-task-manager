import { useState } from 'react';

/**
 * Full dashboard mockup – header, stats, filters, task cards
 * Functional: filter toggles, search, card click, add task button
 */
const DashboardFull = () => {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [viewMode, setViewMode] = useState('cards');
  const [selectedTask, setSelectedTask] = useState(null);

  const stats = [
    { id: 'all', label: 'Total', value: 14 },
    { id: 'todo', label: 'To Do', value: 8 },
    { id: 'progress', label: 'In Progress', value: 4 },
    { id: 'done', label: 'Completed', value: 2 },
  ];

  const tasks = [
    { id: 1, title: 'Review PR #142', status: 'todo', priority: 'high', dueDate: 'Mar 20', assignee: 'Sarah' },
    { id: 2, title: 'Update API docs', status: 'progress', priority: 'medium', dueDate: 'Mar 22', assignee: 'You' },
    { id: 3, title: 'Deploy v2.1', status: 'done', priority: 'urgent', dueDate: 'Mar 15', assignee: 'DevOps' },
    { id: 4, title: 'Design onboarding flow', status: 'todo', priority: 'low', dueDate: 'Mar 25', assignee: 'Design' },
    { id: 5, title: 'Fix login bug', status: 'progress', priority: 'high', dueDate: 'Mar 18', assignee: 'You' },
  ];

  const getStatusColor = (s) => {
    if (s === 'todo') return 'var(--color-bg-tertiary)';
    if (s === 'progress') return 'var(--color-primary)';
    return 'var(--color-accent)';
  };

  const getPriorityBadge = (p) => {
    const colors = {
      urgent: 'var(--color-primary-dark)',
      high: 'var(--color-primary)',
      medium: 'var(--color-primary-light)',
      low: 'var(--color-accent)',
    };
    return colors[p] || colors.medium;
  };

  return (
    <div
      className="min-h-screen"
      style={{ backgroundColor: 'var(--color-bg-primary)', color: 'var(--color-text-primary)' }}
    >
      {/* Header */}
      <header
        className="sticky top-0 z-40 border-b"
        style={{
          backgroundColor: 'var(--color-bg-secondary)',
          borderColor: 'var(--color-border-default)',
        }}
      >
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex justify-between items-center gap-4">
            <h1 className="text-xl font-bold">My Tasks</h1>
            <div className="flex items-center gap-3">
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search tasks..."
                className="px-4 py-2 rounded-lg border w-64"
                style={{
                  backgroundColor: 'var(--color-bg-tertiary)',
                  borderColor: 'var(--color-border-default)',
                }}
              />
              <div className="flex rounded-lg overflow-hidden border" style={{ borderColor: 'var(--color-border-default)' }}>
                {['cards', 'list'].map((v) => (
                  <button
                    key={v}
                    onClick={() => setViewMode(v)}
                    className="px-4 py-2 text-sm font-medium capitalize"
                    style={{
                      backgroundColor: viewMode === v ? 'var(--color-primary)' : 'var(--color-bg-tertiary)',
                      color: viewMode === v ? 'white' : 'var(--color-text-secondary)',
                    }}
                  >
                    {v}
                  </button>
                ))}
              </div>
              <button
                className="px-4 py-2 rounded-lg font-medium"
                style={{ backgroundColor: 'var(--color-primary)', color: 'white' }}
              >
                + New Task
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Stats + Filters */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex gap-4 mb-6 overflow-x-auto pb-2">
          {stats.map((s) => (
            <button
              key={s.id}
              onClick={() => setStatusFilter(s.id)}
              className="flex-shrink-0 px-6 py-4 rounded-xl border transition-all"
              style={{
                backgroundColor: statusFilter === s.id ? 'var(--color-bg-tertiary)' : 'var(--color-bg-secondary)',
                borderColor: statusFilter === s.id ? 'var(--color-primary)' : 'var(--color-border-default)',
              }}
            >
              <div className="text-2xl font-bold">{s.value}</div>
              <div className="text-sm" style={{ color: 'var(--color-text-tertiary)' }}>{s.label}</div>
            </button>
          ))}
        </div>

        {/* Task cards */}
        <div className={viewMode === 'cards' ? 'grid md:grid-cols-2 lg:grid-cols-3 gap-4' : 'space-y-2'}>
          {tasks.map((task) => (
            <div
              key={task.id}
              onClick={() => setSelectedTask(task)}
              className="p-4 rounded-xl border cursor-pointer transition-all hover:shadow-md"
              style={{
                backgroundColor: 'var(--color-bg-secondary)',
                borderColor: selectedTask?.id === task.id ? 'var(--color-primary)' : 'var(--color-border-default)',
              }}
            >
              <div className="flex justify-between items-start mb-2">
                <h3 className="font-medium line-clamp-2">{task.title}</h3>
                <span
                  className="text-xs px-2 py-0.5 rounded-full flex-shrink-0"
                  style={{ backgroundColor: getPriorityBadge(task.priority), color: 'white' }}
                >
                  {task.priority}
                </span>
              </div>
              <div className="flex items-center gap-3 text-sm" style={{ color: 'var(--color-text-tertiary)' }}>
                <span className="px-2 py-0.5 rounded" style={{ backgroundColor: getStatusColor(task.status) }}>
                  {task.status}
                </span>
                <span>Due {task.dueDate}</span>
                <span>→ {task.assignee}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Task detail modal */}
      {selectedTask && (
        <>
          <div className="fixed inset-0 bg-black/50 z-50" onClick={() => setSelectedTask(null)} />
          <div
            className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-lg rounded-2xl shadow-2xl p-6"
            style={{
              backgroundColor: 'var(--color-bg-secondary)',
              borderColor: 'var(--color-border-default)',
              borderWidth: 1,
            }}
          >
            <div className="flex justify-between items-start mb-4">
              <h2 className="text-xl font-bold">{selectedTask.title}</h2>
              <button onClick={() => setSelectedTask(null)} className="text-2xl leading-none" style={{ color: 'var(--color-text-tertiary)' }}>×</button>
            </div>
            <div className="space-y-2 text-sm" style={{ color: 'var(--color-text-secondary)' }}>
              <p>Status: {selectedTask.status} · Priority: {selectedTask.priority}</p>
              <p>Due: {selectedTask.dueDate} · Assigned to: {selectedTask.assignee}</p>
            </div>
            <div className="mt-6 flex gap-3">
              <button className="px-4 py-2 rounded-lg" style={{ backgroundColor: 'var(--color-primary)', color: 'white' }}>Edit</button>
              <button className="px-4 py-2 rounded-lg border" style={{ borderColor: 'var(--color-border-default)' }}>Archive</button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default DashboardFull;
