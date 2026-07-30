import { Link } from 'react-router-dom';
import { ShieldOff } from 'lucide-react';
import Button from '@components/common/Button';

export default function Unauthorized() {
  return (
    <div className="flex flex-col items-center justify-center gap-5 py-24 text-center px-4">
      <div className="flex items-center justify-center w-14 h-14 rounded-full bg-card border border-border">
        <ShieldOff className="w-6 h-6 text-text-muted" aria-hidden="true" />
      </div>

      <div className="flex flex-col gap-1.5 max-w-xs">
        <h1 className="text-base font-semibold text-text">Access denied</h1>
        <p className="text-sm text-text-muted leading-relaxed">
          You don&apos;t have permission to view this page.
        </p>
      </div>

      <div className="flex items-center gap-2">
        <Button variant="secondary" size="sm" as={Link} to="/dashboard">
          Go to dashboard
        </Button>
      </div>
    </div>
  );
}
