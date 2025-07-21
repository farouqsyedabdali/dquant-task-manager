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
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-gray-900 rounded-lg shadow-lg w-full max-w-lg p-0 flex flex-col relative">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-700">
          <div className="flex items-center space-x-2">
            <FaRobot className="text-indigo-400" size={22} />
            <div>
              <span className="text-lg font-semibold text-white">AI Assistant</span>
              <div className="text-xs text-gray-400">
                {user?.name} ({user?.role})
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <button 
              onClick={clearConversation} 
              className="text-gray-400 hover:text-white text-sm"
              title="Clear conversation"
            >
              Clear
            </button>
            <button onClick={onClose} className="text-gray-400 hover:text-white">
              <FaTimes size={20} />
            </button>
          </div>
        </div>
        {/* Conversation */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4 bg-gray-800" style={{ minHeight: 300, maxHeight: 400 }}>
          {messages.map((msg, idx) => (
            <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`rounded-lg px-4 py-2 max-w-[80%] text-sm ${msg.role === 'user' ? 'bg-indigo-600 text-white' : 'bg-gray-700 text-gray-100'}`}>
                {msg.content}
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
        {/* Error */}
        {error && <div className="text-red-400 text-sm px-6">{error}</div>}
        {/* Input */}
        <form onSubmit={handleSend} className="flex items-center px-6 py-4 border-t border-gray-700 bg-gray-900">
          <textarea
            className="flex-1 resize-none rounded-lg bg-gray-800 text-white border border-gray-700 px-3 py-2 mr-2 focus:outline-none focus:border-indigo-500"
            rows={1}
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder="Ask me anything..."
            disabled={loading}
            maxLength={500}
            style={{ minHeight: 36 }}
          />
          <button
            type="submit"
            className="btn bg-indigo-600 hover:bg-indigo-700 text-white border-0 flex items-center justify-center px-4 py-2"
            disabled={loading || !input.trim()}
            style={{ minHeight: 36 }}
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
  );
};

export default AIModal; 