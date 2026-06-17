import { useState, useRef, useEffect } from 'react';

const MOCK_TASKS = [
  { id: 1, title: 'Review PR #142 - auth middleware refactor', status: 'TODO', priority: 'HIGH', dueDate: '2026-04-07', assignee: 'Sarah K.', subtasks: 2, comments: 3 },
  { id: 2, title: 'Update API documentation for v2.1', status: 'IN_PROGRESS', priority: 'MEDIUM', dueDate: '2026-04-09', assignee: 'You', subtasks: 0, comments: 1 },
  { id: 3, title: 'Deploy staging environment', status: 'COMPLETED', priority: 'URGENT', dueDate: '2026-04-04', assignee: 'DevOps', subtasks: 4, comments: 5 },
  { id: 4, title: 'Design onboarding flow for new users', status: 'TODO', priority: 'LOW', dueDate: '2026-04-15', assignee: 'Design Team', subtasks: 3, comments: 0 },
  { id: 5, title: 'Fix login timeout on slow connections', status: 'IN_PROGRESS', priority: 'HIGH', dueDate: '2026-04-06', assignee: 'You', subtasks: 1, comments: 2 },
  { id: 6, title: 'Set up monitoring dashboards', status: 'TODO', priority: 'MEDIUM', dueDate: '2026-04-12', assignee: 'Sarah K.', subtasks: 0, comments: 0 },
  { id: 7, title: 'Write unit tests for payment module', status: 'TODO', priority: 'HIGH', dueDate: '2026-04-10', assignee: 'You', subtasks: 0, comments: 1 },
  { id: 8, title: 'Refactor notification service', status: 'ON_HOLD', priority: 'MEDIUM', dueDate: '2026-04-20', assignee: 'Mike R.', subtasks: 2, comments: 4 },
];

const MOCK_CONTACTS = [
  { id: 1, name: 'Sarah Kim', email: 'sarah@company.com' },
  { id: 2, name: 'Mike Ross', email: 'mike@company.com' },
  { id: 3, name: 'Priya Patel', email: 'priya@company.com' },
  { id: 4, name: 'James Liu', email: 'james@external.io' },
];

const STATUS_STYLES = {
  TODO: { bg: '#9ca3af', label: 'To Do' },
  IN_PROGRESS: { bg: '#3b82f6', label: 'In Progress' },
  COMPLETED: { bg: '#10b981', label: 'Completed' },
  ON_HOLD: { bg: '#f59e0b', label: 'On Hold' },
  CANCELLED: { bg: '#ef4444', label: 'Cancelled' },
};

const PRIORITY_STYLES = {
  URGENT: { bg: '#ef4444', label: 'Urgent' },
  HIGH: { bg: '#f97316', label: 'High' },
  MEDIUM: { bg: '#f59e0b', label: 'Medium' },
  LOW: { bg: '#10b981', label: 'Low' },
};

const NAV_ITEMS = [
  { label: 'Dashboard', icon: '🏠', id: 'dashboard' },
  { label: 'Calendar', icon: '📅', id: 'calendar' },
  { label: 'Contacts', icon: '👤', id: 'contacts' },
  { label: 'Projects', icon: '📊', id: 'projects' },
];

function Badge({ bg, label }) {
  return (
    <span
      className="text-xs font-semibold px-2 py-0.5 rounded-full uppercase tracking-wide"
      style={{ backgroundColor: bg, color: '#fff' }}
    >
      {label}
    </span>
  );
}

