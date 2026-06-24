import { useState, useRef, useEffect, useMemo } from 'react';
import ReactMarkdown from 'react-markdown';
import { aiAPI } from '../../services/api';
import { consumeAiChatStream } from '../../services/aiChatStream';
import { FaCheck, FaPaperPlane, FaPen, FaRegTrashAlt, FaStop, FaTimes, FaUndo, FaRedo } from 'react-icons/fa';
import IconButton from '../common/IconButton';

const RenderDiff = ({ before, after }) => {
  const beforeLines = typeof before === 'string' ? before.split('\n') : [String(before || '')];
  const afterLines = typeof after === 'string' ? after.split('\n') : [String(after || '')];

  return (
    <div className="mt-1.5 grid grid-cols-2 gap-2 font-mono text-[10px] leading-4 border rounded-lg p-2 overflow-x-auto"
         style={{ borderColor: 'var(--color-border-default)', backgroundColor: 'var(--color-bg-secondary)' }}>
      <div className="border-r pr-2 space-y-0.5 border-dashed" style={{ borderColor: 'var(--color-border-default)' }}>
        <p className="text-[9px] font-sans font-semibold uppercase tracking-wider mb-1" style={{ color: 'var(--color-text-tertiary)' }}>Before</p>
        {beforeLines.map((line, idx) => (
          <div key={idx} className="bg-red-500/10 text-red-400 px-1 rounded break-all whitespace-pre-wrap">
            - {line}
          </div>
        ))}
      </div>
      <div className="pl-1 space-y-0.5">
        <p className="text-[9px] font-sans font-semibold uppercase tracking-wider mb-1" style={{ color: 'var(--color-text-tertiary)' }}>After</p>
        {afterLines.map((line, idx) => (
          <div key={idx} className="bg-green-500/10 text-green-400 px-1 rounded break-all whitespace-pre-wrap">
            + {line}
          </div>
        ))}
      </div>
    </div>
  );
};

const isLongText = (change) => {
  const beforeStr = String(change.before || '');
  const afterStr = String(change.after || '');
  return change.field === 'description' || change.field === 'content' || beforeStr.length > 40 || afterStr.length > 40;
};

const STORAGE_KEY = 'aiConversation:v2';
const LEGACY_STORAGE_KEY = 'aiConversation';

const SUGGESTIONS = [
  'Create a task due tomorrow at 5pm',
  'What should I focus on today?',
  'Add a comment to a task',
  'Move a project deadline'
];

const STATUS_COPY = {
  PENDING: { label: 'Ready to review', tone: 'info' },
  NEEDS_CLARIFICATION: { label: 'Needs details', tone: 'warning' },
  UPDATING: { label: 'Updating', tone: 'working' },
  EXECUTING: { label: 'Running', tone: 'working' },
  REJECTING: { label: 'Rejecting', tone: 'working' },
  UNDOING: { label: 'Undoing', tone: 'working' },
  EXECUTED: { label: 'Done', tone: 'success' },
  UNDONE: { label: 'Undone', tone: 'muted' },
  REJECTED: { label: 'Rejected', tone: 'muted' },
  SUPERSEDED: { label: 'Updated draft', tone: 'muted' },
  ERROR: { label: 'Needs attention', tone: 'danger' }
};

const ACTION_COPY = {
  create_task: { label: 'Create task', objectLabel: 'Task draft', verb: 'create this task' },
  update_task: { label: 'Update task', objectLabel: 'Task update', verb: 'update this task' },
  add_subtask: { label: 'Add subtask', objectLabel: 'Subtask draft', verb: 'add this subtask' },
  create_project: { label: 'Create project', objectLabel: 'Project draft', verb: 'create this project' },
  update_project: { label: 'Update project', objectLabel: 'Project update', verb: 'update this project' },
  add_comment: { label: 'Add comment', objectLabel: 'Comment draft', verb: 'add this comment' }
};

const TASK_STATUS_OPTIONS = ['TODO', 'IN_PROGRESS', 'COMPLETED', 'ON_HOLD', 'CANCELLED'];
const PROJECT_STATUS_OPTIONS = ['ACTIVE', 'ON_HOLD', 'COMPLETED', 'ARCHIVED'];

function proposalHasUndo(proposal) {
  return !!(proposal?.undoData || proposal?.undoLabel || proposal?.preview?.undoLabel);
}

function findLatestUndoableProposal(messages) {
  for (let messageIndex = messages.length - 1; messageIndex >= 0; messageIndex -= 1) {
    const proposals = messages[messageIndex]?.proposals;
    if (!Array.isArray(proposals)) continue;
    for (let proposalIndex = proposals.length - 1; proposalIndex >= 0; proposalIndex -= 1) {
      const proposal = proposals[proposalIndex];
      if (proposal?.id && proposal.status === 'EXECUTED' && proposalHasUndo(proposal)) {
        return { proposal, messageIndex, proposalIndex };
      }
    }
  }
  return null;
}

function isDraftSaveDisabled(actionType, draft) {
  if (actionType === 'add_comment') return !(draft.content || '').trim();
  if (actionType === 'create_task' || actionType === 'add_subtask' || actionType === 'create_project') {
    return !(draft.title || '').trim() || !(draft.dueDate || '').trim();
  }
  return false;
}

/** All PENDING executable proposals in the latest assistant message that still has drafts (in list order). */
function collectExecutablePendingChain(messages) {
  for (let messageIndex = messages.length - 1; messageIndex >= 0; messageIndex -= 1) {
    const proposals = messages[messageIndex]?.proposals;
    if (!Array.isArray(proposals)) continue;
    const steps = [];
    proposals.forEach((p, proposalIndex) => {
      if (p?.id && p.status === 'PENDING' && p.canExecute !== false) {
        steps.push({ messageIndex, proposalIndex, id: p.id });
      }
    });
    if (steps.length) return steps;
  }
  return [];
}

