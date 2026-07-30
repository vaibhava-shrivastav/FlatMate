import { cn } from '@utils/cn';

function formatMessageTime(dateStr) {
  return new Intl.DateTimeFormat('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  }).format(new Date(dateStr));
}

function DaySeparator({ date }) {
  const label = (() => {
    const d = new Date(date);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);

    if (d.toDateString() === today.toDateString()) return 'Today';
    if (d.toDateString() === yesterday.toDateString()) return 'Yesterday';
    return new Intl.DateTimeFormat('en-US', { month: 'long', day: 'numeric' }).format(d);
  })();

  return (
    <div className="flex items-center gap-3 py-2 px-4" aria-label={`Messages from ${label}`}>
      <div className="flex-1 h-px bg-border" />
      <span className="text-xs text-text-muted font-medium">{label}</span>
      <div className="flex-1 h-px bg-border" />
    </div>
  );
}

export { DaySeparator };

export default function MessageBubble({ message, isOwn, showAvatar, prevMessage }) {
  const { text, createdAt, sender } = message;

  const showDaySeparator =
    !prevMessage ||
    new Date(createdAt).toDateString() !== new Date(prevMessage.createdAt).toDateString();

  return (
    <>
      {showDaySeparator && <DaySeparator date={createdAt} />}

      <div
        className={cn(
          'flex items-end gap-2.5 px-4',
          isOwn ? 'flex-row-reverse' : 'flex-row',
          'animate-[fadeSlideUp_180ms_ease-out]'
        )}
      >
        {/* Avatar — only for incoming, only when sender changes */}
        {!isOwn && (
          <div className="w-7 h-7 shrink-0 mb-0.5">
            {showAvatar ? (
              <div className="w-7 h-7 rounded-full bg-border flex items-center justify-center overflow-hidden">
                {sender?.avatar ? (
                  <img
                    src={sender.avatar}
                    alt={sender.fullName}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-xs font-medium text-text-muted">
                    {sender?.fullName?.[0]?.toUpperCase() ?? '?'}
                  </span>
                )}
              </div>
            ) : null}
          </div>
        )}

        <div className={cn('flex flex-col gap-1', isOwn ? 'items-end' : 'items-start', 'max-w-[72%] sm:max-w-[60%]')}>
          <div
            className={cn(
              'px-3.5 py-2.5 text-sm leading-relaxed break-words',
              isOwn
                ? 'bg-primary text-white rounded-2xl rounded-br-sm'
                : 'bg-card border border-border text-text rounded-2xl rounded-bl-sm'
            )}
          >
            {text}
          </div>
          <span className="text-[11px] text-text-muted px-1">
            {formatMessageTime(createdAt)}
          </span>
        </div>
      </div>
    </>
  );
}
