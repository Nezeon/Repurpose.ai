/**
 * ChatPanel Component
 * Slide-out chat interface for Q&A about drug repurposing results
 */

import React, { useState, useRef, useEffect } from 'react';
import {
  MessageCircle,
  X,
  Send,
  Bot,
  User,
  Loader2,
  Sparkles,
  AlertCircle,
  Minimize2,
  Maximize2
} from 'lucide-react';
import useAppStore from '../../store';
import { sendChatMessage } from '../../services/api';

/**
 * Format message content with basic markdown
 */
const formatMessageContent = (content) => {
  if (!content) return null;

  const lines = content.split('\n');
  const elements = [];
  let key = 0;

  for (const line of lines) {
    const trimmed = line.trim();

    // Bold text
    let formatted = trimmed.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
    // Italic text
    formatted = formatted.replace(/(?<!\*)\*([^*]+)\*(?!\*)/g, '<em>$1</em>');

    if (trimmed.startsWith('- ') || trimmed.startsWith('• ')) {
      elements.push(
        <li key={key++} className="ml-4 list-disc" dangerouslySetInnerHTML={{ __html: formatted.slice(2) }} />
      );
    } else if (trimmed) {
      elements.push(
        <p key={key++} className="mb-2" dangerouslySetInnerHTML={{ __html: formatted }} />
      );
    }
  }

  return <div className="text-sm leading-relaxed">{elements}</div>;
};

/**
 * Single chat message component
 */