/** While streaming, hide raw action JSON so the thread stays readable. */
function maskAssistantStreamText(message) {
  const raw = message.content || '';
  if (!message.streaming) return raw;
  const fence = raw.indexOf('```');
  if (fence !== -1) {
    const before = raw.slice(0, fence).trimEnd();
    return (before ? `${before}\n\n` : '') + 'Preparing your review…';
  }
  const arr = raw.search(/\[\s*\{/);
  if (arr !== -1 && /"action"\s*:/.test(raw.slice(arr, Math.min(raw.length, arr + 400)))) {
    const before = raw.slice(0, arr).trimEnd();
    return (before ? `${before}\n\n` : '') + 'Preparing your review…';
  }
  const brace = raw.search(/\{\s*"action"\s*:/);
  if (brace !== -1) {
    const before = raw.slice(0, brace).trimEnd();
    return (before ? `${before}\n\n` : '') + 'Preparing your review…';
  }
  return raw;
}

/**
 * @param {'rail' | 'sheet' | 'modal'} layout
 * @param {() => void} [onAction]
 * @param {() => void} [onClose]
 */
const AssistantPanel = ({ layout = 'rail', onAction, onClose }) => {
  const [messages, setMessages] = useState(loadConversation);
  const [input, setInput] = useState('');
  const [error, setError] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [statusText, setStatusText] = useState('Ready');
  const [selectedProposalIds, setSelectedProposalIds] = useState(new Set());

  const currentPendingProposals = useMemo(() => {
    return collectExecutablePendingChain(messages);
  }, [messages]);

  useEffect(() => {
    setSelectedProposalIds(new Set(currentPendingProposals.map(p => p.id)));
  }, [currentPendingProposals]);

  const handleBulkApprove = async () => {
    if (selectedProposalIds.size === 0 || isProcessing) return;
    setIsProcessing(true);
    setStatusText(`Applying ${selectedProposalIds.size} updates…`);
    try {
      const stepsToExecute = currentPendingProposals.filter(p => selectedProposalIds.has(p.id));
      for (const step of stepsToExecute) {
        const { messageIndex, proposalIndex, id } = step;
        updateProposalStatus(messageIndex, proposalIndex, { status: 'EXECUTING' });
        const { data } = await aiAPI.executeAction(id);
        updateProposalStatus(messageIndex, proposalIndex, {
          ...(data.action || {}),
          status: data.action?.status || 'EXECUTED',
          result: data.result,
        });
      }
      setStatusText('Ready');
      if (onAction) onAction();
    } catch (err) {
      setError(getErrorMessage(err, 'Could not apply updates'));
      setStatusText('Needs attention');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleBulkReject = async () => {
    if (selectedProposalIds.size === 0 || isProcessing) return;
    setIsProcessing(true);
    setStatusText(`Rejecting ${selectedProposalIds.size} drafts…`);
    try {
      const stepsToReject = currentPendingProposals.filter(p => selectedProposalIds.has(p.id));
      for (const step of stepsToReject) {
        const { messageIndex, proposalIndex, id } = step;
        updateProposalStatus(messageIndex, proposalIndex, { status: 'REJECTING' });
        const { data } = await aiAPI.rejectAction(id);
        updateProposalStatus(messageIndex, proposalIndex, {
          ...(data.action || {}),
          status: data.action?.status || 'REJECTED',
        });
      }
      setStatusText('Ready');
    } catch (err) {
      setError(getErrorMessage(err, 'Failed to reject selected drafts'));
      setStatusText('Needs attention');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRetry = async (msgIdx) => {
    const userMsg = messages[msgIdx];
    if (!userMsg || userMsg.role !== 'user') return;
    const nextMessages = messages.slice(0, msgIdx + 1);
    setMessages(nextMessages);
    setError(null);
    await handleSend(userMsg.content);
  };
  const messagesScrollRef = useRef(null);
  const streamAbortRef = useRef(null);
  /** Coalesce SSE deltas to one React update per animation frame (avoids Markdown/layout thrash). */
  const streamMsgIdRef = useRef(null);
  const streamPendingRef = useRef('');
  const streamRafRef = useRef(null);

  const cancelStreamRaf = () => {
    if (streamRafRef.current != null) {
      cancelAnimationFrame(streamRafRef.current);
      streamRafRef.current = null;
    }
  };

  const flushStreamPendingSync = () => {
    const id = streamMsgIdRef.current;
    const pending = streamPendingRef.current;
    if (!pending || !id) return;
    streamPendingRef.current = '';
    setMessages((prev) => {
      const next = [...prev];
      const last = next[next.length - 1];
      if (last?.role !== 'assistant' || last.id !== id) return prev;
      next[next.length - 1] = { ...last, content: (last.content || '') + pending };
      return next;
    });
  };

  const scheduleStreamFlush = () => {
    if (streamRafRef.current != null) return;
    streamRafRef.current = requestAnimationFrame(() => {
      streamRafRef.current = null;
      if (!streamMsgIdRef.current) return;
      const chunk = streamPendingRef.current;
      streamPendingRef.current = '';
      if (chunk) {
        setMessages((prev) => {
          const next = [...prev];
          const last = next[next.length - 1];
          const id = streamMsgIdRef.current;
          if (last?.role !== 'assistant' || !id || last.id !== id) return prev;
          next[next.length - 1] = { ...last, content: (last.content || '') + chunk };
          return next;
        });
        setStatusText('Writing…');
      }
      const el = messagesScrollRef.current;
      if (el) el.scrollTop = el.scrollHeight;
      if (streamPendingRef.current) scheduleStreamFlush();
    });
  };

  useEffect(
    () => () => {
      if (streamRafRef.current != null) {
        cancelAnimationFrame(streamRafRef.current);
        streamRafRef.current = null;
      }
    },
    []
  );

  const hasMessages = messages.length > 0;

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
    localStorage.removeItem(LEGACY_STORAGE_KEY);
  }, [messages]);

  useEffect(() => {
    const el = messagesScrollRef.current;
    if (!el) return;
    // While streaming, scroll is driven in the rAF flush to avoid fighting CSS smooth-scroll.
    if (messages[messages.length - 1]?.streaming) return;
    el.scrollTop = el.scrollHeight;
  }, [messages, isProcessing]);

  const getChatHistoryForApi = () =>
    messages
      .filter((m) => m.role === 'user' || m.role === 'assistant')
      .map((m) => ({ role: m.role, content: formatMessageForHistory(m) }))
      .filter((m) => m.content && m.content.trim())
      .slice(-24);

  const updateProposalStatus = (messageIndex, proposalIndex, updates) => {
    setMessages((prev) =>
      prev.map((message, idx) => {
        if (idx !== messageIndex || !Array.isArray(message.proposals)) return message;
        const proposals = [...message.proposals];
        proposals[proposalIndex] = { ...proposals[proposalIndex], ...updates };
        return { ...message, proposals };
      })
    );
  };

  const markProposalSuperseded = (messageIndex, proposalIndex) => {
    updateProposalStatus(messageIndex, proposalIndex, { status: 'SUPERSEDED' });
  };

  const handleProposalAction = async (messageIndex, proposalIndex, action) => {
    const proposal = messages[messageIndex]?.proposals?.[proposalIndex];
    if (!proposal?.id) return;

    if (action?.type === 'update-draft') {
      updateProposalStatus(messageIndex, proposalIndex, { status: 'UPDATING' });
      setStatusText('Updating draft');
      try {
        const { data } = await aiAPI.previewAction(action.actionType || proposal.actionType, action.input, action.sourceText || 'Edited draft');
        updateProposalStatus(messageIndex, proposalIndex, {
          ...(data.action || {}),
          status: data.action?.status || 'PENDING',
        });
        setStatusText(data.action?.status === 'NEEDS_CLARIFICATION' ? 'Needs details' : 'Action ready');
      } catch (err) {
        updateProposalStatus(messageIndex, proposalIndex, {
          status: 'ERROR',
          error: getErrorMessage(err, 'Failed to update draft'),
        });
        setStatusText('Needs attention');
      }
      return;
    }

    if (action?.type === 'create-anyway') {
      updateProposalStatus(messageIndex, proposalIndex, { status: 'EXECUTING' });
      setStatusText('Creating duplicate task');
      try {
        const nextInput = {
          ...(proposal.input || {}),
          ...(proposal.resolvedInput || {}),
          allowDuplicate: true,
        };
        const { data: previewData } = await aiAPI.previewAction(proposal.actionType, nextInput, 'Create duplicate anyway');
        const nextAction = previewData.action || {};
        updateProposalStatus(messageIndex, proposalIndex, { ...nextAction, status: 'EXECUTING' });
        const { data } = await aiAPI.executeAction(nextAction.id);
        updateProposalStatus(messageIndex, proposalIndex, {
          ...(data.action || {}),
          status: data.action?.status || 'EXECUTED',
          result: data.result,
        });
        setStatusText('Action completed');
        if (onAction) onAction();
      } catch (err) {
        updateProposalStatus(messageIndex, proposalIndex, {
          status: 'ERROR',
          error: getErrorMessage(err, 'Failed to create duplicate task'),
        });
        setStatusText('Needs attention');
      }
      return;
    }

    if (action === 'edit') {
      setInput(buildEditPrompt(proposal));
      setStatusText('Tell me what to change');
      return;
    }

    if (action === 'reject') {
      updateProposalStatus(messageIndex, proposalIndex, { status: 'REJECTING' });
      setStatusText('Rejecting draft');
      try {
        const { data } = await aiAPI.rejectAction(proposal.id);
        updateProposalStatus(messageIndex, proposalIndex, {
          ...(data.action || {}),
          status: data.action?.status || 'REJECTED',
        });
        setStatusText('Draft rejected');
      } catch (err) {
        updateProposalStatus(messageIndex, proposalIndex, {
          status: 'ERROR',
          error: getErrorMessage(err, 'Failed to reject action'),
        });
        setStatusText('Needs attention');
      }
      return;
    }

    if (action === 'undo') {
      updateProposalStatus(messageIndex, proposalIndex, { status: 'UNDOING' });
      setStatusText('Undoing action');
      try {
        const { data } = await aiAPI.undoAction(proposal.id);
        updateProposalStatus(messageIndex, proposalIndex, {
          ...(data.action || {}),
          status: data.action?.status || 'UNDONE',
          result: data.result,
        });
        setStatusText('Action undone');
        if (onAction) onAction();
      } catch (err) {
        updateProposalStatus(messageIndex, proposalIndex, {
          status: 'ERROR',
          error: getErrorMessage(err, 'Failed to undo action'),
        });
        setStatusText('Needs attention');
      }
      return;
    }

    updateProposalStatus(messageIndex, proposalIndex, { status: 'EXECUTING' });
    setStatusText('Running approved action');
    try {
      const { data } = await aiAPI.executeAction(proposal.id);
      updateProposalStatus(messageIndex, proposalIndex, {
        ...(data.action || {}),
        status: data.action?.status || 'EXECUTED',
        result: data.result,
      });
      setStatusText('Action completed');
      if (onAction) onAction();
    } catch (err) {
      updateProposalStatus(messageIndex, proposalIndex, {
        status: 'ERROR',
        error: getErrorMessage(err, 'Failed to execute action'),
      });
      setStatusText('Needs attention');
    }
  };

  const handleSend = async (overrideText) => {
    const text = (overrideText || input).trim();
    if (!text || isProcessing) return;

    setIsProcessing(true);
    setError(null);

    const currentLatestProposal = findLatestProposal(messages);
    if (isCancelText(text) && currentLatestProposal?.proposal?.id) {
      setInput('');
      setMessages((prev) => [...prev, { role: 'user', content: text }]);
      setIsProcessing(false);
      await handleProposalAction(currentLatestProposal.messageIndex, currentLatestProposal.proposalIndex, 'reject');
      return;
    }

    if (isCreateAnywayText(text) && hasDuplicateCandidates(currentLatestProposal?.proposal)) {
      setInput('');
      setMessages((prev) => [...prev, { role: 'user', content: text }]);
      setIsProcessing(false);
      await handleProposalAction(currentLatestProposal.messageIndex, currentLatestProposal.proposalIndex, { type: 'create-anyway' });
      return;
    }

    if (isUndoText(text)) {
      const undoTarget = findLatestUndoableProposal(messages);
      if (undoTarget?.proposal?.id) {
        setInput('');
        setMessages((prev) => [...prev, { role: 'user', content: text }]);
        setIsProcessing(false);
        await handleProposalAction(undoTarget.messageIndex, undoTarget.proposalIndex, 'undo');
        return;
      }
    }

    if (isApprovalText(text)) {
      const chain = collectExecutablePendingChain(messages);
      if (chain.length === 0) {
        setInput('');
        setMessages((prev) => [
          ...prev,
          { role: 'user', content: text },
          {
            role: 'assistant',
            content:
              'Nothing is waiting for approval. If a reply was still loading, wait for the review cards—or ask again.',
          },
        ]);
        setIsProcessing(false);
        return;
      }
      setInput('');
      setMessages((prev) => [...prev, { role: 'user', content: text }]);
      setIsProcessing(true);
      setStatusText(chain.length > 1 ? `Applying ${chain.length} updates…` : 'Applying…');
      try {
        for (const step of chain) {
          const { messageIndex, proposalIndex, id } = step;
          setMessages((prev) =>
            prev.map((msg, mi) => {
              if (mi !== messageIndex || !msg.proposals) return msg;
              const proposals = msg.proposals.map((p, pi) =>
                pi === proposalIndex ? { ...p, status: 'EXECUTING' } : p
              );
              return { ...msg, proposals };
            })
          );
          const { data } = await aiAPI.executeAction(id);
          setMessages((prev) =>
            prev.map((msg, mi) => {
              if (mi !== messageIndex || !msg.proposals) return msg;
              const proposals = msg.proposals.map((p, pi) =>
                pi === proposalIndex
                  ? {
                      ...p,
                      ...(data.action || {}),
                      status: data.action?.status || 'EXECUTED',
                      result: data.result,
                    }
                  : p
              );
              return { ...msg, proposals };
            })
          );
        }
        setStatusText('Ready');
        if (onAction) onAction();
      } catch (err) {
        setError(getErrorMessage(err, 'Could not apply updates'));
        setStatusText('Needs attention');
      } finally {
        setIsProcessing(false);
      }
      return;
    }

    if (isDraftCorrection(text, currentLatestProposal?.proposal)) {
      try {
        setStatusText('Updating draft');
        const previous = currentLatestProposal.proposal;
        const nextInput = buildCorrectedInput(previous, text);
        const { data } = await aiAPI.previewAction(previous.actionType, nextInput, text);
        markProposalSuperseded(currentLatestProposal.messageIndex, currentLatestProposal.proposalIndex);
        setInput('');
        setMessages((prev) => [
          ...prev,
          { role: 'user', content: text },
          {
            role: 'assistant',
            content: 'I updated the draft. Review the new version before I run it.',
            proposals: [{ ...(data.action || {}), status: data.action?.status || 'PENDING' }],
          },
        ]);
        setStatusText(data.action?.status === 'NEEDS_CLARIFICATION' ? 'Needs details' : 'Action ready');
        return;
      } catch (err) {
        setError(getErrorMessage(err, 'Failed to update the draft'));
        setStatusText('Needs attention');
        return;
      } finally {
        setIsProcessing(false);
      }
    }

    const historyPayload = getChatHistoryForApi();
    const assistantMsgId = `a-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
    setInput('');
    setStatusText('Connecting…');
    setMessages((prev) => [
      ...prev,
      { role: 'user', content: text },
      { role: 'assistant', id: assistantMsgId, content: '', streaming: true },
    ]);

    const ac = new AbortController();
    streamAbortRef.current = ac;
    cancelStreamRaf();
    streamPendingRef.current = '';
    streamMsgIdRef.current = assistantMsgId;

    try {
      await consumeAiChatStream(text, historyPayload, {
        signal: ac.signal,
        onDelta: (piece) => {
          streamPendingRef.current += piece;
          scheduleStreamFlush();
        },
        onMeta: ({ phase }) => {
          if (phase === 'model') setStatusText('Thinking…');
          if (phase === 'finalizing') setStatusText('Preparing actions…');
        },
        onDone: ({ response, proposals }) => {
          cancelStreamRaf();
          flushStreamPendingSync();
          const list = Array.isArray(proposals)
            ? proposals.map((proposal) => ({ ...proposal, status: proposal.status || 'PENDING' }))
            : [];
          const reply = cleanAssistantReply(response, list);
          setMessages((prev) => {
            const next = [...prev];
            const last = next[next.length - 1];
            if (last?.role !== 'assistant' || last.id !== assistantMsgId) return prev;
            next[next.length - 1] = {
              ...last,
              content: reply,
              streaming: false,
              ...(list.length > 0 ? { proposals: list } : {}),
            };
            return next;
          });
          setStatusText(
            list.some((proposal) => proposal.status === 'NEEDS_CLARIFICATION')
              ? 'Needs details'
              : list.length
                ? 'Action ready'
                : 'Ready'
          );
        },
      });
    } catch (err) {
      cancelStreamRaf();
      flushStreamPendingSync();
      if (err?.name === 'AbortError') {
        setMessages((prev) => {
          const next = [...prev];
          const last = next[next.length - 1];
          if (last?.role === 'assistant' && last.id === assistantMsgId) {
            next[next.length - 1] = {
              ...last,
              streaming: false,
              content: (last.content || '').trim()
                ? `${(last.content || '').trim()}\n\n_(Stopped)_`
                : '_(Stopped)_',
            };
          }
          return next;
        });
        setStatusText('Stopped');
      } else {
        console.error('handleSend error:', err);
        setError(getErrorMessage(err, 'Something went wrong'));
        setStatusText('Needs attention');
        setMessages((prev) => {
          const next = [...prev];
          const last = next[next.length - 1];
          if (last?.role === 'assistant' && last.id === assistantMsgId) {
            next[next.length - 1] = {
              ...last,
              streaming: false,
              content: (last.content || '').trim() || '(Something went wrong)',
            };
          }
          return next;
        });
      }
    } finally {
      streamAbortRef.current = null;
      cancelStreamRaf();
      streamMsgIdRef.current = null;
      streamPendingRef.current = '';
      setIsProcessing(false);
    }
  };

  const stopStreaming = () => {
    streamAbortRef.current?.abort();
  };

  const handleNewChat = () => {
    setMessages([]);
    setInput('');
    setError(null);
    setStatusText('Ready');
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(LEGACY_STORAGE_KEY);
  };

  const outerClass = useMemo(() => {
    if (layout === 'rail') return 'flex flex-col h-full min-h-0 flex-1 overflow-hidden max-h-full';
    if (layout === 'sheet') return 'flex flex-col h-full min-h-0 max-h-full overflow-hidden';
    return 'flex flex-col h-[min(760px,90dvh)] sm:max-w-3xl w-full max-h-[90dvh] overflow-hidden';
  }, [layout]);

  const outerChrome =
    layout === 'rail'
      ? 'border-0 shadow-none rounded-none'
      : 'border shadow-2xl sm:rounded-2xl';

  return (
      <div
        className={`${outerClass} ${outerChrome}`}
        style={{
          backgroundColor: 'var(--color-bg-secondary)',
          borderColor: 'var(--color-border-default)',
        }}
      >
      <AssistantHeader
        statusText={isProcessing ? statusText : statusText || 'Ready'}
        onNewChat={handleNewChat}
        onClose={onClose}
        hasMessages={hasMessages}
      />

        <div
          ref={messagesScrollRef}
          className={`flex-1 min-h-0 overflow-y-auto overflow-x-hidden px-3 py-3 space-y-3 relative ${
            currentPendingProposals.length > 1 ? 'pb-16' : ''
          }`}
          style={{
            backgroundColor: 'var(--color-bg-tertiary)',
            scrollBehavior: messages[messages.length - 1]?.streaming ? 'auto' : 'smooth',
          }}
        >
        {!hasMessages && (
          <AssistantEmptyState
            onSuggestion={(suggestion) => {
              setInput(suggestion);
              handleSend(suggestion);
            }}
          />
        )}

        {messages.map((msg, idx) => {
          const isRetryable = (() => {
            if (msg.role !== 'user') return false;
            const isLastUser = !messages.slice(idx + 1).some(m => m.role === 'user');
            if (!isLastUser) return false;
            const nextMsg = messages[idx + 1];
            const hasError = error || (nextMsg && nextMsg.role === 'assistant' && (nextMsg.content?.includes('(Something went wrong)') || nextMsg.proposals?.some(p => p.status === 'ERROR')));
            return !!hasError;
          })();
          return (
            <MessageGroup
              key={msg.id || `${msg.role}-${idx}-${msg.content?.slice(0, 20) || 'msg'}`}
              message={msg}
              messageIndex={idx}
              onProposalAction={handleProposalAction}
              currentPendingProposals={currentPendingProposals}
              selectedProposalIds={selectedProposalIds}
              setSelectedProposalIds={setSelectedProposalIds}
              isRetryable={isRetryable}
              onRetry={() => handleRetry(idx)}
            />
          );
        })}

        {isProcessing && !messages[messages.length - 1]?.streaming && (
          <ThinkingIndicator label={statusText} />
        )}

        {currentPendingProposals.length > 1 && (
          <div
            className="absolute bottom-3 left-3 right-3 z-30 rounded-xl border p-2 flex items-center justify-between gap-2 shadow-lg"
            style={{
              backgroundColor: 'var(--color-bg-secondary)',
              borderColor: 'var(--color-border-default)',
              backdropFilter: 'blur(8px)',
            }}
          >
            <div className="flex items-center gap-2 pl-1">
              <input
                type="checkbox"
                className="rounded border-neutral-300 text-indigo-600 focus:ring-indigo-500 h-4 w-4 cursor-pointer"
                checked={selectedProposalIds.size === currentPendingProposals.length}
                onChange={(e) => {
                  if (e.target.checked) {
                    setSelectedProposalIds(new Set(currentPendingProposals.map(p => p.id)));
                  } else {
                    setSelectedProposalIds(new Set());
                  }
                }}
              />
              <span className="text-xs font-semibold" style={{ color: 'var(--color-text-secondary)' }}>
                All ({currentPendingProposals.length})
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={handleBulkApprove}
                disabled={selectedProposalIds.size === 0 || isProcessing}
                className="inline-flex items-center gap-1 rounded-lg border px-2.5 py-1.5 text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white disabled:opacity-50 transition-colors"
              >
                Approve ({selectedProposalIds.size})
              </button>
              <button
                type="button"
                onClick={handleBulkReject}
                disabled={selectedProposalIds.size === 0 || isProcessing}
                className="inline-flex items-center gap-1 rounded-lg border px-2.5 py-1.5 text-xs font-semibold bg-red-600 hover:bg-red-700 text-white disabled:opacity-50 transition-colors"
              >
                Reject ({selectedProposalIds.size})
              </button>
            </div>
          </div>
        )}
      </div>

      <Composer
        value={input}
        onChange={setInput}
        onSend={() => handleSend()}
        onStop={stopStreaming}
        isProcessing={isProcessing}
        isStreaming={Boolean(messages[messages.length - 1]?.streaming)}
      />

      {error && (
        <div
          className="mx-3 mb-3 rounded-xl border px-3 py-2 text-xs"
          style={{
            borderColor: 'rgba(239, 68, 68, 0.35)',
            backgroundColor: 'rgba(239, 68, 68, 0.08)',
            color: '#ef4444',
          }}
        >
          {error}
        </div>
      )}
    </div>
  );
};

const AssistantHeader = ({ statusText, onNewChat, onClose, hasMessages }) => (
  <div
    className="flex-shrink-0 border-b px-3 py-2.5"
    style={{ borderColor: 'var(--color-border-default)', backgroundColor: 'var(--color-bg-secondary)' }}
  >
    <div className="flex items-start justify-between gap-3">
      <div>
        <p className="text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>
          Tialz Assistant
        </p>
        <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-tertiary)' }}>
          Drafts work for your approval.
        </p>
      </div>
      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={onNewChat}
          disabled={!hasMessages}
          className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-lg border px-2.5 py-1.5 text-xs transition-opacity disabled:opacity-40"
          style={{ borderColor: 'var(--color-border-default)', color: 'var(--color-text-secondary)' }}
          title="Start a new assistant chat"
        >
          <FaRegTrashAlt className="h-3 w-3" />
          New
        </button>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border p-2"
            style={{ borderColor: 'var(--color-border-default)', color: 'var(--color-text-secondary)' }}
            aria-label="Close assistant"
          >
            <FaTimes className="h-3.5 w-3.5" />
          </button>
        )}
      </div>
    </div>
    <div className="mt-2 flex items-center gap-2 text-xs" style={{ color: 'var(--color-text-tertiary)' }}>
      <span className="h-2 w-2 rounded-full" style={{ backgroundColor: 'var(--color-primary)' }} />
      {statusText}
    </div>
  </div>
);

const AssistantEmptyState = ({ onSuggestion }) => (
  <div className="rounded-2xl border p-3" style={{ backgroundColor: 'var(--color-bg-secondary)', borderColor: 'var(--color-border-default)' }}>
    <p className="text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>
      Tell me what you want to get done.
    </p>
    <p className="mt-1 text-xs leading-5" style={{ color: 'var(--color-text-secondary)' }}>
      I can draft tasks, updates, comments, and project changes. You approve before anything changes.
    </p>
    <div className="mt-3 grid gap-1.5">
      {SUGGESTIONS.map((suggestion) => (
        <button
          type="button"
          key={suggestion}
          onClick={() => onSuggestion(suggestion)}
          className="rounded-xl border px-3 py-1.5 text-left text-xs transition-colors"
          style={{ borderColor: 'var(--color-border-default)', color: 'var(--color-text-secondary)', backgroundColor: 'var(--color-bg-tertiary)' }}
        >
          {suggestion}
        </button>
      ))}
    </div>
  </div>
);

const MessageGroup = ({
  message,
  messageIndex,
  onProposalAction,
  currentPendingProposals = [],
  selectedProposalIds = new Set(),
  setSelectedProposalIds,
  isRetryable,
  onRetry
}) => {
  const isUser = message.role === 'user';
  const assistantBody = !isUser ? maskAssistantStreamText(message) : '';
  const showUserBubble = isUser && message.content && message.content !== '(No response)';
  const showAssistantBubble =
    !isUser &&
    (message.streaming || (message.content && message.content !== '(No response)'));
  const shouldShowBubble = showUserBubble || showAssistantBubble;

  return (
    <div className={`flex min-w-0 w-full max-w-full flex-col ${isUser ? 'items-end' : 'items-start'}`}>
      {shouldShowBubble && (
        <div className="flex items-center gap-2 max-w-[min(94%,100%)]">
          {isUser && isRetryable && (
            <button
              type="button"
              onClick={onRetry}
              className="p-1.5 rounded-lg border bg-neutral-800/10 hover:bg-neutral-800/20 text-neutral-600 dark:text-neutral-400 dark:bg-neutral-200/10 dark:hover:bg-neutral-200/20 transition-colors shrink-0"
              title="Retry this message"
            >
              <FaRedo className="h-3.5 w-3.5" />
            </button>
          )}
          <div
            className={`rounded-2xl px-3 py-2 text-sm leading-5 shadow-sm ${isUser ? 'text-white' : 'border'}`}
            style={
              isUser
                ? { backgroundColor: 'var(--color-primary)' }
                : {
                    backgroundColor: 'var(--color-bg-secondary)',
                    color: 'var(--color-text-primary)',
                    borderColor: 'var(--color-border-default)',
                  }
            }
          >
            {isUser ? (
              <p className="whitespace-pre-wrap break-words">{message.content}</p>
            ) : (
              <div className="ai-markdown min-h-[1.25rem] max-w-full overflow-x-hidden break-words [text-rendering:optimizeLegibility] [-webkit-font-smoothing:antialiased]">
                {assistantBody ? (
                  message.streaming ? (
                    <p className="whitespace-pre-wrap break-words text-sm leading-relaxed tracking-[0.01em]">
                      {assistantBody}
                    </p>
                  ) : (
                    <ReactMarkdown>{assistantBody}</ReactMarkdown>
                  )
                ) : message.streaming ? (
                  <span
                    className="inline-block h-4 w-0.5 animate-pulse rounded-sm opacity-60"
                    style={{ backgroundColor: 'var(--color-text-secondary)' }}
                    aria-hidden
                  />
                ) : null}
              </div>
            )}
          </div>
        </div>
      )}

      {message.role === 'assistant' && Array.isArray(message.proposals) && message.proposals.length > 0 && (
        <div className="mt-2 w-full min-w-0 max-w-full space-y-2.5">
          {message.proposals.map((proposal, proposalIndex) => {
            const isExecutablePending = proposal.status === 'PENDING' && proposal.canExecute !== false;
            const isMultiPending = currentPendingProposals.length > 1 && isExecutablePending;
            return (
              <AIActionCard
                key={proposal.id || proposalIndex}
                proposal={proposal}
                onAction={(action) => onProposalAction(messageIndex, proposalIndex, action)}
                isMultiPending={isMultiPending}
                isSelected={selectedProposalIds.has(proposal.id)}
                onSelectToggle={() => {
                  setSelectedProposalIds(prev => {
                    const next = new Set(prev);
                    if (next.has(proposal.id)) {
                      next.delete(proposal.id);
                    } else {
                      next.add(proposal.id);
                    }
                    return next;
                  });
                }}
              />
            );
          })}
        </div>
      )}
    </div>
  );
};

const Composer = ({ value, onChange, onSend, onStop, isProcessing, isStreaming }) => {
  const showStop = isProcessing && isStreaming;

  return (
    <div
      className="flex-shrink-0 border-t px-3 py-2.5"
      style={{ borderColor: 'var(--color-border-default)', backgroundColor: 'var(--color-bg-secondary)' }}
    >
      <div
        className="rounded-2xl border p-2"
        style={{ borderColor: 'var(--color-border-default)', backgroundColor: 'var(--color-bg-tertiary)' }}
      >
        <textarea
          className="w-full min-w-0 resize-none bg-transparent px-2 py-1 text-sm leading-5 focus:outline-none"
          style={{ color: 'var(--color-text-primary)', minHeight: 46 }}
          rows={2}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key !== 'Enter' || e.shiftKey) return;
            e.preventDefault();
            if (showStop) return;
            if (isProcessing) return;
            onSend();
          }}
          placeholder="Ask me to draft or update work..."
          disabled={isProcessing && !showStop}
          maxLength={700}
        />
        <div className="flex items-center justify-end gap-2 px-1 pt-1">
          {showStop ? (
            <IconButton
              icon={<FaStop />}
              label="Stop"
              variant="secondary"
              size="sm"
              onClick={onStop}
            />
          ) : (
            <IconButton
              icon={<FaPaperPlane />}
              label="Send"
              variant="primary"
              size="sm"
              onClick={onSend}
              disabled={isProcessing || !value.trim()}
              loading={isProcessing}
            />
          )}
        </div>
      </div>
    </div>
  );
};

const ThinkingIndicator = ({ label }) => (
  <div
    className="inline-flex items-center gap-2 rounded-2xl border px-3 py-2 text-xs"
    style={{ backgroundColor: 'var(--color-bg-secondary)', borderColor: 'var(--color-border-default)', color: 'var(--color-text-secondary)' }}
  >
    <span className="inline-flex gap-1">
      <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-current opacity-40" />
      <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-current opacity-60" style={{ animationDelay: '0.15s' }} />
      <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-current opacity-80" style={{ animationDelay: '0.3s' }} />
    </span>
    {label || 'Working'}
  </div>
);

const AIActionCard = ({ proposal, onAction, isMultiPending, isSelected, onSelectToggle }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState(() => buildEditableDraft(proposal));
  const [mergingCandidateId, setMergingCandidateId] = useState(null);
  const [mergeFields, setMergeFields] = useState({
    title: false,
    description: 'append',
    dueDate: false,
    priority: false,
    status: false
  });

  useEffect(() => {
    setDraft(buildEditableDraft(proposal));
    setIsEditing(false);
    setMergingCandidateId(null);
  }, [proposal.id, proposal.status, proposal]);

  const status = proposal.status || 'PENDING';
  const statusCopy = STATUS_COPY[status] || { label: humanize(status), tone: 'muted' };
  const actionCopy = ACTION_COPY[proposal.actionType] || { label: humanize(proposal.actionType || 'AI action'), objectLabel: 'Draft', verb: 'run this action' };
  const isPending = status === 'PENDING';
  const isBlocked = status === 'NEEDS_CLARIFICATION' || proposal.canExecute === false;
  const isBusy = ['UPDATING', 'EXECUTING', 'REJECTING', 'UNDOING'].includes(status);
  const isDone = status === 'EXECUTED';
  const isFinal = ['REJECTED', 'UNDONE', 'SUPERSEDED'].includes(status);
  const isError = status === 'ERROR';
  const resolved = proposal.resolvedInput || {};
  const diff = Array.isArray(proposal.diff || proposal.preview?.diff) ? (proposal.diff || proposal.preview.diff) : [];
  const canUndo = isDone && proposalHasUndo(proposal);
  const details = buildDetails(proposal);
  const duplicateCandidates = Array.isArray(proposal.duplicateCandidates || proposal.preview?.duplicateCandidates)
    ? (proposal.duplicateCandidates || proposal.preview.duplicateCandidates)
    : [];

  const submitDraft = () => {
    const nextInput = buildInputFromDraft(proposal, draft);
    onAction({ type: 'update-draft', input: nextInput, sourceText: 'Edited action draft' });
    setIsEditing(false);
  };

  return (
    <div
      className="min-w-0 max-w-full overflow-x-hidden rounded-2xl border p-3 text-left shadow-sm transition-opacity"
      style={{
        backgroundColor: 'var(--color-bg-secondary)',
        borderColor: isBlocked ? 'rgba(245, 158, 11, 0.45)' : isError ? 'rgba(239, 68, 68, 0.45)' : 'var(--color-border-default)',
        color: 'var(--color-text-primary)',
        opacity: isFinal ? 0.68 : 1,
      }}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-2.5 min-w-0">
          {isMultiPending && (
            <input
              type="checkbox"
              className="mt-0.5 rounded border-neutral-300 text-indigo-600 focus:ring-indigo-500 h-4 w-4 cursor-pointer shrink-0"
              checked={isSelected}
              onChange={onSelectToggle}
            />
          )}
          <div className="min-w-0">
            <p className="text-xs font-medium" style={{ color: 'var(--color-text-tertiary)' }}>
              {actionCopy.label}
            </p>
            <p className="mt-1 break-words text-sm font-semibold leading-5">{getProposalTitle(proposal, resolved)}</p>
          </div>
        </div>
        <StatusPill copy={statusCopy} />
      </div>

      <p className="mt-1.5 text-xs leading-5" style={{ color: 'var(--color-text-secondary)' }}>
        {getFriendlySummary(proposal, status, actionCopy)}
      </p>

      {isEditing ? (
        <DraftEditor
          actionType={proposal.actionType}
          proposal={proposal}
          draft={draft}
          onChange={setDraft}
          onSave={submitDraft}
          onCancel={() => {
            setDraft(buildEditableDraft(proposal));
            setIsEditing(false);
          }}
          isBusy={isBusy}
        />
      ) : details.length > 0 && (
        <div className="mt-2.5 rounded-xl border p-2.5" style={{ borderColor: 'var(--color-border-default)', backgroundColor: 'var(--color-bg-tertiary)' }}>
          <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wide" style={{ color: 'var(--color-text-tertiary)' }}>
            {actionCopy.objectLabel}
          </p>
          <div className="space-y-1.5">
            {details.map((detail) => (
              <DetailRow key={detail.label} label={detail.label} value={detail.value} multiline={detail.multiline} />
            ))}
          </div>
        </div>
      )}

      {diff.length > 0 && (
        <div className="mt-2.5 rounded-xl border p-2.5" style={{ borderColor: 'var(--color-border-default)', backgroundColor: 'var(--color-bg-tertiary)' }}>
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide" style={{ color: 'var(--color-text-tertiary)' }}>
            What will change
          </p>
          <div className="space-y-2">
            {diff.map((change) => (
              <div key={change.field} className="text-xs">
                <p className="font-medium capitalize" style={{ color: 'var(--color-text-primary)' }}>{humanize(change.field)}</p>
                {isLongText(change) ? (
                  <RenderDiff before={change.before} after={change.after} />
                ) : (
                  <p style={{ color: 'var(--color-text-secondary)' }}>
                    {formatValue(change.before)} -&gt; {formatValue(change.after)}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {duplicateCandidates.length > 0 && !mergingCandidateId && (
        <div className="mt-2.5 rounded-xl border p-2.5 text-xs" style={{ borderColor: 'rgba(245, 158, 11, 0.35)', backgroundColor: 'rgba(245, 158, 11, 0.08)', color: 'var(--color-text-secondary)' }}>
          <p className="font-medium" style={{ color: 'var(--color-text-primary)' }}>Possible duplicate</p>
          <p className="mt-1">I found existing work that looks like this draft.</p>
          <div className="mt-2 space-y-1.5">
            {duplicateCandidates.map((candidate) => (
              <div key={candidate.id} className="rounded-lg border px-2 py-1.5" style={{ borderColor: 'var(--color-border-default)' }}>
                <p className="font-medium" style={{ color: 'var(--color-text-primary)' }}>{candidate.title}</p>
                <p>{humanize(candidate.status)} · {humanize(candidate.priority)}{candidate.dueDate ? ` · Due ${formatValue(candidate.dueDate)}` : ''}</p>
              </div>
            ))}
          </div>
          <div className="mt-2 flex flex-wrap gap-2">
            <ActionButton onClick={() => onAction({ type: 'create-anyway' })} disabled={isBusy} variant="primary">
              Create anyway
            </ActionButton>
            {duplicateCandidates.map((candidate) => (
              <ActionButton
                key={`merge-${candidate.id}`}
                onClick={() => {
                  setMergingCandidateId(candidate.id);
                  setMergeFields({
                    title: false,
                    description: 'append',
                    dueDate: draft.dueDate ? true : false,
                    priority: draft.priority !== candidate.priority,
                    status: false
                  });
                }}
                disabled={isBusy}
              >
                Merge into "{candidate.title.slice(0, 15)}..."
              </ActionButton>
            ))}
            <ActionButton onClick={() => onAction('reject')} disabled={isBusy}>
              Cancel
            </ActionButton>
          </div>
        </div>
      )}

      {duplicateCandidates.length > 0 && mergingCandidateId && (() => {
        const candidate = duplicateCandidates.find(c => c.id === mergingCandidateId);
        if (!candidate) return null;
        return (
          <div className="mt-2.5 rounded-xl border p-3 text-xs space-y-3" style={{ borderColor: 'rgba(245, 158, 11, 0.45)', backgroundColor: 'var(--color-bg-tertiary)' }}>
            <p className="font-semibold text-sm" style={{ color: 'var(--color-text-primary)' }}>
              Merge properties into existing task
            </p>
            <p style={{ color: 'var(--color-text-secondary)' }}>
              Choose which draft properties to overwrite or append to task #{candidate.id}.
            </p>

            <div className="space-y-2.5 border-y py-2.5" style={{ borderColor: 'var(--color-border-default)' }}>
              <div className="grid grid-cols-[80px_1fr_1fr] gap-2 items-center">
                <span className="font-medium" style={{ color: 'var(--color-text-secondary)' }}>Title</span>
                <div className="bg-neutral-500/10 p-1.5 rounded truncate" title={candidate.title}>
                  {candidate.title}
                </div>
                <label className="flex items-center gap-1.5 cursor-pointer min-w-0">
                  <input
                    type="checkbox"
                    checked={mergeFields.title}
                    onChange={(e) => setMergeFields(prev => ({ ...prev, title: e.target.checked }))}
                    className="rounded text-indigo-600 focus:ring-indigo-500 h-3.5 w-3.5"
                  />
                  <span className="truncate font-medium text-indigo-500" title={draft.title}>Overwrite: {draft.title}</span>
                </label>
              </div>

              <div className="grid grid-cols-[80px_1fr_1fr] gap-2 items-start">
                <span className="font-medium mt-1" style={{ color: 'var(--color-text-secondary)' }}>Description</span>
                <div className="bg-neutral-500/10 p-1.5 rounded max-h-16 overflow-y-auto whitespace-pre-wrap">
                  {candidate.description || '(none)'}
                </div>
                <div className="space-y-1.5">
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="radio"
                      name="merge-desc"
                      checked={mergeFields.description === 'keep'}
                      onChange={() => setMergeFields(prev => ({ ...prev, description: 'keep' }))}
                      className="text-indigo-600 focus:ring-indigo-500 h-3.5 w-3.5"
                    />
                    <span>Keep existing</span>
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="radio"
                      name="merge-desc"
                      checked={mergeFields.description === 'overwrite'}
                      onChange={() => setMergeFields(prev => ({ ...prev, description: 'overwrite' }))}
                      className="text-indigo-600 focus:ring-indigo-500 h-3.5 w-3.5"
                    />
                    <span>Overwrite</span>
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="radio"
                      name="merge-desc"
                      checked={mergeFields.description === 'append'}
                      onChange={() => setMergeFields(prev => ({ ...prev, description: 'append' }))}
                      className="text-indigo-600 focus:ring-indigo-500 h-3.5 w-3.5"
                    />
                    <span>Append draft</span>
                  </label>
                </div>
              </div>

              {draft.dueDate && (
                <div className="grid grid-cols-[80px_1fr_1fr] gap-2 items-center">
                  <span className="font-medium" style={{ color: 'var(--color-text-secondary)' }}>Due Date</span>
                  <div className="bg-neutral-500/10 p-1.5 rounded truncate">
                    {candidate.dueDate ? formatValue(candidate.dueDate) : '(none)'}
                  </div>
                  <label className="flex items-center gap-1.5 cursor-pointer min-w-0">
                    <input
                      type="checkbox"
                      checked={mergeFields.dueDate}
                      onChange={(e) => setMergeFields(prev => ({ ...prev, dueDate: e.target.checked }))}
                      className="rounded text-indigo-600 focus:ring-indigo-500 h-3.5 w-3.5"
                    />
                    <span className="truncate font-medium text-indigo-500">Overwrite: {formatValue(draft.dueDate)}</span>
                  </label>
                </div>
              )}

              <div className="grid grid-cols-[80px_1fr_1fr] gap-2 items-center">
                <span className="font-medium" style={{ color: 'var(--color-text-secondary)' }}>Priority</span>
                <div className="bg-neutral-500/10 p-1.5 rounded truncate">
                  {candidate.priority}
                </div>
                <label className="flex items-center gap-1.5 cursor-pointer min-w-0">
                  <input
                    type="checkbox"
                    checked={mergeFields.priority}
                    onChange={(e) => setMergeFields(prev => ({ ...prev, priority: e.target.checked }))}
                    className="rounded text-indigo-600 focus:ring-indigo-500 h-3.5 w-3.5"
                  />
                  <span className="font-medium text-indigo-500">Overwrite: {draft.priority}</span>
                </label>
              </div>
            </div>

            <div className="flex gap-2 justify-end">
              <ActionButton
                onClick={() => {
                  const nextInput = {
                    taskId: candidate.id,
                    taskTitle: candidate.title,
                  };
                  if (mergeFields.title) nextInput.newTitle = draft.title;
                  if (mergeFields.description === 'overwrite') {
                    nextInput.description = draft.description;
                  } else if (mergeFields.description === 'append') {
                    nextInput.description = [candidate.description, draft.description].filter(Boolean).join('\n\n');
                  }
                  if (mergeFields.dueDate) nextInput.dueDate = draft.dueDate;
                  if (mergeFields.priority) nextInput.priority = draft.priority;
                  
                  onAction({
                    type: 'update-draft',
                    actionType: 'update_task',
                    input: nextInput,
                    sourceText: `Merge duplicate into task #${candidate.id}`
                  });
                  setMergingCandidateId(null);
                }}
                variant="primary"
              >
                Confirm Merge
              </ActionButton>
              <ActionButton onClick={() => setMergingCandidateId(null)}>
                Cancel
              </ActionButton>
            </div>
          </div>
        );
      })()}

      {Array.isArray(proposal.candidates) && proposal.candidates.length > 0 && (
        <div className="mt-3 rounded-xl border p-3 text-xs" style={{ borderColor: 'rgba(245, 158, 11, 0.35)', backgroundColor: 'rgba(245, 158, 11, 0.08)', color: 'var(--color-text-secondary)' }}>
          <p className="font-medium" style={{ color: 'var(--color-text-primary)' }}>I found more than one match.</p>
          <div className="mt-2 space-y-1">
            {proposal.candidates.map((candidate) => (
              <p key={candidate.id}>#{candidate.id} {candidate.title || candidate.name}</p>
            ))}
          </div>
          <p className="mt-2">Reply with the exact ID, for example: use task #{proposal.candidates[0]?.id}.</p>
        </div>
      )}

      {isError && <InlineNotice tone="danger">{proposal.error || 'Something went wrong while preparing this action.'}</InlineNotice>}
      {isBlocked && <InlineNotice tone="warning">{proposal.summary || 'I need one more detail before I can run this.'}</InlineNotice>}
      {status === 'EXECUTED' && <InlineNotice tone="success">Done. I made the approved change.</InlineNotice>}
      {status === 'UNDONE' && <InlineNotice>Undone. The change has been reversed.</InlineNotice>}
      {status === 'REJECTED' && <InlineNotice>Rejected. I did not make this change.</InlineNotice>}
      {status === 'SUPERSEDED' && <InlineNotice>This draft was replaced by a newer version below.</InlineNotice>}

      <div className="mt-3 flex flex-wrap gap-2">
        {isPending && !isBlocked && (
          <>
            <ActionButton onClick={() => onAction('execute')} disabled={isBusy} variant="primary" icon={<FaCheck />}>
              Approve
            </ActionButton>
            <ActionButton onClick={() => setIsEditing(true)} disabled={isBusy} icon={<FaPen />}>
              Edit
            </ActionButton>
            <ActionButton onClick={() => onAction('reject')} disabled={isBusy}>
              Reject
            </ActionButton>
          </>
        )}
        {isBlocked && (
          <ActionButton onClick={() => setIsEditing(true)} disabled={isBusy} icon={<FaPen />}>
            Add details
          </ActionButton>
        )}
        {canUndo && (
          <ActionButton onClick={() => onAction('undo')} disabled={isBusy} icon={<FaUndo />}>
            Undo
          </ActionButton>
        )}
        {isBusy && (
          <span className="inline-flex items-center rounded-lg px-3 py-1.5 text-xs" style={{ color: 'var(--color-text-tertiary)' }}>
            Working...
          </span>
        )}
      </div>
    </div>
  );
};

