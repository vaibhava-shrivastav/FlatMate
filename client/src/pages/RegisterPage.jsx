import PageLayout from '@components/layout/PageLayout';
import Register from '@components/auth/Register';

export default function RegisterPage() {
  return (
    <PageLayout centered className="py-12">
      <Register />
    </PageLayout>
  );
}
