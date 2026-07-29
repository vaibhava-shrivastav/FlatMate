import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, Heart, BadgeCheck, BedDouble, Calendar } from 'lucide-react';
import { cn } from '@utils/cn';
import { formatCurrency, truncate } from '@utils/formatters';
import Button from '@components/common/Button';
import CompatibilityBadge from '@components/common/CompatibilityBadge';

function RoomTypeBadge({ type }) {
  const labels = {
    private: 'Private room',
    shared: 'Shared room',
    studio: 'Studio',
    entire: 'Entire place',
  };
  return (
    <span className="inline-flex items-center gap-1 text-xs text-text-muted">
      <BedDouble className="w-3 h-3" aria-hidden="true" />
      {labels[type] ?? type}
    </span>
  );
}

export default function ListingCard({ listing }) {
  const navigate = useNavigate();
  const [isFavorited, setIsFavorited] = useState(listing.isFavorited ?? false);

  const {
    _id,
    title,
    location,
    rent,
    compatibility,
    description,
    roomType,
    availableFrom,
    owner,
    images,
  } = listing;

  const imageUrl = images?.[0] ?? null;
  const ownerName = owner?.fullName ?? 'Unknown';
  const isVerified = owner?.isVerified ?? false;

  const handleFavorite = (e) => {
    e.stopPropagation();
    setIsFavorited((prev) => !prev);
  };

  const handleCardClick = () => {
    navigate(`/listing/${_id}`);
  };

  const handleViewCompatibility = (e) => {
    e.stopPropagation();
    navigate(`/listing/${_id}`);
  };

  return (
    <article
      onClick={handleCardClick}
      className={cn(
        'group relative bg-card border border-border rounded-[var(--radius)] overflow-hidden',
        'flex flex-col cursor-pointer',
        'transition-all duration-200',
        'hover:-translate-y-0.5 hover:border-primary/50 hover:shadow-[0_8px_30px_rgba(0,0,0,0.4)]',
      )}
      aria-label={`Listing: ${title}`}
    >
      {/* Image */}
      <div className="relative w-full h-44 bg-border/30 overflow-hidden shrink-0">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={title}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <BedDouble className="w-8 h-8 text-border" aria-hidden="true" />
          </div>
        )}

        {/* Favorite button */}
        <button
          type="button"
          onClick={handleFavorite}
          aria-label={isFavorited ? 'Remove from favorites' : 'Add to favorites'}
          className={cn(
            'absolute top-3 right-3 flex items-center justify-center w-8 h-8 rounded-full',
            'bg-background/70 backdrop-blur-sm border border-border/50',
            'transition-all duration-200 cursor-pointer active:scale-[0.92]',
            'hover:border-border',
            isFavorited ? 'text-danger' : 'text-text-muted hover:text-text',
          )}
        >
          <Heart className={cn('w-4 h-4', isFavorited && 'fill-current')} aria-hidden="true" />
        </button>

        {/* Compatibility badge overlay */}
        {compatibility != null && (
          <div className="absolute top-3 left-3">
            <CompatibilityBadge score={compatibility} />
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex flex-col gap-3 p-4 flex-1">
        {/* Title + verified */}
        <div className="flex items-start justify-between gap-2">
          <h3 className="text-sm font-semibold text-text leading-snug line-clamp-2 flex-1">
            {title}
          </h3>
        </div>

        {/* Location */}
        <div className="flex items-center gap-1.5 text-xs text-text-muted">
          <MapPin className="w-3 h-3 shrink-0" aria-hidden="true" />
          <span className="truncate">{location?.area ?? location?.city ?? 'Location not specified'}</span>
        </div>

        {/* Description */}
        {description && (
          <p className="text-xs text-text-muted leading-relaxed line-clamp-2">
            {truncate(description, 90)}
          </p>
        )}

        {/* Meta row */}
        <div className="flex items-center gap-3 text-xs text-text-muted">
          {roomType && <RoomTypeBadge type={roomType} />}
          {availableFrom && (
            <span className="flex items-center gap-1">
              <Calendar className="w-3 h-3" aria-hidden="true" />
              {new Date(availableFrom) <= new Date() ? 'Available now' : `From ${new Date(availableFrom).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`}
            </span>
          )}
        </div>

        {/* Divider */}
        <div className="h-px bg-border mt-auto" />

        {/* Footer */}
        <div className="flex items-center justify-between gap-2 pt-0.5">
          <div className="flex flex-col gap-0.5">
            <span className="text-base font-semibold text-text">
              {formatCurrency(rent)}
              <span className="text-xs font-normal text-text-muted">/mo</span>
            </span>
            <div className="flex items-center gap-1 text-xs text-text-muted">
              <span>{ownerName}</span>
              {isVerified && (
                <BadgeCheck className="w-3.5 h-3.5 text-primary shrink-0" aria-label="Verified" />
              )}
            </div>
          </div>

          <Button
            size="sm"
            variant="secondary"
            onClick={handleViewCompatibility}
            className="shrink-0 text-xs"
          >
            View profile
          </Button>
        </div>
      </div>
    </article>
  );
}