const StatusPill = ({ copy }) => {
  const styleByTone = {
    info: { backgroundColor: 'rgba(99, 102, 241, 0.12)', color: 'var(--color-primary)' },
    success: { backgroundColor: 'rgba(34, 197, 94, 0.12)', color: '#16a34a' },
    warning: { backgroundColor: 'rgba(245, 158, 11, 0.16)', color: '#d97706' },
    danger: { backgroundColor: 'rgba(239, 68, 68, 0.12)', color: '#ef4444' },
    working: { backgroundColor: 'var(--color-bg-tertiary)', color: 'var(--color-text-secondary)' },
    muted: { backgroundColor: 'var(--color-bg-tertiary)', color: 'var(--color-text-tertiary)' }
  };

  return (
    <span className="shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium" style={styleByTone[copy.tone] || styleByTone.muted}>
      {copy.label}
    </span>
  );
};

const DetailRow = ({ label, value, multiline }) => (
  <div className={multiline ? 'space-y-1 text-xs' : 'grid grid-cols-[72px_minmax(0,1fr)] items-start gap-2 text-xs'}>
    <span className="font-medium" style={{ color: 'var(--color-text-secondary)' }}>{label}</span>
    <span className={multiline ? 'block rounded-lg border px-2 py-2 leading-5' : 'min-w-0 break-words text-right'} style={multiline ? { borderColor: 'var(--color-border-default)', color: 'var(--color-text-primary)' } : { color: 'var(--color-text-primary)' }}>
      {value}
    </span>
  </div>
);

