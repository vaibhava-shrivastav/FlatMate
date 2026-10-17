import { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import {
  ArrowLeft,
  ThumbsUp,
  ThumbsDown,
  BadgeCheck,
  MapPin,
  BedDouble,
  Calendar,
  MessageSquare,
  Sparkles,
  ShieldCheck,
  Check,
} from 'lucide-react';
import api from '@services/api';
import { formatCurrency } from '@utils/formatters';
import { cn } from '@utils/cn';
import Button from '@components/common/Button';
import CompatibilityBadge from '@components/common/CompatibilityBadge';
import Loading from '@components/common/Loading';
import { MOCK_LISTINGS } from '@data/mockListings';

const DEFAULT_COMPATIBILITIES = {
  'gnoida-listing-1': {
    score: 94,
    vibeSummary:
      'Strong lifestyle alignment with Kartik. You both keep consistent early routines, prioritize cleanliness in shared washrooms, and maintain quiet study hours on weeknights for college exams.',
    pros: [
      'Compatible sleep schedule (11:00 PM – 7:00 AM)',
      'High hygiene and chore sharing agreement',
      'Walking distance to GL Bajaj & Galgotias campuses',
      'Quiet study atmosphere with 200 Mbps fiber internet',
      'Non-smoking and non-drinking shared flat',
    ],
    cons: [
      'Shared kitchen requires meal schedule coordination',
      'Guests restricted during exam weeks',
    ],
  },
  'gnoida-listing-2': {
    score: 92,
    vibeSummary:
      'Very high lifestyle harmony with Rhea. Balanced quiet study hours, independent private attached bath, and respectful host policy for medical & engineering students.',
    pros: [
      'Private attached washroom with dedicated geyser',
      'Only 400m from Sharda University campus gate',
      'Daily professional housekeeping included',
      'Air conditioned private workstation',
    ],
    cons: [
      'Advance notice requested for out-of-town visitors',
    ],
  },
  'gnoida-listing-3': {
    score: 89,
    vibeSummary:
      'Great match for daily commuters. Arjun values cleanliness and punctual quiet hours, and the flat is 3 minutes from Alpha 1 Metro Station.',
    pros: [
      '3-minute walk to Alpha 1 Aqua Line Metro',
      'Private balcony with open morning sunlight',
      'Fully equipped kitchen with refrigerator & washing machine',
      'High mutual respect for personal space',
    ],
    cons: [
      'Parking spot shared on alternating schedule',
    ],
  },
};

export default function ProfileDetail({ listingId: propListingId }) {
  const navigate = useNavigate();
  const { id: paramId } = useParams();
  const listingId = propListingId || paramId;

  const [listing, setListing] = useState(null);
  const [compatibility, setCompatibility] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!listingId) return;

    let cancelled = false;
    setIsLoading(true);

    const fetchData = async () => {
      // Find fallback mock listing first
      const mockListing =
        MOCK_LISTINGS.find((l) => l._id === listingId) ||
        MOCK_LISTINGS.find((l) => l.title?.toLowerCase().includes(listingId.toLowerCase())) ||
        MOCK_LISTINGS[0];

      const fallbackCompat =
        DEFAULT_COMPATIBILITIES[listingId] || {
          score: mockListing?.compatibility || 91,
          vibeSummary: `High compatibility with ${mockListing?.owner?.name || 'the host'}. Aligned quiet study hours, shared expectations on common area cleanliness, and mutual respect for personal space in Greater Noida.`,
          pros: [
            'Compatible sleep schedules (11:00 PM – 7:00 AM)',
            'Consistent cleanliness and shared chore ethic',
            'Quiet study and focus hours on weeknights',
            'Close to major Greater Noida campus hubs and transit',
          ],
          cons: [
            'Shared kitchen requires brief cooking coordination',
            'Advance notice required for weekend guests',
          ],
        };

      try {
        const [listingRes, compatRes] = await Promise.allSettled([
          api.get(`/listings/${listingId}`),
          api.get(`/matches/${listingId}`),
        ]);

        if (cancelled) return;

        if (listingRes.status === 'fulfilled' && listingRes.value?.data) {
          const lData = listingRes.value.data.listing ?? listingRes.value.data;
          setListing(lData || mockListing);
        } else {
          setListing(mockListing);
        }

        if (compatRes.status === 'fulfilled' && compatRes.value?.data) {
          const cData = compatRes.value.data.compatibility ?? compatRes.value.data;
          setCompatibility(cData || fallbackCompat);
        } else {
          setCompatibility(fallbackCompat);
        }
      } catch {
        if (!cancelled) {
          setListing(mockListing);
          setCompatibility(fallbackCompat);
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    fetchData();
    return () => {
      cancelled = true;
    };
  }, [listingId]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loading message="Loading profile and compatibility..." />
      </div>
    );
  }

  if (!listing) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-16 text-center">
        <p className="text-text-muted text-sm">Listing profile not found.</p>
        <Button size="sm" variant="secondary" onClick={() => navigate('/dashboard')}>
          Back to listings
        </Button>
      </div>
    );
  }

  const {
    title,
    description,
    rent,
    roomType,
    availableFrom,
    location,
    images,
    amenities = [],
    owner,
  } = listing;

  const imageUrl = images?.[0] ?? null;
  const ownerName = owner?.name ?? 'Verified Host';
  const isVerified = owner?.isVerified ?? true;

  const score = compatibility?.score ?? listing.compatibility ?? 90;
  const vibeSummary = compatibility?.vibeSummary ?? null;
  const pros = compatibility?.pros ?? [];
  const cons = compatibility?.cons ?? [];

  const roomTypeLabels = {
    private: 'Private room',
    shared: 'Shared room',
    studio: 'Studio apartment',
    entire: 'Entire flatshare',
  };

  const handleStartChat = () => {
    navigate('/chat', { state: { recipient: owner, listingTitle: title } });
  };

  return (
    <div className="flex flex-col gap-6 max-w-3xl mx-auto pb-12">
      {/* Back button */}
      <button
        type="button"
        onClick={() => navigate('/dashboard')}
        className="flex items-center gap-1.5 text-sm text-text-muted hover:text-text transition-colors duration-150 cursor-pointer self-start"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to listings
      </button>

      {/* Hero image banner */}
      <div className="relative w-full h-64 sm:h-80 bg-border/30 rounded-[var(--radius)] overflow-hidden border border-border">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <BedDouble className="w-12 h-12 text-border" aria-hidden="true" />
          </div>
        )}
        <div className="absolute top-4 right-4">
          <CompatibilityBadge score={score} className="px-3 py-1 bg-white/95 shadow-sm rounded-full" />
        </div>
      </div>

      {/* Title & Core Pricing Bar */}
      <div className="flex flex-col gap-3">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="flex-1">
            <span className="text-xs font-semibold text-primary uppercase tracking-wider">
              {location?.city || 'Greater Noida'}
            </span>
            <h1 className="text-2xl sm:text-3xl font-semibold text-text tracking-tight mt-0.5">
              {title}
            </h1>
          </div>
          <div className="text-right">
            <span className="text-3xl font-bold text-text">
              {formatCurrency(rent)}
            </span>
            <span className="text-sm font-normal text-text-muted"> / month</span>
          </div>
        </div>

        {/* Location & Tags */}
        <div className="flex flex-wrap items-center gap-4 text-sm text-text-muted pt-1">
          {(location?.area || location?.city) && (
            <span className="flex items-center gap-1.5 text-text font-medium">
              <MapPin className="w-4 h-4 text-primary shrink-0" aria-hidden="true" />
              {location.area ? `${location.area}, ${location.city ?? 'Greater Noida'}` : location.city}
            </span>
          )}

          {roomType && (
            <span className="flex items-center gap-1.5">
              <BedDouble className="w-4 h-4 shrink-0 text-text-muted" aria-hidden="true" />
              {roomTypeLabels[roomType] ?? roomType}
            </span>
          )}

          {availableFrom && (
            <span className="flex items-center gap-1.5">
              <Calendar className="w-4 h-4 shrink-0 text-text-muted" aria-hidden="true" />
              {new Date(availableFrom) <= new Date()
                ? 'Available now'
                : `Move-in from ${new Date(availableFrom).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' })}`}
            </span>
          )}
        </div>
      </div>

      {/* Host Profile Card & Action */}
      <div className="p-5 border border-border rounded-[var(--radius)] bg-card flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-primary font-semibold text-lg">
            {ownerName?.[0]?.toUpperCase() ?? 'H'}
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <p className="text-base font-semibold text-text">{ownerName}</p>
              {isVerified && (
                <BadgeCheck className="w-4 h-4 text-primary" aria-label="Verified Host" />
              )}
            </div>
            <p className="text-xs text-text-muted mt-0.5">
              Verified Host • {location?.area ?? 'Greater Noida'}
            </p>
          </div>
        </div>

        <Button onClick={handleStartChat} className="w-full sm:w-auto shrink-0 flex items-center gap-2">
          <MessageSquare className="w-4 h-4" />
          <span>Message Host</span>
        </Button>
      </div>

      {/* Description */}
      {description && (
        <div className="p-5 border border-border rounded-[var(--radius)] bg-card flex flex-col gap-2">
          <h2 className="text-sm font-semibold text-text uppercase tracking-wider">About This Space</h2>
          <p className="text-sm text-text-muted leading-relaxed">{description}</p>
        </div>
      )}

      {/* Amenities */}
      {amenities.length > 0 && (
        <div className="p-5 border border-border rounded-[var(--radius)] bg-card flex flex-col gap-3">
          <h2 className="text-sm font-semibold text-text uppercase tracking-wider">Included Amenities</h2>
          <div className="flex flex-wrap gap-2">
            {amenities.map((item) => (
              <span
                key={item}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded border border-border bg-stone-50 text-xs font-medium text-text"
              >
                <Check className="w-3.5 h-3.5 text-primary" />
                {item}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* AI Lifestyle Compatibility Breakdown */}
      <div className="p-5 border border-border rounded-[var(--radius)] bg-card flex flex-col gap-5">
        <div className="flex items-center justify-between pb-3 border-b border-border">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-primary" />
            <h2 className="text-sm font-semibold text-text uppercase tracking-wider">
              AI Lifestyle Compatibility
            </h2>
          </div>
          <span className="text-sm font-bold text-primary">{score}% Overall Match</span>
        </div>

        {/* Vibe summary */}
        {vibeSummary && (
          <div className="p-3.5 bg-stone-50 border border-stone-200 rounded text-sm text-text leading-relaxed">
            {vibeSummary}
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Pros */}
          {pros.length > 0 && (
            <div className="p-4 border border-border rounded-[var(--radius)] bg-background flex flex-col gap-2.5">
              <div className="flex items-center gap-2">
                <ThumbsUp className="w-4 h-4 text-primary shrink-0" aria-hidden="true" />
                <span className="text-xs font-semibold text-text uppercase tracking-wider">
                  Lifestyle Harmonies
                </span>
              </div>
              <ul className="flex flex-col gap-2">
                {pros.map((pro, i) => (
                  <li key={i} className="flex items-start gap-2 text-xs text-text-muted leading-relaxed">
                    <span className="mt-1 w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
                    <span>{pro}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Cons */}
          {cons.length > 0 && (
            <div className="p-4 border border-border rounded-[var(--radius)] bg-background flex flex-col gap-2.5">
              <div className="flex items-center gap-2">
                <ThumbsDown className="w-4 h-4 text-danger shrink-0" aria-hidden="true" />
                <span className="text-xs font-semibold text-text uppercase tracking-wider">
                  Things to Coordinate
                </span>
              </div>
              <ul className="flex flex-col gap-2">
                {cons.map((con, i) => (
                  <li key={i} className="flex items-start gap-2 text-xs text-text-muted leading-relaxed">
                    <span className="mt-1 w-1.5 h-1.5 rounded-full bg-danger shrink-0" />
                    <span>{con}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}