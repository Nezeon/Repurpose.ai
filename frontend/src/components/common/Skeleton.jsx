import React from 'react';
import { cn } from '../../utils/helpers';

const Skeleton = ({
  variant = 'rectangle',
  width,
  height,
  className,
  animate = true,
  ...props
}) => {
  const baseClass = cn(
    'bg-brand-slate rounded',
    animate && 'animate-pulse',
    className
  );

  const style = {
    width: width || (variant === 'circle' ? height : '100%'),
    height: height || '1rem',
  };

  if (variant === 'circle') {
    return (
      <div
        className={cn(baseClass, 'rounded-full')}
        style={style}
        {...props}
      />
    );
  }

  if (variant === 'text') {
    return (
      <div
        className={cn(baseClass, 'rounded')}
        style={{ ...style, height: height || '1em' }}
        {...props}
      />
    );
  }

  return <div className={baseClass} style={style} {...props} />;
};

// Pre-built skeleton compositions
Skeleton.Card = ({ className }) => (
  <div className={cn('card p-5 space-y-4', className)}>
    <Skeleton height="1.5rem" width="60%" />
    <Skeleton height="1rem" />
    <Skeleton height="1rem" width="80%" />
    <div className="flex gap-2 pt-2">
      <Skeleton height="2rem" width="4rem" className="rounded-full" />
      <Skeleton height="2rem" width="4rem" className="rounded-full" />
    </div>
  </div>
);

Skeleton.List = ({ count = 3, className }) => (
  <div className={cn('space-y-3', className)}>
    {Array.from({ length: count }).map((_, i) => (
      <div key={i} className="flex items-center gap-3">
        <Skeleton variant="circle" height="2.5rem" />
        <div className="flex-1 space-y-2">
          <Skeleton height="1rem" width="40%" />
          <Skeleton height="0.75rem" width="60%" />
        </div>
      </div>
    ))}
  </div>
);

Skeleton.Stats = ({ className }) => (
  <div className={cn('grid grid-cols-4 gap-4', className)}>
    {Array.from({ length: 4 }).map((_, i) => (
      <div key={i} className="card p-4 space-y-2">
        <Skeleton height="0.75rem" width="50%" />
        <Skeleton height="2rem" width="70%" />
      </div>
    ))}
  </div>
);

Skeleton.OpportunityCard = ({ className }) => (
  <div className={cn('card p-5', className)}>
    <div className="flex items-start justify-between">
      <div className="flex-1 space-y-3">
        <div className="flex items-center gap-2">
          <Skeleton variant="circle" height="1.5rem" width="1.5rem" />
          <Skeleton height="1.5rem" width="40%" />
        </div>
        <div className="flex gap-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} height="3rem" width="4rem" className="rounded-lg" />
          ))}
        </div>
      </div>
      <Skeleton variant="circle" height="5rem" width="5rem" />
    </div>
  </div>
);

export default Skeleton;