const DraftEditor = ({ actionType, proposal, draft, onChange, onSave, onCancel, isBusy }) => {
  const fieldClass = 'w-full rounded-lg border px-2 py-1.5 text-xs focus:outline-none';
  const fieldStyle = {
    backgroundColor: 'var(--color-bg-secondary)',
    borderColor: 'var(--color-border-default)',
    color: 'var(--color-text-primary)'
  };

  const update = (key, value) => onChange((prev) => ({ ...prev, [key]: value }));
  const saveDisabled = isBusy || isDraftSaveDisabled(actionType, draft);
  const resolved = proposal?.resolvedInput || {};

  const titleLabel = actionType === 'update_project' ? 'Name' : 'Title';

  return (
    <div className="mt-2.5 rounded-xl border p-2.5" style={{ borderColor: 'var(--color-border-default)', backgroundColor: 'var(--color-bg-tertiary)' }}>
      <div className="mb-2 flex items-center justify-between gap-2">
        <p className="text-[10px] font-semibold uppercase tracking-wide" style={{ color: 'var(--color-text-tertiary)' }}>
          Edit draft
        </p>
        <div className="flex shrink-0 gap-1.5">
          <ActionButton onClick={onSave} disabled={saveDisabled} variant="primary">
            Save
          </ActionButton>
          <ActionButton onClick={onCancel} disabled={isBusy}>
            Cancel
          </ActionButton>
        </div>
      </div>
      <div className="space-y-2">
        {actionType === 'add_comment' && (
          <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
            {resolved.taskId ? `Task #${resolved.taskId}` : 'Task target is set from the draft.'}
          </p>
        )}

        {actionType === 'add_comment' ? (
          <label className="block text-xs">
            <span className="mb-1 block font-medium" style={{ color: 'var(--color-text-secondary)' }}>Comment</span>
            <textarea
              className={`${fieldClass} resize-none`}
              style={fieldStyle}
              rows={4}
              value={draft.content}
              onChange={(e) => update('content', e.target.value)}
            />
          </label>
        ) : (
          <>
            <label className="block text-xs">
              <span className="mb-1 block font-medium" style={{ color: 'var(--color-text-secondary)' }}>{titleLabel}</span>
              <input className={fieldClass} style={fieldStyle} value={draft.title} onChange={(e) => update('title', e.target.value)} />
            </label>
            <label className="block text-xs">
              <span className="mb-1 block font-medium" style={{ color: 'var(--color-text-secondary)' }}>Due date</span>
              <input className={fieldClass} style={fieldStyle} value={draft.dueDate} onChange={(e) => update('dueDate', e.target.value)} placeholder="Tomorrow at 5pm" />
            </label>
            {actionType !== 'update_project' && (
              <label className="block text-xs">
                <span className="mb-1 block font-medium" style={{ color: 'var(--color-text-secondary)' }}>Priority</span>
                <select className={fieldClass} style={fieldStyle} value={draft.priority} onChange={(e) => update('priority', e.target.value)}>
                  <option value="LOW">Low</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="HIGH">High</option>
                  <option value="URGENT">Urgent</option>
                </select>
              </label>
            )}
            {(actionType === 'update_task' || actionType === 'update_project') && (
              <label className="block text-xs">
                <span className="mb-1 block font-medium" style={{ color: 'var(--color-text-secondary)' }}>Status</span>
                <select className={fieldClass} style={fieldStyle} value={draft.status} onChange={(e) => update('status', e.target.value)}>
                  <option value="">No change</option>
                  {(actionType === 'update_project' ? PROJECT_STATUS_OPTIONS : TASK_STATUS_OPTIONS).map((s) => (
                    <option key={s} value={s}>{humanize(s)}</option>
                  ))}
                </select>
              </label>
            )}
            <label className="block text-xs">
              <span className="mb-1 block font-medium" style={{ color: 'var(--color-text-secondary)' }}>Description</span>
              <textarea className={`${fieldClass} resize-none`} style={fieldStyle} rows={2} value={draft.description} onChange={(e) => update('description', e.target.value)} />
            </label>
          </>
        )}
      </div>
    </div>
  );
};

