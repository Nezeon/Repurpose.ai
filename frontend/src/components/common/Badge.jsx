import React from 'react';
import { cn } from '../../utils/helpers';

const variants = {
  yellow: 'badge-yellow',
  teal: 'badge-teal',
  info: 'badge-info',
  success: 'badge-success',
  warning: 'badge-warning',
  error: 'badge-error',
  neutral: 'badge-neutral',
};

const sizes = {
  sm: 'text-[10px] px-1.5 py-0.5',
  md: 'text-xs px-2.5 py-0.5',
  lg: 'text-sm px-3 py-1',
};

const Badge = ({
  children,
  variant = 'neutral',
  size = 'md',
  dot = false,
  icon: Icon,
  className,
  ...props
}) => {
  return (
    <span
      className={cn(
        variants[variant],
        sizes[size],
        'inline-flex items-center gap-1',
        className
      )}
      {...props}
    >
      {dot && (
        <span className="w-1.5 h-1.5 rounded-full bg-current" />
      )}
      {Icon && <Icon className="w-3 h-3" />}
      {children}
    </span>
  );
};

export default Badge;
