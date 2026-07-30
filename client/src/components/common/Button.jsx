import { cn } from '@utils/cn';

const variants = {
  primary: 'bg-primary text-white hover:bg-primary-hover',
  secondary: 'bg-card text-white border border-border hover:border-primary',
  ghost: 'bg-transparent text-text-muted hover:text-white hover:bg-card',
  danger: 'bg-danger text-white hover:opacity-90',
};

const sizes = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-4 py-2.5 text-sm',
  lg: 'px-6 py-3 text-base',
};

const BASE =
  'inline-flex items-center justify-center gap-2 font-medium rounded-[var(--radius)] ' +
  'transition-all duration-200 cursor-pointer select-none ' +
  'active:scale-[0.98] ' +
  'disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100 ' +
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background';

function LoadingSpinner() {
  return (
    <svg
      className="animate-spin h-4 w-4"
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
      />
    </svg>
  );
}

export default function Button({
  as: Tag = 'button',
  children,
  variant = 'primary',
  size = 'md',
  className,
  isLoading = false,
  disabled = false,
  type,
  ...props
}) {
  // Only pass type="button" when rendering an actual <button> element
  const typeAttr = Tag === 'button' ? (type ?? 'button') : undefined;

  return (
    <Tag
      type={typeAttr}
      disabled={Tag === 'button' ? disabled || isLoading : undefined}
      className={cn(BASE, variants[variant], sizes[size], className)}
      {...props}
    >
      {isLoading ? <LoadingSpinner /> : children}
    </Tag>
  );
}
