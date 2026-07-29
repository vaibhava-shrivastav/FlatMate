import { useState, useRef, useCallback } from 'react';
import { SendHorizonal } from 'lucide-react';
import { cn } from '@utils/cn';

export default function MessageInput({ onSend, onTyping, onStopTyping, disabled }) {
  const [text, setText] = useState('');
  const typingRef = useRef(false);
  const stopTypingTimerRef = useRef(null);
  const textareaRef = useRef(null);

  const handleChange = useCallback(
    (e) => {
      setText(e.target.value);

      if (!typingRef.current) {
        typingRef.current = true;
        onTyping?.();
      }

      clearTimeout(stopTypingTimerRef.current);
      stopTypingTimerRef.current = setTimeout(() => {
        typingRef.current = false;
        onStopTyping?.();
      }, 1500);

      // Auto-resize textarea
      const el = textareaRef.current;
      if (el) {
        el.style.height = 'auto';
        el.style.height = `${Math.min(el.scrollHeight, 140)}px`;
      }
    },
    [onTyping, onStopTyping]
  );

  const submit = useCallback(() => {
    const trimmed = text.trim();
    if (!trimmed || disabled) return;

    onSend(trimmed);
    setText('');
    typingRef.current = false;
    clearTimeout(stopTypingTimerRef.current);
    onStopTyping?.();

    // Reset textarea height
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  }, [text, disabled, onSend, onStopTyping]);

  const handleKeyDown = useCallback(
    (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        submit();
      }
    },
    [submit]
  );

  const canSend = text.trim().length > 0 && !disabled;

  return (
    <div className="flex items-end gap-2.5 px-4 py-3 border-t border-border bg-background">
      <textarea
        ref={textareaRef}
        value={text}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        placeholder="Write a message…"
        disabled={disabled}
        rows={1}
        aria-label="Message input"
        className={cn(
          'flex-1 resize-none bg-card border border-border rounded-[var(--radius)]',
          'px-4 py-2.5 text-sm text-text placeholder:text-text-muted',
          'transition-colors duration-200 leading-relaxed',
          'focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary',
          'disabled:opacity-50 disabled:cursor-not-allowed',
          'overflow-y-auto'
        )}
        style={{ minHeight: '42px', maxHeight: '140px' }}
      />

      <button
        type="button"
        onClick={submit}
        disabled={!canSend}
        aria-label="Send message"
        className={cn(
          'flex items-center justify-center w-10 h-10 rounded-[var(--radius)] shrink-0',
          'transition-all duration-200 cursor-pointer select-none',
          'active:scale-[0.98]',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background',
          canSend
            ? 'bg-primary text-white hover:bg-primary-hover'
            : 'bg-card border border-border text-text-muted cursor-not-allowed'
        )}
      >
        <SendHorizonal className="w-4 h-4" aria-hidden="true" />
      </button>
    </div>
  );
}
