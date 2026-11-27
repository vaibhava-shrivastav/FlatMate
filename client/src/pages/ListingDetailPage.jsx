import { useParams } from 'react-router-dom';
import PageLayout from '@components/layout/PageLayout';
import ProfileDetail from '@components/profile/ProfileDetail';

export default function ListingDetailPage() {
  const { id } = useParams();

  return (
    <PageLayout>
      <ProfileDetail listingId={id} />
    </PageLayout>
  );
}
