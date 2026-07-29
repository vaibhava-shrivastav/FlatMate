import { useState, useMemo } from 'react';
import { Search } from 'lucide-react';
import { cn } from '@utils/cn';
import ConversationCard from './ConversationCard';
import ConversationSkeleton from './ConversationSkeleton';
import ErrorBanner from '@components/common/ErrorBanner';

export default function ConversationList({
  conversations,
  activeId,
  isLoading,
  error,
  onRetry,
  onSelect,
}) {
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    if (!search.trim()) return conversations;
    const q = search.toLowerCase();
    return conversations.filter((c) =>
      c.participant?.fullName?.toLowerCase().includes(q) ||
      c.lastMessage?.text?.toLowerCase().includes(q)
    );
  }, [conversations, search]);

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-4 h-14 border-b border-border shrink-0">
        <h2 className="text-sm font-semibold text-text">Messages</h2>
      </div>

      {/* Search */}
      <div className="px-3 py-2.5 border-b border-border shrink-0">
        <div className="relative">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-text-muted pointer-events-none"
            aria-hidden="true"
          />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search conversations…"
            aria-label="Search conversations"
            className={cn(
              'w-full bg-background border border-border rounded-[var(--radius)]',
              'pl-8 pr-3 py-2 text-xs text-text placeholder:text-text-muted',
              'transition-colors duration-200',
              'focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary'
            )}
          />
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto">
        {error && (
          <div className="p-3">
            <ErrorBanner message={error} onDismiss={onRetry} />
          </div>
        )}

        {isLoading ? (
          <ConversationSkeleton count={6} />
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 py-12 px-4 text-center">
            <p className="text-sm text-text-muted">
              {search ? 'No conversations match your search.' : 'No conversations yet.'}
            </p>
          </div>
        ) : (
          filtered.map((conversation) => (
            <ConversationCard
              key={conversation._id}
              conversation={conversation}
              isActive={conversation._id === activeId}
              onClick={() => onSelect(conversation)}
            />
          ))
        )}
      </div>
    </div>
  );
}