const ActionButton = ({ children, onClick, disabled, variant = 'secondary', icon }) => (
  <button
    type="button"
    onClick={onClick}
    disabled={disabled}
    className="inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-medium transition-opacity disabled:opacity-50"
    style={
      variant === 'primary'
        ? { backgroundColor: 'var(--color-primary)', borderColor: 'var(--color-primary)', color: '#fff' }
        : { backgroundColor: 'transparent', borderColor: 'var(--color-border-default)', color: 'var(--color-text-secondary)' }
    }
  >
    {icon && <span className="text-[10px]">{icon}</span>}
    {children}
  </button>
);

const InlineNotice = ({ children, tone = 'muted' }) => {
  const colors = {
    muted: { backgroundColor: 'var(--color-bg-tertiary)', color: 'var(--color-text-tertiary)', borderColor: 'var(--color-border-default)' },
    success: { backgroundColor: 'rgba(34, 197, 94, 0.1)', color: '#16a34a', borderColor: 'rgba(34, 197, 94, 0.25)' },
    warning: { backgroundColor: 'rgba(245, 158, 11, 0.1)', color: '#d97706', borderColor: 'rgba(245, 158, 11, 0.25)' },
    danger: { backgroundColor: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', borderColor: 'rgba(239, 68, 68, 0.25)' }
  };
  return (
    <div className="mt-2.5 rounded-xl border px-3 py-2 text-xs leading-5" style={colors[tone] || colors.muted}>
      {children}
    </div>
  );
};

function loadConversation() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return [];
    const parsed = JSON.parse(saved);
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    console.error('Failed to parse saved conversation:', e);
    return [];
  }
}

