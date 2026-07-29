import { forwardRef } from 'react';
import { cn } from '@utils/cn';

const Input = forwardRef(function Input(
  { label, error, hint, className, id, required, ...props },
  ref
) {
  const inputId = id || label?.toLowerCase().replace(/\s+/g, '-');

  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label htmlFor={inputId} className="text-sm font-medium text-text">
          {label}
          {required && <span className="text-danger ml-1">*</span>}
        </label>
      )}

      <input
        ref={ref}
        id={inputId}
        required={required}
        className={cn(
          'w-full bg-card border border-border rounded-[var(--radius)]',
          'px-4 py-2.5 text-sm text-text placeholder:text-text-muted',
          'transition-colors duration-200',
          'focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary',
          'disabled:opacity-50 disabled:cursor-not-allowed',
          error && 'border-danger focus:border-danger focus:ring-danger',
          className
        )}
        {...props}
      />

      {error && <p className="text-xs text-danger">{error}</p>}
      {hint && !error && <p className="text-xs text-text-muted">{hint}</p>}
    </div>
  );
});

export default Input;
