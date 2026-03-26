import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { useNavigate, useParams, Navigate, useLocation } from 'react-router-dom';
import { motion, LayoutGroup } from 'framer-motion';
import { FaPaperPlane, FaPlus, FaCalendarAlt, FaProjectDiagram, FaUsers, FaUserFriends } from 'react-icons/fa';
import IconButton from '../components/common/IconButton';
import ReactMarkdown from 'react-markdown';
import useAuthStore from '../context/authStore';
import useTaskStore from '../stores/taskStore';
import { aiAPI, tasksAPI, taskArchiveAPI } from '../services/api';
import TaskCard from '../components/tasks/TaskCard';
import AddTaskModal from '../components/tasks/AddTaskModal';
import AIDashboardHeader from '../components/layout/AIDashboardHeader';
import AIDashboardShortcuts from '../components/layout/AIDashboardShortcuts';
import DeleteConfirmModal from '../components/common/DeleteConfirmModal';
import SkeletonCard from '../components/common/SkeletonCard';
import Calendar from '../components/calendar/Calendar';
import Projects from './Projects';
import Contacts from './Contacts';
import Employees from './Employees';

const EASE = [0.22, 1, 0.36, 1];

const COMPOSER_TEXT_INSET = 'pl-4';
const CHAT_COLUMN = 'max-w-3xl w-full mx-auto';

const PRIORITY_BG = { URGENT: '#dc2626', HIGH: '#ea580c', MEDIUM: '#ca8a04', LOW: '#64748b' };

const SUGGESTIONS = [
  "What's due soon?",
  "What should I prioritize today?",
  'Summarize my active tasks',
  'What needs to be done this week?',
];

function revealTextProcedural(setContent, fullText, onComplete) {
  let i = 0;
  const len = fullText.length;
  const charsPerFrame = Math.max(2, Math.ceil(len / 80));
  let raf = 0;
  const tick = () => {
    i = Math.min(len, i + charsPerFrame);
    setContent(fullText.slice(0, i));
    if (i < len) {
      raf = requestAnimationFrame(tick);
    } else {
      onComplete?.();
    }
  };
  raf = requestAnimationFrame(tick);
  return () => cancelAnimationFrame(raf);
}

function buildChatHistoryPayload(messages) {
  return messages
    .filter(
      (m) =>
        (m.role === 'user' || m.role === 'assistant') &&
        typeof m.content === 'string' &&
        m.content.length > 0 &&
        !m.streaming
    )
    .map((m) => ({ role: m.role, content: m.content }));
}

function formatDueLabel(d) {
  if (!d) return 'No due date';
  try {
    const date = new Date(d);
    const weekday = date.toLocaleDateString(undefined, { weekday: 'long' });
    const rest = date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    return `Due ${weekday} · ${rest}`;
  } catch {
    return '—';
  }
}

const VALID_LENSES = ['welcome', 'tasks', 'chat', 'calendar', 'projects', 'contacts', 'employees'];

function deriveViewMode(lens, valid) {
  if (!valid) return 'welcome';
  if (lens === 'tasks') return 'tasks';
  if (lens === 'chat') return 'chat';
  if (lens === 'calendar') return 'calendar';
  if (lens === 'projects') return 'projects';
  if (lens === 'contacts') return 'contacts';
  if (lens === 'employees') return 'employees';
  return 'welcome';
}

function getComposerPlaceholder(vm) {
  switch (vm) {
    case 'tasks':
      return 'Ask about your tasks…';
    case 'calendar':
      return 'Ask about your schedule…';
    case 'projects':
      return 'Ask about your projects…';
    case 'contacts':
      return 'Ask about your contacts…';
    case 'employees':
      return 'Ask about your team…';
    default:
      return 'Follow up…';
  }
}

