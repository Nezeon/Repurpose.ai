import React from 'react';
import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import { cn } from '../../utils/helpers';

const variants = {
  primary: 'btn-primary',
  secondary: 'btn-secondary',
  ghost: 'btn-ghost',
  success: 'btn-success',
  danger: 'btn-danger',
  icon: 'btn-icon',
};

const sizes = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-4 py-2 text-base',
  lg: 'px-6 py-3 text-lg',
};

const Button = React.forwardRef(
  (
    {
      children,
      variant = 'primary',
      size = 'md',
      loading = false,
      disabled = false,
      leftIcon: LeftIcon,
      rightIcon: RightIcon,
      fullWidth = false,
      className,
      onClick,
      type = 'button',
      ...props
    },
    ref
  ) => {
    const isDisabled = disabled || loading;

    // For icon variant, don't apply size padding
    const sizeClass = variant === 'icon' ? '' : sizes[size];

    return (
      <motion.button
        ref={ref}
        type={type}
        disabled={isDisabled}
        onClick={onClick}
        whileTap={{ scale: isDisabled ? 1 : 0.98 }}
        className={cn(
          variants[variant],
          sizeClass,
          fullWidth && 'w-full',
          'inline-flex items-center justify-center gap-2',
          className
        )}
        {...props}
      >
        {loading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          LeftIcon && <LeftIcon className="h-4 w-4" />
        )}
        {children}
        {!loading && RightIcon && <RightIcon className="h-4 w-4" />}
      </motion.button>
    );
  }
);

Button.displayName = 'Button';

export default Button;
