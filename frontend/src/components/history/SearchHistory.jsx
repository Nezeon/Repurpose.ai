/**
 * SearchHistory Component
 * Displays and manages history of previous searches
 * EY Healthcare Theme
 */

import React, { useState, useEffect } from 'react';
import { History, Trash2, Clock, ChevronRight, X, Search, TrendingUp, Database } from 'lucide-react';

// History storage key
const HISTORY_KEY = 'repurpose_ai_search_history';
const MAX_HISTORY_ITEMS = 20;

// Get history from localStorage
export const getSearchHistory = () => {
  try {
    const history = localStorage.getItem(HISTORY_KEY);
    return history ? JSON.parse(history) : [];
  } catch (e) {
    console.error('Failed to load search history:', e);
    return [];
  }
};

// Save search to history
export const saveToHistory = (searchResult) => {
  try {
    const history = getSearchHistory();

    // Create history item
    const historyItem = {
      id: Date.now().toString(),
      drug_name: searchResult.drug_name,
      timestamp: new Date().toISOString(),
      indications_count: searchResult.ranked_indications?.length || 0,
      evidence_count: searchResult.all_evidence?.length || 0,
      top_indication: searchResult.ranked_indications?.[0]?.indication || 'N/A',
      top_score: searchResult.ranked_indications?.[0]?.confidence_score || 0,
      execution_time: searchResult.execution_time,
      // Store only essential data to keep localStorage small
      summary: {
        ranked_indications: searchResult.ranked_indications?.slice(0, 5).map(ind => ({
          indication: ind.indication,
          confidence_score: ind.confidence_score,
          evidence_count: ind.evidence_count,
          supporting_sources: ind.supporting_sources
        })),
        synthesis: searchResult.synthesis?.slice(0, 500) || ''
      }
    };

    // Remove existing entry for same drug (keep most recent)
    const filteredHistory = history.filter(
      item => item.drug_name.toLowerCase() !== searchResult.drug_name.toLowerCase()
    );

    // Add new item at the beginning
    const newHistory = [historyItem, ...filteredHistory].slice(0, MAX_HISTORY_ITEMS);

    localStorage.setItem(HISTORY_KEY, JSON.stringify(newHistory));
    return newHistory;
  } catch (e) {
    console.error('Failed to save search history:', e);
    return getSearchHistory();
  }
};

// Delete history item
export const deleteHistoryItem = (id) => {
  try {
    const history = getSearchHistory();
    const newHistory = history.filter(item => item.id !== id);
    localStorage.setItem(HISTORY_KEY, JSON.stringify(newHistory));
    return newHistory;
  } catch (e) {
    console.error('Failed to delete history item:', e);
    return getSearchHistory();
  }
};

// Clear all history
export const clearHistory = () => {
  try {
    localStorage.removeItem(HISTORY_KEY);
    return [];
  } catch (e) {
    console.error('Failed to clear history:', e);
    return getSearchHistory();
  }
};

const SearchHistory = ({ isOpen, onClose, onSelectSearch }) => {
  const [history, setHistory] = useState([]);
  const [searchFilter, setSearchFilter] = useState('');

  useEffect(() => {
    if (isOpen) {
      setHistory(getSearchHistory());
    }
  }, [isOpen]);

  const handleDelete = (id, e) => {
    e.stopPropagation();
    const newHistory = deleteHistoryItem(id);
    setHistory(newHistory);
  };

  const handleClearAll = () => {
    if (window.confirm('Are you sure you want to clear all search history?')) {
      const newHistory = clearHistory();
      setHistory(newHistory);
    }
  };

  const handleSelectItem = (item) => {
    if (onSelectSearch) {
      onSelectSearch(item);
    }
  };

  const filteredHistory = history.filter(item =>
    item.drug_name.toLowerCase().includes(searchFilter.toLowerCase())
  );

  const formatDate = (isoString) => {
    const date = new Date(isoString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  const getScoreColor = (score) => {
    if (score >= 80) return 'text-health-green';
    if (score >= 60) return 'text-health-teal';
    if (score >= 40) return 'text-brand-yellow';
    return 'text-red-400';
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="relative w-full max-w-md bg-brand-charcoal shadow-2xl h-full overflow-hidden flex flex-col animate-slide-left">
        {/* Header */}
        <div className="p-4 border-b border-white/10">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-brand-yellow/10 rounded-lg">
                <History className="w-5 h-5 text-brand-yellow" />
              </div>
              <h2 className="text-lg font-semibold text-white">Search History</h2>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Search filter */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input
              type="text"
              placeholder="Filter by drug name..."
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              className="w-full bg-brand-dark border border-white/10 rounded-lg pl-10 pr-4 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-brand-yellow/50"
            />
          </div>
        </div>

        {/* History List */}
        <div className="flex-1 overflow-y-auto p-4">
          {filteredHistory.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-500">
              <History className="w-12 h-12 mb-4 opacity-50" />
              <p className="text-center">
                {searchFilter ? 'No matching searches found' : 'No search history yet'}
              </p>
              <p className="text-sm mt-2 text-center">
                Your previous searches will appear here
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredHistory.map((item) => (
                <div
                  key={item.id}
                  onClick={() => handleSelectItem(item)}
                  className="bg-brand-dark/50 rounded-xl border border-white/5 p-4 cursor-pointer hover:border-brand-yellow/30 transition-all group"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-white truncate group-hover:text-brand-yellow transition-colors">
                        {item.drug_name}
                      </h3>
                      <p className="text-sm text-gray-400 mt-1 truncate">
                        Top: {item.top_indication}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 ml-2">
                      <span className={`text-lg font-bold ${getScoreColor(item.top_score)}`}>
                        {item.top_score?.toFixed(0) || '-'}
                      </span>
                      <button
                        onClick={(e) => handleDelete(item.id, e)}
                        className="p-1.5 text-gray-500 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 mt-3 text-xs text-gray-500">
                    <span className="flex items-center gap-1">
                      <TrendingUp className="w-3 h-3" />
                      {item.indications_count} opportunities
                    </span>
                    <span className="flex items-center gap-1">
                      <Database className="w-3 h-3" />
                      {item.evidence_count} evidence
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {formatDate(item.timestamp)}
                    </span>
                  </div>

                  <div className="flex items-center justify-end mt-2 text-xs text-brand-yellow opacity-0 group-hover:opacity-100 transition-opacity">
                    <span>View details</span>
                    <ChevronRight className="w-3 h-3 ml-1" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        {history.length > 0 && (
          <div className="p-4 border-t border-white/10">
            <button
              onClick={handleClearAll}
              className="w-full flex items-center justify-center gap-2 py-2 text-sm text-red-400 hover:bg-red-400/10 rounded-lg transition-colors"
            >
              <Trash2 className="w-4 h-4" />
              Clear All History
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default SearchHistory;
