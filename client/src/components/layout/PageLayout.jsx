import { cn } from '@utils/cn';

export default function PageLayout({ children, className, centered = false }) {
  return (
    <main
      className={cn(
        'flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 py-8',
        centered && 'flex items-center justify-center',
        className
      )}
    >
      {children}
    </main>
  );
}
