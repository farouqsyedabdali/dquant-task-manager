import { useState, useRef, useEffect, useMemo } from 'react';
import ReactMarkdown from 'react-markdown';
import { aiAPI } from '../../services/api';
import { FaCheck, FaPaperPlane, FaPen, FaRegTrashAlt, FaTimes, FaUndo } from 'react-icons/fa';
import IconButton from '../common/IconButton';

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
  const messagesScrollRef = useRef(null);

  const hasMessages = messages.length > 0;

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
    localStorage.removeItem(LEGACY_STORAGE_KEY);
  }, [messages]);

  useEffect(() => {
    const el = messagesScrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages, isProcessing]);

  const getChatHistoryForApi = () =>
    messages
      .filter((m) => m.role === 'user' || m.role === 'assistant')
      .map((m) => ({ role: m.role, content: formatMessageForHistory(m) }))
      .slice(-24);

  const latestProposal = useMemo(() => findLatestProposal(messages), [messages]);

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
        const { data } = await aiAPI.previewAction(proposal.actionType, action.input, action.sourceText || 'Edited draft');
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

    if (
      isApprovalText(text) &&
      currentLatestProposal?.proposal?.status === 'PENDING' &&
      currentLatestProposal.proposal.canExecute !== false
    ) {
      setInput('');
      setMessages((prev) => [...prev, { role: 'user', content: text }]);
      setIsProcessing(false);
      await handleProposalAction(currentLatestProposal.messageIndex, currentLatestProposal.proposalIndex, 'execute');
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

    let intent = 'chat';
    let payloadText = text;
    setStatusText('Understanding request');
    try {
      const { data } = await aiAPI.routeIntent(text);
      intent = data.intent || 'chat';
      payloadText = (data.text && data.text.trim()) || text;
    } catch (e) {
      console.warn('routeIntent failed, falling back to chat', e);
    }

    try {
      setStatusText(intent === 'chat' ? 'Thinking' : 'Preparing draft');
      const history = getChatHistoryForApi();
      const { data } = await aiAPI.chat(payloadText, history);
          setInput('');
      const proposals = Array.isArray(data?.proposals)
        ? data.proposals.map((proposal) => ({ ...proposal, status: proposal.status || 'PENDING' }))
        : [];
      const reply = cleanAssistantReply(data?.response, proposals);
          setMessages((prev) => [
            ...prev,
            { role: 'user', content: text },
            {
              role: 'assistant',
          content: reply,
          ...(proposals.length > 0 ? { proposals } : {}),
            },
          ]);
      setStatusText(proposals.some((proposal) => proposal.status === 'NEEDS_CLARIFICATION') ? 'Needs details' : proposals.length ? 'Action ready' : 'Ready');
    } catch (err) {
      console.error('handleSend error:', err);
      setError(getErrorMessage(err, 'Something went wrong'));
      setStatusText('Needs attention');
    } finally {
      setIsProcessing(false);
    }
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
        className="flex-1 min-h-0 overflow-y-auto px-3 py-3 space-y-3"
          style={{ backgroundColor: 'var(--color-bg-tertiary)' }}
      >
        {!hasMessages && (
          <AssistantEmptyState
            onSuggestion={(suggestion) => {
              setInput(suggestion);
              handleSend(suggestion);
            }}
          />
        )}

        {messages.map((msg, idx) => (
          <MessageGroup
            key={`${msg.role}-${idx}-${msg.content?.slice(0, 12) || 'proposal'}`}
            message={msg}
            messageIndex={idx}
            onProposalAction={handleProposalAction}
          />
        ))}

        {isProcessing && <ThinkingIndicator label={statusText} />}
      </div>

      <Composer
        value={input}
        onChange={setInput}
        onSend={() => handleSend()}
        isProcessing={isProcessing}
        latestProposal={latestProposal?.proposal}
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

const MessageGroup = ({ message, messageIndex, onProposalAction }) => {
  const isUser = message.role === 'user';
  const shouldShowText = message.content && message.content !== '(No response)';

  return (
    <div className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}>
      {shouldShowText && (
        <div
          className={`max-w-[94%] rounded-2xl px-3 py-2 text-sm leading-5 shadow-sm ${isUser ? 'text-white' : 'border'}`}
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
            <p className="whitespace-pre-wrap">{message.content}</p>
          ) : (
            <div className="ai-markdown">
              <ReactMarkdown>{message.content}</ReactMarkdown>
            </div>
          )}
        </div>
      )}

      {message.role === 'assistant' && Array.isArray(message.proposals) && message.proposals.length > 0 && (
        <div className="mt-2 w-full space-y-2.5">
          {message.proposals.map((proposal, proposalIndex) => (
            <AIActionCard
              key={proposal.id || proposalIndex}
              proposal={proposal}
              onAction={(action) => onProposalAction(messageIndex, proposalIndex, action)}
            />
          ))}
        </div>
      )}
    </div>
  );
};

