import { useState } from 'react';

/**
 * Full task modal mockup – edit, comments, assignee, due date, status tabs
 * Functional: tab switch, form inputs, status/priority selectors
 */
const TaskModalFull = () => {
  const [activeTab, setActiveTab] = useState('details');
  const [title, setTitle] = useState('Review PR #142 and merge before release');
  const [description, setDescription] = useState('Need to verify all tests pass and no breaking changes. Assign to Sarah for final review.');
  const [status, setStatus] = useState('IN_PROGRESS');
  const [priority, setPriority] = useState('HIGH');
  const [dueDate, setDueDate] = useState('2025-03-20');
  const [newComment, setNewComment] = useState('');

  const tabs = [
    { id: 'details', label: 'Details', icon: '📋' },
    { id: 'comments', label: 'Comments', icon: '💬' },
    { id: 'activity', label: 'Activity', icon: '📜' },
  ];

  const comments = [
    { author: 'Sarah', text: 'PR looks good. Approved from my side.', time: '2 hours ago' },
    { author: 'You', text: 'Running final e2e tests.', time: '1 hour ago' },
  ];

  const statuses = ['TODO', 'IN_PROGRESS', 'ON_HOLD', 'COMPLETED', 'CANCELLED'];
  const priorities = ['LOW', 'MEDIUM', 'HIGH', 'URGENT'];

  return (
    <div
      className="min-h-screen flex items-center justify-center p-8"
      style={{ backgroundColor: 'var(--color-bg-primary)', color: 'var(--color-text-primary)' }}
    >
      <div
        className="w-full max-w-4xl max-h-[90vh] overflow-hidden rounded-2xl border shadow-2xl flex flex-col"
        style={{
          backgroundColor: 'var(--color-bg-secondary)',
          borderColor: 'var(--color-border-default)',
        }}
      >
        {/* Header */}
        <div className="flex justify-between items-start p-6 border-b" style={{ borderColor: 'var(--color-border-default)' }}>
          <div>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="text-xl font-bold w-full bg-transparent border-none focus:ring-0 focus:outline-none"
              placeholder="Task title"
            />
            <div className="flex gap-2 mt-2">
              <span className="text-xs px-2 py-1 rounded" style={{ backgroundColor: 'var(--color-primary)', color: 'white' }}>IN_PROGRESS</span>
              <span className="text-xs px-2 py-1 rounded" style={{ backgroundColor: 'var(--color-primary-light)', color: 'white' }}>HIGH</span>
              <span className="text-sm" style={{ color: 'var(--color-text-tertiary)' }}>Due Mar 20, 2025</span>
            </div>
          </div>
          <button className="w-10 h-10 rounded-lg flex items-center justify-center text-xl" style={{ color: 'var(--color-text-tertiary)' }}>×</button>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 px-6 border-b" style={{ borderColor: 'var(--color-border-default)' }}>
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              className="px-4 py-3 text-sm font-medium border-b-2 -mb-px transition-colors"
              style={{
                borderColor: activeTab === t.id ? 'var(--color-primary)' : 'transparent',
                color: activeTab === t.id ? 'var(--color-primary)' : 'var(--color-text-tertiary)',
              }}
            >
              {t.icon} {t.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === 'details' && (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text-secondary)' }}>Description</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={4}
                  className="w-full px-4 py-3 rounded-xl border"
                  style={{
                    backgroundColor: 'var(--color-bg-tertiary)',
                    borderColor: 'var(--color-border-default)',
                  }}
                  placeholder="Add a description..."
                />
              </div>
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text-secondary)' }}>Status</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border"
                    style={{
                      backgroundColor: 'var(--color-bg-tertiary)',
                      borderColor: 'var(--color-border-default)',
                    }}
                  >
                    {statuses.map((s) => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text-secondary)' }}>Priority</label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border"
                    style={{
                      backgroundColor: 'var(--color-bg-tertiary)',
                      borderColor: 'var(--color-border-default)',
                    }}
                  >
                    {priorities.map((p) => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text-secondary)' }}>Due date</label>
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border"
                  style={{
                    backgroundColor: 'var(--color-bg-tertiary)',
                    borderColor: 'var(--color-border-default)',
                  }}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text-secondary)' }}>Assignee</label>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold" style={{ backgroundColor: 'var(--color-primary)', color: 'white' }}>S</div>
                  <span>Sarah Kim</span>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'comments' && (
            <div className="space-y-4">
              {comments.map((c, i) => (
                <div key={i} className="flex gap-3 p-4 rounded-xl" style={{ backgroundColor: 'var(--color-bg-tertiary)' }}>
                  <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0" style={{ backgroundColor: 'var(--color-primary)', color: 'white' }}>
                    {c.author[0]}
                  </div>
                  <div>
                    <div className="font-medium text-sm">{c.author} · <span style={{ color: 'var(--color-text-tertiary)' }}>{c.time}</span></div>
                    <p className="mt-1">{c.text}</p>
                  </div>
                </div>
              ))}
              <div className="flex gap-3">
                <input
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Add a comment..."
                  className="flex-1 px-4 py-3 rounded-xl border"
                  style={{
                    backgroundColor: 'var(--color-bg-tertiary)',
                    borderColor: 'var(--color-border-default)',
                  }}
                />
                <button className="px-4 py-3 rounded-xl font-medium" style={{ backgroundColor: 'var(--color-primary)', color: 'white' }}>
                  Post
                </button>
              </div>
            </div>
          )}

          {activeTab === 'activity' && (
            <div className="space-y-3">
              {['Status changed to In Progress', 'Assigned to Sarah Kim', 'Due date set to Mar 20', 'Task created'].map((a, i) => (
                <div key={i} className="flex gap-3 text-sm py-2" style={{ color: 'var(--color-text-secondary)' }}>
                  <span className="text-xs" style={{ color: 'var(--color-text-tertiary)' }}>2h ago</span>
                  <span>{a}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t flex justify-end gap-3" style={{ borderColor: 'var(--color-border-default)' }}>
          <button className="px-4 py-2 rounded-lg" style={{ color: 'var(--color-text-secondary)' }}>Cancel</button>
          <button className="px-6 py-2 rounded-lg font-medium" style={{ backgroundColor: 'var(--color-primary)', color: 'white' }}>Save changes</button>
        </div>
      </div>
    </div>
  );
};

export default TaskModalFull;
