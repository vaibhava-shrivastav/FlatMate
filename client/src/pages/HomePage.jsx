import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Search,
  MapPin,
  ShieldCheck,
  Users,
  BedDouble,
  ArrowRight,
  CheckCircle2,
  SlidersHorizontal,
  Clock,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '@hooks/useAuth';
import { MOCK_LISTINGS } from '@data/mockListings';
import ListingCard from '@components/dashboard/ListingCard';
import Button from '@components/common/Button';

const QUICK_LOCATIONS = [
  'Knowledge Park II',
  'Knowledge Park III',
  'Pari Chowk',
  'Alpha 1',
  'Beta 1',
  'Delta 2',
  'Jagat Farm',
  'Gaur City',
];

const FEATURES = [
  {
    step: '01',
    title: 'Profile your daily habits',
    desc: 'Answer a 2-minute lifestyle quiz covering your sleep patterns, cleanliness expectations, remote work habits, and guest policy.',
    icon: SlidersHorizontal,
  },
  {
    step: '02',
    title: 'Review compatibility scores',
    desc: 'Browse verified rooms and roommates with automatic percentage match scores calculated from your lifestyle overlap.',
    icon: Sparkles,
  },
  {
    step: '03',
    title: 'Direct chat with no middlemen',
    desc: 'Message flatmates or room owners directly in real-time. Schedule walk-throughs and lock in agreements without broker fees.',
    icon: Users,
  },
];

const COMPATIBILITY_PILLARS = [
  {
    title: 'Sleep schedules & routines',
    detail: 'Early risers paired with morning people; night owls paired with quiet evening schedules.',
  },
  {
    title: 'Cleanliness & chores',
    detail: 'Clear standards for kitchen maintenance, shared washrooms, and domestic chores.',
  },
  {
    title: 'Work from home & quiet hours',
    detail: 'Dedicated study tables, high-speed fiber internet, and agreed quiet hours for calls and focus.',
  },
  {
    title: 'Guest & hosting boundaries',
    detail: 'Upfront agreements on friends visiting, weekend social gatherings, and mutual privacy.',
  },
];

