import { useEffect, useRef } from 'react';
import { useAuth } from '@hooks/useAuth';
import { useMessages } from '@hooks/useMessages';
import ChatHeader from './ChatHeader';
import MessageBubble from './MessageBubble';
import MessageInput from './MessageInput';
import MessageSkeleton from './MessageSkeleton';
import TypingIndicator from './TypingIndicator';
import ErrorBanner from '@components/common/ErrorBanner';

export default function ChatWindow({ conversation, onBack, showBack }) {
  const { user } = useAuth();
  const bottomRef = useRef(null);

  const {
    messages,
    isLoading,
    error,
    isSending,
    typingUsers,
    sendMessage,
    emitTyping,
    emitStopTyping,
    retry,
  } = useMessages(conversation._id);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, typingUsers]);

  const participant = conversation.participant;
  const isTyping = typingUsers.length > 0;

  return (
    <div className="flex flex-col h-full">
      <ChatHeader
        participant={participant}
        onBack={onBack}
        showBack={showBack}
      />

      {/* Message area */}
      <div className="flex-1 overflow-y-auto py-2">
        {error && (
          <div className="px-4 py-2">
            <ErrorBanner message={error} onDismiss={retry} />
          </div>
        )}

        {isLoading ? (
          <MessageSkeleton />
        ) : messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-sm text-text-muted">
              Say hello to {participant?.fullName?.split(' ')[0] ?? 'your match'} 👋
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-1 pb-2">
            {messages.map((message, index) => (
              <MessageBubble
                key={message._id}
                message={message}
                isOwn={message.sender._id === user?._id}
                showAvatar={
                  index === 0 ||
                  messages[index - 1]?.sender._id !== message.sender._id
                }
                prevMessage={index > 0 ? messages[index - 1] : null}
              />
            ))}
          </div>
        )}

        {isTyping && (
          <TypingIndicator name={participant?.fullName?.split(' ')[0] ?? 'Someone'} />
        )}

        <div ref={bottomRef} />
      </div>

      <MessageInput
        onSend={sendMessage}
        onTyping={emitTyping}
        onStopTyping={emitStopTyping}
        disabled={isSending}
      />
    </div>
  );
}
