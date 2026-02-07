import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Paperclip, Sparkles, Bot, User, Loader2 } from 'lucide-react';
import MessageBubble from '../components/chat/MessageBubble';
import SuggestedQueries from '../components/chat/SuggestedQueries';
import FileUploadZone from '../components/chat/FileUploadZone';
import useAppStore from '../store';
import { API_BASE_URL, ENDPOINTS } from '../config/api';
import axios from 'axios';

const WELCOME_SUGGESTIONS = [
  "What are the biggest unmet needs in oncology?",
  "Analyze Metformin for new indications",
  "Show me the patent landscape for adalimumab biosimilars",
  "What's the EXIM trend for Sildenafil API?",
  "Which respiratory diseases have low competition but high patient burden?",
  "What clinical trials are ongoing for GLP-1 agonists in NASH?",
];

const Chat = () => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showUpload, setShowUpload] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [conversationId, setConversationId] = useState(null);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const sendMessage = async (text) => {
    if (!text.trim() || isLoading) return;

    const userMessage = {
      id: Date.now(),
      role: 'user',
      content: text,
      timestamp: new Date().toISOString(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    // Build conversation history for context
    const history = messages.map(m => ({
      role: m.role,
      content: m.content,
    }));

    try {
      const response = await axios.post(`${API_BASE_URL}${ENDPOINTS.CHAT_MESSAGE}`, {
        message: text,
        conversation_id: conversationId,
        conversation_history: history,
        uploaded_file_ids: uploadedFiles.map(f => f.file_id),
      }, { timeout: 300000 }); // 5 min timeout for long operations

      const data = response.data;
      if (data.conversation_id && !conversationId) {
        setConversationId(data.conversation_id);
      }

      const assistantMessage = {
        id: Date.now() + 1,
        role: 'assistant',
        content: data.message.content,
        tables: data.message.tables || [],
        charts: data.message.charts || [],
        pdf_url: data.message.pdf_url,
        suggestions: data.message.suggestions || [],
        agent_activities: data.message.agent_activities || [],
        timestamp: data.message.timestamp,
        intent: data.intent,
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Chat error:', error);
      const errorMessage = {
        id: Date.now() + 1,
        role: 'assistant',
        content: `I encountered an error: ${error.response?.data?.detail || error.message}. Please try again.`,
        timestamp: new Date().toISOString(),
        isError: true,
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    sendMessage(input);
  };

  const handleSuggestionClick = (suggestion) => {
    sendMessage(suggestion);
  };

  const handleFileUploaded = (fileData) => {
    setUploadedFiles(prev => [...prev, fileData]);
    setShowUpload(false);
    // Add a system message about the upload
    const uploadMsg = {
      id: Date.now(),
      role: 'assistant',
      content: `File **${fileData.filename}** uploaded and processed successfully (${fileData.chunks} text chunks indexed).\n\n${fileData.summary || 'You can now ask questions about this document.'}`,
      timestamp: new Date().toISOString(),
    };
    setMessages(prev => [...prev, uploadMsg]);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Chat Header */}
      <div className="flex-shrink-0 border-b border-brand-border px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-brand-yellow/10 rounded-xl flex items-center justify-center">
            <Bot className="w-5 h-5 text-brand-yellow" />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-text-primary">
              Pharma Planning Assistant
            </h1>
            <p className="text-xs text-text-muted">
              Powered by Master Agent + 7 Worker Agents (IQVIA, EXIM, Patent, Clinical Trials, Internal, Web Intel, Report)
            </p>
          </div>
          {uploadedFiles.length > 0 && (
            <div className="ml-auto flex items-center gap-2 text-xs text-text-muted">
              <Paperclip className="w-3.5 h-3.5" />
              {uploadedFiles.length} file{uploadedFiles.length > 1 ? 's' : ''} uploaded
            </div>
          )}
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4 scrollbar-thin">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full max-w-2xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center mb-8"
            >
              <div className="w-20 h-20 bg-brand-yellow/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Sparkles className="w-10 h-10 text-brand-yellow" />
              </div>
              <h2 className="text-2xl font-bold text-text-primary mb-2">
                Repurpose.AI Assistant
              </h2>
              <p className="text-text-secondary max-w-md">
                Ask me about drug repurposing opportunities, market data, patent landscapes,
                clinical trials, trade data, or upload internal documents for analysis.
              </p>
            </motion.div>

            <SuggestedQueries
              suggestions={WELCOME_SUGGESTIONS}
              onSelect={handleSuggestionClick}
            />
          </div>
        ) : (
          <>
            {messages.map((message) => (
              <MessageBubble
                key={message.id}
                message={message}
                onSuggestionClick={handleSuggestionClick}
              />
            ))}

            {isLoading && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex items-start gap-3"
              >
                <div className="w-8 h-8 bg-brand-yellow/10 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Bot className="w-4 h-4 text-brand-yellow" />
                </div>
                <div className="bg-brand-slate border border-brand-border rounded-xl px-4 py-3">
                  <div className="flex items-center gap-2 text-text-secondary">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span className="text-sm">Agents are working on your query...</span>
                  </div>
                </div>
              </motion.div>
            )}
          </>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* File Upload Zone */}
      <AnimatePresence>
        {showUpload && (
          <FileUploadZone
            onFileUploaded={handleFileUploaded}
            onClose={() => setShowUpload(false)}
          />
        )}
      </AnimatePresence>

      {/* Input Area */}
      <div className="flex-shrink-0 border-t border-brand-border px-6 py-4">
        <form onSubmit={handleSubmit} className="flex items-end gap-3">
          <button
            type="button"
            onClick={() => setShowUpload(!showUpload)}
            className="flex-shrink-0 w-10 h-10 rounded-lg bg-brand-slate border border-brand-border flex items-center justify-center text-text-secondary hover:text-brand-yellow hover:border-brand-yellow/30 transition-colors"
            title="Upload PDF document"
          >
            <Paperclip className="w-5 h-5" />
          </button>

          <div className="flex-1 relative">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask about drug repurposing, market data, patents, clinical trials..."
              className="w-full px-4 py-3 bg-brand-darker border border-brand-border rounded-xl text-text-primary placeholder-text-muted resize-none focus:outline-none focus:border-brand-yellow/50 focus:ring-1 focus:ring-brand-yellow/20 transition-colors"
              rows={1}
              style={{ minHeight: '44px', maxHeight: '120px' }}
              disabled={isLoading}
            />
          </div>

          <button
            type="submit"
            disabled={!input.trim() || isLoading}
            className="flex-shrink-0 w-10 h-10 rounded-lg bg-brand-yellow text-brand-darker flex items-center justify-center disabled:opacity-40 disabled:cursor-not-allowed hover:bg-brand-yellow/90 transition-colors"
          >
            <Send className="w-5 h-5" />
          </button>
        </form>
      </div>
    </div>
  );
};

export default Chat;
