import { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { useConversations } from '@hooks/useConversations';
import ConversationList from './ConversationList';
import ChatWindow from './ChatWindow';
import EmptyChat from './EmptyChat';
import { cn } from '@utils/cn';

export default function Chat() {
  const { id: activeId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const {
    conversations,
    isLoading,
    error,
    retry,
    updateLastMessage,
    markAsRead,
  } = useConversations();

  const [activeRecipient, setActiveRecipient] = useState(null);

  useEffect(() => {
    if (location.state?.recipient) {
      const rec = location.state.recipient;
      const recId = rec._id || rec.id;
      const existing = conversations.find(
        (c) => c.participant?._id === recId || c._id === recId
      );

      if (existing) {
        navigate(`/chat/${existing._id}`, { replace: true, state: {} });
      } else {
        const provChatId = `chat_${recId}`;
        setActiveRecipient({
          _id: provChatId,
          participant: {
            _id: recId,
            name: rec.name || rec.fullName || 'Host',
            avatar: rec.avatar || null,
          },
          lastMessage: {
            text: location.state.listingTitle
              ? `Hi, I am interested in your room: ${location.state.listingTitle}`
              : 'Hi, I would like to connect regarding your flat.',
          },
        });
      }
    }
  }, [location.state, conversations, navigate]);

  const activeConversation =
    conversations.find((c) => c._id === activeId) ?? activeRecipient ?? null;

  const handleSelect = useCallback(
    (conversation) => {
      setActiveRecipient(null);
      markAsRead(conversation._id);
      navigate(`/chat/${conversation._id}`);
    },
    [navigate, markAsRead]
  );

  const handleBack = useCallback(() => {
    setActiveRecipient(null);
    navigate('/chat');
  }, [navigate]);

  return (
    <div className="flex h-full border border-border rounded-[var(--radius)] overflow-hidden bg-background">
      {/* Conversation list — hidden on mobile when a chat is open */}
      <div
        className={cn(
          'w-full sm:w-72 lg:w-80 border-r border-border shrink-0',
          'flex flex-col',
          activeId || activeRecipient ? 'hidden sm:flex' : 'flex'
        )}
      >
        <ConversationList
          conversations={conversations}
          activeId={activeId || activeRecipient?._id}
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
          activeId || activeRecipient ? 'flex' : 'hidden sm:flex'
        )}
      >
        {activeConversation ? (
          <ChatWindow
            conversation={activeConversation}
            onBack={handleBack}
            showBack={Boolean(activeId || activeRecipient)}
          />
        ) : (
          <EmptyChat />
        )}
      </div>
    </div>
  );
}
