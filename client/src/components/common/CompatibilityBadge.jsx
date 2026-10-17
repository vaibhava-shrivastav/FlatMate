import { cn } from '@utils/cn';

export default function CompatibilityBadge({ score, className }) {
  const color =
    score >= 80 ? 'text-success' :
    score >= 60 ? 'text-primary' :
                  'text-text-muted';

  return (
    <span
      className={cn(
        'inline-flex items-center text-xs font-medium',
        color,
        className
      )}
    >
      {score}% match
    </span>
  );
}
