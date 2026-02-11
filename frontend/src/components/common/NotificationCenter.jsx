import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bell, X, Check, AlertTriangle, Info, Sparkles, FileText,
  Search, Trash2, CheckCheck,
} from 'lucide-react';
import { formatTimeAgo } from '../../utils/formatters';
import useAppStore from '../../store';

// Notification store — kept lightweight as a global singleton
let _listeners = [];
let _notifications = [];
let _idCounter = 0;

export const notify = ({ title, message, type = 'info', duration = 5000 }) => {
  const id = ++_idCounter;
  const notification = {
    id,
    title,
    message,
    type, // info, success, warning, error
    timestamp: new Date().toISOString(),
    read: false,
  };
  _notifications = [notification, ..._notifications.slice(0, 49)]; // Keep 50 max
  _listeners.forEach(fn => fn([..._notifications]));

  // Auto-dismiss toast after duration
  if (duration > 0) {
    setTimeout(() => {
      dismissToast(id);
    }, duration);
  }

  return id;
};

const dismissToast = (id) => {
  _listeners.forEach(fn => fn(null, id)); // Signal toast dismissal
};

export const clearAllNotifications = () => {
  _notifications = [];
  _listeners.forEach(fn => fn([]));
};

const useNotifications = () => {
  const [notifications, setNotifications] = useState(_notifications);
  const [toasts, setToasts] = useState([]);

  useEffect(() => {
    const listener = (newNotifs, dismissId) => {
      if (dismissId) {
        setToasts(prev => prev.filter(t => t.id !== dismissId));
        return;
      }
      if (newNotifs) {
        setNotifications(newNotifs);
        // Add latest as toast
        if (newNotifs.length > 0) {
          const latest = newNotifs[0];
          setToasts(prev => [latest, ...prev].slice(0, 3));
        }
      }
    };
    _listeners.push(listener);
    return () => {
      _listeners = _listeners.filter(l => l !== listener);
    };
  }, []);

  const markAllRead = () => {
    _notifications = _notifications.map(n => ({ ...n, read: true }));
    setNotifications([..._notifications]);
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return { notifications, toasts, setToasts, unreadCount, markAllRead };
};

const typeConfig = {
  info: { icon: Info, color: 'text-info', bg: 'bg-info/10', border: 'border-info/30' },
  success: { icon: Check, color: 'text-success', bg: 'bg-success/10', border: 'border-success/30' },
  warning: { icon: AlertTriangle, color: 'text-warning', bg: 'bg-warning/10', border: 'border-warning/30' },
  error: { icon: AlertTriangle, color: 'text-error', bg: 'bg-error/10', border: 'border-error/30' },
};

// Toast overlay (bottom-right)
export const ToastContainer = () => {
  const { toasts, setToasts } = useNotifications();

  return (
    <div className="fixed bottom-6 right-6 z-[200] flex flex-col gap-2 pointer-events-none">
      <AnimatePresence>
        {toasts.map((toast) => {
          const config = typeConfig[toast.type] || typeConfig.info;
          const Icon = config.icon;
          return (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, x: 100, scale: 0.9 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 100, scale: 0.9 }}
              transition={{ type: 'spring', bounce: 0.2, duration: 0.4 }}
              className={`pointer-events-auto max-w-sm bg-brand-slate border ${config.border} rounded-xl shadow-2xl p-4 flex items-start gap-3`}
            >
              <div className={`w-8 h-8 rounded-lg ${config.bg} flex items-center justify-center flex-shrink-0`}>
                <Icon className={`w-4 h-4 ${config.color}`} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-text-primary">{toast.title}</p>
                {toast.message && (
                  <p className="text-xs text-text-muted mt-0.5 line-clamp-2">{toast.message}</p>
                )}
              </div>
              <button
                onClick={() => setToasts(prev => prev.filter(t => t.id !== toast.id))}
                className="text-text-muted hover:text-text-primary p-1 flex-shrink-0"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
};

// Bell dropdown in header
const NotificationCenter = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { notifications, unreadCount, markAllRead } = useNotifications();
  const dropdownRef = useRef(null);

  // Close on outside click
  useEffect(() => {
    const handleClick = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    if (isOpen) document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [isOpen]);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => { setIsOpen(!isOpen); if (!isOpen) markAllRead(); }}
        className="relative p-2 text-text-secondary hover:text-text-primary hover:bg-white/5 rounded-lg transition-colors"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute top-1 right-1 w-4 h-4 bg-brand-teal text-[9px] font-bold text-brand-dark rounded-full flex items-center justify-center"
          >
            {unreadCount > 9 ? '9+' : unreadCount}
          </motion.span>
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 mt-2 w-80 bg-brand-slate border border-brand-border rounded-xl shadow-2xl overflow-hidden z-50"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-brand-border">
              <h3 className="text-sm font-semibold text-text-primary">Notifications</h3>
              {notifications.length > 0 && (
                <button
                  onClick={() => { clearAllNotifications(); setIsOpen(false); }}
                  className="text-xs text-text-muted hover:text-text-primary transition-colors"
                >
                  Clear all
                </button>
              )}
            </div>

            {/* List */}
            <div className="max-h-80 overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="px-4 py-8 text-center text-text-muted text-sm">
                  <Bell className="w-8 h-8 mx-auto mb-2 opacity-30" />
                  <p>No notifications</p>
                </div>
              ) : (
                notifications.slice(0, 10).map((notif) => {
                  const config = typeConfig[notif.type] || typeConfig.info;
                  const Icon = config.icon;
                  return (
                    <div
                      key={notif.id}
                      className={`px-4 py-3 border-b border-brand-border/50 hover:bg-white/5 transition-colors ${
                        !notif.read ? 'bg-brand-yellow/5' : ''
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className={`w-7 h-7 rounded-lg ${config.bg} flex items-center justify-center flex-shrink-0 mt-0.5`}>
                          <Icon className={`w-3.5 h-3.5 ${config.color}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-text-primary">{notif.title}</p>
                          {notif.message && (
                            <p className="text-xs text-text-muted mt-0.5 line-clamp-2">{notif.message}</p>
                          )}
                          <p className="text-[10px] text-text-muted mt-1">{formatTimeAgo(notif.timestamp)}</p>
                        </div>
                        {!notif.read && (
                          <div className="w-2 h-2 bg-brand-teal rounded-full flex-shrink-0 mt-2" />
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default NotificationCenter;
