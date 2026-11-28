import { useState, useEffect, useCallback, useRef } from 'react';
import api from '@services/api';
import { getSocket } from '@services/socket';
import { resolveApiError } from '@utils/authHelpers';

export function useConversations() {
  const [conversations, setConversations] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const abortRef = useRef(null);

  const fetchConversations = useCallback(async () => {
    if (abortRef.current) abortRef.current.abort();
    abortRef.current = new AbortController();

    setIsLoading(true);
    setError('');

    try {
      const { data } = await api.get('/chats', {
        signal: abortRef.current.signal,
      });
      setConversations(data.chats ?? data);
    } catch (err) {
      if (err.name !== 'CanceledError' && err.name !== 'AbortError') {
        setError(resolveApiError(err));
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchConversations();

    const socket = getSocket();
    if (!socket) return () => abortRef.current?.abort();

    const onIncomingUpdate = () => {
      fetchConversations();
    };

    socket.on('receiveMessage', onIncomingUpdate);
    socket.on('receive_message', onIncomingUpdate);
    socket.on('conversationUpdated', onIncomingUpdate);

    return () => {
      socket.off('receiveMessage', onIncomingUpdate);
      socket.off('receive_message', onIncomingUpdate);
      socket.off('conversationUpdated', onIncomingUpdate);
      abortRef.current?.abort();
    };
  }, [fetchConversations]);

  const updateLastMessage = useCallback((conversationId, message) => {
    setConversations((prev) =>
      prev.map((c) =>
        c._id === conversationId
          ? { ...c, lastMessage: message, updatedAt: message.createdAt }
          : c
      )
    );
  }, []);

  const markAsRead = useCallback((conversationId) => {
    setConversations((prev) =>
      prev.map((c) =>
        c._id === conversationId ? { ...c, unreadCount: 0 } : c
      )
    );
  }, []);

  return {
    conversations,
    isLoading,
    error,
    retry: fetchConversations,
    updateLastMessage,
    markAsRead,
  };
}