const Composer = ({ value, onChange, onSend, isProcessing, latestProposal }) => {
  const helperText = latestProposal?.status === 'PENDING'
    ? 'Tip: type "go ahead" to approve the latest draft.'
    : latestProposal?.status === 'NEEDS_CLARIFICATION'
      ? 'Add a detail like a due date, assignee, or exact task ID.'
      : 'Press Enter to send. Shift+Enter adds a line.';

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
          className="w-full resize-none bg-transparent px-2 py-1 text-sm leading-5 focus:outline-none"
          style={{ color: 'var(--color-text-primary)', minHeight: 46 }}
          rows={2}
          value={value}
          onChange={(e) => onChange(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
              onSend();
                }
              }}
          placeholder="Ask me to draft or update work..."
              disabled={isProcessing}
          maxLength={700}
        />
        <div className="flex items-center justify-between gap-2 px-1 pt-1">
          <p className="min-w-0 truncate text-[11px]" style={{ color: 'var(--color-text-tertiary)' }} title={helperText}>
            {helperText}
          </p>
              <IconButton
                icon={<FaPaperPlane />}
                label="Send"
                variant="primary"
                size="sm"
            onClick={onSend}
            disabled={isProcessing || !value.trim()}
                loading={isProcessing}
              />
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

const AIActionCard = ({ proposal, onAction }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState(() => buildEditableDraft(proposal));

  useEffect(() => {
    setDraft(buildEditableDraft(proposal));
    setIsEditing(false);
  }, [proposal.id, proposal.status]);

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
  const canUndo = isDone && (proposal.undoData || proposal.undoLabel || proposal.preview?.undoLabel);
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
      className="rounded-2xl border p-3 text-left shadow-sm transition-opacity"
      style={{
        backgroundColor: 'var(--color-bg-secondary)',
        borderColor: isBlocked ? 'rgba(245, 158, 11, 0.45)' : isError ? 'rgba(239, 68, 68, 0.45)' : 'var(--color-border-default)',
        color: 'var(--color-text-primary)',
        opacity: isFinal ? 0.68 : 1,
      }}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-medium" style={{ color: 'var(--color-text-tertiary)' }}>
            {actionCopy.label}
          </p>
          <p className="mt-1 break-words text-sm font-semibold leading-5">{getProposalTitle(proposal, resolved)}</p>
        </div>
        <StatusPill copy={statusCopy} />
      </div>

      <p className="mt-1.5 text-xs leading-5" style={{ color: 'var(--color-text-secondary)' }}>
        {getFriendlySummary(proposal, status, actionCopy)}
      </p>

      {isEditing ? (
        <DraftEditor
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
                <p style={{ color: 'var(--color-text-secondary)' }}>
                  {formatValue(change.before)} -&gt; {formatValue(change.after)}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {duplicateCandidates.length > 0 && (
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
            <ActionButton onClick={() => onAction('reject')} disabled={isBusy}>
              Cancel
            </ActionButton>
          </div>
        </div>
      )}

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

const DraftEditor = ({ draft, onChange, onSave, onCancel, isBusy }) => {
  const fieldClass = 'w-full rounded-lg border px-2 py-1.5 text-xs focus:outline-none';
  const fieldStyle = {
    backgroundColor: 'var(--color-bg-secondary)',
    borderColor: 'var(--color-border-default)',
    color: 'var(--color-text-primary)'
  };

  const update = (key, value) => onChange((prev) => ({ ...prev, [key]: value }));

  return (
    <div className="mt-2.5 rounded-xl border p-2.5" style={{ borderColor: 'var(--color-border-default)', backgroundColor: 'var(--color-bg-tertiary)' }}>
      <div className="mb-2 flex items-center justify-between gap-2">
        <p className="text-[10px] font-semibold uppercase tracking-wide" style={{ color: 'var(--color-text-tertiary)' }}>
          Edit draft
        </p>
        <div className="flex shrink-0 gap-1.5">
          <ActionButton onClick={onSave} disabled={isBusy || !draft.title.trim()} variant="primary">
            Save
          </ActionButton>
          <ActionButton onClick={onCancel} disabled={isBusy}>
            Cancel
          </ActionButton>
        </div>
      </div>
      <div className="space-y-2">
        <label className="block text-xs">
          <span className="mb-1 block font-medium" style={{ color: 'var(--color-text-secondary)' }}>Title</span>
          <input className={fieldClass} style={fieldStyle} value={draft.title} onChange={(e) => update('title', e.target.value)} />
        </label>
        <label className="block text-xs">
          <span className="mb-1 block font-medium" style={{ color: 'var(--color-text-secondary)' }}>Due date</span>
          <input className={fieldClass} style={fieldStyle} value={draft.dueDate} onChange={(e) => update('dueDate', e.target.value)} placeholder="Tomorrow at 5pm" />
        </label>
        <label className="block text-xs">
          <span className="mb-1 block font-medium" style={{ color: 'var(--color-text-secondary)' }}>Priority</span>
          <select className={fieldClass} style={fieldStyle} value={draft.priority} onChange={(e) => update('priority', e.target.value)}>
            <option value="LOW">Low</option>
            <option value="MEDIUM">Medium</option>
            <option value="HIGH">High</option>
            <option value="URGENT">Urgent</option>
          </select>
        </label>
        <label className="block text-xs">
          <span className="mb-1 block font-medium" style={{ color: 'var(--color-text-secondary)' }}>Description</span>
          <textarea className={`${fieldClass} resize-none`} style={fieldStyle} rows={2} value={draft.description} onChange={(e) => update('description', e.target.value)} />
        </label>
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
      if (proposal?.id && !['REJECTED', 'UNDONE', 'SUPERSEDED'].includes(proposal.status)) {
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
  if (proposals.length > 0 && (!text || /^\s*(here'?s|i'?ve|review)/i.test(text))) {
    return proposals.some((proposal) => proposal.status === 'NEEDS_CLARIFICATION')
      ? 'I drafted this, but I need one more detail before it can run.'
      : 'I drafted this for review.';
  }
  return text || (proposals.length > 0 ? 'I drafted this for review.' : '(No response)');
}

function isApprovalText(text) {
  return /^(yes|yeah|yep|approve|approved|go ahead|run it|do it|confirm)$/i.test(text.trim());
}

function isCancelText(text) {
  return /^(no|nope|cancel|reject|stop|never mind|nevermind|discard)$/i.test(text.trim());
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
  if (!['create_task', 'add_subtask', 'create_project', 'update_task', 'update_project'].includes(proposal.actionType)) return false;
  return /\b(due|date|tomorrow|today|eod|priority|assign|assignee|title|rename|description|project|january|february|march|april|may|june|july|august|september|october|november|december)\b/i.test(text);
}

function buildCorrectedInput(previous, text) {
  const nextInput = {
    ...(previous.input || {}),
    ...(previous.resolvedInput || {}),
  };

  if (/\b(due|date|tomorrow|today|eod|january|february|march|april|may|june|july|august|september|october|november|december)\b/i.test(text)) {
    nextInput.dueDate = text;
  }

  const priorityMatch = text.match(/\b(low|medium|high|urgent)\b/i);
  if (priorityMatch) nextInput.priority = priorityMatch[1].toUpperCase();

  return nextInput;
}

function buildEditableDraft(proposal) {
  const resolved = proposal.resolvedInput || {};
  const updates = resolved.updates || {};
  return {
    title: resolved.title || resolved.name || updates.title || updates.name || getProposalTitle(proposal, resolved),
    dueDate: resolved.dueDate || updates.dueDate || '',
    priority: resolved.priority || updates.priority || 'MEDIUM',
    description: resolved.description || updates.description || ''
  };
}

function buildInputFromDraft(proposal, draft) {
  const base = {
    ...(proposal.input || {}),
    ...(proposal.resolvedInput || {})
  };

  if (proposal.actionType === 'update_task') {
    return {
      ...base,
      newTitle: draft.title,
      dueDate: draft.dueDate,
      priority: draft.priority,
      description: draft.description
    };
  }

  if (proposal.actionType === 'update_project') {
    return {
      ...base,
      newName: draft.title,
      dueDate: draft.dueDate,
      description: draft.description
    };
  }

  return {
    ...base,
    title: draft.title,
    name: proposal.actionType?.includes('project') ? draft.title : base.name,
    dueDate: draft.dueDate,
    priority: draft.priority,
    description: draft.description
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
