import { useState, useRef, useEffect } from 'react';
import { aiAPI } from '../../services/api';
import { FaRobot, FaTimes, FaPaperPlane } from 'react-icons/fa';
import useAuthStore from '../../context/authStore';

const AIModal = ({ isOpen, onClose }) => {
  const { user } = useAuthStore();
  const [messages, setMessages] = useState(() => {
    // Load conversation from localStorage or start with welcome message
    const saved = localStorage.getItem('aiConversation');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Failed to parse saved conversation:', e);
      }
    }
    return [
      {
        role: 'assistant',
        content: `Hi ${user?.name || 'there'}! I'm your AI assistant. I can help you with task management, create new tasks, analyze your workload, and more. How can I help you today?`
      }
    ];
  });
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const messagesEndRef = useRef(null);

  // Save conversation to localStorage whenever it changes
  useEffect(() => {
    if (messages.length > 0) {
      localStorage.setItem('aiConversation', JSON.stringify(messages));
    }
  }, [messages]);

  useEffect(() => {
    if (isOpen && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  const handleSend = async (e) => {
    e?.preventDefault();
    if (!input.trim()) return;
    
    const userMessage = { role: 'user', content: input };
    setMessages((msgs) => [...msgs, userMessage]);
    setLoading(true);
    setError(null);
    
    try {
      const res = await aiAPI.chat(input);
      setMessages((msgs) => [...msgs, { role: 'assistant', content: res.data.response }]);
    } catch (err) {
      setError('AI service error');
      // Remove the user message if AI failed
      setMessages((msgs) => msgs.slice(0, -1));
    }
    setInput('');
    setLoading(false);
  };

  const clearConversation = () => {
    setMessages([
      {
        role: 'assistant',
        content: `Hi ${user?.name || 'there'}! I'm your AI assistant. I can help you with task management, create new tasks, analyze your workload, and more. How can I help you today?`
      }
    ]);
    localStorage.removeItem('aiConversation');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-200 opacity-100" />

      {/* Animated container */}
      <div className="absolute inset-0 flex items-end sm:items-center justify-center">
        <div className="w-full h-[90vh] sm:h-[80vh] sm:max-w-3xl transform transition-all duration-300 ease-out animate-[aimodal-enter_300ms_ease-out]">
          <style>{`@keyframes aimodal-enter{0%{opacity:0;transform:translateY(24px) scale(0.98)}100%{opacity:1;transform:translateY(0) scale(1)}}`}</style>
          <div 
            className="border rounded-t-2xl sm:rounded-2xl shadow-2xl flex flex-col h-full transition-colors duration-200"
            style={{
              backgroundColor: 'var(--color-bg-secondary)',
              borderColor: 'var(--color-border-default)',
            }}
          >
        {/* Header */}
        <div 
          className="flex items-center justify-between px-6 py-4 border-b transition-colors duration-200"
          style={{ borderColor: 'var(--color-border-default)' }}
        >
          <div className="flex items-center space-x-2">
            <FaRobot className="text-indigo-400" size={22} />
            <div>
              <span 
                className="text-lg font-semibold transition-colors duration-200"
                style={{ color: 'var(--color-text-primary)' }}
              >
                AI Assistant
              </span>
              <div 
                className="text-xs transition-colors duration-200"
                style={{ color: 'var(--color-text-tertiary)' }}
              >
                {user?.name} ({user?.role})
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <button 
              onClick={clearConversation} 
              className="text-sm transition-colors duration-200"
              style={{ color: 'var(--color-text-tertiary)' }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = 'var(--color-text-primary)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = 'var(--color-text-tertiary)';
              }}
              title="Clear conversation"
            >
              Clear
            </button>
            <button 
              onClick={onClose} 
              className="transition-colors duration-200"
              style={{ color: 'var(--color-text-tertiary)' }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = 'var(--color-text-primary)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = 'var(--color-text-tertiary)';
              }}
            >
              <FaTimes size={20} />
            </button>
          </div>
        </div>
        {/* Conversation */}
        <div 
          className="flex-1 overflow-y-auto px-6 py-4 space-y-4 transition-colors duration-200" 
          style={{ 
            minHeight: 300,
            backgroundColor: 'var(--color-bg-tertiary)',
          }}
        >
          {messages.map((msg, idx) => (
            <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div 
                className={`rounded-xl px-4 py-2 max-w-[80%] text-sm ${msg.role === 'user' ? 'bg-indigo-600 text-white' : ''}`}
                style={msg.role === 'assistant' ? {
                  backgroundColor: 'var(--color-bg-secondary)',
                  color: 'var(--color-text-primary)',
                  border: '1px solid var(--color-border-default)',
                } : {}}
              >
                {msg.content}
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
        {/* Error */}
        {error && <div className="text-red-400 text-sm px-6">{error}</div>}
        {/* Input */}
        <form 
          className="flex items-center px-6 py-4 border-t transition-colors duration-200"
          style={{
            borderColor: 'var(--color-border-default)',
            backgroundColor: 'var(--color-bg-secondary)',
          }}
          onSubmit={handleSend}
        >
          <textarea
            className="flex-1 resize-none rounded-lg px-3 py-3 mr-2 focus:outline-none transition-colors duration-200"
            style={{
              backgroundColor: 'var(--color-bg-tertiary)',
              color: 'var(--color-text-primary)',
              borderColor: 'var(--color-border-default)',
              border: '1px solid',
              minHeight: 40,
            }}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = 'var(--color-primary)';
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = 'var(--color-border-default)';
            }}
            rows={2}
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder="Ask me anything..."
            disabled={loading}
            maxLength={500}
          />
          <button
            type="submit"
            className="btn bg-indigo-600 hover:bg-indigo-700 text-white border-0 flex items-center justify-center px-5 py-2"
            disabled={loading || !input.trim()}
            style={{ minHeight: 40 }}
          >
            {loading ? (
              <span className="loading loading-spinner loading-xs"></span>
            ) : (
              <FaPaperPlane size={18} />
            )}
          </button>
        </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AIModal; 