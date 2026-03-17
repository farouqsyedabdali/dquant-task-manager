import { useState } from 'react';

/**
 * Dashboard as-is with subtle improvements
 * Keeps: stat cards, filters, ArchiveSwitcher, task card grid
 * Tweaks: clearer empty state, "Clear filters" prominence, overdue hint, quick-complete on cards
 */
const DashboardCurrentImproved = () => {
  const [archiveView, setArchiveView] = useState('active');
  const [statusFilter, setStatusFilter] = useState('TODO,IN_PROGRESS');
  const [search, setSearch] = useState('');
  const [selectedTask, setSelectedTask] = useState(null);

  const stats = {
    total: 14,
    todo: 8,
    inProgress: 4,
    completed: 2,
    onHold: 0,
    cancelled: 0,
  };

  const tasks = [
    { id: 1, title: 'Review PR #142 for auth flow', status: 'TODO', priority: 'HIGH', dueDate: 'Mar 20', assignee: 'Sarah Kim', overdue: false },
    { id: 2, title: 'Update API documentation', status: 'IN_PROGRESS', priority: 'MEDIUM', dueDate: 'Mar 22', assignee: 'You', overdue: false },
    { id: 3, title: 'Deploy v2.1 to staging', status: 'COMPLETED', priority: 'URGENT', dueDate: 'Mar 15', assignee: 'DevOps', overdue: false },
    { id: 4, title: 'Design onboarding flow', status: 'TODO', priority: 'LOW', dueDate: 'Mar 25', assignee: 'Design', overdue: false },
    { id: 5, title: 'Fix login bug on mobile', status: 'IN_PROGRESS', priority: 'HIGH', dueDate: 'Mar 17', assignee: 'You', overdue: true },
    { id: 6, title: 'Set up CI/CD pipeline', status: 'TODO', priority: 'MEDIUM', dueDate: null, assignee: null, overdue: false },
  ];

  const filteredTasks = tasks.filter((t) => {
    if (statusFilter && statusFilter !== 'total') {
      const statuses = statusFilter.split(',');
      if (!statuses.includes(t.status)) return false;
    }
    if (search) {
      const q = search.toLowerCase();
      return t.title.toLowerCase().includes(q) || (t.assignee && t.assignee.toLowerCase().includes(q));
    }
    return true;
  });

  const hasActiveFilters = !!search;

  const getStatusClass = (s) => {
    const map = { TODO: 'status-todo', IN_PROGRESS: 'status-in-progress', COMPLETED: 'status-completed', ON_HOLD: 'status-on-hold', CANCELLED: 'status-cancelled' };
    return map[s] || 'status-todo';
  };

  const getPriorityClass = (p) => {
    const map = { URGENT: 'priority-urgent', HIGH: 'priority-high', MEDIUM: 'priority-medium', LOW: 'priority-low' };
    return map[p] || 'priority-medium';
  };

  const StatCard = ({ title, value, icon, status, isActive, onClick }) => (
    <div
      onClick={onClick}
      className="border rounded-lg p-4 cursor-pointer transition-all duration-200 hover:scale-[1.02]"
      style={{
        backgroundColor: isActive ? 'var(--color-bg-tertiary)' : 'var(--color-bg-secondary)',
        borderColor: isActive ? 'var(--color-primary)' : 'var(--color-border-default)',
        boxShadow: isActive ? '0 4px 12px rgba(99, 102, 241, 0.15)' : 'none',
      }}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium" style={{ color: 'var(--color-text-tertiary)' }}>{title}</p>
          <p className="text-2xl font-bold" style={{ color: 'var(--color-text-primary)' }}>{value}</p>
        </div>
        <span className="text-3xl">{icon}</span>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen transition-colors duration-200" style={{ backgroundColor: 'var(--color-bg-primary)' }}>
      <div className="max-w-[95%] mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-4 relative">
            <div>
              <h1 className="text-3xl font-bold" style={{ color: 'var(--color-text-primary)' }}>
                Welcome back, Alex!
              </h1>
              <p className="mt-2" style={{ color: 'var(--color-text-secondary)' }}>
                Manage all tasks and team assignments
              </p>
            </div>
            <div className="absolute left-1/2 transform -translate-x-1/2">
              <h2 className="text-xl font-semibold" style={{ color: 'var(--color-text-primary)' }}>Acme Inc</h2>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xs px-2 py-1 rounded-full" style={{ backgroundColor: 'var(--color-primary)', color: 'white' }}>
                2 invites
              </span>
              <button
                className="px-4 py-2 rounded-lg font-medium"
                style={{ backgroundColor: 'var(--color-primary)', color: 'white' }}
              >
                + Add New Task
              </button>
            </div>
          </div>
        </div>

        {/* Stat Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6 mb-8">
          <StatCard title="Total Tasks" value={stats.total} icon="📋" status="total" isActive={!statusFilter || statusFilter === ''} onClick={() => setStatusFilter('')} />
          <StatCard title="To Do" value={stats.todo} icon="⏳" status="TODO" isActive={statusFilter?.includes('TODO')} onClick={() => setStatusFilter('TODO,IN_PROGRESS')} />
          <StatCard title="In Progress" value={stats.inProgress} icon="🔄" status="IN_PROGRESS" isActive={statusFilter?.includes('IN_PROGRESS')} onClick={() => setStatusFilter('TODO,IN_PROGRESS')} />
          <StatCard title="Completed" value={stats.completed} icon="✅" status="COMPLETED" isActive={statusFilter?.includes('COMPLETED')} onClick={() => setStatusFilter('COMPLETED')} />
          <StatCard title="On Hold" value={stats.onHold} icon="⏸️" status="ON_HOLD" isActive={statusFilter?.includes('ON_HOLD')} onClick={() => setStatusFilter('ON_HOLD')} />
          <StatCard title="Cancelled" value={stats.cancelled} icon="❌" status="CANCELLED" isActive={statusFilter?.includes('CANCELLED')} onClick={() => setStatusFilter('CANCELLED')} />
        </div>

        {/* Filters (simplified – same look, fewer columns for mockup) */}
        <div
          className="border rounded-lg shadow-lg p-6 mb-6 transition-colors duration-200"
          style={{
            backgroundColor: 'var(--color-bg-secondary)',
            borderColor: 'var(--color-border-default)',
          }}
        >
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text-secondary)' }}>Search</label>
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search tasks..."
                className="w-full px-3 py-2 rounded-lg border text-sm"
                style={{
                  backgroundColor: 'var(--color-bg-tertiary)',
                  borderColor: 'var(--color-border-default)',
                  color: 'var(--color-text-primary)',
                }}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text-secondary)' }}>Status</label>
              <div className="px-3 py-2 rounded-lg text-sm" style={{ backgroundColor: 'var(--color-bg-tertiary)', color: 'var(--color-text-primary)' }}>
                Tasks on Hand (To Do & In Progress)
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text-secondary)' }}>Sort by</label>
              <div className="px-3 py-2 rounded-lg text-sm" style={{ backgroundColor: 'var(--color-bg-tertiary)', color: 'var(--color-text-primary)' }}>
                Urgency
              </div>
            </div>
            <div className="flex items-end">
              {hasActiveFilters && (
                <button
                  className="px-4 py-2 rounded-lg text-sm font-medium"
                  style={{ color: 'var(--color-primary)', borderWidth: 1, borderColor: 'var(--color-primary)' }}
                >
                  Clear filters
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Tasks container */}
        <div
          className="rounded-lg shadow-lg p-6 transition-colors duration-200"
          style={{ backgroundColor: 'var(--color-bg-secondary)' }}
        >
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold" style={{ color: 'var(--color-text-primary)' }}>
              {archiveView === 'archived' ? 'Archived Tasks' : 'All Tasks'} ({filteredTasks.length})
            </h2>
            <div className="flex items-center gap-1 rounded-lg p-1" style={{ backgroundColor: 'var(--color-bg-tertiary)' }}>
              <button
                onClick={() => setArchiveView('active')}
                className="px-3 py-1.5 text-sm rounded-md"
                style={{
                  backgroundColor: archiveView === 'active' ? 'var(--color-primary)' : 'transparent',
                  color: archiveView === 'active' ? 'white' : 'var(--color-text-secondary)',
                }}
              >
                Active
              </button>
              <button
                onClick={() => setArchiveView('archived')}
                className="px-3 py-1.5 text-sm rounded-md"
                style={{
                  backgroundColor: archiveView === 'archived' ? 'var(--color-primary)' : 'transparent',
                  color: archiveView === 'archived' ? 'white' : 'var(--color-text-secondary)',
                }}
              >
                Archived
              </button>
            </div>
          </div>

          {/* Overdue hint – improvement: show when tasks are overdue */}
          {tasks.some((t) => t.overdue) && archiveView === 'active' && (
            <div
              className="mb-4 px-4 py-2 rounded-lg flex items-center gap-2 text-sm"
              style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', borderWidth: 1, borderColor: 'rgba(239, 68, 68, 0.3)' }}
            >
              <span>⚠️</span>
              <span>1 task is overdue</span>
            </div>
          )}

          {filteredTasks.length === 0 ? (
            /* Improved empty state – clearer messaging */
            <div className="py-16 text-center">
              <div className="text-5xl mb-4 opacity-40">📋</div>
              <h3 className="text-lg font-semibold mb-2" style={{ color: 'var(--color-text-primary)' }}>
                No tasks match your filters
              </h3>
              <p className="text-sm mb-6 max-w-sm mx-auto" style={{ color: 'var(--color-text-tertiary)' }}>
                {search ? `Nothing found for "${search}".` : 'Try adjusting your filters'} Create a new task or clear filters to see all tasks.
              </p>
              <div className="flex gap-3 justify-center">
                {hasActiveFilters && (
                  <button
                    className="px-4 py-2 rounded-lg text-sm font-medium border"
                    style={{ borderColor: 'var(--color-border-default)', color: 'var(--color-text-secondary)' }}
                  >
                    Clear filters
                  </button>
                )}
                <button
                  className="px-4 py-2 rounded-lg text-sm font-medium"
                  style={{ backgroundColor: 'var(--color-primary)', color: 'white' }}
                >
                  Create New Task
                </button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6">
              {filteredTasks.map((task) => (
                <div
                  key={task.id}
                  onClick={() => setSelectedTask(task)}
                  className="border rounded-lg p-4 cursor-pointer transition-all duration-200 hover:shadow-md"
                  style={{
                    backgroundColor: 'var(--color-bg-secondary)',
                    borderColor: task.overdue ? '#ef4444' : 'var(--color-border-default)',
                    borderWidth: task.overdue ? 2 : 1,
                  }}
                >
                  <div className="mb-3">
                    <div className="flex items-start gap-2 mb-2">
                      <h3 className="font-medium text-lg line-clamp-2 flex-1" style={{ color: 'var(--color-text-primary)' }}>
                        {task.title}
                      </h3>
                      {/* Improvement: quick-complete checkbox on hover in real impl */}
                      <button
                        onClick={(e) => e.stopPropagation()}
                        className="w-6 h-6 rounded border flex-shrink-0 flex items-center justify-center text-xs"
                        style={{
                          borderColor: 'var(--color-border-default)',
                          color: task.status === 'COMPLETED' ? 'var(--color-primary)' : 'var(--color-text-tertiary)',
                        }}
                        title="Quick complete"
                      >
                        {task.status === 'COMPLETED' ? '✓' : ''}
                      </button>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`status-badge uppercase text-xs ${getStatusClass(task.status)}`}>{task.status.replace('_', ' ')}</span>
                      <span className={`status-badge uppercase text-xs ${getPriorityClass(task.priority)}`}>{task.priority}</span>
                      {task.overdue && <span className="status-badge text-xs" style={{ backgroundColor: '#ef4444', color: 'white' }}>Overdue</span>}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="text-sm" style={{ color: 'var(--color-text-tertiary)' }}>Lead:</span>
                      {task.assignee ? (
                        <div className="flex items-center gap-2">
                          <div
                            className="w-6 h-6 rounded-full flex items-center justify-center text-xs text-white"
                            style={{ backgroundColor: 'var(--color-primary)' }}
                          >
                            {task.assignee.charAt(0)}
                          </div>
                          <span className="text-sm" style={{ color: 'var(--color-text-primary)' }}>{task.assignee}</span>
                        </div>
                      ) : (
                        <span className="text-sm" style={{ color: 'var(--color-text-muted)' }}>Unassigned</span>
                      )}
                    </div>
                    {task.dueDate && (
                      <div className="text-sm" style={{ color: 'var(--color-text-tertiary)' }}>
                        Due {task.dueDate}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Subtle improvement: keyboard hint */}
        <p className="mt-6 text-center text-xs" style={{ color: 'var(--color-text-tertiary)' }}>
          Press <kbd className="px-1.5 py-0.5 rounded" style={{ backgroundColor: 'var(--color-bg-tertiary)' }}>/</kbd> to focus search
        </p>
      </div>

      {/* Task detail modal */}
      {selectedTask && (
        <>
          <div className="fixed inset-0 bg-black/50 z-50" onClick={() => setSelectedTask(null)} />
          <div
            className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-lg rounded-2xl shadow-2xl p-6 border"
            style={{
              backgroundColor: 'var(--color-bg-secondary)',
              borderColor: 'var(--color-border-default)',
            }}
          >
            <div className="flex justify-between items-start mb-4">
              <h2 className="text-xl font-bold">{selectedTask.title}</h2>
              <button onClick={() => setSelectedTask(null)} className="text-2xl leading-none" style={{ color: 'var(--color-text-tertiary)' }}>×</button>
            </div>
            <div className="space-y-2 text-sm" style={{ color: 'var(--color-text-secondary)' }}>
              <p>Status: {selectedTask.status} · Priority: {selectedTask.priority}</p>
              <p>Due: {selectedTask.dueDate || '—'} · Assigned to: {selectedTask.assignee || 'Unassigned'}</p>
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

export default DashboardCurrentImproved;
