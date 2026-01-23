/**
 * Main App Component
 * Drug Repurposing Platform - Multi-Agent AI Discovery System
 * EY Healthcare Theme
 */

import React, { useState, useEffect } from 'react';
import { AlertCircle, BookOpen, Stethoscope, FlaskConical, Dna, Sparkles } from 'lucide-react';
import Layout from './components/layout/Layout';
import SearchBar from './components/search/SearchBar';
import AgentProgress from './components/agents/AgentProgress';
import ResultsDashboard from './components/results/ResultsDashboard';
import ChatPanel from './components/chat/ChatPanel';
import { saveToHistory } from './components/history/SearchHistory';
import useAppStore from './store';
import { searchDrug } from './services/api';
import useWebSocket from './hooks/useWebSocket';

function App() {
  const {
    searchResults,
    setSearchResults,
    isSearching,
    setIsSearching,
    searchError,
    setSearchError,
    sessionId,
    setSessionId,
    drugName,
    setDrugName,
    reset,
  } = useAppStore();

  // Track if we should show agent progress
  const [showAgentProgress, setShowAgentProgress] = useState(false);
  const [isReanalyzing, setIsReanalyzing] = useState(false);

  // WebSocket for real-time progress
  const {
    connected: wsConnected,
    agentProgress,
    resetProgress,
  } = useWebSocket(sessionId, {
    autoConnect: false,
    reconnect: true,
    onConnect: () => {
      console.log('[App] WebSocket connected for session:', sessionId);
    },
    onMessage: (data) => {
      console.log('[App] WebSocket message:', data);
    },
  });

  // Handle search submission
  const handleSearch = async (searchDrugName) => {
    try {
      // Reset state
      reset();
      resetProgress();
      setSearchError(null);
      setIsSearching(true);
      setDrugName(searchDrugName);
      setShowAgentProgress(true);

      // Generate session ID
      const newSessionId = `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      setSessionId(newSessionId);

      console.log('[App] Starting search for:', searchDrugName);

      // Call search API
      const results = await searchDrug(searchDrugName, {
        sessionId: newSessionId,
        forceRefresh: false,
      });

      console.log('[App] Search results received:', results);

      // Update results
      setSearchResults(results);
      setIsSearching(false);

      // Save to history
      saveToHistory(results);

      // Keep agent progress visible for a moment
      setTimeout(() => {
        setShowAgentProgress(false);
      }, 2000);

    } catch (error) {
      console.error('[App] Search failed:', error);
      setSearchError(error.message);
      setIsSearching(false);
      setShowAgentProgress(false);
    }
  };

  // Handle re-analyze (force refresh from cache)
  const handleReanalyze = async (searchDrugName) => {
    try {
      // Don't reset results, just show we're re-analyzing
      setIsReanalyzing(true);
      setSearchError(null);
      resetProgress();
      setShowAgentProgress(true);

      // Generate new session ID
      const newSessionId = `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      setSessionId(newSessionId);

      console.log('[App] Re-analyzing with force refresh:', searchDrugName);

      // Call search API with force refresh
      const results = await searchDrug(searchDrugName, {
        sessionId: newSessionId,
        forceRefresh: true,  // Force bypass cache
      });

      console.log('[App] Re-analysis results received:', results);

      // Update results
      setSearchResults(results);
      setIsReanalyzing(false);

      // Save to history
      saveToHistory(results);

      // Keep agent progress visible for a moment
      setTimeout(() => {
        setShowAgentProgress(false);
      }, 2000);

    } catch (error) {
      console.error('[App] Re-analysis failed:', error);
      setSearchError(error.message);
      setIsReanalyzing(false);
      setShowAgentProgress(false);
    }
  };

  // Handle selection from history
  const handleHistorySelect = (historyItem) => {
    console.log('[App] Selected history item:', historyItem);

    // Re-run the search for the drug
    handleSearch(historyItem.drug_name);
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      reset();
    };
  }, []);

  return (
    <Layout onSelectHistoryItem={handleHistorySelect}>
      {/* Hero Section */}
      <div className="text-center mb-12 animate-fade-in">
        {/* Decorative element */}
        <div className="flex justify-center mb-6">
          <div className="relative">
            <div className="absolute inset-0 bg-brand-yellow/20 rounded-full blur-2xl scale-150" />
            <div className="relative flex items-center gap-2 px-4 py-2 bg-brand-yellow/10 border border-brand-yellow/30 rounded-full">
              <Sparkles className="w-4 h-4 text-brand-yellow" />
              <span className="text-sm font-medium text-brand-yellow">AI-Powered Discovery</span>
            </div>
          </div>
        </div>

        <h2 className="text-4xl md:text-6xl font-bold mb-6">
          <span className="text-white">Discover New </span>
          <span className="text-gradient">Indications</span>
        </h2>

        <p className="text-xl text-gray-400 max-w-3xl mx-auto leading-relaxed">
          Harness the power of <span className="text-brand-yellow font-semibold">5 AI agents</span> to analyze
          millions of scientific papers, clinical trials, and molecular data in seconds
        </p>
      </div>

      {/* Search Bar */}
      <SearchBar
        onSearch={handleSearch}
        isSearching={isSearching}
      />

      {/* Error Message */}
      {searchError && (
        <div className="max-w-4xl mx-auto mt-6 p-4 bg-red-500/10 border border-red-500/30 rounded-xl flex items-start space-x-3 animate-slide-up">
          <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <h3 className="font-semibold text-red-400 mb-1">Search Failed</h3>
            <p className="text-red-300/80">{searchError}</p>
          </div>
        </div>
      )}

      {/* Agent Progress */}
      {(isSearching || isReanalyzing || showAgentProgress) && (
        <AgentProgress
          agentProgress={agentProgress}
          show={true}
        />
      )}

      {/* Results Dashboard */}
      {searchResults && !isSearching && (
        <div className="mt-8">
          <ResultsDashboard
            results={searchResults}
            onReanalyze={handleReanalyze}
            isReanalyzing={isReanalyzing}
          />
        </div>
      )}

      {/* Empty State - Feature Cards */}
      {!searchResults && !isSearching && !searchError && (
        <div className="text-center mt-16 animate-fade-in">
          <div className="max-w-4xl mx-auto">
            <h3 className="text-2xl font-semibold text-white mb-2">
              Start Your Discovery Journey
            </h3>
            <p className="text-gray-400 mb-8">
              Our AI agents search across multiple data sources simultaneously
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Literature Card */}
              <div className="group p-6 bg-brand-charcoal rounded-2xl border border-white/10 hover:border-brand-yellow/30 transition-all duration-300">
                <div className="mb-4 p-3 bg-blue-500/10 rounded-xl w-fit group-hover:bg-blue-500/20 transition-colors">
                  <BookOpen className="w-6 h-6 text-blue-400" />
                </div>
                <h4 className="font-semibold text-white mb-2">Literature</h4>
                <p className="text-sm text-gray-400">
                  PubMed articles & research papers
                </p>
              </div>

              {/* Clinical Trials Card */}
              <div className="group p-6 bg-brand-charcoal rounded-2xl border border-white/10 hover:border-brand-yellow/30 transition-all duration-300">
                <div className="mb-4 p-3 bg-health-teal/10 rounded-xl w-fit group-hover:bg-health-teal/20 transition-colors">
                  <Stethoscope className="w-6 h-6 text-health-teal" />
                </div>
                <h4 className="font-semibold text-white mb-2">Clinical Trials</h4>
                <p className="text-sm text-gray-400">
                  ClinicalTrials.gov registry
                </p>
              </div>

              {/* Bioactivity Card */}
              <div className="group p-6 bg-brand-charcoal rounded-2xl border border-white/10 hover:border-brand-yellow/30 transition-all duration-300">
                <div className="mb-4 p-3 bg-purple-500/10 rounded-xl w-fit group-hover:bg-purple-500/20 transition-colors">
                  <FlaskConical className="w-6 h-6 text-purple-400" />
                </div>
                <h4 className="font-semibold text-white mb-2">Bioactivity</h4>
                <p className="text-sm text-gray-400">
                  ChEMBL molecular data
                </p>
              </div>

              {/* Patents Card */}
              <div className="group p-6 bg-brand-charcoal rounded-2xl border border-white/10 hover:border-brand-yellow/30 transition-all duration-300">
                <div className="mb-4 p-3 bg-brand-yellow/10 rounded-xl w-fit group-hover:bg-brand-yellow/20 transition-colors">
                  <Dna className="w-6 h-6 text-brand-yellow" />
                </div>
                <h4 className="font-semibold text-white mb-2">Patents</h4>
                <p className="text-sm text-gray-400">
                  Lens.org patent database
                </p>
              </div>
            </div>

            {/* Stats */}
            <div className="mt-12 grid grid-cols-3 gap-8 max-w-2xl mx-auto">
              <div className="text-center">
                <div className="text-3xl font-bold text-gradient mb-1">5</div>
                <div className="text-sm text-gray-500">AI Agents</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-gradient mb-1">30M+</div>
                <div className="text-sm text-gray-500">Articles Indexed</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-gradient mb-1">&lt;60s</div>
                <div className="text-sm text-gray-500">Analysis Time</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Chat Panel - Floating Q&A interface */}
      <ChatPanel />
    </Layout>
  );
}

export default App;