export default function HomePage() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    const query = searchQuery.trim();
    if (query) {
      navigate(`/dashboard?search=${encodeURIComponent(query)}`);
    } else {
      navigate('/dashboard');
    }
  };

  const handleLocationClick = (loc) => {
    navigate(`/dashboard?search=${encodeURIComponent(loc)}`);
  };

  const featuredListings = MOCK_LISTINGS.slice(0, 3);

  return (
    <div className="flex flex-col min-h-screen">
      {/* ── HERO SECTION ── */}
      <section className="border-b border-border bg-stone-50/50 py-16 sm:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col items-center text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-border bg-card text-xs font-medium text-text-muted mb-6">
            <ShieldCheck className="w-3.5 h-3.5 text-primary" />
            <span>Verified student & professional flat sharing in Greater Noida</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-semibold text-text tracking-tight max-w-3xl leading-tight">
            Find a verified room.
            <br />
            <span className="text-primary">Live with someone who fits your rhythm.</span>
          </h1>

          <p className="mt-4 text-base sm:text-lg text-text-muted max-w-2xl leading-relaxed">
            FlatMate connects students from GL Bajaj, Sharda, Galgotias, Bennett, and working professionals
            through daily habit compatibility, transparent room specs, and direct in-app chat. Zero broker fees.
          </p>

          {/* Quick Search Form */}
          <form
            onSubmit={handleSearchSubmit}
            className="w-full max-w-2xl mt-8 flex flex-col sm:flex-row items-center gap-2 bg-card p-2 border border-border rounded-[var(--radius)] shadow-sm"
          >
            <div className="flex items-center gap-2 px-3 py-2 w-full">
              <Search className="w-4 h-4 text-text-muted shrink-0" />
              <input
                type="text"
                placeholder="Search in Greater Noida (e.g. Knowledge Park, Pari Chowk, Alpha 1, Sharda)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full text-sm bg-transparent border-none outline-none text-text placeholder:text-text-muted"
              />
            </div>
            <Button type="submit" size="md" className="w-full sm:w-auto shrink-0">
              Search rooms
            </Button>
          </form>

          {/* Quick Location Chips */}
          <div className="mt-4 flex flex-wrap items-center justify-center gap-2 text-xs text-text-muted">
            <span className="font-medium text-text">Popular areas:</span>
            {QUICK_LOCATIONS.map((loc) => (
              <button
                key={loc}
                type="button"
                onClick={() => handleLocationClick(loc)}
                className="px-2.5 py-1 rounded border border-border bg-card hover:border-primary hover:text-text transition-colors duration-150 cursor-pointer"
              >
                {loc}
              </button>
            ))}
          </div>

          {/* Trust stats row */}
          <div className="mt-12 grid grid-cols-2 sm:grid-cols-4 gap-4 w-full max-w-3xl pt-8 border-t border-border/60 text-left">
            <div>
              <p className="text-2xl font-semibold text-text">850+</p>
              <p className="text-xs text-text-muted mt-0.5">Verified room listings</p>
            </div>
            <div>
              <p className="text-2xl font-semibold text-text">94%</p>
              <p className="text-xs text-text-muted mt-0.5">Report habit satisfaction</p>
            </div>
            <div>
              <p className="text-2xl font-semibold text-text">₹0</p>
              <p className="text-xs text-text-muted mt-0.5">Brokerage commissions</p>
            </div>
            <div>
              <p className="text-2xl font-semibold text-text">100%</p>
              <p className="text-xs text-text-muted mt-0.5">Direct chat with hosts</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── FEATURED DEMO LISTINGS ── */}
      <section className="py-14 sm:py-16 max-w-7xl mx-auto px-4 sm:px-6 w-full">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
          <div>
            <p className="text-xs font-semibold text-primary uppercase tracking-wider">Available Spaces</p>
            <h2 className="text-2xl sm:text-3xl font-semibold text-text tracking-tight mt-1">
              Curated rooms ready for move-in
            </h2>
            <p className="text-sm text-text-muted mt-1">
              Explore spaces with active listings, verified amenities, and habit scores.
            </p>
          </div>
          <Link
            to="/dashboard"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:text-primary-hover transition-colors"
          >
            <span>View all listings</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {featuredListings.map((listing) => (
            <ListingCard key={listing._id} listing={listing} />
          ))}
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section className="py-14 sm:py-16 bg-card border-y border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <p className="text-xs font-semibold text-primary uppercase tracking-wider">How FlatMate Works</p>
            <h2 className="text-2xl sm:text-3xl font-semibold text-text tracking-tight mt-1">
              Three steps to a frictionless flatshare
            </h2>
            <p className="text-sm text-text-muted mt-2">
              Designed around respect, quiet spaces, and verified identity.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {FEATURES.map(({ step, title, desc, icon: Icon }) => (
              <div
                key={step}
                className="p-6 border border-border rounded-[var(--radius)] bg-background flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-xs font-mono font-bold text-text-muted bg-stone-200/60 px-2 py-0.5 rounded">
                      {step}
                    </span>
                    <Icon className="w-5 h-5 text-primary" />
                  </div>
                  <h3 className="text-base font-semibold text-text mb-2">{title}</h3>
                  <p className="text-sm text-text-muted leading-relaxed">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── HABIT COMPATIBILITY SECTION ── */}
      <section className="py-14 sm:py-16 max-w-7xl mx-auto px-4 sm:px-6 w-full">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
          <div>
            <p className="text-xs font-semibold text-primary uppercase tracking-wider">Compatibility First</p>
            <h2 className="text-2xl sm:text-3xl font-semibold text-text tracking-tight mt-1">
              Why habit matching solves roommate headaches
            </h2>
            <p className="text-sm text-text-muted mt-3 leading-relaxed">
              Most shared housing friction comes down to basic day-to-day lifestyle mismatches:
              dishes in the sink, midnight calls, or differing sleep schedules. FlatMate scores
              compatibility across core living metrics before you make commitments.
            </p>

            <div className="mt-6 space-y-4">
              {COMPATIBILITY_PILLARS.map(({ title, detail }) => (
                <div key={title} className="flex items-start gap-3">
                  <CheckCircle2 className="w-4 h-4 text-primary shrink-0 mt-1" />
                  <div>
                    <p className="text-sm font-semibold text-text">{title}</p>
                    <p className="text-xs text-text-muted mt-0.5 leading-relaxed">{detail}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-8 flex items-center gap-3">
              <Button as={Link} to={isAuthenticated ? '/dashboard' : '/register'}>
                Find compatible roommates
              </Button>
              <Button as={Link} to="/dashboard" variant="secondary">
                View campus rooms
              </Button>
            </div>
          </div>

          {/* Clean habit sample card */}
          <div className="p-6 border border-border rounded-[var(--radius)] bg-card flex flex-col gap-5">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <div>
                <p className="text-xs text-text-muted font-medium">Sample Match Analysis</p>
                <p className="text-base font-semibold text-text">Kartik & You</p>
              </div>
              <span className="inline-flex items-center text-sm font-semibold text-primary">
                94% Match
              </span>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <div className="flex justify-between text-text mb-1 font-medium">
                  <span>Sleep schedule (11:00 PM - 7:00 AM)</span>
                  <span className="text-primary font-semibold">95%</span>
                </div>
                <div className="w-full bg-stone-200 h-1.5 rounded-full overflow-hidden">
                  <div className="bg-primary h-full w-[95%]" />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-text mb-1 font-medium">
                  <span>Cleanliness & chore sharing</span>
                  <span className="text-primary font-semibold">90%</span>
                </div>
                <div className="w-full bg-stone-200 h-1.5 rounded-full overflow-hidden">
                  <div className="bg-primary h-full w-[90%]" />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-text mb-1 font-medium">
                  <span>Study / Remote work focus</span>
                  <span className="text-primary font-semibold">98%</span>
                </div>
                <div className="w-full bg-stone-200 h-1.5 rounded-full overflow-hidden">
                  <div className="bg-primary h-full w-[98%]" />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-text mb-1 font-medium">
                  <span>Guest & weekend policy</span>
                  <span className="text-primary font-semibold">92%</span>
                </div>
                <div className="w-full bg-stone-200 h-1.5 rounded-full overflow-hidden">
                  <div className="bg-primary h-full w-[92%]" />
                </div>
              </div>
            </div>

            <div className="pt-2 border-t border-border flex items-center justify-between text-xs text-text-muted">
              <span>Verified student host</span>
              <span className="text-primary font-medium">Knowledge Park II, Greater Noida</span>
            </div>
          </div>
        </div>
      </section>

      {/* ── CALL TO ACTION ── */}
      <section className="py-14 sm:py-16 bg-stone-50 border-t border-border">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center">
          <h2 className="text-2xl sm:text-3xl font-semibold text-text tracking-tight">
            Ready to find your room or post an open space?
          </h2>
          <p className="mt-3 text-sm text-text-muted max-w-xl mx-auto leading-relaxed">
            Join students from GL Bajaj, Sharda, Galgotias, Bennett, and young professionals living across Greater Noida.
          </p>

          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <Button as={Link} to={isAuthenticated ? '/dashboard' : '/register'} size="lg">
              {isAuthenticated ? 'Go to Dashboard' : 'Create account'}
            </Button>
            <Button as={Link} to="/dashboard" variant="secondary" size="lg">
              Explore available rooms
            </Button>
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="mt-auto border-t border-border bg-card py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-text-muted">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-text">FlatMate</span>
            <span>— Verified roommate & flat sharing</span>
          </div>

          <div className="flex items-center gap-5">
            <Link to="/dashboard" className="hover:text-text transition-colors">
              Listings
            </Link>
            <Link to="/chat" className="hover:text-text transition-colors">
              Messages
            </Link>
            <Link to="/login" className="hover:text-text transition-colors">
              Sign In
            </Link>
            <Link to="/register" className="hover:text-text transition-colors">
              Register
            </Link>
          </div>

          <p>© {new Date().getFullYear()} FlatMate. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
