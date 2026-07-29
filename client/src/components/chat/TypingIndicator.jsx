export default function TypingIndicator({ name }) {
  return (
    <div className="flex items-end gap-2.5 px-4 py-1">
      <div className="flex items-center gap-1.5 bg-card border border-border rounded-2xl rounded-bl-sm px-3.5 py-2.5">
        <span className="flex gap-1 items-center" aria-label={`${name} is typing`}>
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              className="w-1.5 h-1.5 rounded-full bg-text-muted"
              style={{
                animation: 'typing-bounce 1.2s ease-in-out infinite',
                animationDelay: `${i * 0.2}s`,
              }}
            />
          ))}
        </span>
      </div>
    </div>
  );
}
