import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  Search, MessageSquare, LayoutDashboard, Clock, Bookmark,
  FileText, Settings, Plug, Sparkles, ArrowRight, Command,
  CornerDownLeft, ArrowUp, ArrowDown, Hash, Dna, Download,
  Trash2, Plus, Zap,
} from 'lucide-react';
import useAppStore from '../../store';
import { ROUTES } from '../../utils/constants';
import { formatDrugName, formatTimeAgo } from '../../utils/formatters';

const CommandPalette = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const inputRef = useRef(null);
  const listRef = useRef(null);
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const { searchHistory, savedOpportunities } = useAppStore();

  // Build command items
  const allItems = useMemo(() => {
    const pages = [
      { id: 'nav-chat', type: 'page', label: 'AI Assistant', description: 'Chat with agents', icon: MessageSquare, action: () => navigate(ROUTES.CHAT) },
      { id: 'nav-dashboard', type: 'page', label: 'Dashboard', description: 'Overview & stats', icon: LayoutDashboard, action: () => navigate(ROUTES.DASHBOARD) },
      { id: 'nav-search', type: 'page', label: 'New Drug Search', description: 'Run full pipeline analysis', icon: Search, action: () => navigate(ROUTES.SEARCH) },
      { id: 'nav-history', type: 'page', label: 'Search History', description: 'Past searches & reports', icon: Clock, action: () => navigate(ROUTES.HISTORY) },
      { id: 'nav-saved', type: 'page', label: 'Saved Opportunities', description: 'Bookmarked items', icon: Bookmark, action: () => navigate(ROUTES.SAVED) },
      { id: 'nav-integrations', type: 'page', label: 'Integrations', description: 'Data source config', icon: Plug, action: () => navigate(ROUTES.INTEGRATIONS) },
      { id: 'nav-settings', type: 'page', label: 'Settings', description: 'Preferences', icon: Settings, action: () => navigate(ROUTES.SETTINGS) },
    ];

    const actions = [
      { id: 'action-new-search', type: 'action', label: 'Analyze a Drug', description: 'Start a new drug analysis', icon: Sparkles, action: () => navigate(ROUTES.SEARCH) },
      { id: 'action-new-chat', type: 'action', label: 'New Conversation', description: 'Start fresh AI chat', icon: Plus, action: () => navigate(ROUTES.CHAT) },
    ];

    const recentSearches = (searchHistory || []).slice(0, 5).map((s, i) => ({
      id: `search-${i}`,
      type: 'recent',
      label: formatDrugName(s.drugName),
      description: `${s.opportunityCount || 0} opportunities • ${formatTimeAgo(s.timestamp)}`,
      icon: Dna,
      action: () => navigate(`${ROUTES.RESULTS}/${encodeURIComponent(s.drugName)}`),
    }));

    const saved = (savedOpportunities || []).slice(0, 5).map((s, i) => ({
      id: `saved-${i}`,
      type: 'saved',
      label: `${s.indication || s.name}`,
      description: `${formatDrugName(s.drugName || '')} • Score: ${s.compositeScore || s.score || '—'}`,
      icon: Bookmark,
      action: () => navigate(ROUTES.SAVED),
    }));

    return [...actions, ...pages, ...recentSearches, ...saved];
  }, [searchHistory, savedOpportunities, navigate]);

  // Filter items
  const filteredItems = useMemo(() => {
    if (!query.trim()) return allItems;
    const q = query.toLowerCase();
    return allItems.filter(
      item => item.label.toLowerCase().includes(q) || item.description.toLowerCase().includes(q)
    );
  }, [query, allItems]);

  // Group items
  const groupedItems = useMemo(() => {
    const groups = {};
    for (const item of filteredItems) {
      const group = item.type === 'page' ? 'Pages' :
                    item.type === 'action' ? 'Actions' :
                    item.type === 'recent' ? 'Recent Searches' :
                    item.type === 'saved' ? 'Saved Items' : 'Other';
      if (!groups[group]) groups[group] = [];
      groups[group].push(item);
    }
    return groups;
  }, [filteredItems]);

  // Flatten for keyboard navigation
  const flatItems = useMemo(() => {
    return Object.values(groupedItems).flat();
  }, [groupedItems]);

  // Reset state when opened
  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  // Keyboard navigation
  const handleKeyDown = useCallback((e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(i => Math.min(i + 1, flatItems.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(i => Math.max(i - 1, 0));
    } else if (e.key === 'Enter' && flatItems[selectedIndex]) {
      e.preventDefault();
      flatItems[selectedIndex].action();
      onClose();
    } else if (e.key === 'Escape') {
      onClose();
    }
  }, [flatItems, selectedIndex, onClose]);

  // Scroll selected item into view
  useEffect(() => {
    const el = listRef.current?.querySelector(`[data-index="${selectedIndex}"]`);
    el?.scrollIntoView({ block: 'nearest' });
  }, [selectedIndex]);

  if (!isOpen) return null;

  const typeLabels = { action: 'Actions', page: 'Pages', recent: 'Recent Searches', saved: 'Saved Items' };

  let globalIndex = -1;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100]"
          />

          {/* Palette */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -20 }}
            transition={{ duration: 0.15 }}
            className="fixed top-[15%] left-1/2 -translate-x-1/2 w-full max-w-2xl z-[101]"
          >
            <div className="bg-brand-slate border border-brand-border rounded-2xl shadow-2xl overflow-hidden">
              {/* Search input */}
              <div className="flex items-center gap-3 px-5 py-4 border-b border-brand-border">
                <Search className="w-5 h-5 text-text-muted flex-shrink-0" />
                <input
                  ref={inputRef}
                  value={query}
                  onChange={(e) => { setQuery(e.target.value); setSelectedIndex(0); }}
                  onKeyDown={handleKeyDown}
                  placeholder="Search pages, drugs, actions..."
                  className="flex-1 bg-transparent text-text-primary placeholder:text-text-muted outline-none text-base"
                  autoComplete="off"
                  spellCheck={false}
                />
                <kbd className="hidden sm:inline-flex items-center px-2 py-0.5 rounded bg-brand-darker border border-brand-border text-[10px] text-text-muted font-mono">
                  ESC
                </kbd>
              </div>

              {/* Results */}
              <div ref={listRef} className="max-h-[400px] overflow-y-auto py-2">
                {flatItems.length === 0 ? (
                  <div className="px-5 py-8 text-center text-text-muted text-sm">
                    <Search className="w-8 h-8 mx-auto mb-2 opacity-30" />
                    <p>No results for "{query}"</p>
                  </div>
                ) : (
                  Object.entries(groupedItems).map(([group, items]) => (
                    <div key={group}>
                      <div className="px-5 py-1.5">
                        <span className="text-[10px] font-semibold text-text-muted tracking-widest uppercase">
                          {group}
                        </span>
                      </div>
                      {items.map((item) => {
                        globalIndex++;
                        const idx = globalIndex;
                        const isSelected = idx === selectedIndex;
                        const Icon = item.icon;
                        return (
                          <button
                            key={item.id}
                            data-index={idx}
                            onClick={() => { item.action(); onClose(); }}
                            onMouseEnter={() => setSelectedIndex(idx)}
                            className={`w-full flex items-center gap-3 px-5 py-2.5 text-left transition-colors ${
                              isSelected ? 'bg-brand-yellow/10 text-text-primary' : 'text-text-secondary hover:text-text-primary'
                            }`}
                          >
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                              isSelected ? 'bg-brand-yellow/20' : 'bg-brand-darker'
                            }`}>
                              <Icon className={`w-4 h-4 ${isSelected ? 'text-brand-yellow' : ''}`} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium truncate">{item.label}</p>
                              <p className="text-xs text-text-muted truncate">{item.description}</p>
                            </div>
                            {isSelected && (
                              <div className="flex items-center gap-1 text-text-muted flex-shrink-0">
                                <CornerDownLeft className="w-3.5 h-3.5" />
                              </div>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  ))
                )}
              </div>

              {/* Footer */}
              <div className="px-5 py-2.5 border-t border-brand-border flex items-center gap-4 text-[10px] text-text-muted">
                <span className="flex items-center gap-1">
                  <ArrowUp className="w-3 h-3" /><ArrowDown className="w-3 h-3" /> Navigate
                </span>
                <span className="flex items-center gap-1">
                  <CornerDownLeft className="w-3 h-3" /> Open
                </span>
                <span className="flex items-center gap-1">
                  ESC Close
                </span>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default CommandPalette;
