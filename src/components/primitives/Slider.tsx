import React, { forwardRef, InputHTMLAttributes } from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export interface SliderProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'onChange'> {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  label?: string;
  showValue?: boolean;
  valueFormatter?: (value: number) => string;
}

export const Slider = forwardRef<HTMLInputElement, SliderProps>(
  (
    {
      value,
      onChange,
      min = 0,
      max = 100,
      step = 1,
      label,
      showValue = false,
      valueFormatter = (v) => `${v}`,
      className,
      disabled,
      ...props
    },
    ref
  ) => {
    const percentage = Math.min(100, Math.max(0, ((value - min) / (max - min)) * 100));

    return (
      <div className="w-full flex flex-col gap-1.5 select-none font-sans">
        {(label || showValue) && (
          <div className="flex items-center justify-between text-[11px] text-white/50 tracking-tight">
            {label && <span className="font-medium">{label}</span>}
            {showValue && <span className="font-mono text-white/80">{valueFormatter(value)}</span>}
          </div>
        )}
        <div className="relative flex items-center w-full h-4 group">
          {/* Apple-style background track */}
          <div className="w-full h-1.5 bg-white/10 group-hover:h-2 transition-all duration-200 rounded-full overflow-hidden backdrop-blur-md">
            <div
              className="h-full bg-accent-blue rounded-full transition-all duration-75 shadow-glow-blue"
              style={{ width: `${percentage}%` }}
            />
          </div>

          <input
            ref={ref}
            type="range"
            min={min}
            max={max}
            step={step}
            value={value}
            disabled={disabled}
            onChange={(e) => onChange(parseFloat(e.target.value))}
            onPointerDown={(e) => {
              e.stopPropagation();
              e.nativeEvent?.stopPropagation?.();
            }}
            onMouseDown={(e) => {
              e.stopPropagation();
              e.nativeEvent?.stopPropagation?.();
            }}
            className={twMerge(
              clsx(
                'absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed',
                className
              )
            )}
            {...props}
          />
        </div>
      </div>
    );
  }
);

Slider.displayName = 'Slider';
export default Slider;
