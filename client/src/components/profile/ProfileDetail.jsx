import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ThumbsUp, ThumbsDown, BadgeCheck, MapPin, BedDouble, Calendar } from 'lucide-react';
import api from '@services/api';
import { resolveApiError } from '@utils/authHelpers';
import { formatCurrency } from '@utils/formatters';
import { cn } from '@utils/cn';
import Button from '@components/common/Button';
import CompatibilityBadge from '@components/common/CompatibilityBadge';
import ErrorBanner from '@components/common/ErrorBanner';
import Loading from '@components/common/Loading';

export default function ProfileDetail({ listingId }) {
  const navigate = useNavigate();

  const [listing, setListing] = useState(null);
  const [compatibility, setCompatibility] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!listingId) return;

    let cancelled = false;
    setIsLoading(true);
    setError('');

    const fetchData = async () => {
      try {
        const [listingRes, compatRes] = await Promise.all([
          api.get(`/listings/${listingId}`),
          api.get(`/matches/${listingId}`),
        ]);

        if (!cancelled) {
          setListing(listingRes.data.listing ?? listingRes.data);
          setCompatibility(compatRes.data.compatibility ?? compatRes.data);
        }
      } catch (err) {
        if (!cancelled) setError(resolveApiError(err));
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    fetchData();
    return () => { cancelled = true; };
  }, [listingId]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loading message="Loading profile..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col gap-4 max-w-xl mx-auto py-10">
        <ErrorBanner message={error} onDismiss={() => navigate(-1)} />
        <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="self-start">
          <ArrowLeft className="w-4 h-4" />
          Go back
        </Button>
      </div>
    );
  }

  if (!listing) return null;

  const {
    title,
    description,
    rent,
    roomType,
    availableFrom,
    location,
    images,
    owner,
  } = listing;

  const imageUrl = images?.[0] ?? null;
  const ownerName = owner?.fullName ?? 'Unknown';
  const isVerified = owner?.isVerified ?? false;

  const score = compatibility?.score ?? null;
  const vibeSummary = compatibility?.vibeSummary ?? null;
  const pros = compatibility?.pros ?? [];
  const cons = compatibility?.cons ?? [];

  const roomTypeLabels = {
    private: 'Private room',
    shared: 'Shared room',
    studio: 'Studio',
    entire: 'Entire place',
  };

  return (
    <div className="flex flex-col gap-6 max-w-2xl mx-auto">
      {/* Back button */}
      <button
        type="button"
        onClick={() => navigate(-1)}
        className="flex items-center gap-1.5 text-sm text-text-muted hover:text-text transition-colors duration-150 cursor-pointer self-start"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to listings
      </button>

      {/* Hero image */}
      <div className="w-full h-56 bg-border/30 rounded-[var(--radius)] overflow-hidden">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <BedDouble className="w-10 h-10 text-border" aria-hidden="true" />
          </div>
        )}
      </div>

      {/* Title + meta */}
      <div className="flex flex-col gap-3">
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <h1 className="text-xl font-semibold text-text tracking-tight flex-1">{title}</h1>
          {score != null && <CompatibilityBadge score={score} />}
        </div>

        <div className="flex flex-wrap items-center gap-4 text-sm text-text-muted">
          {location?.area || location?.city ? (
            <span className="flex items-center gap-1.5">
              <MapPin className="w-4 h-4 shrink-0" aria-hidden="true" />
              {location.area ?? location.city}
            </span>
          ) : null}

          {roomType && (
            <span className="flex items-center gap-1.5">
              <BedDouble className="w-4 h-4 shrink-0" aria-hidden="true" />
              {roomTypeLabels[roomType] ?? roomType}
            </span>
          )}

          {availableFrom && (
            <span className="flex items-center gap-1.5">
              <Calendar className="w-4 h-4 shrink-0" aria-hidden="true" />
              {new Date(availableFrom) <= new Date()
                ? 'Available now'
                : `From ${new Date(availableFrom).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`}
            </span>
          )}
        </div>

        <div className="flex items-center justify-between gap-3 flex-wrap">
          <span className="text-2xl font-semibold text-text">
            {formatCurrency(rent)}
            <span className="text-sm font-normal text-text-muted">/mo</span>
          </span>

          <div className="flex items-center gap-1.5 text-sm text-text-muted">
            <span>{ownerName}</span>
            {isVerified && (
              <BadgeCheck className="w-4 h-4 text-primary shrink-0" aria-label="Verified" />
            )}
          </div>
        </div>
      </div>

      {/* Description */}
      {description && (
        <div className="bg-card border border-border rounded-[var(--radius)] p-4">
          <p className="text-sm text-text-muted leading-relaxed">{description}</p>
        </div>
      )}

      {/* AI Compatibility section */}
      {compatibility && (
        <div className="flex flex-col gap-4">
          <h2 className="text-base font-semibold text-text">AI Compatibility</h2>

          {/* Vibe summary */}
          {vibeSummary && (
            <div className="bg-card border border-border rounded-[var(--radius)] p-4">
              <p className="text-sm text-text leading-relaxed">{vibeSummary}</p>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Pros */}
            {pros.length > 0 && (
              <div className="bg-card border border-border rounded-[var(--radius)] p-4 flex flex-col gap-3">
                <div className="flex items-center gap-2">
                  <ThumbsUp className="w-4 h-4 text-primary shrink-0" aria-hidden="true" />
                  <span className="text-sm font-medium text-text">Pros</span>
                </div>
                <ul className="flex flex-col gap-1.5">
                  {pros.map((pro, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-text-muted">
                      <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
                      {pro}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Cons */}
            {cons.length > 0 && (
              <div className="bg-card border border-border rounded-[var(--radius)] p-4 flex flex-col gap-3">
                <div className="flex items-center gap-2">
                  <ThumbsDown className="w-4 h-4 text-danger shrink-0" aria-hidden="true" />
                  <span className="text-sm font-medium text-text">Cons</span>
                </div>
                <ul className="flex flex-col gap-1.5">
                  {cons.map((con, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-text-muted">
                      <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-danger shrink-0" />
                      {con}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}