import Chat from '@components/chat/Chat';

export default function ChatPage() {
  return (
    <main
      className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 py-6"
      style={{ height: 'calc(100vh - 4rem)' }}
    >
      <div className="h-full">
        <Chat />
      </div>
    </main>
  );
}
