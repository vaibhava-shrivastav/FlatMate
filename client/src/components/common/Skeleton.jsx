import { cn } from '@utils/cn';

export default function Bone({ className }) {
  return (
    <div
      className={cn('bg-stone-200 rounded animate-pulse', className)}
      aria-hidden="true"
    />
  );
}
