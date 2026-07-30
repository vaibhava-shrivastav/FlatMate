export default function SessionLoader() {
  return (
    <div className="fixed inset-0 bg-background flex flex-col items-center justify-center gap-6 z-50">
      <div className="flex flex-col items-center gap-4">
        <span className="text-lg font-semibold text-text tracking-tight select-none">Jovac</span>

        <div className="flex items-center gap-1.5" aria-label="Restoring session" role="status">
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              className="w-1.5 h-1.5 rounded-full bg-primary"
              style={{
                animation: 'session-pulse 1.2s ease-in-out infinite',
                animationDelay: `${i * 0.2}s`,
              }}
            />
          ))}
        </div>
      </div>

      <p className="text-xs text-text-muted">Restoring your session…</p>
    </div>
  );
}
