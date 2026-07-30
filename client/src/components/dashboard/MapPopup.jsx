import { useNavigate } from 'react-router-dom';
import { MapPin, BadgeCheck } from 'lucide-react';
import { formatCurrency } from '@utils/formatters';
import Button from '@components/common/Button';
import CompatibilityBadge from '@components/common/CompatibilityBadge';

export default function MapPopup({ listing }) {
  const navigate = useNavigate();
  const { _id, title, rent, compatibility, images, location, owner } = listing;
  const imageUrl = images?.[0] ?? null;
  const ownerName = owner?.fullName ?? null;
  const isVerified = owner?.isVerified ?? false;

  return (
    <div className="flex flex-col" style={{ width: 228 }}>
      {/* Image */}
      <div className="w-full bg-border/30 overflow-hidden" style={{ height: 120, borderRadius: '10px 10px 0 0' }}>
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={title}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <MapPin className="w-5 h-5 text-border" aria-hidden="true" />
          </div>
        )}
      </div>

      {/* Body */}
      <div className="flex flex-col gap-2.5 p-3">
        <div className="flex flex-col gap-1">
          <p className="text-sm font-semibold text-text leading-snug line-clamp-2">{title}</p>
          {(location?.area || location?.city) && (
            <div className="flex items-center gap-1 text-xs text-text-muted">
              <MapPin className="w-3 h-3 shrink-0" aria-hidden="true" />
              <span className="truncate">{location.area ?? location.city}</span>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between gap-2">
          <span className="text-sm font-semibold text-text">
            {formatCurrency(rent)}
            <span className="text-xs font-normal text-text-muted">/mo</span>
          </span>
          {compatibility != null && <CompatibilityBadge score={compatibility} />}
        </div>

        {ownerName && (
          <div className="flex items-center gap-1 text-xs text-text-muted">
            <span>{ownerName}</span>
            {isVerified && (
              <BadgeCheck className="w-3.5 h-3.5 text-primary shrink-0" aria-label="Verified" />
            )}
          </div>
        )}

        <Button
          size="sm"
          className="w-full text-xs mt-0.5"
          onClick={() => navigate(`/listing/${_id}`)}
        >
          View profile
        </Button>
      </div>
    </div>
  );
}
