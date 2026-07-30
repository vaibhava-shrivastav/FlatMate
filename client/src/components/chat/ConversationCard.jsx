import { cn } from '@utils/cn';
import { formatRelativeTime, truncate } from '@utils/formatters';

export default function ConversationCard({ conversation, isActive, onClick }) {
  const { participant, lastMessage, unreadCount, updatedAt } = conversation;
  const { fullName, avatar, isOnline, compatibility } = participant;
  const initials = fullName?.[0]?.toUpperCase() ?? '?';
  const hasUnread = unreadCount > 0;

  return (
    <button
      type="button"
      onClick={onClick}
      aria-current={isActive ? 'true' : undefined}
      className={cn(
        'w-full flex items-center gap-3 px-3 py-3 text-left',
        'transition-colors duration-150 cursor-pointer',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-inset',
        isActive
          ? 'bg-card border-r-2 border-r-primary'
          : 'hover:bg-card/60 border-r-2 border-r-transparent'
      )}
    >
      {/* Avatar */}
      <div className="relative shrink-0">
        <div className="w-10 h-10 rounded-full bg-border flex items-center justify-center overflow-hidden">
          {avatar ? (
            <img src={avatar} alt={fullName} className="w-full h-full object-cover" loading="lazy" />
          ) : (
            <span className="text-sm font-semibold text-text-muted">{initials}</span>
          )}
        </div>
        {isOnline && (
          <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-success border-2 border-background" />
        )}
      </div>

      {/* Content */}
      <div className="flex flex-col gap-0.5 flex-1 min-w-0">
        <div className="flex items-center justify-between gap-1">
          <span className={cn('text-sm truncate', hasUnread ? 'font-semibold text-text' : 'font-medium text-text')}>
            {fullName}
          </span>
          <span className="text-[11px] text-text-muted shrink-0">
            {updatedAt ? formatRelativeTime(updatedAt) : ''}
          </span>
        </div>

        <div className="flex items-center justify-between gap-1">
          <span className={cn('text-xs truncate', hasUnread ? 'text-text' : 'text-text-muted')}>
            {lastMessage?.text ? truncate(lastMessage.text, 40) : 'No messages yet'}
          </span>

          <div className="flex items-center gap-1.5 shrink-0">
            {compatibility != null && (
              <span className="text-[10px] text-primary font-medium">{compatibility}%</span>
            )}
            {hasUnread && (
              <span className="flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full bg-primary text-white text-[10px] font-semibold">
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
          </div>
        </div>
      </div>
    </button>
  );
}
