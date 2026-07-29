import { useMap } from 'react-leaflet';
import { Plus, Minus, Maximize2 } from 'lucide-react';
import { cn } from '@utils/cn';
import CurrentLocationButton from './CurrentLocationButton';

const INDIA_CENTER = [20.5937, 78.9629];
const DEFAULT_ZOOM = 5;

function MapIconButton({ onClick, disabled, label, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      title={label}
      className={cn(
        'flex items-center justify-center w-9 h-9 rounded-[var(--radius)]',
        'bg-card border border-border text-text-muted',
        'transition-all duration-200 cursor-pointer select-none',
        'hover:border-primary hover:text-text active:scale-[0.98]',
        'disabled:opacity-40 disabled:cursor-not-allowed',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background'
      )}
    >
      {children}
    </button>
  );
}

function ZoomControls() {
  const map = useMap();
  const zoom = map.getZoom();

  return (
    <>
      <MapIconButton
        onClick={() => map.zoomIn()}
        disabled={zoom >= map.getMaxZoom()}
        label="Zoom in"
      >
        <Plus className="w-4 h-4" aria-hidden="true" />
      </MapIconButton>

      <MapIconButton
        onClick={() => map.zoomOut()}
        disabled={zoom <= map.getMinZoom()}
        label="Zoom out"
      >
        <Minus className="w-4 h-4" aria-hidden="true" />
      </MapIconButton>
    </>
  );
}

function ResetViewButton({ bounds }) {
  const map = useMap();

  const handleReset = () => {
    if (bounds) {
      map.fitBounds(bounds, { padding: [48, 48], maxZoom: 14, duration: 0.8 });
    } else {
      map.flyTo(INDIA_CENTER, DEFAULT_ZOOM, { duration: 0.8 });
    }
  };

  return (
    <MapIconButton onClick={handleReset} label="Reset view">
      <Maximize2 className="w-4 h-4" aria-hidden="true" />
    </MapIconButton>
  );
}

export default function MapControls({ bounds }) {
  return (
    <div className="absolute bottom-5 right-3 z-[1000] flex flex-col gap-1.5">
      <ZoomControls />
      <ResetViewButton bounds={bounds} />
      <CurrentLocationButton />
    </div>
  );
}
