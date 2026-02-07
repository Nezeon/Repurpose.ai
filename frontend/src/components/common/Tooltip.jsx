import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../../utils/helpers';

const positions = {
  top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
  bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
  left: 'right-full top-1/2 -translate-y-1/2 mr-2',
  right: 'left-full top-1/2 -translate-y-1/2 ml-2',
};

const arrowPositions = {
  top: 'top-full left-1/2 -translate-x-1/2 border-t-brand-slate border-x-transparent border-b-transparent',
  bottom: 'bottom-full left-1/2 -translate-x-1/2 border-b-brand-slate border-x-transparent border-t-transparent',
  left: 'left-full top-1/2 -translate-y-1/2 border-l-brand-slate border-y-transparent border-r-transparent',
  right: 'right-full top-1/2 -translate-y-1/2 border-r-brand-slate border-y-transparent border-l-transparent',
};

const Tooltip = ({
  children,
  content,
  position = 'top',
  delay = 200,
  className,
  disabled = false,
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [tooltipPosition, setTooltipPosition] = useState({ top: 0, left: 0 });
  const triggerRef = useRef(null);
  const timeoutRef = useRef(null);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const updatePosition = () => {
    if (!triggerRef.current) return;

    const rect = triggerRef.current.getBoundingClientRect();
    const scrollX = window.scrollX;
    const scrollY = window.scrollY;

    let top = 0;
    let left = 0;

    switch (position) {
      case 'top':
        top = rect.top + scrollY - 8;
        left = rect.left + scrollX + rect.width / 2;
        break;
      case 'bottom':
        top = rect.bottom + scrollY + 8;
        left = rect.left + scrollX + rect.width / 2;
        break;
      case 'left':
        top = rect.top + scrollY + rect.height / 2;
        left = rect.left + scrollX - 8;
        break;
      case 'right':
        top = rect.top + scrollY + rect.height / 2;
        left = rect.right + scrollX + 8;
        break;
    }

    setTooltipPosition({ top, left });
  };

  const handleMouseEnter = () => {
    if (disabled) return;
    timeoutRef.current = setTimeout(() => {
      updatePosition();
      setIsVisible(true);
    }, delay);
  };

  const handleMouseLeave = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    setIsVisible(false);
  };

  if (!content) {
    return children;
  }

  const tooltipContent = (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.15 }}
          style={{
            position: 'absolute',
            top: tooltipPosition.top,
            left: tooltipPosition.left,
            transform:
              position === 'top' || position === 'bottom'
                ? 'translateX(-50%)'
                : 'translateY(-50%)',
            zIndex: 9999,
          }}
          className={cn(
            'px-3 py-1.5 text-sm text-text-primary bg-brand-slate border border-brand-border rounded-lg shadow-lg whitespace-nowrap',
            position === 'top' && '-translate-y-full',
            position === 'left' && '-translate-x-full',
            className
          )}
        >
          {content}
        </motion.div>
      )}
    </AnimatePresence>
  );

  return (
    <>
      <span
        ref={triggerRef}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        className="inline-flex"
      >
        {children}
      </span>
      {createPortal(tooltipContent, document.body)}
    </>
  );
};

export default Tooltip;
