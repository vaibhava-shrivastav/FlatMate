import { cn } from '@utils/cn';

export default function Bone({ className }) {
  return (
    <div
      className={cn('bg-border/60 rounded animate-pulse', className)}
      aria-hidden="true"
    />
  );
}
