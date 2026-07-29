import Bone from '@components/common/Skeleton';

export default function MapSkeleton() {
  return (
    <div
      className="relative w-full rounded-[var(--radius)] overflow-hidden border border-border bg-card"
      style={{ height: 560 }}
      aria-label="Loading map"
      aria-busy="true"
    >
      {/* Simulated tile grid */}
      <div className="absolute inset-0 grid grid-cols-4 grid-rows-4 gap-px opacity-30">
        {Array.from({ length: 16 }, (_, i) => (
          <Bone key={i} className="rounded-none w-full h-full" />
        ))}
      </div>

      {/* Simulated markers */}
      <div className="absolute inset-0">
        {[
          { top: '30%', left: '25%' },
          { top: '45%', left: '55%' },
          { top: '60%', left: '35%' },
          { top: '25%', left: '65%' },
          { top: '70%', left: '70%' },
        ].map((pos, i) => (
          <div
            key={i}
            className="absolute w-7 h-7 bg-border/80 rounded-full animate-pulse border-2 border-background"
            style={{ top: pos.top, left: pos.left, animationDelay: `${i * 0.15}s` }}
            aria-hidden="true"
          />
        ))}
      </div>

      {/* Simulated controls */}
      <div className="absolute bottom-5 right-3 flex flex-col gap-1.5">
        {[0, 1, 2, 3].map((i) => (
          <Bone key={i} className="w-9 h-9 rounded-[var(--radius)]" />
        ))}
      </div>

      {/* Simulated legend */}
      <div className="absolute bottom-5 left-3">
        <Bone className="w-28 h-16 rounded-[var(--radius)]" />
      </div>

      {/* Center label */}
      <div className="absolute inset-0 flex items-center justify-center">
        <p className="text-sm text-text-muted">Loading map…</p>
      </div>
    </div>
  );
}
