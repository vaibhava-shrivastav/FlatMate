import { Link } from 'react-router-dom';
import PageLayout from '@components/layout/PageLayout';
import Button from '@components/common/Button';

export default function NotFoundPage() {
  return (
    <PageLayout centered>
      <div className="flex flex-col items-center gap-4 text-center">
        <h1 className="text-6xl font-bold text-primary">404</h1>
        <p className="text-text-muted text-sm">This page does not exist.</p>
        <Button as={Link} to="/" size="sm" variant="secondary">
          Go home
        </Button>
      </div>
    </PageLayout>
  );
}
