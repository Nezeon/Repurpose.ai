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
  Command,
  Sun,
  Moon,
} from 'lucide-react';
import { cn } from '../../utils/helpers';
import { ROUTES } from '../../utils/constants';
import Button from '../common/Button';
import SearchInput from '../common/SearchInput';
import NotificationCenter from '../common/NotificationCenter';
import Breadcrumbs from './Breadcrumbs';
import useAppStore from '../../store';

// Page title mapping
const pageTitles = {
  '/dashboard': 'Dashboard',
  '/search': 'Drug Search',
  '/results': 'Analysis Results',
  '/history': 'History',
  '/saved': 'Saved Opportunities',
  '/integrations': 'Integrations',
  '/settings': 'Settings',
  '/chat': 'AI Assistant',
  '/compare': 'Drug Comparison',
};

const Header = ({ onMenuClick }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [quickSearch, setQuickSearch] = useState('');
  const { user, theme, toggleTheme } = useAppStore();

  const currentPath = location.pathname.startsWith('/results')
    ? '/results'
    : location.pathname;
  const pageTitle = pageTitles[currentPath] || 'Repurpose.AI';

  const handleQuickSearch = (value) => {
    if (value.trim()) {
      navigate(`${ROUTES.SEARCH}?drug=${encodeURIComponent(value.trim())}`);
      setQuickSearch('');
    }
  };

  return (
    <header className="h-14 bg-brand-dark/80 backdrop-blur-sm border-b border-brand-border px-6 flex items-center justify-between sticky top-0 z-40">
      {/* Left section */}
      <div className="flex items-center gap-4">
        <button
          onClick={onMenuClick}
          className="lg:hidden p-2 text-text-secondary hover:text-text-primary hover:bg-white/5 rounded-lg transition-colors"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex flex-col">
          <Breadcrumbs />
          <h1 className="text-sm font-semibold text-text-primary leading-tight">{pageTitle}</h1>
        </div>
      </div>

      {/* Center - Ctrl+K hint (hidden on mobile) */}
      <div className="hidden md:flex flex-1 max-w-sm mx-8">
        <SearchInput
          value={quickSearch}
          onChange={(e) => setQuickSearch(e.target.value)}
          onSubmit={handleQuickSearch}
          placeholder="Quick search... (Ctrl+K)"
          size="sm"
        />
      </div>

      {/* Right section */}
      <div className="flex items-center gap-2">
        {/* Ctrl+K badge */}
        <button
          onClick={() => document.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', ctrlKey: true }))}
          className="hidden lg:flex items-center gap-1 px-2 py-1 text-[10px] text-text-muted bg-brand-darker border border-brand-border rounded-lg hover:border-brand-yellow/30 transition-colors"
          title="Command Palette"
        >
          <Command className="w-3 h-3" /> K
        </button>

        {/* Theme toggle */}
        <button
          onClick={toggleTheme}
          className="p-1.5 text-text-muted hover:text-text-primary hover:bg-white/5 rounded-lg transition-colors"
          title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
        >
          {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </button>

        {/* Notifications */}
        <NotificationCenter />

        {/* User menu */}
        <div className="relative">
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-white/5 transition-colors"
          >
            <div className="w-7 h-7 bg-brand-yellow/20 rounded-full flex items-center justify-center">
              <User className="w-3.5 h-3.5 text-brand-yellow" />
            </div>
            <span className="hidden sm:block text-xs font-medium text-text-primary">
              {user?.full_name || user?.username || 'User'}
            </span>
          </button>

          <AnimatePresence>
            {showUserMenu && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setShowUserMenu(false)}
                />
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  transition={{ duration: 0.15 }}
                  className="absolute right-0 mt-2 w-52 bg-brand-slate border border-brand-border rounded-xl shadow-lg overflow-hidden z-50"
                >
                  <div className="p-3 border-b border-brand-border">
                    <p className="font-medium text-sm text-text-primary">
                      {user?.full_name || 'Guest User'}
                    </p>
                    <p className="text-xs text-text-muted">
                      {user?.email || 'Sign in for full access'}
                    </p>
                  </div>

                  <div className="p-1.5">
                    <button
                      onClick={() => { navigate(ROUTES.SETTINGS); setShowUserMenu(false); }}
                      className="w-full flex items-center gap-3 px-3 py-2 text-sm text-text-secondary hover:text-text-primary hover:bg-white/5 rounded-lg transition-colors"
                    >
                      <Settings className="w-4 h-4" />
                      Settings
                    </button>
                    <button
                      onClick={() => setShowUserMenu(false)}
                      className="w-full flex items-center gap-3 px-3 py-2 text-sm text-error hover:bg-error/10 rounded-lg transition-colors"
                    >
                      <LogOut className="w-4 h-4" />
                      Sign out
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
