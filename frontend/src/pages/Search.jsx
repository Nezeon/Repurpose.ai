import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Sparkles, Dna } from 'lucide-react';
import useAppStore from '../store';
import { useWebSocket } from '../hooks/useWebSocket';
import { searchDrug } from '../services/api';
import { generateSessionId } from '../utils/helpers';
import { ROUTES } from '../utils/constants';
import { SearchBox, SearchProgress } from '../components/search';
import Card from '../components/common/Card';

const Search = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialDrug = searchParams.get('drug') || '';

  const [drugName, setDrugName] = useState(initialDrug);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState(null);
  const [sessionId, setSessionId] = useState(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  const startTimeRef = useRef(null);
  const timerRef = useRef(null);

  const {
    setSearchResults,
    addToHistory,
    searchHistory,
  } = useAppStore();

  // WebSocket connection
  const {
    connected,
    agentProgress,
    workflowStatus,
    resetProgress,
  } = useWebSocket(sessionId, {
    autoConnect: !!sessionId,
  });

  // Timer for elapsed time
  useEffect(() => {
    if (isSearching && startTimeRef.current) {
      timerRef.current = setInterval(() => {
        setElapsedTime((Date.now() - startTimeRef.current) / 1000);
      }, 100);
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [isSearching]);

  // Auto-submit if drug param provided
  useEffect(() => {
    if (initialDrug && !isSearching) {
      handleSearch(initialDrug);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSearch = async (drug) => {
    if (!drug.trim() || isSearching) return;

    const newSessionId = generateSessionId();
    setSessionId(newSessionId);
    setIsSearching(true);
    setError(null);
    resetProgress();
    startTimeRef.current = Date.now();
    setElapsedTime(0);

    try {
      const results = await searchDrug(drug.trim(), {
        sessionId: newSessionId,
        forceRefresh: false,
      });

      setSearchResults(results);

      // Add to history
      addToHistory({
        drugName: drug.trim(),
        timestamp: new Date().toISOString(),
        opportunityCount: results.enhanced_indications?.length || results.ranked_indications?.length || 0,
        cached: results.cached || false,
      });

      // Navigate to results
      navigate(`${ROUTES.RESULTS}/${encodeURIComponent(drug.trim())}`);
    } catch (err) {
      console.error('Search error:', err);
      setError(err.message || 'Search failed. Please try again.');
    } finally {
      setIsSearching(false);
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-8"
      >
        <div className="inline-flex items-center justify-center w-16 h-16 bg-brand-yellow/10 rounded-2xl mb-4">
          <Dna className="w-8 h-8 text-brand-yellow" />
        </div>
        <h1 className="text-3xl font-bold text-text-primary mb-2">
          Drug Repurposing Analysis
        </h1>
        <p className="text-text-secondary max-w-lg mx-auto">
          Enter a drug name to discover potential new therapeutic indications
          using AI-powered analysis of scientific literature, clinical trials,
          and bioactivity data.
        </p>
      </motion.div>

      {/* Search box */}
      {!isSearching && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <SearchBox
            value={drugName}
            onChange={(e) => setDrugName(e.target.value)}
            onSubmit={handleSearch}
            loading={isSearching}
            placeholder="Enter drug name (e.g., Metformin, Aspirin, Ibuprofen)..."
            recentSearches={searchHistory}
          />

          {error && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="mt-4 p-4 bg-error/10 border border-error/30 rounded-xl text-error text-center"
            >
              {error}
            </motion.div>
          )}
        </motion.div>
      )}

      {/* Search progress */}
      {isSearching && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          <SearchProgress
            drugName={drugName}
            agentProgress={agentProgress}
            workflowStatus={workflowStatus}
            elapsedTime={elapsedTime}
          />
        </motion.div>
      )}

      {/* Info cards */}
      {!isSearching && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mt-12 grid md:grid-cols-3 gap-4"
        >
          <Card className="p-5">
            <div className="w-10 h-10 bg-info/20 rounded-xl flex items-center justify-center mb-3">
              <Sparkles className="w-5 h-5 text-info" />
            </div>
            <h3 className="font-semibold text-text-primary mb-1">15+ Data Sources</h3>
            <p className="text-sm text-text-secondary">
              Aggregates evidence from PubMed, ClinicalTrials.gov, ChEMBL, FDA, and more.
            </p>
          </Card>

          <Card className="p-5">
            <div className="w-10 h-10 bg-success/20 rounded-xl flex items-center justify-center mb-3">
              <Sparkles className="w-5 h-5 text-success" />
            </div>
            <h3 className="font-semibold text-text-primary mb-1">AI-Powered Scoring</h3>
            <p className="text-sm text-text-secondary">
              Multi-dimensional analysis covering scientific evidence, market, competition, and feasibility.
            </p>
          </Card>

          <Card className="p-5">
            <div className="w-10 h-10 bg-warning/20 rounded-xl flex items-center justify-center mb-3">
              <Sparkles className="w-5 h-5 text-warning" />
            </div>
            <h3 className="font-semibold text-text-primary mb-1">Actionable Insights</h3>
            <p className="text-sm text-text-secondary">
              Get key strengths, risks, and recommended next steps for each opportunity.
            </p>
          </Card>
        </motion.div>
      )}
    </div>
  );
};

export default Search;