function TaskCard({ task, onClick, isSelected }) {
  const isOverdue = task.status !== 'COMPLETED' && new Date(task.dueDate) < new Date();
  const dueStr = new Date(task.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

  return (
    <div
      onClick={onClick}
      className="p-4 rounded-lg border cursor-pointer transition-all hover:shadow-lg"
      style={{
        backgroundColor: 'var(--color-bg-secondary)',
        borderColor: isSelected ? 'var(--color-primary)' : isOverdue ? '#ef4444' : 'var(--color-border-default)',
        borderWidth: isSelected || isOverdue ? 2 : 1,
        transform: isSelected ? 'translateY(-2px)' : undefined,
      }}
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <h3 className="font-medium text-sm line-clamp-2 flex-1" style={{ color: 'var(--color-text-primary)' }}>
          {task.title}
        </h3>
        <Badge {...PRIORITY_STYLES[task.priority]} />
      </div>
      <div className="flex items-center gap-2 mb-3">
        <Badge {...STATUS_STYLES[task.status]} />
      </div>
      <div className="flex items-center gap-2 text-xs" style={{ color: 'var(--color-text-tertiary)' }}>
        <div className="flex items-center gap-1">
          <div
            className="w-5 h-5 rounded-full flex items-center justify-center text-white text-[10px] font-bold"
            style={{ backgroundColor: 'var(--color-primary)' }}
          >
            {task.assignee[0]}
          </div>
          <span>{task.assignee}</span>
        </div>
        <span>·</span>
        <span style={{ color: isOverdue ? '#ef4444' : undefined, fontWeight: isOverdue ? 600 : undefined }}>
          {isOverdue && '⚠ '}Due {dueStr}
        </span>
      </div>
      {(task.subtasks > 0 || task.comments > 0) && (
        <div className="flex items-center gap-3 mt-3 pt-2 text-xs border-t" style={{ borderColor: 'var(--color-border-default)', color: 'var(--color-text-tertiary)' }}>
          {task.subtasks > 0 && <span>☐ {task.subtasks} subtasks</span>}
          {task.comments > 0 && <span>💬 {task.comments}</span>}
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value, emoji, isActive, onClick }) {
  return (
    <button
      onClick={onClick}
      className="flex-shrink-0 px-5 py-3 rounded-lg border transition-all hover:scale-105"
      style={{
        backgroundColor: isActive ? 'var(--color-bg-tertiary)' : 'var(--color-bg-secondary)',
        borderColor: isActive ? 'var(--color-primary)' : 'var(--color-border-default)',
        boxShadow: isActive ? '0 4px 15px rgba(99,102,241,0.2)' : undefined,
      }}
    >
      <div className="flex items-center gap-3">
        <span className="text-xl">{emoji}</span>
        <div className="text-left">
          <div className="text-lg font-bold" style={{ color: 'var(--color-text-primary)' }}>{value}</div>
          <div className="text-xs" style={{ color: 'var(--color-text-tertiary)' }}>{label}</div>
        </div>
      </div>
    </button>
  );
}

function CreateTaskModal({ onClose, prefill = {} }) {
  const [title, setTitle] = useState(prefill.title || '');
  const [description, setDescription] = useState(prefill.description || '');
  const [priority, setPriority] = useState(prefill.priority || 'MEDIUM');
  const [dueDate, setDueDate] = useState(prefill.dueDate || '');
  const [assignee, setAssignee] = useState(prefill.assignee || '');

  return (
    <>
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[60]" onClick={onClose} />
      <div
        className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[60] w-full max-w-lg rounded-2xl shadow-2xl border"
        style={{ backgroundColor: 'var(--color-bg-secondary)', borderColor: 'var(--color-border-default)' }}
      >
        <div className="flex justify-between items-center px-6 py-4 border-b" style={{ borderColor: 'var(--color-border-default)' }}>
          <h2 className="text-xl font-bold" style={{ color: 'var(--color-text-primary)' }}>Create New Task</h2>
          <button onClick={onClose} className="text-2xl leading-none" style={{ color: 'var(--color-text-tertiary)' }}>×</button>
        </div>
        <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto">
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-text-secondary)' }}>Title *</label>
            <input
              value={title} onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border text-sm"
              style={{ backgroundColor: 'var(--color-bg-tertiary)', borderColor: 'var(--color-border-default)', color: 'var(--color-text-primary)' }}
              placeholder="What needs to be done?"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-text-secondary)' }}>Description</label>
            <textarea
              value={description} onChange={(e) => setDescription(e.target.value)} rows={3}
              className="w-full px-3 py-2 rounded-lg border text-sm resize-none"
              style={{ backgroundColor: 'var(--color-bg-tertiary)', borderColor: 'var(--color-border-default)', color: 'var(--color-text-primary)' }}
              placeholder="Add details..."
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-text-secondary)' }}>Priority</label>
              <select
                value={priority} onChange={(e) => setPriority(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border text-sm"
                style={{ backgroundColor: 'var(--color-bg-tertiary)', borderColor: 'var(--color-border-default)', color: 'var(--color-text-primary)' }}
              >
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
                <option value="URGENT">Urgent</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-text-secondary)' }}>Due Date</label>
              <input
                type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border text-sm"
                style={{ backgroundColor: 'var(--color-bg-tertiary)', borderColor: 'var(--color-border-default)', color: 'var(--color-text-primary)' }}
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-text-secondary)' }}>Assign To</label>
            <select
              value={assignee} onChange={(e) => setAssignee(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border text-sm"
              style={{ backgroundColor: 'var(--color-bg-tertiary)', borderColor: 'var(--color-border-default)', color: 'var(--color-text-primary)' }}
            >
              <option value="">Select assignee...</option>
              {MOCK_CONTACTS.map((c) => (
                <option key={c.id} value={c.name}>{c.name}</option>
              ))}
            </select>
          </div>
          {prefill.title && (
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs" style={{ backgroundColor: 'rgba(99,102,241,0.1)', color: 'var(--color-primary)' }}>
              <span className="font-semibold">AI pre-filled</span> -- review and adjust before creating
            </div>
          )}
        </div>
        <div className="flex justify-end gap-3 px-6 py-4 border-t" style={{ borderColor: 'var(--color-border-default)' }}>
          <button onClick={onClose} className="px-4 py-2 rounded-lg border text-sm font-medium" style={{ borderColor: 'var(--color-border-default)', color: 'var(--color-text-secondary)' }}>
            Cancel
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-sm font-medium"
            style={{ backgroundColor: 'var(--color-primary)', color: '#fff' }}
          >
            Create Task
          </button>
        </div>
      </div>
    </>
  );
}

function TypingIndicator() {
  return (
    <div className="flex gap-1 items-center px-4 py-3">
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className="w-2 h-2 rounded-full"
          style={{
            backgroundColor: 'var(--color-text-tertiary)',
            animation: `typing-dot 1.4s infinite ${i * 0.2}s`,
          }}
        />
      ))}
    </div>
  );
}

