import { useState } from 'react';
import useThemeLogo from '../hooks/useThemeLogo';

/**
 * AI chat assistant mockup – conversation, input, suggested actions
 */
const AIChatFull = () => {
  const tialzLogo = useThemeLogo();
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState([
    { role: 'user', text: 'Create a task for reviewing the API docs by Friday' },
    { role: 'assistant', text: "I've created a task:\n\n**Review API docs**\n- Priority: Medium\n- Due: Friday, Mar 21\n- Status: To Do\n\nWould you like me to assign it to anyone or add more details?" },
  ]);

  const suggestions = [
    'Create task: Deploy v2.1 tomorrow',
    'What tasks are due this week?',
    'Summarize my in-progress tasks',
    'Add update to PR #142: approved',
  ];

  const handleSend = () => {
    if (!input.trim()) return;
    setMessages((m) => [...m, { role: 'user', text: input }, { role: 'assistant', text: "I understand. This is a mockup – in the real app I'd process that and help you manage your tasks." }]);
    setInput('');
  };

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ backgroundColor: 'var(--color-bg-primary)', color: 'var(--color-text-primary)' }}
    >
      {/* Header */}
      <div
        className="flex items-center gap-3 p-4 border-b"
        style={{
          backgroundColor: 'var(--color-bg-secondary)',
          borderColor: 'var(--color-border-default)',
        }}
      >
        <img src={tialzLogo} alt="TIALZ AI" className="w-10 h-10" />
        <div>
          <h1 className="font-bold">AI Assistant</h1>
          <p className="text-xs" style={{ color: 'var(--color-text-tertiary)' }}>Task management powered by AI</p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-6 max-w-3xl mx-auto w-full">
        {messages.map((m, i) => (
          <div
            key={i}
            className={`flex gap-3 mb-6 ${m.role === 'user' ? 'justify-end' : ''}`}
          >
            {m.role === 'assistant' && (
              <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: 'var(--color-primary)' }}>
                <img src={tialzLogo} alt="" className="w-5 h-5" />
              </div>
            )}
            <div
              className={`max-w-[80%] px-4 py-3 rounded-2xl ${
                m.role === 'user'
                  ? 'rounded-br-md'
                  : 'rounded-bl-md'
              }`}
              style={{
                backgroundColor: m.role === 'user' ? 'var(--color-primary)' : 'var(--color-bg-tertiary)',
                color: m.role === 'user' ? 'white' : 'var(--color-text-primary)',
              }}
            >
              <p className="whitespace-pre-wrap text-sm">{m.text}</p>
            </div>
            {m.role === 'user' && <div className="w-8" />}
          </div>
        ))}
      </div>

      {/* Suggestions */}
      <div className="px-6 pb-2 max-w-3xl mx-auto w-full">
        <p className="text-xs mb-2" style={{ color: 'var(--color-text-tertiary)' }}>Try asking:</p>
        <div className="flex flex-wrap gap-2">
          {suggestions.map((s) => (
            <button
              key={s}
              onClick={() => setInput(s)}
              className="px-3 py-1.5 rounded-lg text-sm border"
              style={{
                backgroundColor: 'var(--color-bg-secondary)',
                borderColor: 'var(--color-border-default)',
                color: 'var(--color-text-secondary)',
              }}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Input */}
      <div
        className="p-4 border-t"
        style={{
          backgroundColor: 'var(--color-bg-secondary)',
          borderColor: 'var(--color-border-default)',
        }}
      >
        <div className="max-w-3xl mx-auto flex gap-3">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
            placeholder="Ask me to create tasks, add updates, or summarize..."
            className="flex-1 px-4 py-3 rounded-xl border"
            style={{
              backgroundColor: 'var(--color-bg-tertiary)',
              borderColor: 'var(--color-border-default)',
            }}
          />
          <button
            onClick={handleSend}
            className="px-6 py-3 rounded-xl font-medium"
            style={{ backgroundColor: 'var(--color-primary)', color: 'white' }}
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
};

export default AIChatFull;