export default function AppWorkSurface({ taskbarAction, onTaskbarActionHandled }) {
  const { user, isAdmin } = useAuthStore();
  const canSeeEmployeesLens = useMemo(() => isAdmin() && !user?.isPersonal, [user, isAdmin]);
  const { lens } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const firstName = user?.name?.split(/\s+/)[0] || 'there';
  const validLens = VALID_LENSES.includes(lens);
  const viewMode = deriveViewMode(lens, validLens);
  const {
    tasks,
    filters,
    fetchTasks,
    getFilteredTasks,
    updateTaskStatus,
    updateTaskPriority,
    deleteTask,
    isLoading: tasksStoreLoading,
  } = useTaskStore();

  const [input, setInput] = useState('');
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [deleteTaskId, setDeleteTaskId] = useState(null);
  const [extensionTaskData, setExtensionTaskData] = useState(null);
  const [isAddTaskOpen, setIsAddTaskOpen] = useState(false);
  const scrollRef = useRef(null);
  const inputRef = useRef(null);
  const revealCancelRef = useRef(null);

  const composerDocked = messages.length > 0;
  const filteredTasks = useMemo(() => getFilteredTasks(), [tasks, filters, getFilteredTasks]);

  const scrollToBottom = useCallback(() => {
    requestAnimationFrame(() => {
      scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
    });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, viewMode, scrollToBottom]);

  useEffect(() => () => revealCancelRef.current?.(), []);

  useEffect(() => {
    if (validLens && (lens === 'tasks' || lens === 'calendar')) fetchTasks();
  }, [lens, validLens, fetchTasks]);

  /** Welcome + messages → chat */
  useEffect(() => {
    if (!validLens) return;
    if (lens === 'welcome' && messages.length > 0) {
      navigate('/app/chat', { replace: true });
    }
  }, [lens, messages.length, navigate, validLens]);

  /** Chat + no messages → welcome (direct /app/chat hit; not while sending) */
  useEffect(() => {
    if (!validLens) return;
    if (lens === 'chat' && messages.length === 0 && !loading) {
      navigate('/app/welcome', { replace: true });
    }
  }, [lens, messages.length, loading, navigate, validLens]);

  /** Browser extension / AIModal: popupData in URL → open add task */
  useEffect(() => {
    const urlParams = new URLSearchParams(location.search);
    const popupDataKey = urlParams.get('popupData');
    if (!popupDataKey) return;
    try {
      const raw = localStorage.getItem(popupDataKey);
      if (!raw) return;
      const parsed = JSON.parse(raw);
      if (parsed.type === 'create' && parsed.taskData) {
        setExtensionTaskData({
          ...parsed.taskData,
          originalText: parsed.originalText,
        });
        setIsAddTaskOpen(true);
        navigate('/app/tasks', { replace: true });
      }
      localStorage.removeItem(popupDataKey);
    } catch {
      navigate('/app/tasks', { replace: true });
    }
  }, [location.search, navigate]);

  /** Electron taskbar: simple create from clipboard */
  useEffect(() => {
    if (!taskbarAction || taskbarAction.action !== 'create-task') return;
    if (taskbarAction.useAI) {
      if (onTaskbarActionHandled) onTaskbarActionHandled();
      return;
    }
    setExtensionTaskData({
      title: taskbarAction.clipboardText?.substring(0, 50) || 'New Task',
      description: taskbarAction.clipboardText || '',
      priority: 'MEDIUM',
      dueDate: null,
      assignee: null,
      originalText: taskbarAction.clipboardText,
    });
    setIsAddTaskOpen(true);
    navigate('/app/tasks', { replace: true });
    if (onTaskbarActionHandled) onTaskbarActionHandled();
  }, [taskbarAction, onTaskbarActionHandled, navigate]);

  const openTasksView = () => navigate('/app/tasks', { replace: true });
  const openCalendarView = () => navigate('/app/calendar', { replace: true });
  const openProjectsView = () => navigate('/app/projects', { replace: true });
  const openContactsView = () => navigate('/app/contacts', { replace: true });
  const openEmployeesView = () => navigate('/app/employees', { replace: true });

  const startNewConversation = () => {
    revealCancelRef.current?.();
    setMessages([]);
    setInput('');
    setError(null);
    navigate('/app/welcome', { replace: true });
  };

  const handleProposalAction = async (msgId, proposalIndex, action) => {
    setMessages((prev) =>
      prev.map((m) => {
        if (m.id !== msgId || !m.proposals) return m;
        const updated = [...m.proposals];
        updated[proposalIndex] = { ...updated[proposalIndex], status: action === 'approve' ? 'creating' : 'declined' };
        return { ...m, proposals: updated };
      })
    );

    if (action !== 'approve') return;

    const msg = messages.find((m) => m.id === msgId);
    const proposal = msg?.proposals?.[proposalIndex];
    if (!proposal) return;

    try {
      const taskData = {
        title: proposal.title,
        description: proposal.description || '',
        priority: proposal.priority || 'MEDIUM',
        assigneeId: user?.id,
      };
      if (proposal.dueDate) taskData.dueDate = proposal.dueDate;

      await tasksAPI.create(taskData);
      await fetchTasks();

      setMessages((prev) =>
        prev.map((m) => {
          if (m.id !== msgId || !m.proposals) return m;
          const updated = [...m.proposals];
          updated[proposalIndex] = { ...updated[proposalIndex], status: 'created' };
          return { ...m, proposals: updated };
        })
      );
    } catch (e) {
      const errMsg = e.response?.data?.error || e.message || 'Failed to create task';
      setMessages((prev) =>
        prev.map((m) => {
          if (m.id !== msgId || !m.proposals) return m;
          const updated = [...m.proposals];
          updated[proposalIndex] = { ...updated[proposalIndex], status: 'error', error: errMsg };
          return { ...m, proposals: updated };
        })
      );
    }
  };

  const sendMessage = async (raw) => {
    const text = (raw ?? input).trim();
    if (!text || loading) return;

    const history = buildChatHistoryPayload(messages);
    setInput('');
    setError(null);

    const userMsg = { id: `u-${Date.now()}`, role: 'user', content: text };
    const asstId = `a-${Date.now()}`;
    setMessages((prev) => [...prev, userMsg, { id: asstId, role: 'assistant', content: '', streaming: true }]);
    navigate('/app/chat', { replace: true });
    setLoading(true);

    try {
      const { data } = await aiAPI.chat(text, history);
      setLoading(false);

      const full = typeof data?.response === 'string' ? data.response : '';
      const proposals = Array.isArray(data?.proposals)
        ? data.proposals.map((p) => ({ ...p, status: 'pending' }))
        : null;

      if (!full && (!proposals || proposals.length === 0)) {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === asstId
              ? { ...m, content: '(No response)', streaming: false }
              : m
          )
        );
        return;
      }

      if (!full && proposals) {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === asstId
              ? {
                  ...m,
                  content: "Here's what I've put together — review the draft below.",
                  streaming: false,
                  proposals,
                }
              : m
          )
        );
        return;
      }

      revealCancelRef.current?.();
      revealCancelRef.current = revealTextProcedural(
        (slice) => {
          setMessages((prev) =>
            prev.map((m) =>
              m.id === asstId
                ? { ...m, content: slice, streaming: slice.length < full.length }
                : m
            )
          );
        },
        full,
        () => {
          setMessages((prev) =>
            prev.map((m) =>
              m.id === asstId
                ? { ...m, streaming: false, ...(proposals ? { proposals } : {}) }
                : m
            )
          );
        }
      );
    } catch (e) {
      const msg = e.response?.data?.error || e.message || 'Something went wrong';
      setError(msg);
      setMessages((prev) =>
        prev.map((m) => (m.id === asstId ? { ...m, content: `Error: ${msg}`, streaming: false } : m))
      );
      setLoading(false);
    }
  };

  const handleStatusChange = async (taskId, newStatus) => await updateTaskStatus(taskId, newStatus);
  const handlePriorityChange = async (taskId, newPriority) => await updateTaskPriority(taskId, newPriority);
  const handleDelete = (taskId) => setDeleteTaskId(taskId);
  const confirmDelete = async () => {
    if (deleteTaskId) { await deleteTask(deleteTaskId); setDeleteTaskId(null); }
  };
  const handleArchiveTask = async (taskId) => { try { await taskArchiveAPI.archiveTask(taskId); await fetchTasks(); } catch {} };
  const handleUnarchiveTask = async (taskId) => { try { await taskArchiveAPI.unarchiveTask(taskId); await fetchTasks(); } catch {} };
  const deleteTaskTitle = deleteTaskId != null ? filteredTasks.find((t) => t.id === deleteTaskId)?.title || 'this task' : '';

  if (!validLens) {
    return <Navigate to="/app/welcome" replace />;
  }
  if (lens === 'employees' && !canSeeEmployeesLens) {
    return <Navigate to="/app/welcome" replace />;
  }

  const onKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  };

  const dockedToolbar = (
    <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
      <div className="flex flex-wrap items-center gap-2">
        <IconButton label="New conversation" variant="secondary" size="sm" onClick={startNewConversation} />
        {viewMode === 'chat' && (
          <>
            <IconButton label="View my tasks" variant="secondary" size="sm" onClick={openTasksView} />
            <IconButton label="Calendar" icon={<FaCalendarAlt />} variant="secondary" size="sm" onClick={openCalendarView} />
            <IconButton label="Projects" icon={<FaProjectDiagram />} variant="secondary" size="sm" onClick={openProjectsView} />
            <IconButton label="Contacts" icon={<FaUserFriends />} variant="secondary" size="sm" onClick={openContactsView} />
            {canSeeEmployeesLens && (
              <IconButton label="Employees" icon={<FaUsers />} variant="secondary" size="sm" onClick={openEmployeesView} />
            )}
          </>
        )}
        {['tasks', 'calendar', 'projects', 'contacts', 'employees'].includes(viewMode) && (
          <IconButton label="Back to chat" variant="secondary" size="sm" onClick={() => navigate('/app/chat', { replace: true })} />
        )}
      </div>
      {viewMode === 'tasks' && (
        <IconButton icon={<FaPlus />} label="Add New Task" variant="primary" size="sm" onClick={() => setIsAddTaskOpen(true)} />
      )}
    </div>
  );

  const tasksSectionTitle =
    viewMode === 'tasks' && !composerDocked ? (
      <div className="mb-4 flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-semibold">My tasks</h2>
          <IconButton label="Back" variant="secondary" size="sm" onClick={() => navigate('/app/welcome', { replace: true })} />
        </div>
        <IconButton icon={<FaPlus />} label="Add New Task" variant="primary" size="sm" onClick={() => setIsAddTaskOpen(true)} />
      </div>
    ) : null;

  const calendarSectionTitle =
    viewMode === 'calendar' && !composerDocked ? (
      <div className="mb-4 flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-semibold">Calendar</h2>
          <IconButton label="Back" variant="secondary" size="sm" onClick={() => navigate('/app/welcome', { replace: true })} />
        </div>
      </div>
    ) : null;

  const projectsSectionTitle =
    viewMode === 'projects' && !composerDocked ? (
      <div className="mb-4 flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-semibold">Projects and events</h2>
          <IconButton label="Back" variant="secondary" size="sm" onClick={() => navigate('/app/welcome', { replace: true })} />
        </div>
      </div>
    ) : null;

  const contactsSectionTitle =
    viewMode === 'contacts' && !composerDocked ? (
      <div className="mb-4 flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-semibold">Contacts</h2>
          <IconButton label="Back" variant="secondary" size="sm" onClick={() => navigate('/app/welcome', { replace: true })} />
        </div>
      </div>
    ) : null;

  const employeesSectionTitle =
    viewMode === 'employees' && !composerDocked ? (
      <div className="mb-4 flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-semibold">Employees</h2>
          <IconButton label="Back" variant="secondary" size="sm" onClick={() => navigate('/app/welcome', { replace: true })} />
        </div>
      </div>
    ) : null;

  const tasksGrid = (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, ease: EASE }} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6 pb-4">
      {tasksStoreLoading && Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} variant="task" />)}
      {!tasksStoreLoading && filteredTasks.map((task, i) => (
        <motion.div key={task.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: Math.min(i * 0.03, 0.18), duration: 0.28, ease: EASE }}>
          <TaskCard task={task} onStatusChange={handleStatusChange} onPriorityChange={handlePriorityChange} onDelete={handleDelete} onArchive={handleArchiveTask} onUnarchive={handleUnarchiveTask} />
        </motion.div>
      ))}
      {!tasksStoreLoading && filteredTasks.length === 0 && (
        <p className="text-sm col-span-full" style={{ color: 'var(--color-text-tertiary)' }}>No active tasks. Create one to get started.</p>
      )}
    </motion.div>
  );

  return (
    <LayoutGroup>
      <div className="min-h-screen flex flex-col relative overflow-hidden" style={{ backgroundColor: 'var(--color-bg-primary)', color: 'var(--color-text-primary)' }}>
        <AIDashboardHeader />

        <div className="pointer-events-none absolute inset-0 opacity-100" style={{ background: 'radial-gradient(ellipse 70% 50% at 50% -15%, color-mix(in srgb, var(--color-primary) 22%, transparent), transparent 55%)' }} />

        <div className="flex-1 flex flex-col min-h-0 relative z-10">
          {!composerDocked ? (
            <>
              {viewMode === 'welcome' && (
                <div className="flex-1 flex flex-col min-h-0 overflow-hidden px-4 sm:px-6">
                  <div className="flex-1 flex flex-col justify-center min-h-0 py-8">
                    <div className={`${CHAT_COLUMN} flex flex-col gap-8`}>
                      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, ease: EASE }} className={`w-full text-left space-y-2 ${COMPOSER_TEXT_INSET}`}>
                        <p className="text-2xl sm:text-3xl font-semibold tracking-tight" style={{ color: 'var(--color-text-primary)' }}>Hello, {firstName}</p>
                        <h1 className="text-xl sm:text-2xl font-medium tracking-tight" style={{ color: 'var(--color-text-secondary)' }}>What do you want to get done?</h1>
                      </motion.div>

                      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08, duration: 0.4, ease: EASE }} className={`flex flex-wrap gap-2 ${COMPOSER_TEXT_INSET}`}>
                        {SUGGESTIONS.map((s) => (
                          <button key={s} type="button" onClick={() => sendMessage(s)} disabled={loading} className="text-left text-xs sm:text-sm px-3 py-2 rounded-full border transition-transform hover:scale-[1.02] disabled:opacity-50" style={{ borderColor: 'var(--color-border-default)', backgroundColor: 'var(--color-bg-secondary)', color: 'var(--color-text-secondary)' }}>
                            {s}
                          </button>
                        ))}
                      </motion.div>

                      <motion.div layoutId="aidash-composer" transition={{ layout: { duration: 0.55, ease: EASE } }} className="w-full">
                        <ComposerRow inputRef={inputRef} input={input} setInput={setInput} onKeyDown={onKeyDown} onSend={() => sendMessage()} disabled={loading} placeholder="Ask anything about your tasks…" />
                      </motion.div>

                      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.15, duration: 0.35 }} className="w-full">
                        <AIDashboardShortcuts onViewTasks={openTasksView} size="md" />
                      </motion.div>
                    </div>
                  </div>
                </div>
              )}

              {viewMode === 'tasks' && (
                <div className="flex-1 flex flex-col min-h-0">
                  <div ref={scrollRef} className="flex-1 overflow-y-auto scrollbar-thin px-4 sm:px-6 py-4 min-h-0">
                    <div className="max-w-[1600px] mx-auto w-full">{tasksSectionTitle}{tasksGrid}</div>
                  </div>
                  <div className="shrink-0 px-4 sm:px-6 pb-10 pt-2">
                    <div className={CHAT_COLUMN}>
                      <motion.div layoutId="aidash-composer" transition={{ layout: { duration: 0.55, ease: EASE } }} className="w-full">
                        <ComposerRow inputRef={inputRef} input={input} setInput={setInput} onKeyDown={onKeyDown} onSend={() => sendMessage()} disabled={loading} placeholder="Ask anything about your tasks…" />
                      </motion.div>
                    </div>
                  </div>
                </div>
              )}

              {viewMode === 'calendar' && (
                <div className="flex-1 flex flex-col min-h-0">
                  <div ref={scrollRef} className="flex-1 overflow-y-auto scrollbar-thin px-4 sm:px-6 py-4 min-h-0">
                    <div className="max-w-[95%] mx-auto w-full">
                      {calendarSectionTitle}
                      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, ease: EASE }}>
                        <Calendar />
                      </motion.div>
                    </div>
                  </div>
                  <div className="shrink-0 px-4 sm:px-6 pb-10 pt-2">
                    <div className={CHAT_COLUMN}>
                      <motion.div layoutId="aidash-composer" transition={{ layout: { duration: 0.55, ease: EASE } }} className="w-full">
                        <ComposerRow inputRef={inputRef} input={input} setInput={setInput} onKeyDown={onKeyDown} onSend={() => sendMessage()} disabled={loading} placeholder={getComposerPlaceholder('calendar')} />
                      </motion.div>
                    </div>
                  </div>
                </div>
              )}

              {viewMode === 'projects' && (
                <div className="flex-1 flex flex-col min-h-0">
                  <div ref={scrollRef} className="flex-1 overflow-y-auto scrollbar-thin px-4 sm:px-6 py-4 min-h-0">
                    <div className="max-w-[95%] mx-auto w-full">
                      {projectsSectionTitle}
                      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, ease: EASE }}>
                        <Projects />
                      </motion.div>
                    </div>
                  </div>
                  <div className="shrink-0 px-4 sm:px-6 pb-10 pt-2">
                    <div className={CHAT_COLUMN}>
                      <motion.div layoutId="aidash-composer" transition={{ layout: { duration: 0.55, ease: EASE } }} className="w-full">
                        <ComposerRow inputRef={inputRef} input={input} setInput={setInput} onKeyDown={onKeyDown} onSend={() => sendMessage()} disabled={loading} placeholder={getComposerPlaceholder('projects')} />
                      </motion.div>
                    </div>
                  </div>
                </div>
              )}

              {viewMode === 'contacts' && (
                <div className="flex-1 flex flex-col min-h-0">
                  <div ref={scrollRef} className="flex-1 overflow-y-auto scrollbar-thin px-4 sm:px-6 py-4 min-h-0">
                    <div className="max-w-[95%] mx-auto w-full">
                      {contactsSectionTitle}
                      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, ease: EASE }}>
                        <Contacts />
                      </motion.div>
                    </div>
                  </div>
                  <div className="shrink-0 px-4 sm:px-6 pb-10 pt-2">
                    <div className={CHAT_COLUMN}>
                      <motion.div layoutId="aidash-composer" transition={{ layout: { duration: 0.55, ease: EASE } }} className="w-full">
                        <ComposerRow inputRef={inputRef} input={input} setInput={setInput} onKeyDown={onKeyDown} onSend={() => sendMessage()} disabled={loading} placeholder={getComposerPlaceholder('contacts')} />
                      </motion.div>
                    </div>
                  </div>
                </div>
              )}

              {viewMode === 'employees' && (
                <div className="flex-1 flex flex-col min-h-0">
                  <div ref={scrollRef} className="flex-1 overflow-y-auto scrollbar-thin px-4 sm:px-6 py-4 min-h-0">
                    <div className="max-w-[95%] mx-auto w-full">
                      {employeesSectionTitle}
                      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, ease: EASE }}>
                        <Employees />
                      </motion.div>
                    </div>
                  </div>
                  <div className="shrink-0 px-4 sm:px-6 pb-10 pt-2">
                    <div className={CHAT_COLUMN}>
                      <motion.div layoutId="aidash-composer" transition={{ layout: { duration: 0.55, ease: EASE } }} className="w-full">
                        <ComposerRow inputRef={inputRef} input={input} setInput={setInput} onKeyDown={onKeyDown} onSend={() => sendMessage()} disabled={loading} placeholder={getComposerPlaceholder('employees')} />
                      </motion.div>
                    </div>
                  </div>
                </div>
              )}
            </>
          ) : (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.25, ease: EASE }} className="flex-1 flex flex-col min-h-0">
              <div ref={scrollRef} className="flex-1 overflow-y-auto scrollbar-thin px-4 sm:px-6 py-4 min-h-0">
                <div className={viewMode === 'chat' ? CHAT_COLUMN : 'max-w-[1600px] mx-auto w-full'}>
                  {dockedToolbar}

                  {viewMode === 'tasks' && <div className="mb-4"><h2 className="text-lg font-semibold">My tasks</h2></div>}

                  {viewMode === 'calendar' && (
                    <div className="mb-4 max-w-[95%] mx-auto w-full">
                      <h2 className="text-lg font-semibold mb-4">Calendar</h2>
                      <Calendar />
                    </div>
                  )}

                  {viewMode === 'projects' && (
                    <div className="mb-4 max-w-[95%] mx-auto w-full">
                      <h2 className="text-lg font-semibold mb-4">Projects and events</h2>
                      <Projects />
                    </div>
                  )}

                  {viewMode === 'contacts' && (
                    <div className="mb-4 max-w-[95%] mx-auto w-full">
                      <h2 className="text-lg font-semibold mb-4">Contacts</h2>
                      <Contacts />
                    </div>
                  )}

                  {viewMode === 'employees' && (
                    <div className="mb-4 max-w-[95%] mx-auto w-full">
                      <h2 className="text-lg font-semibold mb-4">Employees</h2>
                      <Employees />
                    </div>
                  )}

                  {viewMode === 'chat' && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.2 }} className="space-y-4 pb-4">
                      {messages.map((m) => (
                        <motion.div key={m.id} layout initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.28, ease: EASE }} className={`flex flex-col w-full ${m.role === 'user' ? 'items-end' : 'items-start'}`}>
                          <div
                            className={`rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-sm ${
                              m.role === 'user' ? 'max-w-[min(100%,22rem)] rounded-tr-md' : 'max-w-full rounded-tl-md border'
                            }`}
                            style={
                              m.role === 'user'
                                ? { backgroundColor: 'var(--color-primary)', color: 'white' }
                                : { backgroundColor: 'var(--color-bg-secondary)', color: 'var(--color-text-primary)', borderColor: 'var(--color-border-default)' }
                            }
                          >
                            {m.role === 'assistant' && !m.content && m.streaming ? (
                              <span className="inline-flex gap-1 py-0.5">
                                <span className="w-1.5 h-1.5 rounded-full bg-current opacity-50 animate-pulse" />
                                <span className="w-1.5 h-1.5 rounded-full bg-current opacity-50 animate-pulse" style={{ animationDelay: '0.15s' }} />
                                <span className="w-1.5 h-1.5 rounded-full bg-current opacity-50 animate-pulse" style={{ animationDelay: '0.3s' }} />
                              </span>
                            ) : (
                              <>
                                {m.role === 'assistant' ? (
                                  <div className="ai-markdown">
                                    <ReactMarkdown>{m.content}</ReactMarkdown>
                                  </div>
                                ) : (
                                  <p className="whitespace-pre-wrap">{m.content}</p>
                                )}
                                {m.role === 'assistant' && m.streaming && (
                                  <span className="inline-block w-0.5 h-4 ml-0.5 align-middle bg-current opacity-60 animate-pulse" />
                                )}
                              </>
                            )}
                          </div>

                          {m.role === 'assistant' && m.proposals && !m.streaming && (
                            <div className="mt-3 space-y-3 w-full max-w-md">
                              {m.proposals.map((p, pi) => (
                                <DraftCard key={pi} proposal={p} onAction={(action) => handleProposalAction(m.id, pi, action)} />
                              ))}
                            </div>
                          )}
                        </motion.div>
                      ))}
                    </motion.div>
                  )}

                  {viewMode === 'tasks' && tasksGrid}
                  {viewMode === 'chat' && error && <p className="text-center text-sm py-2 text-red-500">{error}</p>}
                </div>
              </div>

              <motion.div layoutId="aidash-composer" transition={{ layout: { duration: 0.55, ease: EASE } }} className="shrink-0 border-t px-4 sm:px-6 py-3 backdrop-blur-md" style={{ borderColor: 'var(--color-border-default)', backgroundColor: 'color-mix(in srgb, var(--color-bg-primary) 92%, transparent)' }}>
                <div className={viewMode === 'chat' ? CHAT_COLUMN : 'max-w-[1600px] mx-auto w-full'}>
                  <ComposerRow
                    inputRef={inputRef}
                    input={input}
                    setInput={setInput}
                    onKeyDown={onKeyDown}
                    onSend={() => sendMessage()}
                    disabled={loading}
                    placeholder={getComposerPlaceholder(viewMode)}
                  />
                </div>
              </motion.div>
            </motion.div>
          )}
        </div>

        <p className="relative z-10 text-center text-[11px] py-4 px-4" style={{ color: 'var(--color-text-tertiary)' }}>
          AI can make mistakes. Verify important actions in your task list.
        </p>
      </div>

      {isAddTaskOpen && (
        <AddTaskModal
          isOpen
          initialData={extensionTaskData}
          onClose={() => {
            setIsAddTaskOpen(false);
            setExtensionTaskData(null);
            fetchTasks();
          }}
        />
      )}

      {deleteTaskId != null && (
        <DeleteConfirmModal isOpen onClose={() => setDeleteTaskId(null)} onConfirm={confirmDelete} taskTitle={deleteTaskTitle} />
      )}
    </LayoutGroup>
  );
}

