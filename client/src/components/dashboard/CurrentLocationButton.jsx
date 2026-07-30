import { useState } from 'react';
import { useMap } from 'react-leaflet';
import { Locate } from 'lucide-react';
import { cn } from '@utils/cn';

export default function CurrentLocationButton() {
  const map = useMap();
  const [isLocating, setIsLocating] = useState(false);
  const [error, setError] = useState(false);

  const handleLocate = () => {
    if (!navigator.geolocation) {
      setError(true);
      return;
    }

    setIsLocating(true);
    setError(false);

    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        map.flyTo([coords.latitude, coords.longitude], 13, { duration: 1.2 });
        setIsLocating(false);
      },
      () => {
        setError(true);
        setIsLocating(false);
      },
      { timeout: 8000 }
    );
  };

  return (
    <button
      type="button"
      onClick={handleLocate}
      disabled={isLocating}
      aria-label="Go to my location"
      title={error ? 'Location unavailable' : 'Go to my location'}
      className={cn(
        'flex items-center justify-center w-9 h-9 rounded-[var(--radius)]',
        'bg-card border border-border',
        'transition-all duration-200 cursor-pointer select-none',
        'hover:border-primary hover:text-text active:scale-[0.98]',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background',
        error ? 'text-danger border-danger/40' : 'text-text-muted',
        isLocating && 'animate-pulse'
      )}
    >
      <Locate className="w-4 h-4" aria-hidden="true" />
    </button>
  );
}
