import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Bot, User, ChevronDown, ChevronUp, Download, Table2, BarChart3, AlertCircle } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import TableRenderer from './TableRenderer';
import ChartRenderer from './ChartRenderer';
import SuggestedQueries from './SuggestedQueries';
import { API_BASE_URL } from '../../config/api';

const MessageBubble = ({ message, onSuggestionClick }) => {
  const isUser = message.role === 'user';
  const [expandedTables, setExpandedTables] = useState({});

  const toggleTable = (idx) => {
    setExpandedTables(prev => ({ ...prev, [idx]: !prev[idx] }));
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={`flex items-start gap-3 ${isUser ? 'flex-row-reverse' : ''}`}
    >
      {/* Avatar */}
      <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
        isUser
          ? 'bg-brand-teal/10'
          : message.isError
            ? 'bg-red-500/10'
            : 'bg-brand-yellow/10'
      }`}>
        {isUser ? (
          <User className="w-4 h-4 text-brand-teal" />
        ) : message.isError ? (
          <AlertCircle className="w-4 h-4 text-red-400" />
        ) : (
          <Bot className="w-4 h-4 text-brand-yellow" />
        )}
      </div>

      {/* Message Content */}
      <div className={`max-w-[85%] space-y-3 ${isUser ? 'items-end' : 'items-start'}`}>
        {/* Text bubble */}
        <div className={`rounded-xl px-4 py-3 ${
          isUser
            ? 'bg-brand-teal/10 border border-brand-teal/20'
            : message.isError
              ? 'bg-red-500/10 border border-red-500/20'
              : 'bg-brand-slate border border-brand-border'
        }`}>
          <div className="prose prose-invert prose-sm max-w-none">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                p: ({ children }) => <p className="text-sm text-text-primary mb-2 last:mb-0">{children}</p>,
                strong: ({ children }) => <strong className="text-brand-yellow font-semibold">{children}</strong>,
                a: ({ href, children }) => (
                  <a href={href} target="_blank" rel="noopener noreferrer" className="text-brand-teal hover:underline">
                    {children}
                  </a>
                ),
                ul: ({ children }) => <ul className="list-disc pl-4 space-y-1 text-sm text-text-secondary">{children}</ul>,
                ol: ({ children }) => <ol className="list-decimal pl-4 space-y-1 text-sm text-text-secondary">{children}</ol>,
                li: ({ children }) => <li className="text-sm text-text-secondary">{children}</li>,
                h1: ({ children }) => <h1 className="text-lg font-bold text-text-primary mt-3 mb-1">{children}</h1>,
                h2: ({ children }) => <h2 className="text-base font-semibold text-text-primary mt-3 mb-1">{children}</h2>,
                h3: ({ children }) => <h3 className="text-sm font-semibold text-text-primary mt-2 mb-1">{children}</h3>,
                code: ({ children }) => <code className="bg-brand-darker px-1.5 py-0.5 rounded text-xs font-mono text-brand-teal">{children}</code>,
                table: ({ children }) => (
                  <div className="overflow-x-auto my-2">
                    <table className="min-w-full text-xs border border-brand-border">{children}</table>
                  </div>
                ),
                th: ({ children }) => <th className="px-3 py-2 bg-brand-darker text-left text-text-primary font-semibold border-b border-brand-border">{children}</th>,
                td: ({ children }) => <td className="px-3 py-2 text-text-secondary border-b border-brand-border/50">{children}</td>,
              }}
            >
              {message.content}
            </ReactMarkdown>
          </div>
        </div>

        {/* Agent Activities */}
        {message.agent_activities && message.agent_activities.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {message.agent_activities.map((activity, idx) => (
              <div key={idx} className="flex items-center gap-1.5 px-2.5 py-1 bg-brand-darker rounded-full text-xs">
                <div className={`w-1.5 h-1.5 rounded-full ${
                  activity.status === 'done' ? 'bg-green-400' :
                  activity.status === 'working' ? 'bg-brand-yellow animate-pulse' :
                  activity.status === 'error' ? 'bg-red-400' : 'bg-text-muted'
                }`} />
                <span className="text-text-secondary">{activity.agent_name}</span>
              </div>
            ))}
          </div>
        )}

        {/* Tables */}
        {message.tables && message.tables.length > 0 && (
          <div className="space-y-2">
            {message.tables.map((table, idx) => (
              <div key={idx} className="bg-brand-slate border border-brand-border rounded-xl overflow-hidden">
                <button
                  onClick={() => toggleTable(idx)}
                  className="w-full flex items-center justify-between px-4 py-2.5 hover:bg-white/5 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <Table2 className="w-4 h-4 text-brand-teal" />
                    <span className="text-sm font-medium text-text-primary">
                      {table.title || `Table ${idx + 1}`}
                    </span>
                    <span className="text-xs text-text-muted">
                      ({table.rows?.length || 0} rows)
                    </span>
                  </div>
                  {expandedTables[idx] ? (
                    <ChevronUp className="w-4 h-4 text-text-muted" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-text-muted" />
                  )}
                </button>
                {expandedTables[idx] !== false && (
                  <TableRenderer table={table} />
                )}
              </div>
            ))}
          </div>
        )}

        {/* Charts */}
        {message.charts && message.charts.length > 0 && (
          <div className="space-y-2">
            {message.charts.map((chart, idx) => (
              <div key={idx} className="bg-brand-slate border border-brand-border rounded-xl p-4">
                <div className="flex items-center gap-2 mb-3">
                  <BarChart3 className="w-4 h-4 text-brand-yellow" />
                  <span className="text-sm font-medium text-text-primary">
                    {chart.title || `Chart ${idx + 1}`}
                  </span>
                </div>
                <ChartRenderer chart={chart} />
              </div>
            ))}
          </div>
        )}

        {/* Report Downloads */}
        {(message.pdf_url || message.excel_url) && (
          <div className="flex flex-wrap gap-2">
            {message.pdf_url && (
              <a
                href={`${API_BASE_URL}${message.pdf_url}`}
                download
                className="flex items-center gap-2 px-4 py-2.5 bg-brand-yellow/10 border border-brand-yellow/20 rounded-xl hover:bg-brand-yellow/20 transition-colors"
              >
                <Download className="w-4 h-4 text-brand-yellow" />
                <span className="text-sm font-medium text-brand-yellow">Download PDF Report</span>
              </a>
            )}
            {message.excel_url && (
              <a
                href={`${API_BASE_URL}${message.excel_url}`}
                download
                className="flex items-center gap-2 px-4 py-2.5 bg-green-500/10 border border-green-500/20 rounded-xl hover:bg-green-500/20 transition-colors"
              >
                <Download className="w-4 h-4 text-green-400" />
                <span className="text-sm font-medium text-green-400">Download Excel Report</span>
              </a>
            )}
          </div>
        )}

        {/* Suggested Follow-ups */}
        {message.suggestions && message.suggestions.length > 0 && !message.role === 'user' && (
          <SuggestedQueries
            suggestions={message.suggestions}
            onSelect={onSuggestionClick}
            compact
          />
        )}
        {message.suggestions && message.suggestions.length > 0 && message.role === 'assistant' && (
          <SuggestedQueries
            suggestions={message.suggestions}
            onSelect={onSuggestionClick}
            compact
          />
        )}
      </div>
    </motion.div>
  );
};

export default MessageBubble;
