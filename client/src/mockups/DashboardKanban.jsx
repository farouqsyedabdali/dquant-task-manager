/**
 * Mockup: Kanban-style dashboard columns
 * Idea: Drag-and-drop columns for To Do, In Progress, Done
 */
const DashboardKanban = () => {
  const columns = [
    { id: 'todo', title: 'To Do', count: 3, color: 'var(--color-bg-tertiary)' },
    { id: 'progress', title: 'In Progress', count: 2, color: 'var(--color-primary)' },
    { id: 'done', title: 'Done', count: 1, color: 'var(--color-primary)' },
  ];

  const sampleTasks = [
    { id: 1, title: 'Review PR #142', col: 'todo', priority: 'high' },
    { id: 2, title: 'Update API documentation', col: 'todo', priority: 'medium' },
    { id: 3, title: 'Design onboarding flow', col: 'todo', priority: 'low' },
    { id: 4, title: 'Fix login validation bug', col: 'progress', priority: 'high' },
    { id: 5, title: 'Add dark mode support', col: 'progress', priority: 'medium' },
    { id: 6, title: 'Deploy v2.1 to production', col: 'done', priority: 'urgent' },
  ];

  return (
    <div
      className="min-h-screen p-6"
      style={{ backgroundColor: 'var(--color-bg-primary)', color: 'var(--color-text-primary)' }}
    >
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold">My Tasks</h1>
        <button
          className="px-4 py-2 rounded-lg font-medium"
          style={{ backgroundColor: 'var(--color-primary)', color: 'white' }}
        >
          + New Task
        </button>
      </div>

      <div className="flex gap-4 overflow-x-auto pb-4">
        {columns.map((col) => (
          <div
            key={col.id}
            className="flex-shrink-0 w-72 rounded-xl border p-4"
            style={{
              backgroundColor: 'var(--color-bg-secondary)',
              borderColor: 'var(--color-border-default)',
            }}
          >
            <div className="flex justify-between items-center mb-4">
              <h2 className="font-semibold">{col.title}</h2>
              <span
                className="text-xs px-2 py-1 rounded-full"
                style={{ backgroundColor: col.color, opacity: 0.3 }}
              >
                {col.count}
              </span>
            </div>
            <div className="space-y-3">
              {sampleTasks
                .filter((t) => t.col === col.id)
                .map((task) => (
                  <div
                    key={task.id}
                    className="p-4 rounded-lg border cursor-move transition-all hover:shadow-md"
                    style={{
                      backgroundColor: 'var(--color-bg-primary)',
                      borderColor: 'var(--color-border-light)',
                    }}
                  >
                    <div className="font-medium text-sm">{task.title}</div>
                    <div className="mt-2 flex items-center gap-2">
                      <span
                        className="text-xs px-2 py-0.5 rounded capitalize"
                        style={{
                          backgroundColor: task.priority === 'high' || task.priority === 'urgent' ? 'rgba(239,68,68,0.2)' : 'var(--color-bg-tertiary)',
                          color: task.priority === 'high' || task.priority === 'urgent' ? '#ef4444' : 'var(--color-text-tertiary)',
                        }}
                      >
                        {task.priority}
                      </span>
                      <span className="text-xs" style={{ color: 'var(--color-text-tertiary)' }}>Due Mar 20</span>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default DashboardKanban;
