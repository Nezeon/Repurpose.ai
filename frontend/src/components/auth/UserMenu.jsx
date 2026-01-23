/**
 * UserMenu Component
 * Dropdown menu for authenticated users
 */

import React, { useState, useRef, useEffect } from 'react';
import {
  User,
  LogOut,
  Settings,
  History,
  ChevronDown,
  Search
} from 'lucide-react';
import { logout, getStoredUser } from '../../services/auth';

const UserMenu = ({ onLogout }) => {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef(null);
  const user = getStoredUser();

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    logout();
    setIsOpen(false);
    onLogout?.();
  };

  if (!user) return null;

  return (
    <div className="relative" ref={menuRef}>
      {/* Trigger button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg transition-colors"
      >
        <div className="w-7 h-7 bg-brand-yellow/20 rounded-full flex items-center justify-center">
          <User className="w-4 h-4 text-brand-yellow" />
        </div>
        <span className="text-sm text-white font-medium max-w-[100px] truncate">
          {user.username}
        </span>
        <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Dropdown menu */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-56 bg-brand-dark border border-white/10 rounded-xl shadow-xl overflow-hidden z-50">
          {/* User info header */}
          <div className="px-4 py-3 border-b border-white/10">
            <p className="text-sm font-medium text-white truncate">
              {user.full_name || user.username}
            </p>
            <p className="text-xs text-gray-400 truncate">{user.email}</p>
          </div>

          {/* Stats */}
          <div className="px-4 py-2 border-b border-white/10 bg-white/5">
            <div className="flex items-center gap-2 text-xs text-gray-400">
              <Search className="w-3 h-3" />
              <span>{user.search_count || 0} searches</span>
            </div>
          </div>

          {/* Menu items */}
          <div className="py-1">
            <button
              onClick={() => setIsOpen(false)}
              className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-300 hover:bg-white/5 hover:text-white transition-colors"
            >
              <History className="w-4 h-4" />
              Search History
            </button>

            <button
              onClick={() => setIsOpen(false)}
              className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-300 hover:bg-white/5 hover:text-white transition-colors"
            >
              <Settings className="w-4 h-4" />
              Settings
            </button>
          </div>

          {/* Logout */}
          <div className="border-t border-white/10 py-1">
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-4 py-2 text-sm text-red-400 hover:bg-red-500/10 transition-colors"
            >
              <LogOut className="w-4 h-4" />
              Sign Out
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserMenu;
