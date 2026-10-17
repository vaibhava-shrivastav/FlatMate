import { Link } from 'react-router-dom';
import {
  User,
  Mail,
  MapPin,
  BadgeCheck,
  ShieldCheck,
  SlidersHorizontal,
  Home,
  LogOut,
  Sparkles,
  BedDouble,
  GraduationCap,
  Calendar,
} from 'lucide-react';
import { useAuth } from '@hooks/useAuth';
import { formatCurrency } from '@utils/formatters';
import PageLayout from '@components/layout/PageLayout';
import Button from '@components/common/Button';
import ListingCard from '@components/dashboard/ListingCard';
import { MOCK_LISTINGS } from '@data/mockListings';

export default function ProfilePage() {
  const { user, logout } = useAuth();

  // If user has not completed onboarding or is a test session, provide realistic fallback demo profile
  const displayName = user?.name || user?.fullName || 'Aayush Kumar';
  const displayEmail = user?.email || 'aayush.kumar@example.com';
  const displayRole = user?.role === 'HAS_ROOM' ? 'Offering a Room' : 'Looking for a Flatmate';
  const displayBudget = user?.budget || 8500;
  const isVerified = user?.isVerified ?? true;

  const habitVector = user?.habitVector || {
    sleepSchedule: 8,
    cleanliness: 9,
    noise: 8,
    guests: 5,
    cooking: 7,
    smoking: 1,
  };

  const HABIT_METRICS = [
    {
      label: 'Sleep Schedule',
      value: habitVector.sleepSchedule,
      detail: 'Early riser (11:00 PM – 7:00 AM)',
      max: 10,
    },
    {
      label: 'Cleanliness & Chores',
      value: habitVector.cleanliness,
      detail: 'Daily shared cleaning & hygiene priority',
      max: 10,
    },
    {
      label: 'Study & Noise Level',
      value: habitVector.noise,
      detail: 'Prefers quiet evening hours for focus',
      max: 10,
    },
    {
      label: 'Guest Policy',
      value: habitVector.guests,
      detail: 'Visitors welcome with advance notice',
      max: 10,
    },
    {
      label: 'Cooking & Kitchen',
      value: habitVector.cooking,
      detail: 'Shared kitchen with vegetarian cooking',
      max: 10,
    },
    {
      label: 'Smoking / Alcohol',
      value: habitVector.smoking,
      detail: 'Strict non-smoker household preference',
      max: 10,
    },
  ];

  const savedListings = MOCK_LISTINGS.slice(0, 2);

  return (
    <PageLayout>
      <div className="flex flex-col gap-8 max-w-4xl mx-auto pb-12">
        {/* Profile Header Card */}
        <div className="p-6 sm:p-8 border border-border rounded-[var(--radius)] bg-card flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-primary/10 border-2 border-primary/20 flex items-center justify-center text-primary text-2xl font-bold">
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
                    Verified Student
                  </span>
                )}
              </div>
              <p className="text-sm text-text-muted mt-0.5">{displayEmail}</p>
              <div className="flex items-center gap-2 text-xs text-text-muted mt-2">
                <span className="px-2 py-0.5 rounded bg-stone-100 font-medium text-text">
                  {displayRole}
                </span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <MapPin className="w-3 h-3 text-primary" />
                  Greater Noida, UP
                </span>
              </div>
            </div>
          </div>

          <div className="flex sm:flex-col items-center gap-2.5 w-full sm:w-auto">
            <Button as={Link} to="/onboarding" variant="secondary" size="sm" className="w-full sm:w-auto text-xs">
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span>Edit Habits</span>
            </Button>
            <Button onClick={logout} variant="ghost" size="sm" className="w-full sm:w-auto text-xs text-danger hover:text-danger hover:bg-red-50">
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign out</span>
            </Button>
          </div>
        </div>

        {/* Quick Preferences Overview */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="p-4 border border-border rounded-[var(--radius)] bg-card">
            <p className="text-xs text-text-muted font-medium">Monthly Budget</p>
            <p className="text-lg font-semibold text-text mt-1">{formatCurrency(displayBudget)}</p>
            <p className="text-[11px] text-text-muted mt-0.5">Maximum rent target</p>
          </div>
          <div className="p-4 border border-border rounded-[var(--radius)] bg-card">
            <p className="text-xs text-text-muted font-medium">College / Hub</p>
            <p className="text-base font-semibold text-text mt-1">Knowledge Park II</p>
            <p className="text-[11px] text-text-muted mt-0.5">GL Bajaj / Galgotias</p>
          </div>
          <div className="p-4 border border-border rounded-[var(--radius)] bg-card">
            <p className="text-xs text-text-muted font-medium">Preferred Room</p>
            <p className="text-base font-semibold text-text mt-1">Private Room</p>
            <p className="text-[11px] text-text-muted mt-0.5">In 2BHK/3BHK Flat</p>
          </div>
          <div className="p-4 border border-border rounded-[var(--radius)] bg-card">
            <p className="text-xs text-text-muted font-medium">Target Move-in</p>
            <p className="text-base font-semibold text-text mt-1">Immediate</p>
            <p className="text-[11px] text-text-muted mt-0.5">Ready for semester</p>
          </div>
        </div>

        {/* 6D Lifestyle Habit Vector Breakdown */}
        <div className="p-6 border border-border rounded-[var(--radius)] bg-card flex flex-col gap-6">
          <div className="flex items-center justify-between pb-3 border-b border-border">
            <div>
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-primary" />
                <h2 className="text-sm font-semibold text-text uppercase tracking-wider">
                  My Lifestyle & Habit Vector
                </h2>
              </div>
              <p className="text-xs text-text-muted mt-0.5">
                Used to calculate mutual compatibility with Greater Noida room hosts and flatmates.
              </p>
            </div>
            <Link
              to="/onboarding"
              className="text-xs font-medium text-primary hover:text-primary-hover transition-colors"
            >
              Retake quiz →
            </Link>
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

        {/* Saved & Recommended Greater Noida Listings */}
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-text">Recommended Rooms for You</h2>
              <p className="text-xs text-text-muted">Top compatibility matches in Greater Noida</p>
            </div>
            <Button as={Link} to="/dashboard" variant="secondary" size="sm">
              View all listings
            </Button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {savedListings.map((listing) => (
              <ListingCard key={listing._id} listing={listing} />
            ))}
          </div>
        </div>
      </div>
    </PageLayout>
  );
}
