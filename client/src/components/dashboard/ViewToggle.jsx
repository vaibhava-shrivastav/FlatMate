import { LayoutGrid, Map } from 'lucide-react';
import { cn } from '@utils/cn';

const VIEWS = [
  { id: 'grid', label: 'Grid', Icon: LayoutGrid },
  { id: 'map', label: 'Map', Icon: Map },
];

export default function ViewToggle({ activeView, onChange }) {
  return (
    <div
      role="group"
      aria-label="View mode"
      className="flex items-center bg-card border border-border rounded-[var(--radius)] p-0.5"
    >
      {VIEWS.map(({ id, label, Icon }) => {
        const isActive = activeView === id;
        return (
          <button
            key={id}
            type="button"
            onClick={() => onChange(id)}
            aria-pressed={isActive}
            aria-label={`${label} view`}
            className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 rounded-[10px] text-sm font-medium',
              'transition-all duration-200 cursor-pointer select-none',
              'active:scale-[0.98]',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1 focus-visible:ring-offset-card',
              isActive
                ? 'bg-primary text-white'
                : 'text-text-muted hover:text-text',
            )}
          >
            <Icon className="w-3.5 h-3.5" aria-hidden="true" />
            <span>{label}</span>
          </button>
        );
      })}
    </div>
  );
}
