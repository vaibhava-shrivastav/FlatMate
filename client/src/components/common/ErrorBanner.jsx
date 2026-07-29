import { AlertCircle, X } from 'lucide-react';

export default function ErrorBanner({ message, onDismiss }) {
  if (!message) return null;

  return (
    <div
      role="alert"
      className="flex items-start gap-3 px-4 py-3 rounded-[var(--radius)] bg-danger/10 border border-danger/20"
    >
      <AlertCircle className="w-4 h-4 text-danger mt-0.5 shrink-0" />
      <p className="text-sm text-danger flex-1">{message}</p>
      {onDismiss && (
        <button
          type="button"
          onClick={onDismiss}
          className="text-danger/60 hover:text-danger transition-colors duration-150 cursor-pointer"
          aria-label="Dismiss error"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}
