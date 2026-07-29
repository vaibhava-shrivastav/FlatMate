import { MessageSquare } from 'lucide-react';

export default function EmptyChat() {
  return (
    <div className="flex flex-col items-center justify-center gap-4 h-full text-center px-8">
      <div className="flex items-center justify-center w-14 h-14 rounded-full bg-card border border-border">
        <MessageSquare className="w-6 h-6 text-text-muted" aria-hidden="true" />
      </div>
      <div className="flex flex-col gap-1.5 max-w-xs">
        <h3 className="text-base font-semibold text-text">Your messages</h3>
        <p className="text-sm text-text-muted leading-relaxed">
          Select a conversation to start chatting, or connect with a roommate from the dashboard.
        </p>
      </div>
    </div>
  );
}
