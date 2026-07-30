import { useState, useEffect, useCallback, useRef } from 'react';
import api from '@services/api';
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
      const { data } = await api.get('/conversations', {
        signal: abortRef.current.signal,
      });
      setConversations(data.conversations ?? data);
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
    return () => abortRef.current?.abort();
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