function DraftCard({ proposal, onAction }) {
  const p = proposal;
  const isPending = !p.status || p.status === 'pending';
  const isCreating = p.status === 'creating';
  const isCreated = p.status === 'created';
  const isDeclined = p.status === 'declined';
  const isError = p.status === 'error';

  return (
    <motion.div
      initial={{ opacity: 0, y: 10, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
      className="p-4 rounded-2xl border text-left"
      style={{
        backgroundColor: 'var(--color-bg-tertiary, var(--color-bg-secondary))',
        borderColor: 'var(--color-border-default)',
        opacity: isDeclined ? 0.5 : 1,
      }}
    >
      <p className="text-[10px] uppercase tracking-wider font-semibold mb-2" style={{ color: 'var(--color-text-tertiary)' }}>
        {isCreated ? 'Task created' : isDeclined ? 'Declined' : 'Draft task'}
      </p>
      <p className="font-semibold text-base mb-2 leading-snug">{p.title}</p>
      {p.description && (
        <p className="text-xs mb-2" style={{ color: 'var(--color-text-secondary)' }}>{p.description}</p>
      )}
      <div className="flex flex-wrap gap-2 text-xs mb-3">
        <span className="px-2 py-1 rounded-lg" style={{ backgroundColor: 'var(--color-bg-primary)' }}>
          {formatDueLabel(p.dueDate)}
        </span>
        {p.priority && (
          <span className="px-2 py-1 rounded-lg font-medium text-white" style={{ backgroundColor: PRIORITY_BG[p.priority] || PRIORITY_BG.MEDIUM }}>
            {p.priority}
          </span>
        )}
        {p.assignee && (
          <span className="px-2 py-1 rounded-lg" style={{ backgroundColor: 'var(--color-bg-primary)' }}>
            {p.assignee}
          </span>
        )}
      </div>

      {isPending && (
        <div className="flex gap-2">
          <button type="button" onClick={() => onAction('approve')} className="text-xs px-3 py-1.5 rounded-lg font-medium text-white" style={{ backgroundColor: 'var(--color-primary)' }}>
            Approve
          </button>
          <button type="button" onClick={() => onAction('decline')} className="text-xs px-3 py-1.5 rounded-lg border" style={{ borderColor: 'var(--color-border-default)', color: 'var(--color-text-secondary)' }}>
            Decline
          </button>
        </div>
      )}
      {isCreating && <p className="text-xs" style={{ color: 'var(--color-text-tertiary)' }}>Creating…</p>}
      {isCreated && <p className="text-xs font-medium" style={{ color: 'var(--color-primary)' }}>Added to your tasks</p>}
      {isDeclined && <p className="text-xs" style={{ color: 'var(--color-text-tertiary)' }}>Dismissed</p>}
      {isError && <p className="text-xs text-red-500">{p.error}</p>}
    </motion.div>
  );
}

function ComposerRow({ inputRef, input, setInput, onKeyDown, onSend, disabled, placeholder }) {
  return (
    <div
      className="flex items-center gap-2 rounded-full border pl-4 pr-1.5 py-1.5 shadow-md transition-shadow focus-within:ring-2 focus-within:ring-[var(--color-primary)]"
      style={{ backgroundColor: 'var(--color-bg-secondary)', borderColor: 'var(--color-border-default)', boxShadow: '0 4px 24px rgba(0,0,0,0.06)' }}
    >
      <input
        ref={inputRef}
        type="text"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={onKeyDown}
        placeholder={placeholder}
        disabled={disabled}
        className="flex-1 min-w-0 bg-transparent text-sm sm:text-base outline-none h-10 px-0 placeholder:opacity-50 disabled:opacity-60"
        style={{ color: 'var(--color-text-primary)' }}
        autoComplete="off"
      />
      <motion.button
        type="button"
        aria-label="Send"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={onSend}
        disabled={!input.trim() || disabled}
        className="shrink-0 w-10 h-10 rounded-full flex items-center justify-center text-white disabled:opacity-35 disabled:cursor-not-allowed"
        style={{ backgroundColor: 'var(--color-primary)' }}
      >
        <FaPaperPlane className="w-4 h-4 -ml-0.5" />
      </motion.button>
    </div>
  );
}
