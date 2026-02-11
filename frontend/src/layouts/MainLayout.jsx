import React, { useState, useEffect, useCallback } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Sidebar, Header, MobileNav } from '../components/layout';
import { X } from 'lucide-react';
import CommandPalette from '../components/common/CommandPalette';
import ShortcutsModal from '../components/common/ShortcutsModal';
import { ToastContainer } from '../components/common/NotificationCenter';
import OnboardingTour from '../components/common/OnboardingTour';
import { ROUTES } from '../utils/constants';
import useAppStore from '../store';

const MainLayout = () => {
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);
  const [shortcutsOpen, setShortcutsOpen] = useState(false);
  const theme = useAppStore((s) => s.theme);

  // Apply theme class to document
  useEffect(() => {
    document.documentElement.classList.toggle('light-theme', theme === 'light');
  }, [theme]);

  // Global keyboard shortcuts
  const handleGlobalKeyDown = useCallback((e) => {
    const tag = e.target.tagName.toLowerCase();
    const isInput = tag === 'input' || tag === 'textarea' || e.target.isContentEditable;

    // Ctrl+K — Command Palette (always)
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
      e.preventDefault();
      setCommandPaletteOpen(prev => !prev);
      return;
    }

    // Ctrl+/ — Focus chat input
    if ((e.ctrlKey || e.metaKey) && e.key === '/') {
      e.preventDefault();
      navigate(ROUTES.CHAT);
      return;
    }

    // Ctrl+Shift+N — New search
    if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'N') {
      e.preventDefault();
      navigate(ROUTES.SEARCH);
      return;
    }

    // Ctrl+Shift+D — Dashboard
    if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'D') {
      e.preventDefault();
      navigate(ROUTES.DASHBOARD);
      return;
    }

    // Ctrl+Shift+H — History
    if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'H') {
      e.preventDefault();
      navigate(ROUTES.HISTORY);
      return;
    }

    // ? — Shortcuts (only when not in input)
    if (!isInput && e.key === '?' && !e.ctrlKey && !e.metaKey) {
      e.preventDefault();
      setShortcutsOpen(prev => !prev);
      return;
    }

    // Escape — close open modals
    if (e.key === 'Escape') {
      if (commandPaletteOpen) setCommandPaletteOpen(false);
      if (shortcutsOpen) setShortcutsOpen(false);
    }
  }, [navigate, commandPaletteOpen, shortcutsOpen]);

  useEffect(() => {
    document.addEventListener('keydown', handleGlobalKeyDown);
    return () => document.removeEventListener('keydown', handleGlobalKeyDown);
  }, [handleGlobalKeyDown]);

  return (
    <div className="flex h-screen bg-brand-dark overflow-hidden">
      {/* Desktop Sidebar */}
      <div className="hidden lg:block">
        <Sidebar />
      </div>

      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileMenuOpen(false)}
              className="lg:hidden fixed inset-0 bg-black/60 z-40"
            />
            <motion.div
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ type: 'spring', bounce: 0, duration: 0.3 }}
              className="lg:hidden fixed left-0 top-0 bottom-0 z-50"
            >
              <div className="relative">
                <Sidebar />
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className="absolute top-4 right-4 p-2 text-text-secondary hover:text-text-primary hover:bg-white/10 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header onMenuClick={() => setMobileMenuOpen(true)} />

        <main className="flex-1 overflow-auto pb-20 lg:pb-0">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
            className="p-4 lg:p-6"
          >
            <Outlet />
          </motion.div>
        </main>

        <MobileNav />
      </div>

      {/* Global Overlays */}
      <CommandPalette isOpen={commandPaletteOpen} onClose={() => setCommandPaletteOpen(false)} />
      <ShortcutsModal isOpen={shortcutsOpen} onClose={() => setShortcutsOpen(false)} />
      <ToastContainer />
      <OnboardingTour />
    </div>
  );
};

export default MainLayout;