function findLatestProposal(messages) {
  for (let messageIndex = messages.length - 1; messageIndex >= 0; messageIndex -= 1) {
    const proposals = messages[messageIndex]?.proposals;
    if (!Array.isArray(proposals)) continue;
    for (let proposalIndex = proposals.length - 1; proposalIndex >= 0; proposalIndex -= 1) {
      const proposal = proposals[proposalIndex];
      if (
        proposal?.id &&
        ['PENDING', 'NEEDS_CLARIFICATION', 'ERROR'].includes(proposal.status)
      ) {
        return { proposal, messageIndex, proposalIndex };
      }
    }
  }
  return null;
}

function formatMessageForHistory(message) {
  if (!Array.isArray(message.proposals) || message.proposals.length === 0) {
    return message.content;
  }

  const proposalText = message.proposals
    .map((proposal) => {
      const resolved = proposal.resolvedInput || {};
      return [
        `AI action card: ${proposal.actionType}`,
        `status: ${proposal.status}`,
        `title: ${proposal.title}`,
        `summary: ${proposal.summary}`,
        resolved.title ? `task title: ${resolved.title}` : null,
        resolved.name ? `project name: ${resolved.name}` : null,
        resolved.dueDate ? `due date: ${resolved.dueDate}` : null,
        resolved.priority ? `priority: ${resolved.priority}` : null,
      ]
        .filter(Boolean)
        .join('; ');
    })
    .join('\n');

  return `${message.content}\n\n${proposalText}`.trim();
}

