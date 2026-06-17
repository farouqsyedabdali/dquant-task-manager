import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence, LayoutGroup } from 'framer-motion';
import useThemeLogo from '../hooks/useThemeLogo';

/**
 * AI-first home mockup — full interactive demo (no backend).
 * Route: /mockups/ai-home-first
 *
 * Three view modes:
 *   welcome — centered hero + composer + suggestions + "My tasks" button
 *   tasks   — 3-column card grid (responsive), scrollable, composer pinned bottom
 *   chat    — conversation thread, composer pinned to bottom
 *
 * Transitions: welcome text/suggestions/button fade out, composer slides
 * down via framer-motion layoutId, tasks or messages fill space above.
 */

const uid = () => `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const EASE_OUT = [0.22, 1, 0.36, 1];

const INITIAL_TASKS = [
  {
    id: 't1',
    title: 'Review vendor API contract',
    project: 'Platform',
    due: 'Today · 4:00 PM',
    priority: 'HIGH',
    status: 'In progress',
  },
  {
    id: 't2',
    title: 'Draft onboarding email sequence',
    project: 'Growth',
    due: 'Tomorrow',
    priority: 'MEDIUM',
    status: 'To do',
  },
  {
    id: 't3',
    title: 'Sync with design on nav IA',
    project: 'Website',
    due: 'Mar 26',
    priority: 'LOW',
    status: 'To do',
  },
  {
    id: 't4',
    title: 'Approve homepage copy for launch',
    project: 'Website',
    due: 'Mar 24',
    priority: 'MEDIUM',
    status: 'To do',
  },
  {
    id: 't5',
    title: 'Document API rate limits for partners',
    project: 'Platform',
    due: 'Mar 28',
    priority: 'LOW',
    status: 'To do',
  },
  {
    id: 't6',
    title: 'Send weekly metrics to stakeholders',
    project: 'Growth',
    due: 'Mar 25',
    priority: 'HIGH',
    status: 'In progress',
  },
];

const SUGGESTIONS = [
  'What are my responsibilities for today?',
  'Summarize tasks due this week',
  'Create a task from this: Ship Q2 deck by Friday — urgent',
  'What might block the website launch?',
];

function getSimulatedReply(text) {
  const lower = text.toLowerCase();
  if (lower.includes('responsibilit') || (lower.includes('today') && lower.includes('?'))) {
    return {
      text:
        "Here's what stands out for **today** based on your active work:\n\n" +
        '• **Review vendor API contract** — due this afternoon (HIGH). This is the critical path for legal sign-off.\n' +
        '• **Draft onboarding email sequence** — not due until tomorrow; you could defer if you need focus time.\n' +
        '• **Website nav IA** — lower priority; good candidate after the contract review.\n\n' +
        'Want me to **reschedule** anything or **draft a follow-up** for the vendor thread?',
      taskCard: null,
    };
  }
  if (lower.includes('week') || lower.includes('summarize')) {
    return {
      text:
        '**This week** you have **4** open items across **Platform**, **Growth**, and **Website**.\n\n' +
        '• Two tasks have deadlines **before Friday**.\n' +
        "• One task has **no due date** yet — I can add one if you tell me when it should land.\n\n" +
        "Say **\"show overdue\"** and I'll list anything past due.",
      taskCard: null,
    };
  }
  if (
    lower.includes('create') ||
    lower.includes('task') ||
    lower.includes('q2') ||
    lower.includes('deck') ||
    lower.includes('urgent') ||
    lower.includes('email')
  ) {
    return {
      text:
        "I've parsed that into a **draft task**. Review the card below — say **\"confirm\"** to save it to your workspace (mockup only).",
      taskCard: {
        title: lower.includes('q2') || lower.includes('deck') ? 'Finalize Q2 board deck' : 'New task from conversation',
        due: 'Friday · EOD',
        priority: 'URGENT',
        project: 'Growth',
      },
    };
  }
  if (lower.includes('block') || lower.includes('launch') || lower.includes('website')) {
    return {
      text:
        'For **Website launch**, likely blockers from your current tasks:\n\n' +
        '• **Nav / IA** is still in **To do** — depends on design sync.\n' +
        '• **API contract** review could slip legal if not closed today.\n\n' +
        'I can **raise priority** on the IA task or **add a dependency** — tell me which.',
      taskCard: null,
    };
  }
  return {
    text:
      "I can **list tasks**, **create** from natural language, **summarize** your week, or **spot risks**. Try one of the suggested prompts, or describe what you need in plain English.",
    taskCard: null,
  };
}

const DEMO_STEPS = [
  {
    user: 'What are my responsibilities for today?',
    assistant:
      "Here's your **today** snapshot:\n\n" +
      '• **Review vendor API contract** — due **4:00 PM** · HIGH priority · In progress\n' +
      '• **Draft onboarding email** — due **tomorrow** · MEDIUM\n' +
      '• **Nav IA sync** — due **Mar 26** · LOW\n\n' +
      'Top recommendation: **finish the contract review first** — it unlocks downstream work. Want me to **block time** or **nudge the assigner**?',
    taskCard: null,
  },
  {
    user:
      'Create a task from this email snippet: "Team — we need the Q2 narrative deck finalized by Friday EOD. Treat as urgent. — Sarah"',
    assistant:
      "Parsed. I'm proposing this **draft** — review and confirm:\n\n" +
      '• Title pulls the **action** (finalize deck), not the email greeting.\n' +
      '• Due **Friday EOD** · Priority **URGENT** · Project **Growth** (inferred).\n\n' +
      "In the full app, I'd match **Sarah** to a teammate if she's in your directory.",
    taskCard: {
      title: 'Finalize Q2 narrative deck',
      due: 'Friday · EOD',
      priority: 'URGENT',
      project: 'Growth',
    },
  },
];

// ─── Main component ───────────────────────────────────────────────

export default function AIHomeFirstMockup() {
  const tialzLogo = useThemeLogo();

  // 'welcome' | 'tasks' | 'chat'
  const [viewMode, setViewMode] = useState('welcome');
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [tasks, setTasks] = useState(INITIAL_TASKS);
  const [isThinking, setIsThinking] = useState(false);
  const [isDemoRunning, setIsDemoRunning] = useState(false);
  const [streamingId, setStreamingId] = useState(null);
  const [toast, setToast] = useState(null);
  const scrollRef = useRef(null);
  const taskScrollRef = useRef(null);
  const textareaRef = useRef(null);
  const demoAbortRef = useRef(false);

  const scrollToBottom = useCallback(() => {
    requestAnimationFrame(() => {
      scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
    });
  }, []);

  useEffect(() => {
    if (viewMode === 'chat') scrollToBottom();
  }, [messages, isThinking, viewMode, scrollToBottom]);

  // Auto-resize textarea
  useEffect(() => {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.style.height = 'auto';
    ta.style.height = `${Math.min(ta.scrollHeight, 160)}px`;
  }, [input]);

  // ─── Streaming helpers ────────────────────────────────────────

  const streamContent = useCallback(async (messageId, fullText, onDone) => {
    const chunk = 2;
    for (let i = 0; i <= fullText.length; i += chunk) {
      if (demoAbortRef.current) {
        setMessages((prev) =>
          prev.map((m) => (m.id === messageId ? { ...m, isStreaming: false } : m))
        );
        setStreamingId(null);
        return;
      }
      const slice = fullText.slice(0, i);
      setMessages((prev) =>
        prev.map((m) => (m.id === messageId ? { ...m, content: slice, isStreaming: i < fullText.length } : m))
      );
      await sleep(14 + Math.random() * 8);
    }
    setMessages((prev) =>
      prev.map((m) => (m.id === messageId ? { ...m, isStreaming: false } : m))
    );
    setStreamingId(null);
    onDone?.();
  }, []);

  const pushUserMessage = (text) => {
    const id = uid();
    setMessages((prev) => [...prev, { id, role: 'user', content: text.trim() }]);
    return id;
  };

  const pushAssistantShell = () => {
    const id = uid();
    setMessages((prev) => [...prev, { id, role: 'assistant', content: '', isStreaming: true, taskCard: null }]);
    setStreamingId(id);
    return id;
  };

  const runReplyPipeline = useCallback(
    async (reply) => {
      setIsThinking(true);
      await sleep(650 + Math.random() * 400);
      setIsThinking(false);
      const asstId = pushAssistantShell();
      await sleep(120);
      await streamContent(asstId, reply.text, () => {
        if (reply.taskCard) {
          setMessages((prev) =>
            prev.map((m) => (m.id === asstId ? { ...m, taskCard: reply.taskCard } : m))
          );
        }
      });
    },
    [streamContent]
  );

  // ─── Actions ──────────────────────────────────────────────────

  const handleSend = async (raw) => {
    const text = (raw ?? input).trim();
    if (!text || isThinking || streamingId) return;
    setInput('');
    setViewMode('chat');
    pushUserMessage(text);
    const reply = getSimulatedReply(text);
    await runReplyPipeline(reply);
    if (reply.taskCard) {
      setToast('Draft task ready — review the card in the thread.');
      setTimeout(() => setToast(null), 3200);
    }
  };

  const runGuidedDemo = async () => {
    if (isDemoRunning) return;
    demoAbortRef.current = false;
    setIsDemoRunning(true);
    setMessages([]);
    setTasks(INITIAL_TASKS);
    setViewMode('chat');

    for (let step = 0; step < DEMO_STEPS.length; step++) {
      if (demoAbortRef.current) break;
      const { user, assistant, taskCard } = DEMO_STEPS[step];

      await sleep(step === 0 ? 400 : 500);
      pushUserMessage(user);
      await sleep(350);

      setIsThinking(true);
      await sleep(500 + Math.random() * 350);
      setIsThinking(false);

      const asstId = pushAssistantShell();
      await sleep(100);
      await streamContent(asstId, assistant, () => {
        if (taskCard) {
          setMessages((prev) =>
            prev.map((m) => (m.id === asstId ? { ...m, taskCard } : m))
          );
        }
      });

      if (taskCard) {
        await sleep(200);
        const newTask = {
          id: `demo-${uid()}`,
          title: taskCard.title,
          project: taskCard.project,
          due: taskCard.due.replace(' · EOD', ''),
          priority: taskCard.priority,
          status: 'Draft',
        };
        setTasks((prev) => [newTask, ...prev]);
        setToast('Task added — open My tasks to see it.');
        setTimeout(() => setToast(null), 2800);
      }
      await sleep(600);
    }

    setIsDemoRunning(false);
  };

  const stopDemo = () => {
    demoAbortRef.current = true;
    setIsDemoRunning(false);
    setIsThinking(false);
    setStreamingId(null);
  };

  const resetAll = () => {
    stopDemo();
    setMessages([]);
    setTasks(INITIAL_TASKS);
    setInput('');
    setToast(null);
    setViewMode('welcome');
  };

  const onKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // ─── Render ───────────────────────────────────────────────────

  return (
    <LayoutGroup>
      <div
        className="min-h-screen flex flex-col relative overflow-hidden"
        style={{
          backgroundColor: 'var(--color-bg-primary)',
          color: 'var(--color-text-primary)',
        }}
      >
        <style>{`
          .ai-home-mockup-gradient {
            background: radial-gradient(ellipse 80% 60% at 50% -20%, rgba(99, 102, 241, 0.18), transparent 55%),
              radial-gradient(ellipse 50% 40% at 100% 50%, rgba(139, 92, 246, 0.08), transparent 50%),
              var(--color-bg-primary);
          }
          .dark .ai-home-mockup-gradient {
            background: radial-gradient(ellipse 80% 60% at 50% -20%, rgba(99, 102, 241, 0.25), transparent 55%),
              radial-gradient(ellipse 50% 40% at 100% 50%, rgba(139, 92, 246, 0.12), transparent 50%),
              var(--color-bg-primary);
          }
          @keyframes ai-dots {
            0%, 80%, 100% { transform: translateY(0); opacity: 0.4; }
            40% { transform: translateY(-4px); opacity: 1; }
          }
          .ai-dot { animation: ai-dots 1.2s ease-in-out infinite; }
          .ai-dot:nth-child(2) { animation-delay: 0.15s; }
          .ai-dot:nth-child(3) { animation-delay: 0.3s; }
        `}</style>

        {/* ─── Header ─────────────────────────────────────────── */}
        <header
          className="shrink-0 z-30 flex items-center justify-between gap-3 px-4 sm:px-6 h-14 border-b backdrop-blur-md"
          style={{
            borderColor: 'var(--color-border-default)',
            backgroundColor: 'color-mix(in srgb, var(--color-bg-primary) 88%, transparent)',
          }}
        >
          <div className="flex items-center gap-3 min-w-0">
            <img src={tialzLogo} alt="" className="h-9 w-9 object-contain shrink-0" />
            <div className="min-w-0 hidden sm:block">
              <p className="text-sm font-semibold truncate leading-tight">TIALZ</p>
              <p className="text-[11px] truncate" style={{ color: 'var(--color-text-tertiary)' }}>
                Acme Ops · Workspace
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <motion.button
              type="button"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={runGuidedDemo}
              disabled={isDemoRunning || !!streamingId}
              className="hidden sm:inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium border transition-opacity disabled:opacity-50"
              style={{
                borderColor: 'var(--color-border-default)',
                color: 'var(--color-text-secondary)',
                backgroundColor: 'var(--color-bg-secondary)',
              }}
            >
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              {isDemoRunning ? 'Demo playing…' : 'Play guided demo'}
            </motion.button>

            {isDemoRunning && (
              <button
                type="button"
                onClick={stopDemo}
                className="text-xs px-2 py-1 rounded-lg underline-offset-2 hover:underline"
                style={{ color: 'var(--color-text-tertiary)' }}
              >
                Stop
              </button>
            )}

            {viewMode !== 'welcome' && (
              <button
                type="button"
                onClick={resetAll}
                className="hidden sm:inline text-xs px-3 py-1.5 rounded-lg border"
                style={{
                  borderColor: 'var(--color-border-default)',
                  color: 'var(--color-text-secondary)',
                  backgroundColor: 'var(--color-bg-secondary)',
                }}
              >
                New conversation
              </button>
            )}

            {/* Show "My tasks" in header only in chat mode */}
            {viewMode === 'chat' && (
              <motion.button
                type="button"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.25 }}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => setViewMode('tasks')}
                className="relative flex items-center gap-2 px-3 sm:px-4 py-2 rounded-xl text-sm font-medium"
                style={{
                  backgroundColor: 'var(--color-primary)',
                  color: 'white',
                  boxShadow: '0 2px 16px rgba(99, 102, 241, 0.35)',
                }}
              >
                My tasks
                <span
                  className="text-[10px] px-1.5 py-0.5 rounded-md font-semibold"
                  style={{ backgroundColor: 'rgba(255,255,255,0.2)' }}
                >
                  {tasks.length}
                </span>
              </motion.button>
            )}

            <button
              type="button"
              className="p-2 rounded-xl relative"
              style={{ backgroundColor: 'var(--color-bg-secondary)' }}
              aria-label="Notifications"
            >
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-rose-500 ring-2 ring-[var(--color-bg-secondary)]" />
              <svg className="w-5 h-5 opacity-80" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
            </button>
            <div
              className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0"
              style={{ background: 'linear-gradient(135deg, var(--color-primary), var(--color-accent))' }}
            >
              FA
            </div>
          </div>
        </header>

        {/* ─── Main area ──────────────────────────────────────── */}
        <div className="flex-1 flex flex-col min-h-0 ai-home-mockup-gradient">
          <AnimatePresence mode="wait">
            {/* ────────── WELCOME ────────── */}
            {viewMode === 'welcome' && (
              <motion.div
                key="welcome"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0, y: -18, transition: { duration: 0.3, ease: EASE_OUT } }}
                transition={{ duration: 0.4, ease: EASE_OUT }}
                className="flex-1 flex flex-col items-center justify-center px-4 pb-16 pt-8"
              >
                {/* Hero text */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.08, duration: 0.5, ease: EASE_OUT }}
                  className="max-w-2xl w-full text-center"
                >
                  <p
                    className="text-[11px] uppercase tracking-[0.2em] font-semibold mb-3"
                    style={{ color: 'var(--color-text-tertiary)' }}
                  >
                    AI-first workspace
                  </p>
                  <h1 className="text-3xl sm:text-4xl font-bold tracking-tight mb-3">
                    What do you need to get done?
                  </h1>
                  <p className="text-base sm:text-lg mb-10 max-w-lg mx-auto" style={{ color: 'var(--color-text-secondary)' }}>
                    Start with plain language. I'll turn it into structured tasks, summaries, and next steps — no
                    empty form fields first.
                  </p>
                </motion.div>

                {/* Composer (welcome position — centered) */}
                <motion.div
                  layoutId="composer"
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.15, duration: 0.45, ease: EASE_OUT, layout: { duration: 0.5, ease: EASE_OUT } }}
                  className="w-full max-w-2xl"
                >
                  <Composer
                    textareaRef={textareaRef}
                    input={input}
                    setInput={setInput}
                    onKeyDown={onKeyDown}
                    onSend={() => handleSend()}
                    disabled={!!streamingId}
                    placeholder="Ask anything, paste an email, or describe work in your own words…"
                    size="lg"
                  />
                </motion.div>

                {/* Suggestions */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.22, duration: 0.4, ease: EASE_OUT }}
                  className="mt-6 flex flex-wrap justify-center gap-2 max-w-2xl"
                >
                  {SUGGESTIONS.map((s, i) => (
                    <motion.button
                      key={s}
                      type="button"
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.28 + i * 0.06, duration: 0.35, ease: EASE_OUT }}
                      whileHover={{ scale: 1.02, y: -1 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => {
                        setInput(s);
                        setTimeout(() => handleSend(s), 50);
                      }}
                      className="text-left text-xs sm:text-sm px-3 py-2 rounded-xl border max-w-[280px] sm:max-w-none"
                      style={{
                        borderColor: 'var(--color-border-default)',
                        backgroundColor: 'var(--color-bg-secondary)',
                        color: 'var(--color-text-secondary)',
                      }}
                    >
                      {s}
                    </motion.button>
                  ))}
                </motion.div>

                {/* My tasks button (welcome position — below suggestions) */}
                <motion.button
                  type="button"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.55, duration: 0.4, ease: EASE_OUT }}
                  whileHover={{ scale: 1.03, y: -1 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => setViewMode('tasks')}
                  className="mt-8 flex items-center gap-2.5 px-5 py-2.5 rounded-xl text-sm font-medium border"
                  style={{
                    borderColor: 'var(--color-border-default)',
                    backgroundColor: 'var(--color-bg-secondary)',
                    color: 'var(--color-text-primary)',
                  }}
                >
                  <svg className="w-4 h-4 opacity-70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                  My tasks
                  <span
                    className="text-[10px] px-1.5 py-0.5 rounded-md font-semibold"
                    style={{ backgroundColor: 'var(--color-primary)', color: 'white' }}
                  >
                    {tasks.length}
                  </span>
                </motion.button>

                <p className="text-center text-[11px] mt-6" style={{ color: 'var(--color-text-tertiary)' }}>
                  Interactive mockup · responses are simulated · no account required
                </p>
              </motion.div>
            )}

            {/* ────────── TASKS VIEW ────────── */}
            {viewMode === 'tasks' && (
              <motion.div
                key="tasks"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0, transition: { duration: 0.2 } }}
                transition={{ duration: 0.35, ease: EASE_OUT }}
                className="flex-1 flex flex-col min-h-0"
              >
                {/* Tasks header row */}
                <div className="shrink-0 flex items-center justify-between px-4 sm:px-8 pt-5 pb-3">
                  <div className="flex items-center gap-3">
                    <h2 className="text-xl font-bold">My tasks</h2>
                    <span
                      className="text-xs px-2 py-0.5 rounded-lg font-semibold"
                      style={{ backgroundColor: 'var(--color-bg-tertiary)', color: 'var(--color-text-secondary)' }}
                    >
                      {tasks.length}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    {messages.length > 0 && (
                      <button
                        type="button"
                        onClick={() => setViewMode('chat')}
                        className="text-xs px-3 py-1.5 rounded-lg border flex items-center gap-1.5"
                        style={{
                          borderColor: 'var(--color-border-default)',
                          color: 'var(--color-text-secondary)',
                          backgroundColor: 'var(--color-bg-secondary)',
                        }}
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                        </svg>
                        Back to chat
                      </button>
                    )}
                  </div>
                </div>

                {/* Task grid — 3×2-style layout on xl, scrolls for overflow */}
                <div
                  ref={taskScrollRef}
                  className="flex-1 min-h-0 overflow-y-auto scrollbar-thin px-4 sm:px-6 lg:px-8 pb-4"
                >
                  <div className="max-w-6xl mx-auto">
                    <p className="text-[11px] mb-3 text-center sm:text-left" style={{ color: 'var(--color-text-tertiary)' }}>
                      Scroll for more · cards match dashboard-style density
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 auto-rows-fr pb-2">
                      {tasks.map((t, i) => (
                        <TaskGridCard key={t.id} task={t} index={i} />
                      ))}
                    </div>
                    <p className="text-center text-[11px] mt-6 pb-2" style={{ color: 'var(--color-text-tertiary)' }}>
                      In the real app, edits here sync with chat commands instantly.
                    </p>
                  </div>
                </div>

                {/* Composer (bottom position) */}
                <motion.div
                  layoutId="composer"
                  transition={{ layout: { duration: 0.5, ease: EASE_OUT } }}
                  className="shrink-0 border-t px-4 sm:px-8 py-4 backdrop-blur-md"
                  style={{
                    borderColor: 'var(--color-border-default)',
                    backgroundColor: 'color-mix(in srgb, var(--color-bg-primary) 92%, transparent)',
                  }}
                >
                  <div className="max-w-6xl mx-auto">
                    <Composer
                      textareaRef={textareaRef}
                      input={input}
                      setInput={setInput}
                      onKeyDown={onKeyDown}
                      onSend={() => handleSend()}
                      disabled={!!streamingId || isThinking}
                      placeholder="Ask about these tasks, create new ones, or paste context…"
                      size="sm"
                    />
                  </div>
                </motion.div>
              </motion.div>
            )}

            {/* ────────── CHAT VIEW ────────── */}
            {viewMode === 'chat' && (
              <motion.div
                key="chat"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0, transition: { duration: 0.2 } }}
                transition={{ duration: 0.35, ease: EASE_OUT }}
                className="flex-1 flex flex-col min-h-0"
              >
                <div
                  ref={scrollRef}
                  className="flex-1 overflow-y-auto scrollbar-thin px-4 sm:px-8 py-6 space-y-5"
                >
                  <AnimatePresence initial={false}>
                    {messages.map((m, index) => (
                      <motion.div
                        key={m.id}
                        layout
                        initial={{ opacity: 0, y: 16, filter: 'blur(4px)' }}
                        animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                        transition={{
                          duration: 0.4,
                          ease: EASE_OUT,
                          delay: Math.min(index * 0.03, 0.15),
                        }}
                        className={`flex gap-3 ${m.role === 'user' ? 'flex-row-reverse' : ''}`}
                      >
                        <div
                          className="w-9 h-9 rounded-2xl shrink-0 flex items-center justify-center overflow-hidden text-xs font-bold text-white"
                          style={{
                            background:
                              m.role === 'user'
                                ? 'linear-gradient(135deg, #64748b, #475569)'
                                : 'linear-gradient(135deg, var(--color-primary), var(--color-accent))',
                          }}
                        >
                          {m.role === 'user' ? 'You' : <img src={tialzLogo} alt="" className="w-6 h-6 object-contain" />}
                        </div>
                        <div className={`min-w-0 max-w-[min(100%,720px)] ${m.role === 'user' ? 'text-right' : ''}`}>
                          <div
                            className={`inline-block text-left rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-sm ${
                              m.role === 'user' ? 'rounded-tr-md' : 'rounded-tl-md'
                            }`}
                            style={{
                              backgroundColor:
                                m.role === 'user' ? 'var(--color-primary)' : 'var(--color-bg-secondary)',
                              color: m.role === 'user' ? 'white' : 'var(--color-text-primary)',
                              border:
                                m.role === 'user' ? 'none' : '1px solid var(--color-border-default)',
                            }}
                          >
                            <MessageBody text={m.content} isUser={m.role === 'user'} />
                            {m.role === 'assistant' && m.isStreaming && (
                              <span className="inline-block w-1.5 h-4 ml-0.5 align-middle bg-current opacity-70 animate-pulse" />
                            )}
                          </div>

                          {m.role === 'assistant' && m.taskCard && !m.isStreaming && (
                            <motion.div
                              initial={{ opacity: 0, y: 10, scale: 0.98 }}
                              animate={{ opacity: 1, y: 0, scale: 1 }}
                              transition={{ duration: 0.35, ease: EASE_OUT }}
                              className="mt-3 p-4 rounded-2xl border text-left max-w-md"
                              style={{
                                backgroundColor: 'var(--color-bg-tertiary)',
                                borderColor: 'var(--color-border-default)',
                              }}
                            >
                              <p className="text-[10px] uppercase tracking-wider font-semibold mb-2" style={{ color: 'var(--color-text-tertiary)' }}>
                                Draft task
                              </p>
                              <p className="font-semibold text-base mb-2">{m.taskCard.title}</p>
                              <div className="flex flex-wrap gap-2 text-xs">
                                <span className="px-2 py-1 rounded-lg" style={{ backgroundColor: 'var(--color-bg-primary)' }}>
                                  Due {m.taskCard.due}
                                </span>
                                <span
                                  className="px-2 py-1 rounded-lg font-medium text-white"
                                  style={{ backgroundColor: '#dc2626' }}
                                >
                                  {m.taskCard.priority}
                                </span>
                                <span className="px-2 py-1 rounded-lg" style={{ backgroundColor: 'var(--color-bg-primary)' }}>
                                  {m.taskCard.project}
                                </span>
                              </div>
                              <div className="mt-3 flex gap-2">
                                <button
                                  type="button"
                                  className="text-xs px-3 py-1.5 rounded-lg font-medium text-white"
                                  style={{ backgroundColor: 'var(--color-primary)' }}
                                >
                                  Confirm (mock)
                                </button>
                                <button
                                  type="button"
                                  className="text-xs px-3 py-1.5 rounded-lg border"
                                  style={{ borderColor: 'var(--color-border-default)', color: 'var(--color-text-secondary)' }}
                                >
                                  Edit
                                </button>
                              </div>
                            </motion.div>
                          )}
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>

                  <AnimatePresence>
                    {isThinking && (
                      <motion.div
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -4 }}
                        className="flex gap-3 items-center pl-1"
                      >
                        <div
                          className="w-9 h-9 rounded-2xl flex items-center justify-center"
                          style={{ background: 'linear-gradient(135deg, var(--color-primary), var(--color-accent))' }}
                        >
                          <img src={tialzLogo} alt="" className="w-6 h-6 object-contain" />
                        </div>
                        <div
                          className="flex items-center gap-1 px-4 py-3 rounded-2xl rounded-tl-md border"
                          style={{
                            backgroundColor: 'var(--color-bg-secondary)',
                            borderColor: 'var(--color-border-default)',
                          }}
                        >
                          <span className="ai-dot w-2 h-2 rounded-full bg-[var(--color-text-tertiary)]" />
                          <span className="ai-dot w-2 h-2 rounded-full bg-[var(--color-text-tertiary)]" />
                          <span className="ai-dot w-2 h-2 rounded-full bg-[var(--color-text-tertiary)]" />
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Composer (bottom position) */}
                <motion.div
                  layoutId="composer"
                  transition={{ layout: { duration: 0.5, ease: EASE_OUT } }}
                  className="shrink-0 border-t px-4 sm:px-8 py-4 backdrop-blur-md"
                  style={{
                    borderColor: 'var(--color-border-default)',
                    backgroundColor: 'color-mix(in srgb, var(--color-bg-primary) 92%, transparent)',
                  }}
                >
                  <div className="max-w-3xl mx-auto">
                    <Composer
                      textareaRef={textareaRef}
                      input={input}
                      setInput={setInput}
                      onKeyDown={onKeyDown}
                      onSend={() => handleSend()}
                      disabled={!!streamingId || isThinking}
                      placeholder="Follow up, paste more context, or ask for a summary…"
                      size="sm"
                    />
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Mobile demo FAB */}
        <div className="sm:hidden fixed bottom-24 right-4 z-20">
          <motion.button
            type="button"
            whileTap={{ scale: 0.95 }}
            onClick={runGuidedDemo}
            disabled={isDemoRunning}
            className="px-4 py-2 rounded-full text-xs font-semibold text-white shadow-lg disabled:opacity-50"
            style={{ backgroundColor: 'var(--color-primary)' }}
          >
            {isDemoRunning ? 'Demo…' : 'Play demo'}
          </motion.button>
        </div>

        {/* Toast */}
        <AnimatePresence>
          {toast && (
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[60] px-4 py-3 rounded-xl shadow-xl text-sm font-medium text-white max-w-[90vw]"
              style={{ backgroundColor: 'var(--color-primary-dark)', boxShadow: '0 8px 32px rgba(79,70,229,0.4)' }}
            >
              {toast}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </LayoutGroup>
  );
}

// ─── Task card (grid cell) ────────────────────────────────────────

function TaskGridCard({ task, index }) {
  const t = task;
  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 16, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ delay: Math.min(index * 0.04, 0.24), duration: 0.38, ease: EASE_OUT }}
      className="flex flex-col min-h-[188px] p-4 rounded-2xl border cursor-default group transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5"
      style={{
        borderColor: 'var(--color-border-default)',
        backgroundColor: 'var(--color-bg-secondary)',
        boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
      }}
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <span
          className="text-[10px] font-semibold uppercase tracking-wider truncate max-w-[55%]"
          style={{ color: 'var(--color-text-tertiary)' }}
        >
          {t.project}
        </span>
        <div className="flex flex-wrap justify-end gap-1.5 shrink-0">
          <StatusBadge s={t.status} />
          <PriorityBadge p={t.priority} />
        </div>
      </div>
      <h3 className="font-semibold text-sm leading-snug mb-3 flex-1 line-clamp-3" style={{ color: 'var(--color-text-primary)' }}>
        {t.title}
      </h3>
      <div
        className="mt-auto pt-3 border-t flex items-center justify-between gap-2 text-[11px]"
        style={{ borderColor: 'var(--color-border-light)', color: 'var(--color-text-secondary)' }}
      >
        <span className="flex items-center gap-1.5 min-w-0">
          <svg className="w-3.5 h-3.5 shrink-0 opacity-70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <span className="truncate">{t.due}</span>
        </span>
        <button
          type="button"
          className="text-[10px] font-medium px-2 py-1 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity focus:opacity-100"
          style={{ backgroundColor: 'var(--color-bg-tertiary)', color: 'var(--color-text-secondary)' }}
          tabIndex={-1}
        >
          Open
        </button>
      </div>
    </motion.article>
  );
}

// ─── Shared Composer ──────────────────────────────────────────────

function Composer({ textareaRef, input, setInput, onKeyDown, onSend, disabled, placeholder, size }) {
  const isLg = size === 'lg';
  return (
    <div
      className={`rounded-2xl border p-2 transition-shadow focus-within:ring-2 focus-within:ring-[var(--color-primary)] focus-within:border-transparent ${
        isLg ? 'shadow-xl' : 'shadow-lg'
      }`}
      style={{
        backgroundColor: 'var(--color-bg-secondary)',
        borderColor: 'var(--color-border-default)',
        ...(isLg ? { boxShadow: '0 12px 40px rgba(0,0,0,0.08)' } : {}),
      }}
    >
      <textarea
        ref={textareaRef}
        rows={1}
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={onKeyDown}
        placeholder={placeholder}
        disabled={disabled}
        className={`w-full bg-transparent px-4 resize-none outline-none placeholder:opacity-50 disabled:opacity-50 ${
          isLg ? 'py-3 text-base min-h-[52px]' : 'py-3 text-sm min-h-[48px]'
        }`}
        style={{ color: 'var(--color-text-primary)' }}
      />
      <div className={`flex items-center px-2 pb-2 gap-2 ${isLg ? 'justify-between' : 'justify-end'}`}>
        {isLg && (
          <span className="text-[11px] pl-2" style={{ color: 'var(--color-text-tertiary)' }}>
            Enter to send · Shift+Enter for newline
          </span>
        )}
        <motion.button
          type="button"
          whileHover={{ scale: 1.04 }}
          whileTap={{ scale: 0.96 }}
          onClick={onSend}
          disabled={!input?.trim() || disabled}
          className="px-4 py-2 rounded-xl text-sm font-semibold text-white disabled:opacity-40"
          style={{ backgroundColor: 'var(--color-primary)' }}
        >
          Send
        </motion.button>
      </div>
    </div>
  );
}

// ─── Small components ─────────────────────────────────────────────

function PriorityBadge({ p }) {
  const colors = {
    URGENT: '#dc2626',
    HIGH: '#ea580c',
    MEDIUM: '#ca8a04',
    LOW: '#64748b',
  };
  return (
    <span
      className="text-[10px] font-bold px-2 py-0.5 rounded-md text-white"
      style={{ backgroundColor: colors[p] || colors.LOW }}
    >
      {p}
    </span>
  );
}

function StatusBadge({ s }) {
  const map = {
    'In progress': { bg: '#2563eb', label: 'In progress' },
    'To do': { bg: '#64748b', label: 'To do' },
    Draft: { bg: '#a855f7', label: 'Draft' },
  };
  const cfg = map[s] || map['To do'];
  return (
    <span className="text-[10px] font-medium px-2 py-0.5 rounded-md text-white" style={{ backgroundColor: cfg.bg }}>
      {cfg.label}
    </span>
  );
}

function MessageBody({ text, isUser }) {
  if (!text) return null;
  if (isUser) {
    return <p className="whitespace-pre-wrap">{text}</p>;
  }
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return (
    <p className="whitespace-pre-wrap">
      {parts.map((part, i) => {
        if (part.startsWith('**') && part.endsWith('**')) {
          return (
            <strong key={i} className="font-semibold">
              {part.slice(2, -2)}
            </strong>
          );
        }
        return <span key={i}>{part}</span>;
      })}
    </p>
  );
}
