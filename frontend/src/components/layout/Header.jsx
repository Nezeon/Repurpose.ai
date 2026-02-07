import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bell,
  ChevronRight,
  User,
  Settings,
  LogOut,
  Menu,
} from 'lucide-react';
import { cn } from '../../utils/helpers';
import { ROUTES } from '../../utils/constants';
import Button from '../common/Button';
import SearchInput from '../common/SearchInput';
import useAppStore from '../../store';

// Breadcrumb mapping
const pageTitles = {
  '/dashboard': { title: 'Dashboard', subtitle: 'Welcome back' },
  '/search': { title: 'New Search', subtitle: 'Discover drug repurposing opportunities' },
  '/results': { title: 'Analysis Results', subtitle: 'Detailed opportunity analysis' },
  '/history': { title: 'Search History', subtitle: 'Previous searches and results' },
  '/saved': { title: 'Saved Opportunities', subtitle: 'Your bookmarked opportunities' },
  '/integrations': { title: 'Integrations', subtitle: 'Connect external data sources' },
  '/settings': { title: 'Settings', subtitle: 'Manage your preferences' },
};

const Header = ({ onMenuClick }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [quickSearch, setQuickSearch] = useState('');
  const { user } = useAppStore();

  // Get current page info
  const currentPath = location.pathname.startsWith('/results')
    ? '/results'
    : location.pathname;
  const pageInfo = pageTitles[currentPath] || { title: 'Repurpose.AI', subtitle: '' };

  // Handle quick search
  const handleQuickSearch = (value) => {
    if (value.trim()) {
      navigate(`${ROUTES.SEARCH}?drug=${encodeURIComponent(value.trim())}`);
      setQuickSearch('');
    }
  };

  return (
    <header className="h-16 bg-brand-dark/80 backdrop-blur-sm border-b border-brand-border px-6 flex items-center justify-between sticky top-0 z-40">
      {/* Left section - Page title */}
      <div className="flex items-center gap-4">
        {/* Mobile menu button */}
        <button
          onClick={onMenuClick}
          className="lg:hidden p-2 text-text-secondary hover:text-text-primary hover:bg-white/5 rounded-lg transition-colors"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div>
          <div className="flex items-center gap-2 text-sm text-text-muted">
            <span>Home</span>
            <ChevronRight className="w-3 h-3" />
            <span className="text-text-secondary">{pageInfo.title}</span>
          </div>
          <h1 className="text-lg font-semibold text-text-primary">{pageInfo.title}</h1>
        </div>
      </div>

      {/* Center section - Quick search (hidden on mobile) */}
      <div className="hidden md:block flex-1 max-w-md mx-8">
        <SearchInput
          value={quickSearch}
          onChange={(e) => setQuickSearch(e.target.value)}
          onSubmit={handleQuickSearch}
          placeholder="Quick search drugs..."
          size="sm"
        />
      </div>

      {/* Right section - Actions */}
      <div className="flex items-center gap-3">
        {/* Notifications */}
        <Button variant="icon" className="relative">
          <Bell className="w-5 h-5" />
          <span className="absolute top-1 right-1 w-2 h-2 bg-brand-teal rounded-full" />
        </Button>

        {/* User menu */}
        <div className="relative">
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-white/5 transition-colors"
          >
            <div className="w-8 h-8 bg-brand-yellow/20 rounded-full flex items-center justify-center">
              <User className="w-4 h-4 text-brand-yellow" />
            </div>
            <span className="hidden sm:block text-sm font-medium text-text-primary">
              {user?.full_name || user?.username || 'User'}
            </span>
          </button>

          <AnimatePresence>
            {showUserMenu && (
              <>
                {/* Backdrop */}
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setShowUserMenu(false)}
                />

                {/* Dropdown */}
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  transition={{ duration: 0.15 }}
                  className="absolute right-0 mt-2 w-56 bg-brand-slate border border-brand-border rounded-xl shadow-lg overflow-hidden z-50"
                >
                  <div className="p-3 border-b border-brand-border">
                    <p className="font-medium text-text-primary">
                      {user?.full_name || 'Guest User'}
                    </p>
                    <p className="text-sm text-text-muted">
                      {user?.email || 'Sign in for full access'}
                    </p>
                  </div>

                  <div className="p-2">
                    <button
                      onClick={() => {
                        navigate(ROUTES.SETTINGS);
                        setShowUserMenu(false);
                      }}
                      className="w-full flex items-center gap-3 px-3 py-2 text-text-secondary hover:text-text-primary hover:bg-white/5 rounded-lg transition-colors"
                    >
                      <Settings className="w-4 h-4" />
                      <span>Settings</span>
                    </button>
                    <button
                      onClick={() => {
                        // Handle logout
                        setShowUserMenu(false);
                      }}
                      className="w-full flex items-center gap-3 px-3 py-2 text-error hover:bg-error/10 rounded-lg transition-colors"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Sign out</span>
                    </button>
                  </div>
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>
      </div>
    </header>
  );
};

export default Header;