function cleanAssistantReply(reply, proposals) {
  const text = typeof reply === 'string' ? reply.trim() : '';
  if (proposals.length > 0 && (!text || /^\s*(here'?s|i'?ve|review|please|let me know)/i.test(text))) {
    if (proposals.some((proposal) => proposal.status === 'NEEDS_CLARIFICATION')) {
      return 'I need one more detail on the card below before this can run.';
    }
    if (proposals.length > 1) {
      return `I set up **${proposals.length} changes** below. Say **approve** when they look good, and I will run them in order.`;
    }
    return 'Here is a change to review — say **approve** when it looks right.';
  }
  return text || (proposals.length > 0 ? 'Review the card below.' : '(No response)');
}

function isApprovalText(text) {
  return /^(yes|yeah|yep|approve|approved|go ahead|run it|do it|confirm)$/i.test(text.trim());
}

function isCancelText(text) {
  return /^(no|nope|cancel|reject|stop|never mind|nevermind|discard)$/i.test(text.trim());
}

function isUndoText(text) {
  return /^(undo|undo that|undo it|reverse that|take it back|rollback)$/i.test(text.trim());
}

function isCreateAnywayText(text) {
  return /^(create anyway|create it anyway|make another|make a duplicate|duplicate it|yes create it|yes create anyway)$/i.test(text.trim());
}

