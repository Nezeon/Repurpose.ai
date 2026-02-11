import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Paperclip, Sparkles, Bot, User, Loader2, MessageSquare, Plus, Trash2, ChevronLeft } from 'lucide-react';
import MessageBubble from '../components/chat/MessageBubble';
import SuggestedQueries from '../components/chat/SuggestedQueries';
import FileUploadZone from '../components/chat/FileUploadZone';
import ChatProgress from '../components/chat/ChatProgress';
import useAppStore from '../store';
import { useWebSocket } from '../hooks/useWebSocket';
import { API_BASE_URL, ENDPOINTS } from '../config/api';
import { getConversations, getConversation, deleteConversation } from '../services/api';
import { generateSessionId } from '../utils/helpers';
import axios from 'axios';

const WELCOME_SUGGESTIONS = [
  "What are the biggest unmet needs in oncology?",
  "Analyze Metformin for new indications",
  "Show me the patent landscape for adalimumab biosimilars",
  "What's the EXIM trend for Sildenafil API from India and China?",
  "Which respiratory diseases show low competition but high patient burden?",
  "What clinical trials are ongoing for GLP-1 agonists in NASH?",
  "Find biosimilar opportunities for molecules with patents expiring in 2 years",
  "Compare the market potential of GLP-1 agonists across diabetes and obesity",
  "Summarize recent FDA guidance on drug repurposing pathways",
  "Which cardiovascular drugs show the highest import volumes from China?",
];

