import { ArrowLeft, MoreHorizontal } from 'lucide-react';
import { cn } from '@utils/cn';

function OnlineDot({ isOnline }) {
  return (
    <span
      className={cn(
        'absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-background',
        isOnline ? 'bg-success' : 'bg-border'
      )}
      aria-label={isOnline ? 'Online' : 'Offline'}
    />
  );
}

export default function ChatHeader({ participant, onBack, showBack }) {
  if (!participant) return null;

  const { fullName, avatar, isOnline, compatibility } = participant;
  const initials = fullName?.[0]?.toUpperCase() ?? '?';

  return (
    <div className="flex items-center gap-3 px-4 h-14 border-b border-border bg-background shrink-0">
      {showBack && (
        <button
          type="button"
          onClick={onBack}
          aria-label="Back to conversations"
          className="flex items-center justify-center w-8 h-8 -ml-1 rounded-[var(--radius)] text-text-muted hover:text-text hover:bg-card transition-all duration-200 cursor-pointer active:scale-[0.98]"
        >
          <ArrowLeft className="w-4 h-4" aria-hidden="true" />
        </button>
      )}

      <div className="relative shrink-0">
        <div className="w-8 h-8 rounded-full bg-border flex items-center justify-center overflow-hidden">
          {avatar ? (
            <img src={avatar} alt={fullName} className="w-full h-full object-cover" />
          ) : (
            <span className="text-xs font-semibold text-text-muted">{initials}</span>
          )}
        </div>
        <OnlineDot isOnline={isOnline} />
      </div>

      <div className="flex flex-col min-w-0 flex-1">
        <span className="text-sm font-semibold text-text truncate leading-tight">{fullName}</span>
        <span className="text-xs text-text-muted leading-tight">
          {isOnline ? 'Active now' : 'Offline'}
          {compatibility != null && (
            <span className="ml-2 text-primary font-medium">{compatibility}% match</span>
          )}
        </span>
      </div>

      <button
        type="button"
        aria-label="More options"
        className="flex items-center justify-center w-8 h-8 rounded-[var(--radius)] text-text-muted hover:text-text hover:bg-card transition-all duration-200 cursor-pointer active:scale-[0.98] ml-auto shrink-0"
      >
        <MoreHorizontal className="w-4 h-4" aria-hidden="true" />
      </button>
    </div>
  );
}
