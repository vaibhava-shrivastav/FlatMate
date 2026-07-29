import PageLayout from '@components/layout/PageLayout';
import Login from '@components/auth/Login';

export default function LoginPage() {
  return (
    <PageLayout centered className="py-12">
      <Login />
    </PageLayout>
  );
}
