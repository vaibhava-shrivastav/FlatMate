import { useState, useEffect, useCallback, useRef } from 'react';
import api from '@services/api';
import { getSocket } from '@services/socket';
import { resolveApiError } from '@utils/authHelpers';

export function useMessages(conversationId) {
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [typingUsers, setTypingUsers] = useState([]);
  const abortRef = useRef(null);
  const typingTimerRef = useRef(null);

  const fetchMessages = useCallback(async (id) => {
    if (!id) return;
    if (abortRef.current) abortRef.current.abort();
    abortRef.current = new AbortController();

    setIsLoading(true);
    setError('');
    setMessages([]);

    try {
      const { data } = await api.get(`/conversations/${id}/messages`, {
        signal: abortRef.current.signal,
      });
      setMessages(data.messages ?? data);
    } catch (err) {
      if (err.name !== 'CanceledError' && err.name !== 'AbortError') {
        setError(resolveApiError(err));
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!conversationId) return;

    const socket = getSocket();
    fetchMessages(conversationId);

    if (!socket) return;

    socket.emit('join_room', conversationId);

    const onMessage = (message) => {
      setMessages((prev) => [...prev, message]);
      setTypingUsers((prev) => prev.filter((u) => u !== message.sender._id));
    };

    const onTyping = ({ userId }) => {
      setTypingUsers((prev) => (prev.includes(userId) ? prev : [...prev, userId]));
      clearTimeout(typingTimerRef.current);
      typingTimerRef.current = setTimeout(() => {
        setTypingUsers((prev) => prev.filter((u) => u !== userId));
      }, 3000);
    };

    const onStopTyping = ({ userId }) => {
      setTypingUsers((prev) => prev.filter((u) => u !== userId));
    };

    socket.on('receive_message', onMessage);
    socket.on('user_typing', onTyping);
    socket.on('user_stop_typing', onStopTyping);

    return () => {
      socket.emit('leave_room', conversationId);
      socket.off('receive_message', onMessage);
      socket.off('user_typing', onTyping);
      socket.off('user_stop_typing', onStopTyping);
      clearTimeout(typingTimerRef.current);
      abortRef.current?.abort();
    };
  }, [conversationId, fetchMessages]);

  const sendMessage = useCallback(
    async (text) => {
      if (!text.trim() || !conversationId) return;

      const socket = getSocket();
      setIsSending(true);

      try {
        const { data } = await api.post(`/conversations/${conversationId}/messages`, {
          text: text.trim(),
        });
        setMessages((prev) => [...prev, data.message ?? data]);

        if (socket) {
          socket.emit('send_message', { conversationId, message: data.message ?? data });
          socket.emit('stop_typing', conversationId);
        }
      } catch (err) {
        setError(resolveApiError(err));
      } finally {
        setIsSending(false);
      }
    },
    [conversationId]
  );

  const emitTyping = useCallback(() => {
    const socket = getSocket();
    if (socket && conversationId) socket.emit('typing', conversationId);
  }, [conversationId]);

  const emitStopTyping = useCallback(() => {
    const socket = getSocket();
    if (socket && conversationId) socket.emit('stop_typing', conversationId);
  }, [conversationId]);

  return {
    messages,
    isLoading,
    error,
    isSending,
    typingUsers,
    sendMessage,
    emitTyping,
    emitStopTyping,
    retry: () => fetchMessages(conversationId),
  };
}