function hasDuplicateCandidates(proposal) {
  return Array.isArray(proposal?.duplicateCandidates || proposal?.preview?.duplicateCandidates)
    && (proposal.duplicateCandidates || proposal.preview.duplicateCandidates).length > 0;
}

function isDraftCorrection(text, proposal) {
  if (!proposal || !['NEEDS_CLARIFICATION', 'ERROR', 'PENDING'].includes(proposal.status)) return false;
  if (proposal.actionType === 'add_comment') {
    return /\b(comment|note|rephrase|instead (say|write)|change (it )?to|update (the )?(comment|note))\b/i.test(text);
  }
  if (!['create_task', 'add_subtask', 'create_project', 'update_task', 'update_project'].includes(proposal.actionType)) return false;
  return /\b(due|date|tomorrow|today|eod|priority|assign|assignee|title|rename|description|project|status|in progress|completed|on hold|cancelled|canceled|january|february|march|april|may|june|july|august|september|october|november|december)\b/i.test(text);
}

function buildCorrectedInput(previous, text) {
  const nextInput = {
    ...(previous.input || {}),
    ...(previous.resolvedInput || {}),
  };
  delete nextInput.updates;

  if (/\b(due|date|tomorrow|today|eod|january|february|march|april|may|june|july|august|september|october|november|december)\b/i.test(text)) {
    nextInput.dueDate = text;
  }

  const priorityMatch = text.match(/\b(low|medium|high|urgent)\b/i);
  if (priorityMatch) nextInput.priority = priorityMatch[1].toUpperCase();

  if (previous.actionType === 'update_task') {
    if (/\b(in progress|in_progress|in-progress)\b/i.test(text)) nextInput.status = 'IN_PROGRESS';
    else if (/\btodo\b/i.test(text)) nextInput.status = 'TODO';
    else if (/\b(done|completed)\b/i.test(text)) nextInput.status = 'COMPLETED';
    else if (/\b(on hold|on_hold)\b/i.test(text)) nextInput.status = 'ON_HOLD';
    else if (/\b(cancelled|canceled)\b/i.test(text)) nextInput.status = 'CANCELLED';
  }

  if (previous.actionType === 'update_project') {
    if (/\b(active)\b/i.test(text)) nextInput.status = 'ACTIVE';
    else if (/\b(on hold|on_hold)\b/i.test(text)) nextInput.status = 'ON_HOLD';
    else if (/\b(completed|done)\b/i.test(text)) nextInput.status = 'COMPLETED';
    else if (/\b(archived)\b/i.test(text)) nextInput.status = 'ARCHIVED';
  }

  if (previous.actionType === 'add_comment') {
    nextInput.content = text.trim();
  }

  return nextInput;
}

function buildEditableDraft(proposal) {
  const resolved = proposal.resolvedInput || {};
  const updates = resolved.updates || {};
  return {
    title: resolved.title || resolved.name || updates.title || updates.name || getProposalTitle(proposal, resolved),
    dueDate: resolved.dueDate || updates.dueDate || '',
    priority: resolved.priority || updates.priority || 'MEDIUM',
    description: resolved.description || updates.description || '',
    content: resolved.content || '',
    status: updates.status || ''
  };
}

function buildInputFromDraft(proposal, draft) {
  const input = proposal.input || {};
  const resolved = proposal.resolvedInput || {};

  if (proposal.actionType === 'add_comment') {
    return {
      ...input,
      taskId: resolved.taskId ?? input.taskId,
      taskTitle: input.taskTitle,
      title: input.title,
      content: (draft.content || '').trim(),
    };
  }

  if (proposal.actionType === 'update_task') {
    const next = {
      ...input,
      taskId: resolved.taskId ?? input.taskId,
      taskTitle: input.taskTitle,
      newTitle: (draft.title || '').trim() || undefined,
      dueDate: draft.dueDate || undefined,
      priority: draft.priority,
      description: draft.description,
    };
    if ((draft.status || '').trim()) next.status = draft.status;
    return next;
  }

  if (proposal.actionType === 'update_project') {
    const next = {
      ...input,
      projectId: resolved.projectId ?? input.projectId,
      projectName: input.projectName,
      newName: (draft.title || '').trim() || undefined,
      dueDate: draft.dueDate || undefined,
      description: draft.description,
    };
    if ((draft.status || '').trim()) next.status = draft.status;
    return next;
  }

  return {
    ...input,
    ...resolved,
    title: draft.title,
    name: proposal.actionType?.includes('project') ? draft.title : input.name,
    dueDate: draft.dueDate,
    priority: draft.priority,
    description: draft.description,
  };
}

function buildEditPrompt(proposal) {
  const title = getProposalTitle(proposal, proposal.resolvedInput || {});
  if (proposal.status === 'NEEDS_CLARIFICATION') {
    return `For "${title}", `;
  }
  return `Change "${title}" to `;
}

function buildDetails(proposal) {
  const resolved = proposal.resolvedInput || {};
  const updates = resolved.updates || {};
  const rows = [];

  const title = resolved.title || resolved.name || updates.title || updates.name;
  if (title) rows.push({ label: proposal.actionType?.includes('project') ? 'Name' : 'Title', value: title });
  if (resolved.taskId) rows.push({ label: 'Task', value: `#${resolved.taskId}` });
  if (resolved.projectId) rows.push({ label: 'Project', value: `#${resolved.projectId}` });
  if (resolved.parentTaskId) rows.push({ label: 'Parent task', value: `#${resolved.parentTaskId}` });
  if (resolved.dueDate || updates.dueDate) rows.push({ label: 'Due', value: formatValue(resolved.dueDate || updates.dueDate) });
  if (resolved.priority || updates.priority) rows.push({ label: 'Priority', value: humanize(resolved.priority || updates.priority) });
  if (updates.status) rows.push({ label: 'Status', value: humanize(updates.status) });
  if (resolved.assigneeId) rows.push({ label: 'Assignee', value: `User #${resolved.assigneeId}` });
  if (resolved.content) rows.push({ label: 'Comment', value: resolved.content, multiline: true });
  if (resolved.description || updates.description) rows.push({ label: 'Description', value: resolved.description || updates.description, multiline: true });

  return rows;
}

function getProposalTitle(proposal, resolved) {
  if (resolved.title || resolved.name) return resolved.title || resolved.name;
  if (proposal.title) return proposal.title.replace(/^(Create|Update|Add) (task|project|subtask|comment):?\s*/i, '').trim();
  return humanize(proposal.actionType || 'Draft');
}

function getFriendlySummary(proposal, status, actionCopy) {
  if (status === 'NEEDS_CLARIFICATION') return proposal.summary || 'I need one more detail before I can run this.';
  if (status === 'PENDING') return `Review this draft. If it looks right, I will ${actionCopy.verb}.`;
  if (status === 'EXECUTED') return 'This approved action has been completed.';
  if (status === 'UNDONE') return 'This action has been reversed.';
  if (status === 'SUPERSEDED') return 'A newer draft replaced this one.';
  return proposal.summary || `I will ${actionCopy.verb}.`;
}

function formatValue(value) {
  if (value === null || value === undefined || value === '') return 'empty';
  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}T/.test(value)) {
    return new Date(value).toLocaleString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  }
  return humanize(String(value));
}

function humanize(value) {
  return String(value || '')
    .replace(/_/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase()
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function getErrorMessage(err, fallback) {
  return err.response?.data?.error || err.message || fallback;
}

export default AssistantPanel;
