import { cn } from '@utils/cn';

export default function CompatibilityBadge({ score, className }) {
  const color =
    score >= 80 ? 'text-success bg-success/10 border-success/20' :
    score >= 60 ? 'text-primary bg-primary/10 border-primary/20' :
                  'text-text-muted bg-border/40 border-border';

  return (
    <span
      className={cn(
        'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border',
        color,
        className
      )}
    >
      {score}% match
    </span>
  );
}
