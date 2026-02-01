/**
 * Layout Component
 * Main layout wrapper for the application - EY Healthcare Theme
 */

import React, { useState, useEffect } from 'react';
import { FlaskConical, Github, Info, Zap, Activity, History, LogIn } from 'lucide-react';
import SearchHistory from '../history/SearchHistory';
import AuthModal from '../auth/AuthModal';
import UserMenu from '../auth/UserMenu';
import { isAuthenticated, getStoredUser } from '../../services/auth';

const Layout = ({ children, onSelectHistoryItem }) => {
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [user, setUser] = useState(getStoredUser());

  // Listen for auth changes
  useEffect(() => {
    const handleAuthLogout = () => {
      setUser(null);
    };

    window.addEventListener('auth:logout', handleAuthLogout);
    return () => window.removeEventListener('auth:logout', handleAuthLogout);
  }, []);

  const handleAuthSuccess = () => {
    setUser(getStoredUser());
  };

  const handleLogout = () => {
    setUser(null);
  };

  const handleSelectSearch = (historyItem) => {
    setIsHistoryOpen(false);
    if (onSelectHistoryItem) {
      onSelectHistoryItem(historyItem);
    }
  };

  return (
    <div className="min-h-screen bg-brand-dark">
      {/* Animated background gradient */}
      <div className="fixed inset-0 bg-gradient-hero animate-gradient opacity-50 pointer-events-none" />

      {/* Header */}
      <header className="relative bg-brand-darker/80 backdrop-blur-xl border-b border-white/10 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            {/* Logo and Title */}
            <div className="flex items-center space-x-4">
              {/* Logo icon */}
              <div className="relative">
                <div className="absolute inset-0 bg-brand-yellow/20 rounded-xl blur-xl" />
                <div className="relative bg-gradient-to-br from-brand-yellow to-brand-gold p-2.5 rounded-xl shadow-glow-yellow">
                  <FlaskConical className="w-8 h-8 text-brand-dark" />
                </div>
              </div>

              {/* Title */}
              <div>
                <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                  Repurpose
                  <span className="text-gradient">.AI</span>
                </h1>
                <p className="text-sm text-gray-400 flex items-center gap-1.5">
                  <Activity className="w-3.5 h-3.5 text-health-teal" />
                  Multi-Agent AI Discovery System
                </p>
              </div>
            </div>

            {/* Right side nav */}
            <div className="flex items-center space-x-2">
              {/* Live indicator */}
              <div className="hidden md:flex items-center space-x-2 px-3 py-1.5 bg-health-green/10 border border-health-green/30 rounded-full mr-4">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-health-green opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-health-green"></span>
                </span>
                <span className="text-sm text-health-green font-medium">Live</span>
              </div>

              {/* History button */}
              <button
                className="flex items-center space-x-2 px-4 py-2 text-gray-400 hover:text-brand-yellow
                         hover:bg-white/5 rounded-lg transition-all duration-200"
                onClick={() => setIsHistoryOpen(true)}
              >
                <History className="w-5 h-5" />
                <span className="hidden md:inline text-sm font-medium">History</span>
              </button>

              <button
                className="flex items-center space-x-2 px-4 py-2 text-gray-400 hover:text-brand-yellow
                         hover:bg-white/5 rounded-lg transition-all duration-200"
                onClick={() => window.open('/docs', '_blank')}
              >
                <Info className="w-5 h-5" />
                <span className="hidden md:inline text-sm font-medium">API Docs</span>
              </button>

              <button
                className="flex items-center space-x-2 px-4 py-2 text-gray-400 hover:text-brand-yellow
                         hover:bg-white/5 rounded-lg transition-all duration-200"
                onClick={() => window.open('https://github.com/Nezeon/Repurpose.ai', '_blank')}
              >
                <Github className="w-5 h-5" />
                <span className="hidden md:inline text-sm font-medium">GitHub</span>
              </button>

              {/* Auth button or User menu */}
              {user ? (
                <UserMenu onLogout={handleLogout} />
              ) : (
                <button
                  onClick={() => setIsAuthModalOpen(true)}
                  className="flex items-center space-x-2 px-4 py-2 bg-brand-yellow/10 hover:bg-brand-yellow/20
                           text-brand-yellow border border-brand-yellow/30 rounded-lg transition-all duration-200"
                >
                  <LogIn className="w-4 h-4" />
                  <span className="text-sm font-medium">Sign In</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative container mx-auto px-4 py-8">
        {children}
      </main>

      {/* Footer */}
      <footer className="relative bg-brand-darker/80 backdrop-blur-xl border-t border-white/10 mt-16">
        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            {/* Left side */}
            <div className="flex items-center space-x-3">
              <div className="bg-gradient-to-br from-brand-yellow to-brand-gold p-1.5 rounded-lg">
                <FlaskConical className="w-5 h-5 text-brand-dark" />
              </div>
              <span className="text-gray-400 text-sm">
                © 2025 Repurpose.AI - Accelerating Drug Discovery
              </span>
            </div>

            {/* Right side - Tech stack */}
            <div className="flex items-center space-x-4">
              <span className="text-gray-500 text-sm">Powered by</span>
              <div className="flex items-center space-x-3">
                <span className="px-3 py-1 bg-white/5 border border-white/10 rounded-full text-xs font-medium text-gray-300">
                  LangGraph
                </span>
                <span className="px-3 py-1 bg-white/5 border border-white/10 rounded-full text-xs font-medium text-gray-300">
                  Gemini AI
                </span>
                <span className="px-3 py-1 bg-brand-yellow/10 border border-brand-yellow/30 rounded-full text-xs font-medium text-brand-yellow flex items-center gap-1">
                  <Zap className="w-3 h-3" />
                  5 AI Agents
                </span>
              </div>
            </div>
          </div>
        </div>
      </footer>

      {/* Search History Panel */}
      <SearchHistory
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        onSelectSearch={handleSelectSearch}
      />

      {/* Auth Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onAuthSuccess={handleAuthSuccess}
      />
    </div>
  );
};

export default Layout;