const Chat = () => {
  const addToHistory = useAppStore((s) => s.addToHistory);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showUpload, setShowUpload] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [conversationId, setConversationId] = useState(null);
  const [pastConversations, setPastConversations] = useState([]);
  const [showHistory, setShowHistory] = useState(false);
  const [chatSessionId, setChatSessionId] = useState(null);
  const [activeAgents, setActiveAgents] = useState({ agentsNeeded: [], agentNames: {} });
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Stable callback for WebSocket messages (prevents reconnection loops)
  const handleWsMessage = useCallback((data) => {
    if (data.type === 'chat_agents_info') {
      setActiveAgents({
        agentsNeeded: data.agents_needed || [],
        agentNames: data.agent_names || {},
      });
    }
  }, []);

  // WebSocket for real-time agent progress during chat
  const {
    agentProgress,
    resetProgress,
  } = useWebSocket(chatSessionId, {
    autoConnect: !!chatSessionId,
    reconnect: false,
    onMessage: handleWsMessage,
  });

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    inputRef.current?.focus();
    loadPastConversations();
  }, []);

  const loadPastConversations = async () => {
    try {
      const data = await getConversations(20);
      setPastConversations(data.conversations || []);
    } catch (error) {
      // Silently fail — conversations just won't show
    }
  };

  const handleLoadConversation = async (convId) => {
    try {
      const data = await getConversation(convId);
      if (data && data.messages) {
        const loadedMessages = data.messages.map((msg, idx) => ({
          id: Date.now() + idx,
          role: msg.role,
          content: msg.content,
          timestamp: msg.timestamp,
          tables: msg.tables || [],
          charts: msg.charts || [],
          suggestions: msg.suggestions || [],
          agent_activities: msg.agent_activities || [],
          pdf_url: msg.pdf_url || msg.metadata?.pdf_url,
          excel_url: msg.excel_url || msg.metadata?.excel_url,
          intent: msg.metadata?.intent,
        }));
        setMessages(loadedMessages);
        setConversationId(convId);
        setShowHistory(false);
      }
    } catch (error) {
      console.error('Failed to load conversation:', error);
    }
  };

  const handleDeleteConversation = async (convId, e) => {
    e.stopPropagation();
    try {
      await deleteConversation(convId);
      setPastConversations((prev) => prev.filter((c) => c.conversation_id !== convId));
      if (conversationId === convId) {
        handleNewConversation();
      }
    } catch (error) {
      console.error('Failed to delete conversation:', error);
    }
  };

  const handleNewConversation = () => {
    setMessages([]);
    setConversationId(null);
    setUploadedFiles([]);
    setShowHistory(false);
  };

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

    // Set up WebSocket for real-time progress
    const newSessionId = generateSessionId();
    setChatSessionId(newSessionId);
    resetProgress();
    setActiveAgents({ agentsNeeded: [], agentNames: {} });

    // Brief delay to ensure WebSocket connects before backend sends progress
    await new Promise(resolve => setTimeout(resolve, 300));

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
        session_id: newSessionId,
      }, { timeout: 300000 });

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
        excel_url: data.message.excel_url,
        suggestions: data.message.suggestions || [],
        agent_activities: data.message.agent_activities || [],
        timestamp: data.message.timestamp,
        intent: data.intent,
      };

      setMessages(prev => [...prev, assistantMessage]);

      // Add pipeline analysis to search history so it appears in History page
      if (data.pipeline_metadata) {
        const pm = data.pipeline_metadata;
        const historyEntry = {
          drugName: pm.drug_name,
          timestamp: new Date().toISOString(),
          opportunityCount: pm.opportunity_count || 0,
          cached: false,
        };
        // Include scores if provided by backend
        if (pm.scores) {
          historyEntry.scores = pm.scores;
        }
        addToHistory(historyEntry);
      }

      loadPastConversations();
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
      setChatSessionId(null);
      setActiveAgents({ agentsNeeded: [], agentNames: {} });
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

  const formatTimeAgo = (ts) => {
    if (!ts) return '';
    const diff = Date.now() - new Date(ts).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'just now';
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    return `${days}d ago`;
  };

  return (
    <div className="flex h-full">
      {/* Conversation History Sidebar */}
      <AnimatePresence>
        {showHistory && (
          <motion.div
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 280, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="flex-shrink-0 border-r border-brand-border bg-brand-darker overflow-hidden"
          >
            <div className="w-[280px] h-full flex flex-col">
              <div className="p-3 border-b border-brand-border flex items-center justify-between">
                <span className="text-sm font-medium text-text-primary">Conversations</span>
                <button
                  onClick={handleNewConversation}
                  className="p-1.5 rounded-lg hover:bg-brand-yellow/10 text-text-muted hover:text-brand-yellow transition-colors"
                  title="New conversation"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto scrollbar-thin">
                {pastConversations.length === 0 ? (
                  <div className="p-4 text-center text-text-muted text-xs">
                    No past conversations
                  </div>
                ) : (
                  pastConversations.map((conv) => (
                    <div
                      key={conv.conversation_id}
                      onClick={() => handleLoadConversation(conv.conversation_id)}
                      role="button"
                      tabIndex={0}
                      className={`w-full text-left p-3 border-b border-brand-border/50 hover:bg-white/5 transition-colors group cursor-pointer ${
                        conversationId === conv.conversation_id ? 'bg-brand-yellow/5 border-l-2 border-l-brand-yellow' : ''
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-sm text-text-primary line-clamp-2 flex-1">
                          {conv.preview || 'Empty conversation'}
                        </p>
                        <button
                          onClick={(e) => handleDeleteConversation(conv.conversation_id, e)}
                          className="p-1 rounded text-text-muted hover:text-error opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                      <div className="flex items-center gap-2 mt-1 text-xs text-text-muted">
                        <span>{conv.message_count} msgs</span>
                        <span>{formatTimeAgo(conv.updated_at)}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Chat Header */}
        <div className="flex-shrink-0 border-b border-brand-border px-6 py-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowHistory(!showHistory)}
              className="p-2 rounded-lg hover:bg-white/5 text-text-muted hover:text-text-primary transition-colors"
              title={showHistory ? 'Hide history' : 'Show conversations'}
            >
              {showHistory ? <ChevronLeft className="w-5 h-5" /> : <MessageSquare className="w-5 h-5" />}
            </button>
            <div className="w-10 h-10 bg-brand-yellow/10 rounded-xl flex items-center justify-center">
              <Bot className="w-5 h-5 text-brand-yellow" />
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-lg font-semibold text-text-primary">
                Pharma Planning Assistant
              </h1>
              <p className="text-xs text-text-muted truncate">
                Powered by Master Agent + 7 Worker Agents (IQVIA, EXIM, Patent, Clinical Trials, Internal, Web Intel, Report)
              </p>
            </div>
            {uploadedFiles.length > 0 && (
              <div className="flex items-center gap-2 text-xs text-text-muted flex-shrink-0">
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
                <ChatProgress
                  agentsNeeded={activeAgents.agentsNeeded}
                  agentNames={activeAgents.agentNames}
                  agentProgress={agentProgress}
                />
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
    </div>
  );
};

export default Chat;
