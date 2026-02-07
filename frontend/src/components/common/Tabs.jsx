import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '../../utils/helpers';

const Tabs = ({
  tabs,
  activeTab,
  onChange,
  variant = 'underline',
  size = 'md',
  fullWidth = false,
  className,
}) => {
  const sizes = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg',
  };

  if (variant === 'pills') {
    return (
      <div
        className={cn(
          'inline-flex bg-brand-darker rounded-lg p-1',
          fullWidth && 'w-full',
          className
        )}
      >
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onChange(tab.id)}
            className={cn(
              'relative px-4 py-2 rounded-md font-medium transition-colors duration-200',
              sizes[size],
              fullWidth && 'flex-1',
              activeTab === tab.id
                ? 'text-brand-dark'
                : 'text-text-secondary hover:text-text-primary'
            )}
          >
            {activeTab === tab.id && (
              <motion.div
                layoutId="pill-tab"
                className="absolute inset-0 bg-brand-yellow rounded-md"
                transition={{ type: 'spring', bounce: 0.2, duration: 0.4 }}
              />
            )}
            <span className="relative z-10 flex items-center gap-2">
              {tab.icon && <tab.icon className="w-4 h-4" />}
              {tab.label}
              {tab.badge && (
                <span className="px-1.5 py-0.5 text-xs rounded-full bg-brand-teal/20 text-brand-teal">
                  {tab.badge}
                </span>
              )}
            </span>
          </button>
        ))}
      </div>
    );
  }

  // Default underline variant
  return (
    <div
      className={cn(
        'flex border-b border-brand-border',
        fullWidth && 'w-full',
        className
      )}
    >
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onChange(tab.id)}
          disabled={tab.disabled}
          className={cn(
            'relative px-4 py-3 font-medium transition-colors duration-200',
            sizes[size],
            fullWidth && 'flex-1',
            activeTab === tab.id
              ? 'text-brand-yellow'
              : 'text-text-secondary hover:text-text-primary',
            tab.disabled && 'opacity-50 cursor-not-allowed'
          )}
        >
          <span className="flex items-center justify-center gap-2">
            {tab.icon && <tab.icon className="w-4 h-4" />}
            {tab.label}
            {tab.badge && (
              <span
                className={cn(
                  'px-1.5 py-0.5 text-xs rounded-full',
                  activeTab === tab.id
                    ? 'bg-brand-yellow/20 text-brand-yellow'
                    : 'bg-brand-border text-text-secondary'
                )}
              >
                {tab.badge}
              </span>
            )}
          </span>
          {activeTab === tab.id && (
            <motion.div
              layoutId="underline-tab"
              className="absolute bottom-0 left-0 right-0 h-0.5 bg-brand-yellow"
              transition={{ type: 'spring', bounce: 0.2, duration: 0.4 }}
            />
          )}
        </button>
      ))}
    </div>
  );
};

// Tab panel wrapper
Tabs.Panel = ({ children, active, className }) => {
  if (!active) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.2 }}
      className={className}
    >
      {children}
    </motion.div>
  );
};

export default Tabs;
