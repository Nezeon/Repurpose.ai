import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '../../utils/helpers';

const Card = React.forwardRef(
  (
    {
      children,
      className,
      hover = false,
      glass = false,
      solid = false,
      padding = 'md',
      onClick,
      animate = false,
      ...props
    },
    ref
  ) => {
    const paddingClasses = {
      none: '',
      sm: 'p-3',
      md: 'p-5',
      lg: 'p-6',
      xl: 'p-8',
    };

    const baseClass = glass ? 'card-glass' : solid ? 'card-solid' : hover ? 'card-hover' : 'card';

    const Component = animate || onClick ? motion.div : 'div';
    const motionProps =
      animate || onClick
        ? {
            initial: { opacity: 0, y: 10 },
            animate: { opacity: 1, y: 0 },
            whileHover: onClick ? { scale: 1.01 } : undefined,
            whileTap: onClick ? { scale: 0.99 } : undefined,
          }
        : {};

    return (
      <Component
        ref={ref}
        className={cn(
          baseClass,
          paddingClasses[padding],
          onClick && 'cursor-pointer',
          className
        )}
        onClick={onClick}
        {...motionProps}
        {...props}
      >
        {children}
      </Component>
    );
  }
);

Card.displayName = 'Card';

// Card Header
const CardHeader = ({ children, className, ...props }) => (
  <div className={cn('mb-4', className)} {...props}>
    {children}
  </div>
);

CardHeader.displayName = 'CardHeader';

// Card Title
const CardTitle = ({ children, className, ...props }) => (
  <h3 className={cn('text-lg font-semibold text-text-primary', className)} {...props}>
    {children}
  </h3>
);

CardTitle.displayName = 'CardTitle';

// Card Description
const CardDescription = ({ children, className, ...props }) => (
  <p className={cn('text-sm text-text-secondary mt-1', className)} {...props}>
    {children}
  </p>
);

CardDescription.displayName = 'CardDescription';

// Card Body
const CardBody = ({ children, className, ...props }) => (
  <div className={cn(className)} {...props}>
    {children}
  </div>
);

CardBody.displayName = 'CardBody';

// Card Footer
const CardFooter = ({ children, className, ...props }) => (
  <div className={cn('mt-4 pt-4 border-t border-brand-border', className)} {...props}>
    {children}
  </div>
);

CardFooter.displayName = 'CardFooter';

// Attach compound components
Card.Header = CardHeader;
Card.Title = CardTitle;
Card.Description = CardDescription;
Card.Body = CardBody;
Card.Footer = CardFooter;

export default Card;
