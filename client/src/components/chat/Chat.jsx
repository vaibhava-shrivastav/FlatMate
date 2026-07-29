import { useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useConversations } from '@hooks/useConversations';
import ConversationList from './ConversationList';
import ChatWindow from './ChatWindow';
import EmptyChat from './EmptyChat';
import { cn } from '@utils/cn';

export default function Chat() {
  const { id: activeId } = useParams();
  const navigate = useNavigate();

  const {
    conversations,
    isLoading,
    error,
    retry,
    updateLastMessage,
    markAsRead,
  } = useConversations();

  const activeConversation = conversations.find((c) => c._id === activeId) ?? null;

  const handleSelect = useCallback(
    (conversation) => {
      markAsRead(conversation._id);
      navigate(`/chat/${conversation._id}`);
    },
    [navigate, markAsRead]
  );

  const handleBack = useCallback(() => {
    navigate('/chat');
  }, [navigate]);

  const showList = !activeId;
  const showWindow = Boolean(activeId && activeConversation);

  return (
    <div className="flex h-full border border-border rounded-[var(--radius)] overflow-hidden bg-background">
      {/* Conversation list — hidden on mobile when a chat is open */}
      <div
        className={cn(
          'w-full sm:w-72 lg:w-80 border-r border-border shrink-0',
          'flex flex-col',
          activeId ? 'hidden sm:flex' : 'flex'
        )}
      >
        <ConversationList
          conversations={conversations}
          activeId={activeId}
          isLoading={isLoading}
          error={error}
          onRetry={retry}
          onSelect={handleSelect}
        />
      </div>

      {/* Chat window — hidden on mobile when no chat is open */}
      <div
        className={cn(
          'flex-1 flex flex-col min-w-0',
          !activeId ? 'hidden sm:flex' : 'flex'
        )}
      >
        {showWindow ? (
          <ChatWindow
            conversation={activeConversation}
            onBack={handleBack}
            showBack={Boolean(activeId)}
          />
        ) : (
          <EmptyChat />
        )}
      </div>
    </div>
  );
}