function AISidePanel({ onCreateTask, onShowContacts, chatPanelOpen }) {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      text: "Hey! I'm your Tialz assistant. I can help you create tasks, check your schedule, manage contacts, and more. Try asking me something below, or pick a suggestion.",
    },
  ]);
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  const suggestions = [
    { text: 'Create a task to review the new design mockups by Friday', action: 'create' },
    { text: 'What tasks are due this week?', action: 'query' },
    { text: 'Add Priya Patel and James Liu to my contacts', action: 'contacts' },
    { text: 'Summarize my in-progress tasks', action: 'summary' },
  ];

  const simulateResponse = (userText) => {
    setIsTyping(true);
    const lower = userText.toLowerCase();

    setTimeout(() => {
      setIsTyping(false);

      if (lower.includes('create') && (lower.includes('task') || lower.includes('review') || lower.includes('design'))) {
        setMessages((m) => [...m, {
          role: 'assistant',
          text: "I've drafted a task for you. Opening the create form now with the details pre-filled -- check the main area and adjust anything before saving.",
          action: 'create_task',
          prefill: {
            title: 'Review new design mockups',
            description: 'Go through the latest Figma mockups and leave feedback before end of week.',
            priority: 'HIGH',
            dueDate: '2026-04-10',
            assignee: 'You',
          },
        }]);
        onCreateTask({
          title: 'Review new design mockups',
          description: 'Go through the latest Figma mockups and leave feedback before end of week.',
          priority: 'HIGH',
          dueDate: '2026-04-10',
          assignee: '',
        });
      } else if (lower.includes('due this week') || lower.includes('due soon')) {
        const upcoming = MOCK_TASKS.filter((t) => {
          const d = new Date(t.dueDate);
          const now = new Date();
          const weekEnd = new Date(now);
          weekEnd.setDate(weekEnd.getDate() + 7);
          return d >= now && d <= weekEnd && t.status !== 'COMPLETED';
        });
        const list = upcoming.map((t) => `- **${t.title}** (${PRIORITY_STYLES[t.priority].label}, due ${new Date(t.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })})`).join('\n');
        setMessages((m) => [...m, {
          role: 'assistant',
          text: `You have **${upcoming.length} tasks** due in the next 7 days:\n\n${list || "None -- you are all clear!"}`,
        }]);
      } else if (lower.includes('contact') || lower.includes('priya') || lower.includes('james')) {
        setMessages((m) => [...m, {
          role: 'assistant',
          text: "I've added **Priya Patel** and **James Liu** to your contacts. You can view them in the Contacts page -- I'll open it for you.",
          action: 'show_contacts',
        }]);
        onShowContacts();
      } else if (lower.includes('summar') || lower.includes('in progress') || lower.includes('in-progress')) {
        const inProg = MOCK_TASKS.filter((t) => t.status === 'IN_PROGRESS');
        const list = inProg.map((t) => `- **${t.title}** -- assigned to ${t.assignee}, due ${new Date(t.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`).join('\n');
        setMessages((m) => [...m, {
          role: 'assistant',
          text: `You have **${inProg.length} tasks** in progress:\n\n${list}\n\nWant me to update any of them?`,
        }]);
      } else {
        setMessages((m) => [...m, {
          role: 'assistant',
          text: "Got it. In the full app I'd process that and take action -- this is a mockup demonstrating the side-panel layout. Try one of the suggestions to see real interactions!",
        }]);
      }
    }, 1200);
  };

  const handleSend = (text) => {
    const msg = text || input;
    if (!msg.trim()) return;
    setMessages((m) => [...m, { role: 'user', text: msg }]);
    if (!text) setInput('');
    simulateResponse(msg);
  };

  const formatText = (text) => {
    return text.split('\n').map((line, i) => {
      const formatted = line.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
      return <p key={i} className={i > 0 ? 'mt-1' : ''} dangerouslySetInnerHTML={{ __html: formatted }} />;
    });
  };

  return (
    <div
      className="flex flex-col h-full border-l"
      style={{
        backgroundColor: 'var(--color-bg-secondary)',
        borderColor: 'var(--color-border-default)',
      }}
    >
      {/* Panel header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b" style={{ borderColor: 'var(--color-border-default)' }}>
        <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ backgroundColor: 'var(--color-primary)' }}>
          <span className="text-white text-sm font-bold">T</span>
        </div>
        <div className="flex-1 min-w-0">
          <h2 className="text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>Tialz Assistant</h2>
          <p className="text-xs truncate" style={{ color: 'var(--color-text-tertiary)' }}>Your personal task secretary</p>
        </div>
        <div className="w-2 h-2 rounded-full bg-green-500 flex-shrink-0" />
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-3 py-3 space-y-3" style={{ backgroundColor: 'var(--color-bg-primary)' }}>
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div
              className={`max-w-[88%] px-3 py-2 rounded-xl text-sm ${
                m.role === 'user' ? 'rounded-br-sm' : 'rounded-bl-sm'
              }`}
              style={{
                backgroundColor: m.role === 'user' ? 'var(--color-primary)' : 'var(--color-bg-secondary)',
                color: m.role === 'user' ? '#fff' : 'var(--color-text-primary)',
                border: m.role === 'assistant' ? '1px solid var(--color-border-default)' : undefined,
              }}
            >
              {formatText(m.text)}
              {m.action === 'create_task' && (
                <div className="mt-2 px-2 py-1.5 rounded-md text-xs font-medium flex items-center gap-1.5"
                  style={{ backgroundColor: 'rgba(99,102,241,0.12)', color: 'var(--color-primary)' }}>
                  <span>↗</span> Task form opened on main screen
                </div>
              )}
              {m.action === 'show_contacts' && (
                <div className="mt-2 px-2 py-1.5 rounded-md text-xs font-medium flex items-center gap-1.5"
                  style={{ backgroundColor: 'rgba(16,185,129,0.12)', color: '#10b981' }}>
                  <span>✓</span> Contacts updated
                </div>
              )}
            </div>
          </div>
        ))}
        {isTyping && (
          <div className="flex justify-start">
            <div className="px-3 py-2 rounded-xl rounded-bl-sm border" style={{ backgroundColor: 'var(--color-bg-secondary)', borderColor: 'var(--color-border-default)' }}>
              <TypingIndicator />
            </div>
          </div>
        )}
      </div>

      {/* Suggestions */}
      {messages.length <= 2 && (
        <div className="px-3 py-2 border-t" style={{ borderColor: 'var(--color-border-default)' }}>
          <p className="text-[10px] font-medium uppercase tracking-wider mb-1.5" style={{ color: 'var(--color-text-tertiary)' }}>
            Try asking
          </p>
          <div className="space-y-1">
            {suggestions.map((s) => (
              <button
                key={s.text}
                onClick={() => handleSend(s.text)}
                className="w-full text-left px-2.5 py-1.5 rounded-md text-xs transition-colors"
                style={{ color: 'var(--color-text-secondary)' }}
                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--color-bg-tertiary)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
              >
                {s.text}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input */}
      <div className="px-3 py-3 border-t" style={{ borderColor: 'var(--color-border-default)' }}>
        <div className="flex gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
            placeholder="Ask anything..."
            className="flex-1 px-3 py-2 rounded-lg border text-sm"
            style={{
              backgroundColor: 'var(--color-bg-tertiary)',
              borderColor: 'var(--color-border-default)',
              color: 'var(--color-text-primary)',
            }}
          />
          <button
            onClick={() => handleSend()}
            className="px-3 py-2 rounded-lg text-sm font-medium flex-shrink-0"
            style={{ backgroundColor: 'var(--color-primary)', color: '#fff' }}
          >
            ↑
          </button>
        </div>
      </div>

      <style>{`
        @keyframes typing-dot {
          0%, 60%, 100% { opacity: 0.3; transform: scale(0.8); }
          30% { opacity: 1; transform: scale(1); }
        }
      `}</style>
    </div>
  );
}

export default function AISidePanelDashboard() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedTask, setSelectedTask] = useState(null);
  const [createModal, setCreateModal] = useState(null);
  const [activeNav, setActiveNav] = useState('dashboard');
  const [chatOpen, setChatOpen] = useState(true);
  const [contactsFlash, setContactsFlash] = useState(false);

  const stats = [
    { id: 'all', label: 'Total Tasks', value: MOCK_TASKS.length, emoji: '📋' },
    { id: 'TODO', label: 'To Do', value: MOCK_TASKS.filter((t) => t.status === 'TODO').length, emoji: '📝' },
    { id: 'IN_PROGRESS', label: 'In Progress', value: MOCK_TASKS.filter((t) => t.status === 'IN_PROGRESS').length, emoji: '🔄' },
    { id: 'COMPLETED', label: 'Completed', value: MOCK_TASKS.filter((t) => t.status === 'COMPLETED').length, emoji: '✅' },
    { id: 'ON_HOLD', label: 'On Hold', value: MOCK_TASKS.filter((t) => t.status === 'ON_HOLD').length, emoji: '⏸' },
  ];

  const filtered = MOCK_TASKS.filter((t) => {
    if (statusFilter !== 'all' && t.status !== statusFilter) return false;
    if (search && !t.title.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const handleCreateFromAI = (prefill) => {
    setCreateModal(prefill);
  };

  const handleShowContacts = () => {
    setActiveNav('contacts');
    setContactsFlash(true);
    setTimeout(() => setContactsFlash(false), 2000);
  };

  return (
    <div className="h-screen flex flex-col" style={{ backgroundColor: 'var(--color-bg-primary)', color: 'var(--color-text-primary)' }}>
      {/* Top header bar */}
      <header
        className="flex-shrink-0 border-b z-40"
        style={{ backgroundColor: 'var(--color-bg-secondary)', borderColor: 'var(--color-border-default)' }}
      >
        <div className="px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center font-bold text-white" style={{ backgroundColor: 'var(--color-primary)' }}>T</div>
              <span className="text-lg font-bold" style={{ color: 'var(--color-text-primary)' }}>Tialz</span>
            </div>
            <nav className="hidden md:flex items-center gap-1">
              {NAV_ITEMS.map((item) => (
                <button
                  key={item.id}
                  onClick={() => setActiveNav(item.id)}
                  className="px-3 py-1.5 rounded-md text-sm font-medium flex items-center gap-1.5 transition-colors"
                  style={{
                    backgroundColor: activeNav === item.id ? 'var(--color-bg-tertiary)' : 'transparent',
                    color: activeNav === item.id ? 'var(--color-text-primary)' : 'var(--color-text-secondary)',
                  }}
                >
                  <span className="text-base">{item.icon}</span>
                  {item.label}
                </button>
              ))}
            </nav>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setChatOpen(!chatOpen)}
              className="px-3 py-1.5 rounded-lg text-sm font-medium border flex items-center gap-1.5 transition-all"
              style={{
                backgroundColor: chatOpen ? 'var(--color-primary)' : 'var(--color-bg-tertiary)',
                color: chatOpen ? '#fff' : 'var(--color-text-secondary)',
                borderColor: chatOpen ? 'var(--color-primary)' : 'var(--color-border-default)',
              }}
            >
              <span className="text-base">💬</span>
              <span className="hidden sm:inline">AI Assistant</span>
            </button>
            <div className="flex items-center gap-2">
              <div className="text-right hidden sm:block">
                <div className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>Farouq A.</div>
                <div className="text-xs" style={{ color: 'var(--color-text-tertiary)' }}>Admin</div>
              </div>
              <div
                className="w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-bold cursor-pointer"
                style={{ backgroundColor: 'var(--color-primary)' }}
              >
                FA
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main content area: dashboard + side panel */}
      <div className="flex-1 flex min-h-0 overflow-hidden">
        {/* Main dashboard area */}
        <main className="flex-1 overflow-y-auto">
          {activeNav === 'dashboard' && (
            <div className="max-w-[95%] mx-auto px-4 sm:px-6 lg:px-8 py-6">
              {/* Welcome + actions */}
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
                <div>
                  <h1 className="text-2xl sm:text-3xl font-bold" style={{ color: 'var(--color-text-primary)' }}>
                    Welcome back, Farouq!
                  </h1>
                  <p className="mt-1 text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                    You have {MOCK_TASKS.filter((t) => t.status !== 'COMPLETED').length} active tasks. Your assistant is ready on the right.
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setCreateModal({})}
                    className="px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2"
                    style={{ backgroundColor: 'var(--color-primary)', color: '#fff' }}
                  >
                    + Add New Task
                  </button>
                </div>
              </div>

              {/* Stats row */}
              <div className="flex gap-3 mb-6 overflow-x-auto pb-1">
                {stats.map((s) => (
                  <StatCard
                    key={s.id}
                    label={s.label}
                    value={s.value}
                    emoji={s.emoji}
                    isActive={statusFilter === s.id}
                    onClick={() => setStatusFilter(statusFilter === s.id ? 'all' : s.id)}
                  />
                ))}
              </div>

              {/* Filters */}
              <div className="flex items-center gap-3 mb-6">
                <div className="relative flex-1 max-w-xs">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm" style={{ color: 'var(--color-text-tertiary)' }}>🔍</span>
                  <input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search tasks..."
                    className="w-full pl-9 pr-3 py-2 rounded-lg border text-sm"
                    style={{ backgroundColor: 'var(--color-bg-tertiary)', borderColor: 'var(--color-border-default)', color: 'var(--color-text-primary)' }}
                  />
                </div>
                {search && (
                  <button
                    onClick={() => setSearch('')}
                    className="px-3 py-1.5 rounded-md text-xs font-medium"
                    style={{ backgroundColor: 'var(--color-bg-tertiary)', color: 'var(--color-text-secondary)' }}
                  >
                    Clear
                  </button>
                )}
              </div>

              {/* Task grid */}
              <div className="rounded-lg p-5 shadow-sm border" style={{ backgroundColor: 'var(--color-bg-secondary)', borderColor: 'var(--color-border-default)' }}>
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-lg font-semibold" style={{ color: 'var(--color-text-primary)' }}>
                    {statusFilter === 'all' ? 'All Tasks' : STATUS_STYLES[statusFilter]?.label || 'Tasks'} ({filtered.length})
                  </h2>
                </div>
                {filtered.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4">
                    {filtered.map((task) => (
                      <TaskCard
                        key={task.id}
                        task={task}
                        isSelected={selectedTask?.id === task.id}
                        onClick={() => setSelectedTask(task)}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="py-16 text-center" style={{ color: 'var(--color-text-tertiary)' }}>
                    <div className="text-4xl mb-3">📭</div>
                    <p className="font-medium">No tasks found</p>
                    <p className="text-sm mt-1">Try adjusting your filters or ask the AI assistant to create one</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeNav === 'contacts' && (
            <div className="max-w-[95%] mx-auto px-4 sm:px-6 lg:px-8 py-6">
              <h1 className="text-2xl font-bold mb-6" style={{ color: 'var(--color-text-primary)' }}>Contacts</h1>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {MOCK_CONTACTS.map((c) => (
                  <div
                    key={c.id}
                    className="p-4 rounded-lg border transition-all"
                    style={{
                      backgroundColor: 'var(--color-bg-secondary)',
                      borderColor: contactsFlash ? 'var(--color-primary)' : 'var(--color-border-default)',
                      boxShadow: contactsFlash ? '0 0 20px rgba(99,102,241,0.15)' : undefined,
                    }}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold"
                        style={{ backgroundColor: 'var(--color-primary)' }}
                      >
                        {c.name[0]}
                      </div>
                      <div>
                        <div className="font-medium text-sm" style={{ color: 'var(--color-text-primary)' }}>{c.name}</div>
                        <div className="text-xs" style={{ color: 'var(--color-text-tertiary)' }}>{c.email}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeNav === 'calendar' && (
            <div className="max-w-[95%] mx-auto px-4 sm:px-6 lg:px-8 py-6">
              <h1 className="text-2xl font-bold mb-4" style={{ color: 'var(--color-text-primary)' }}>Calendar</h1>
              <p className="text-sm" style={{ color: 'var(--color-text-tertiary)' }}>Calendar view placeholder -- the AI panel stays open while you browse.</p>
            </div>
          )}

          {activeNav === 'projects' && (
            <div className="max-w-[95%] mx-auto px-4 sm:px-6 lg:px-8 py-6">
              <h1 className="text-2xl font-bold mb-4" style={{ color: 'var(--color-text-primary)' }}>Projects</h1>
              <p className="text-sm" style={{ color: 'var(--color-text-tertiary)' }}>Projects view placeholder -- ask the assistant to create a project.</p>
            </div>
          )}
        </main>

        {/* AI Side Panel */}
        {chatOpen && (
          <aside
            className="flex-shrink-0 hidden lg:block"
            style={{ width: 'min(380px, 28vw)', minWidth: '320px' }}
          >
            <AISidePanel
              onCreateTask={handleCreateFromAI}
              onShowContacts={handleShowContacts}
              chatPanelOpen={chatOpen}
            />
          </aside>
        )}
      </div>

      {/* Task detail modal */}
      {selectedTask && (
        <>
          <div className="fixed inset-0 bg-black/50 z-50" onClick={() => setSelectedTask(null)} />
          <div
            className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-lg rounded-2xl shadow-2xl border p-6"
            style={{ backgroundColor: 'var(--color-bg-secondary)', borderColor: 'var(--color-border-default)' }}
          >
            <div className="flex justify-between items-start mb-4">
              <h2 className="text-xl font-bold" style={{ color: 'var(--color-text-primary)' }}>{selectedTask.title}</h2>
              <button onClick={() => setSelectedTask(null)} className="text-2xl leading-none" style={{ color: 'var(--color-text-tertiary)' }}>×</button>
            </div>
            <div className="flex gap-2 mb-4">
              <Badge {...STATUS_STYLES[selectedTask.status]} />
              <Badge {...PRIORITY_STYLES[selectedTask.priority]} />
            </div>
            <div className="space-y-2 text-sm" style={{ color: 'var(--color-text-secondary)' }}>
              <p>Assigned to: <strong>{selectedTask.assignee}</strong></p>
              <p>Due: <strong>{new Date(selectedTask.dueDate).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</strong></p>
              {selectedTask.subtasks > 0 && <p>Subtasks: {selectedTask.subtasks}</p>}
              {selectedTask.comments > 0 && <p>Comments: {selectedTask.comments}</p>}
            </div>
            <div className="mt-6 flex gap-3">
              <button className="px-4 py-2 rounded-lg text-sm font-medium" style={{ backgroundColor: 'var(--color-primary)', color: '#fff' }}>Edit</button>
              <button className="px-4 py-2 rounded-lg text-sm font-medium border" style={{ borderColor: 'var(--color-border-default)', color: 'var(--color-text-secondary)' }}>Archive</button>
            </div>
          </div>
        </>
      )}

      {/* Create task modal */}
      {createModal && (
        <CreateTaskModal
          onClose={() => setCreateModal(null)}
          prefill={createModal}
        />
      )}
    </div>
  );
}
