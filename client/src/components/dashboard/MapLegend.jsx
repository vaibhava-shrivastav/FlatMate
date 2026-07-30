const LEGEND_ITEMS = [
  { color: '#22C55E', label: '80%+ match' },
  { color: '#2563EB', label: 'Listed room' },
];

export default function MapLegend() {
  return (
    <div className="absolute bottom-5 left-3 z-[1000] flex flex-col gap-1.5 bg-card border border-border rounded-[var(--radius)] px-3 py-2.5">
      <p className="text-[10px] font-medium text-text-muted uppercase tracking-wider mb-0.5">
        Legend
      </p>
      {LEGEND_ITEMS.map(({ color, label }) => (
        <div key={label} className="flex items-center gap-2">
          <span
            className="w-3 h-3 rounded-full shrink-0 border border-white/20"
            style={{ background: color }}
            aria-hidden="true"
          />
          <span className="text-xs text-text-muted">{label}</span>
        </div>
      ))}
    </div>
  );
}