const ChatMessage = ({ message }) => {
  const isUser = message.role === 'user';

  return (
    <div className={`flex gap-3 ${isUser ? 'flex-row-reverse' : ''}`}>
      {/* Avatar */}
      <div className={`
        flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center
        ${isUser
          ? 'bg-brand-yellow/20 text-brand-yellow'
          : 'bg-health-teal/20 text-health-teal'}
      `}>
        {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
      </div>

      {/* Message content */}
      <div className={`
        max-w-[80%] rounded-2xl px-4 py-3
        ${isUser
          ? 'bg-brand-yellow/10 border border-brand-yellow/30 text-gray-200'
          : 'bg-white/5 border border-white/10 text-gray-300'}
      `}>
        {message.isLoading ? (
          <div className="flex items-center gap-2 text-gray-400">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span className="text-sm">Thinking...</span>
          </div>
        ) : message.error ? (
          <div className="flex items-center gap-2 text-red-400">
            <AlertCircle className="w-4 h-4" />
            <span className="text-sm">{message.error}</span>
          </div>
        ) : (
          formatMessageContent(message.content)
        )}
      </div>
    </div>
  );
};

/**
 * Suggested questions component
 */
const SuggestedQuestions = ({ drugName, indications, onSelect }) => {
  const topIndication = indications?.[0]?.indication || 'cancer';

  const suggestions = [
    `What is the strongest evidence for ${drugName} in ${topIndication}?`,
    `What are the potential risks of repurposing ${drugName}?`,
    `What clinical trials are most relevant?`,
    `Summarize the mechanism of action for ${drugName}.`,
  ];

  return (
    <div className="space-y-2">
      <p className="text-xs text-gray-500 mb-2">Suggested questions:</p>
      {suggestions.map((question, index) => (
        <button
          key={index}
          onClick={() => onSelect(question)}
          className="
            w-full text-left px-3 py-2 text-sm text-gray-400
            bg-white/5 hover:bg-white/10 rounded-lg
            border border-white/10 hover:border-brand-yellow/30
            transition-all duration-200
          "
        >
          {question}
        </button>
      ))}
    </div>
  );
};

const ChatPanel = () => {
  const {
    searchResults,
    drugName,
    chatMessages,
    addChatMessage,
    clearChatMessages,
    isChatOpen,
    setIsChatOpen
  } = useAppStore();

  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  // Focus input when panel opens
  useEffect(() => {
    if (isChatOpen && !isMinimized) {
      inputRef.current?.focus();
    }
  }, [isChatOpen, isMinimized]);

  // Don't render if no search results
  if (!searchResults) return null;

  const handleToggle = () => {
    setIsChatOpen(!isChatOpen);
    if (!isChatOpen) {
      setIsMinimized(false);
    }
  };

  const handleSend = async () => {
    if (!inputValue.trim() || isLoading) return;

    const question = inputValue.trim();
    setInputValue('');

    // Add user message
    addChatMessage({
      id: Date.now(),
      role: 'user',
      content: question,
      timestamp: new Date().toISOString(),
    });

    // Add loading message
    const loadingId = Date.now() + 1;
    addChatMessage({
      id: loadingId,
      role: 'assistant',
      content: '',
      isLoading: true,
      timestamp: new Date().toISOString(),
    });

    setIsLoading(true);

    try {
      // Prepare context for the API
      const indications = searchResults.ranked_indications?.map(i => i.indication) || [];
      const evidenceSummary = searchResults.synthesis || '';

      const response = await sendChatMessage(question, {
        drugName: searchResults.drug_name,
        indications,
        evidenceSummary,
      });

      // Replace loading message with actual response
      useAppStore.setState((state) => ({
        chatMessages: state.chatMessages.map((msg) =>
          msg.id === loadingId
            ? {
                ...msg,
                content: response.answer || response.response || 'No response received.',
                isLoading: false,
              }
            : msg
        ),
      }));
    } catch (error) {
      // Replace loading message with error
      useAppStore.setState((state) => ({
        chatMessages: state.chatMessages.map((msg) =>
          msg.id === loadingId
            ? {
                ...msg,
                error: error.message || 'Failed to get response',
                isLoading: false,
              }
            : msg
        ),
      }));
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleSuggestionSelect = (question) => {
    setInputValue(question);
    inputRef.current?.focus();
  };

  return (
    <>
      {/* Chat Toggle Button */}
      <button
        onClick={handleToggle}
        className={`
          fixed bottom-6 right-6 z-50
          w-14 h-14 rounded-full
          bg-gradient-to-br from-brand-yellow to-brand-gold
          text-brand-dark shadow-lg shadow-brand-yellow/25
          flex items-center justify-center
          hover:scale-110 active:scale-95
          transition-all duration-300
          ${isChatOpen ? 'rotate-0' : 'animate-bounce-subtle'}
        `}
        title={isChatOpen ? 'Close chat' : 'Ask questions about results'}
      >
        {isChatOpen ? (
          <X className="w-6 h-6" />
        ) : (
          <MessageCircle className="w-6 h-6" />
        )}
      </button>

      {/* Chat Panel */}
      <div
        className={`
          fixed bottom-24 right-6 z-40
          w-96 max-w-[calc(100vw-3rem)]
          bg-brand-dark border border-white/10 rounded-2xl
          shadow-2xl shadow-black/50
          transition-all duration-300 origin-bottom-right
          ${isChatOpen
            ? 'opacity-100 scale-100 translate-y-0'
            : 'opacity-0 scale-95 translate-y-4 pointer-events-none'}
          ${isMinimized ? 'h-14' : 'h-[500px] max-h-[calc(100vh-8rem)]'}
        `}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-health-teal/20 rounded-lg">
              <Sparkles className="w-4 h-4 text-health-teal" />
            </div>
            <div>
              <h3 className="font-semibold text-white text-sm">Research Assistant</h3>
              <p className="text-xs text-gray-500">Ask about {drugName}</p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setIsMinimized(!isMinimized)}
              className="p-1.5 hover:bg-white/10 rounded-lg transition-colors"
              title={isMinimized ? 'Expand' : 'Minimize'}
            >
              {isMinimized ? (
                <Maximize2 className="w-4 h-4 text-gray-400" />
              ) : (
                <Minimize2 className="w-4 h-4 text-gray-400" />
              )}
            </button>
            <button
              onClick={handleToggle}
              className="p-1.5 hover:bg-white/10 rounded-lg transition-colors"
              title="Close"
            >
              <X className="w-4 h-4 text-gray-400" />
            </button>
          </div>
        </div>

        {/* Content (hidden when minimized) */}
        {!isMinimized && (
          <>
            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 h-[calc(100%-8rem)]">
              {chatMessages.length === 0 ? (
                <div className="text-center py-8">
                  <div className="inline-flex p-3 bg-health-teal/10 rounded-full mb-4">
                    <Bot className="w-8 h-8 text-health-teal" />
                  </div>
                  <h4 className="text-white font-medium mb-2">
                    Ask me anything about {drugName}
                  </h4>
                  <p className="text-sm text-gray-400 mb-6">
                    I can help you understand the repurposing opportunities, evidence, and research findings.
                  </p>
                  <SuggestedQuestions
                    drugName={drugName}
                    indications={searchResults.ranked_indications}
                    onSelect={handleSuggestionSelect}
                  />
                </div>
              ) : (
                <>
                  {chatMessages.map((message) => (
                    <ChatMessage key={message.id} message={message} />
                  ))}
                  <div ref={messagesEndRef} />
                </>
              )}
            </div>

            {/* Input */}
            <div className="p-4 border-t border-white/10">
              <div className="flex items-center gap-2">
                <input
                  ref={inputRef}
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Ask a question..."
                  disabled={isLoading}
                  className="
                    flex-1 px-4 py-2.5
                    bg-white/5 border border-white/10 rounded-xl
                    text-white placeholder-gray-500
                    focus:outline-none focus:border-brand-yellow/50 focus:ring-1 focus:ring-brand-yellow/25
                    disabled:opacity-50
                    text-sm
                  "
                />
                <button
                  onClick={handleSend}
                  disabled={!inputValue.trim() || isLoading}
                  className="
                    p-2.5 rounded-xl
                    bg-brand-yellow text-brand-dark
                    hover:bg-brand-gold
                    disabled:opacity-50 disabled:cursor-not-allowed
                    transition-colors
                  "
                  title="Send message"
                >
                  {isLoading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <Send className="w-5 h-5" />
                  )}
                </button>
              </div>
              {chatMessages.length > 0 && (
                <button
                  onClick={clearChatMessages}
                  className="mt-2 text-xs text-gray-500 hover:text-gray-400 transition-colors"
                >
                  Clear conversation
                </button>
              )}
            </div>
          </>
        )}
      </div>
    </>
  );
};

export default ChatPanel;
