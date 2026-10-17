import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  User,
  Mail,
  MapPin,
  BadgeCheck,
  SlidersHorizontal,
  LogOut,
  Sparkles,
  BedDouble,
  GraduationCap,
  Calendar,
  MessageSquare,
  ArrowLeft,
} from 'lucide-react';
import { useAuth } from '@hooks/useAuth';
import api from '@services/api';
import { formatCurrency } from '@utils/formatters';
import PageLayout from '@components/layout/PageLayout';
import Button from '@components/common/Button';
import ListingCard from '@components/dashboard/ListingCard';
import Loading from '@components/common/Loading';
import { MOCK_LISTINGS } from '@data/mockListings';
import { MOCK_USERS, findMockUser } from '@data/mockUsers';

export default function ProfilePage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user: currentUser, logout } = useAuth();

  const isOwnProfile = !id || id === 'me' || id === currentUser?._id;
  const [profileUser, setProfileUser] = useState(null);
  const [isLoading, setIsLoading] = useState(!isOwnProfile);

  useEffect(() => {
    if (isOwnProfile) {
      setProfileUser(currentUser);
      setIsLoading(false);
      return;
    }

    let cancelled = false;
    setIsLoading(true);

    const fetchUserProfile = async () => {
      const mock = findMockUser(id);
      try {
        const { data } = await api.get(`/users/${id}`);
        if (!cancelled) {
          setProfileUser(data || mock);
        }
      } catch {
        if (!cancelled) {
          setProfileUser(mock);
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    fetchUserProfile();
    return () => {
      cancelled = true;
    };
  }, [id, isOwnProfile, currentUser]);

  if (isLoading) {
    return (
      <PageLayout centered>
        <Loading message="Loading profile..." />
      </PageLayout>
    );
  }

  // Active target user with resilient demo fallback
  const targetUser = isOwnProfile ? currentUser : profileUser;
  const mockFallback = findMockUser(id) || MOCK_USERS[0];

  const displayName = targetUser?.name || targetUser?.fullName || mockFallback.name;
  const displayEmail = targetUser?.email || mockFallback.email;
  const displayRole = (targetUser?.role || mockFallback.role) === 'HAS_ROOM' ? 'Offering a Room' : 'Looking for a Flatmate';
  const displayBudget = targetUser?.budget || mockFallback.budget || 8500;
  const isVerified = targetUser?.isVerified ?? true;
  const institution = targetUser?.institution || mockFallback.institution || 'GL Bajaj Institute of Technology';
  const locationText = targetUser?.location?.area
    ? `${targetUser.location.area}, Greater Noida`
    : mockFallback.location || 'Knowledge Park II, Greater Noida';
  const bio = targetUser?.bio || mockFallback.bio || 'Student / working professional based in Greater Noida.';

  const habitVector = targetUser?.habitVector || mockFallback.habitVector || {
    sleepSchedule: 8,
    cleanliness: 9,
    noise: 8,
    guests: 4,
    cooking: 7,
    smoking: 1,
  };

  const HABIT_METRICS = [
    {
      label: 'Sleep Schedule',
      value: habitVector.sleepSchedule ?? 8,
      detail: 'Early riser (11:00 PM – 7:00 AM)',
      max: 10,
    },
    {
      label: 'Cleanliness & Chores',
      value: habitVector.cleanliness ?? 9,
      detail: 'Daily shared cleaning & hygiene priority',
      max: 10,
    },
    {
      label: 'Study & Noise Level',
      value: habitVector.noise ?? 8,
      detail: 'Prefers quiet evening hours for exam focus',
      max: 10,
    },
    {
      label: 'Guest Policy',
      value: habitVector.guests ?? 4,
      detail: 'Visitors welcome with advance notice',
      max: 10,
    },
    {
      label: 'Cooking & Kitchen',
      value: habitVector.cooking ?? 7,
      detail: 'Shared kitchen with vegetarian cooking',
      max: 10,
    },
    {
      label: 'Smoking / Alcohol',
      value: habitVector.smoking ?? 1,
      detail: 'Strict non-smoker household preference',
      max: 10,
    },
  ];

  // Get listings posted by or associated with this user
  const userListings = MOCK_LISTINGS.filter(
    (l) =>
      l.owner?._id === id ||
      l.owner?._id === targetUser?._id ||
      mockFallback.listings?.includes(l._id)
  );

  const displayListings = userListings.length > 0 ? userListings : MOCK_LISTINGS.slice(0, 2);

  const handleStartChat = () => {
    navigate('/chat', { state: { recipient: targetUser || mockFallback } });
  };

  return (
    <PageLayout>
      <div className="flex flex-col gap-8 max-w-4xl mx-auto pb-12">
        {/* Back navigation button if viewing other user */}
        {!isOwnProfile && (
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="flex items-center gap-1.5 text-sm text-text-muted hover:text-text transition-colors duration-150 cursor-pointer self-start"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </button>
        )}

        {/* Profile Header Card */}
        <div className="p-6 sm:p-8 border border-border rounded-[var(--radius)] bg-card flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div className="flex items-start sm:items-center gap-5">
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-primary/10 border-2 border-primary/20 flex items-center justify-center text-primary text-2xl font-bold shrink-0">
              {displayName?.[0]?.toUpperCase() ?? 'U'}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl sm:text-2xl font-bold text-text tracking-tight">
                  {displayName}
                </h1>
                {isVerified && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full border border-primary/20 bg-primary/10 text-xs font-medium text-primary">
                    <BadgeCheck className="w-3.5 h-3.5" />
                    Verified User
                  </span>
                )}
              </div>
              <p className="text-sm text-text-muted mt-0.5">{displayEmail}</p>
              <div className="flex items-center gap-2 text-xs text-text-muted mt-2 flex-wrap">
                <span className="px-2 py-0.5 rounded bg-stone-100 font-medium text-text">
                  {displayRole}
                </span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <GraduationCap className="w-3.5 h-3.5 text-primary" />
                  {institution}
                </span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <MapPin className="w-3 h-3 text-primary" />
                  {locationText}
                </span>
              </div>
            </div>
          </div>

          <div className="flex sm:flex-col items-center gap-2.5 w-full sm:w-auto">
            {isOwnProfile ? (
              <>
                <Button as={Link} to="/onboarding" variant="secondary" size="sm" className="w-full sm:w-auto text-xs">
                  <SlidersHorizontal className="w-3.5 h-3.5" />
                  <span>Edit Habits</span>
                </Button>
                <Button onClick={logout} variant="ghost" size="sm" className="w-full sm:w-auto text-xs text-danger hover:text-danger hover:bg-red-50">
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Sign out</span>
                </Button>
              </>
            ) : (
              <Button onClick={handleStartChat} size="md" className="w-full sm:w-auto flex items-center gap-2">
                <MessageSquare className="w-4 h-4" />
                <span>Message Host</span>
              </Button>
            )}
          </div>
        </div>

        {/* Bio */}
        {bio && (
          <div className="p-5 border border-border rounded-[var(--radius)] bg-card">
            <h2 className="text-xs font-semibold text-text uppercase tracking-wider mb-1.5">About</h2>
            <p className="text-sm text-text-muted leading-relaxed">{bio}</p>
          </div>
        )}

        {/* Quick Preferences Overview */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="p-4 border border-border rounded-[var(--radius)] bg-card">
            <p className="text-xs text-text-muted font-medium">Monthly Budget</p>
            <p className="text-lg font-semibold text-text mt-1">{formatCurrency(displayBudget)}</p>
            <p className="text-[11px] text-text-muted mt-0.5">Target rent limit</p>
          </div>
          <div className="p-4 border border-border rounded-[var(--radius)] bg-card">
            <p className="text-xs text-text-muted font-medium">College / Hub</p>
            <p className="text-sm font-semibold text-text mt-1 truncate">{institution.split('(')[0]}</p>
            <p className="text-[11px] text-text-muted mt-0.5">Greater Noida</p>
          </div>
          <div className="p-4 border border-border rounded-[var(--radius)] bg-card">
            <p className="text-xs text-text-muted font-medium">Preferred Room</p>
            <p className="text-sm font-semibold text-text mt-1">{mockFallback.roomPreference || 'Private Room'}</p>
            <p className="text-[11px] text-text-muted mt-0.5">In 2BHK/3BHK Flat</p>
          </div>
          <div className="p-4 border border-border rounded-[var(--radius)] bg-card">
            <p className="text-xs text-text-muted font-medium">Move-in Date</p>
            <p className="text-sm font-semibold text-text mt-1">{mockFallback.moveInDate || 'Immediate'}</p>
            <p className="text-[11px] text-text-muted mt-0.5">Ready for move-in</p>
          </div>
        </div>

        {/* 6D Lifestyle Habit Vector Breakdown */}
        <div className="p-6 border border-border rounded-[var(--radius)] bg-card flex flex-col gap-6">
          <div className="flex items-center justify-between pb-3 border-b border-border">
            <div>
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-primary" />
                <h2 className="text-sm font-semibold text-text uppercase tracking-wider">
                  Lifestyle & Habit Vector
                </h2>
              </div>
              <p className="text-xs text-text-muted mt-0.5">
                Daily routines and shared living expectations in Greater Noida.
              </p>
            </div>
            {isOwnProfile && (
              <Link
                to="/onboarding"
                className="text-xs font-medium text-primary hover:text-primary-hover transition-colors"
              >
                Retake quiz →
              </Link>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {HABIT_METRICS.map(({ label, value, detail, max }) => {
              const percent = Math.round((value / max) * 100);
              return (
                <div key={label} className="p-3.5 border border-border/70 rounded bg-stone-50/50 flex flex-col gap-2">
                  <div className="flex items-center justify-between text-xs font-medium">
                    <span className="text-text">{label}</span>
                    <span className="text-primary font-bold">{value} / {max}</span>
                  </div>
                  <div className="w-full bg-stone-200 h-1.5 rounded-full overflow-hidden">
                    <div className="bg-primary h-full transition-all duration-300" style={{ width: `${percent}%` }} />
                  </div>
                  <p className="text-[11px] text-text-muted">{detail}</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Listings Section (Rooms offered or recommended) */}
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-text">
                {isOwnProfile ? 'Recommended Rooms for You' : `Rooms Hosted by ${displayName.split(' ')[0]}`}
              </h2>
              <p className="text-xs text-text-muted">
                {isOwnProfile ? 'Top matches in Greater Noida' : `Active flatshares in Greater Noida`}
              </p>
            </div>
            <Button as={Link} to="/dashboard" variant="secondary" size="sm">
              View all listings
            </Button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {displayListings.map((listing) => (
              <ListingCard key={listing._id} listing={listing} />
            ))}
          </div>
        </div>
      </div>
    </PageLayout>
  );
}
