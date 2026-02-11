import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Command } from 'lucide-react';

const shortcuts = [
  {
    category: 'Navigation',
    items: [
      { keys: ['Ctrl', 'K'], description: 'Open command palette' },
      { keys: ['Ctrl', '/'], description: 'Focus chat input' },
      { keys: ['Ctrl', 'Shift', 'N'], description: 'New drug search' },
      { keys: ['Ctrl', 'Shift', 'D'], description: 'Go to dashboard' },
      { keys: ['Ctrl', 'Shift', 'H'], description: 'Go to history' },
    ],
  },
  {
    category: 'Actions',
    items: [
      { keys: ['Ctrl', 'E'], description: 'Export current view' },
      { keys: ['Ctrl', 'S'], description: 'Save / bookmark opportunity' },
      { keys: ['Ctrl', 'Shift', 'C'], description: 'Copy selected data' },
    ],
  },
  {
    category: 'General',
    items: [
      { keys: ['?'], description: 'Show this shortcuts panel' },
      { keys: ['Esc'], description: 'Close modal / palette' },
    ],
  },
];

const ShortcutsModal = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100]"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="fixed top-[10%] left-1/2 -translate-x-1/2 w-full max-w-lg z-[101]"
          >
            <div className="bg-brand-slate border border-brand-border rounded-2xl shadow-2xl overflow-hidden">
              {/* Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-brand-border">
                <div className="flex items-center gap-2">
                  <Command className="w-5 h-5 text-brand-yellow" />
                  <h2 className="text-base font-semibold text-text-primary">Keyboard Shortcuts</h2>
                </div>
                <button
                  onClick={onClose}
                  className="p-1.5 text-text-muted hover:text-text-primary hover:bg-white/5 rounded-lg transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Content */}
              <div className="p-6 space-y-6 max-h-[60vh] overflow-y-auto">
                {shortcuts.map((section) => (
                  <div key={section.category}>
                    <h3 className="text-xs font-semibold text-text-muted tracking-widest uppercase mb-3">
                      {section.category}
                    </h3>
                    <div className="space-y-2">
                      {section.items.map((item, i) => (
                        <div
                          key={i}
                          className="flex items-center justify-between py-1.5"
                        >
                          <span className="text-sm text-text-secondary">{item.description}</span>
                          <div className="flex items-center gap-1">
                            {item.keys.map((key, ki) => (
                              <React.Fragment key={ki}>
                                {ki > 0 && <span className="text-text-muted text-xs">+</span>}
                                <kbd className="inline-flex items-center justify-center min-w-[24px] h-6 px-1.5 rounded bg-brand-darker border border-brand-border text-[11px] text-text-muted font-mono">
                                  {key}
                                </kbd>
                              </React.Fragment>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              {/* Footer */}
              <div className="px-6 py-3 border-t border-brand-border text-center">
                <p className="text-[10px] text-text-muted">
                  Press <kbd className="px-1 py-0.5 rounded bg-brand-darker border border-brand-border text-[10px] font-mono">?</kbd> anywhere to toggle this panel
                </p>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default ShortcutsModal;
