import React, { forwardRef, ButtonHTMLAttributes, ReactNode } from 'react';
import { motion, HTMLMotionProps } from 'framer-motion';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

import { stopCanvasPropagation } from '../../utils/canvas-events';

export interface ButtonProps
  extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'onAnimationStart' | 'onDrag' | 'onDragEnd' | 'onDragStart'> {
  variant?: 'primary' | 'secondary' | 'glass' | 'ghost' | 'danger' | 'outline' | 'unstyled';
  size?: 'sm' | 'md' | 'lg' | 'icon';
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  isLoading?: boolean;
  style?: React.CSSProperties;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      style,
      variant = 'secondary',
      size = 'md',
      leftIcon,
      rightIcon,
      isLoading = false,
      disabled,
      children,
      onClick,
      onPointerDown,
      onMouseDown,
      ...props
    },
    ref
  ) => {
    const handlePointerDown = (e: React.PointerEvent<HTMLButtonElement>) => {
      stopCanvasPropagation(e);
      onPointerDown?.(e);
    };

    const handleMouseDown = (e: React.MouseEvent<HTMLButtonElement>) => {
      stopCanvasPropagation(e);
      onMouseDown?.(e);
    };

    if (variant === 'unstyled') {
      return (
        <button
          ref={ref}
          disabled={disabled || isLoading}
          onClick={onClick}
          onPointerDown={handlePointerDown}
          onMouseDown={handleMouseDown}
          className={className}
          style={style}
          {...(props as any)}
        >
          {leftIcon}
          {children}
          {rightIcon}
        </button>
      );
    }

    const baseStyles =
      'inline-flex items-center justify-center gap-2 rounded-xl font-medium transition-colors select-none cursor-pointer tracking-tight outline-none focus-visible:ring-2 focus-visible:ring-accent-blue/60 disabled:opacity-40 disabled:cursor-not-allowed transform-gpu will-change-transform';

    const variantStyles: Record<NonNullable<ButtonProps['variant']>, string> = {
      primary:
        'bg-accent-blue text-white shadow-glow-blue hover:brightness-110 active:brightness-95 font-semibold border border-white/20',
      secondary:
        'bg-white/10 text-white hover:bg-white/15 active:bg-white/10 border border-white/10 backdrop-blur-md',
      glass:
        'glass-vision-pill text-white hover:bg-white/15 active:bg-white/10 border border-white/15',
      ghost:
        'text-white/70 hover:text-white hover:bg-white/10 active:bg-white/5',
      danger:
        'bg-accent-red/20 text-accent-red hover:bg-accent-red/30 border border-accent-red/30',
      outline:
        'border border-white/20 text-white/90 hover:bg-white/10',
      unstyled: '',
    };

    const sizeStyles: Record<NonNullable<ButtonProps['size']>, string> = {
      sm: 'px-2.5 py-1 text-xs rounded-lg',
      md: 'px-3.5 py-1.5 text-sm rounded-xl',
      lg: 'px-5 py-2.5 text-base rounded-2xl',
      icon: 'p-2 aspect-square rounded-xl',
    };

    return (
      <motion.button
        ref={ref}
        disabled={disabled || isLoading}
        whileHover={disabled ? undefined : { scale: 1.02 }}
        whileTap={disabled ? undefined : { scale: 0.96 }}
        transition={{ type: 'spring', stiffness: 400, damping: 30 }}
        onClick={onClick}
        onPointerDown={handlePointerDown}
        onMouseDown={handleMouseDown}
        style={style}
        className={twMerge(
          clsx(
            baseStyles,
            variantStyles[variant],
            sizeStyles[size],
            className
          )
        )}
        {...(props as any)}
      >
        {isLoading ? (
          <span className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
        ) : (
          leftIcon
        )}
        {children}
        {rightIcon}
      </motion.button>
    );
  }
);

Button.displayName = 'Button';
export default Button;
