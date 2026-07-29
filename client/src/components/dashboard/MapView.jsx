import { useState, useEffect, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { getMarkerIcon } from './ListingMarker';
import MapPopup from './MapPopup';
import MapControls from './MapControls';
import MapLegend from './MapLegend';
import MapSkeleton from './MapSkeleton';
import EmptyMapState from './EmptyMapState';

// Fix Leaflet default icon path issue with bundlers — runs once at module level
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const INDIA_CENTER = [20.5937, 78.9629];
const DEFAULT_ZOOM = 5;

function BoundsController({ listings }) {
  const map = useMap();

  useEffect(() => {
    if (listings.length === 0) return;
    const bounds = L.latLngBounds(listings.map((l) => [l.location.lat, l.location.lng]));
    map.fitBounds(bounds, { padding: [48, 48], maxZoom: 14 });
  }, [listings, map]);

  return null;
}

function MapInner({ listings, selectedId, onSelect, bounds }) {
  return (
    <>
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      {listings.length > 0 && <BoundsController listings={listings} />}

      {listings.map((listing) => (
        <Marker
          key={listing._id}
          position={[listing.location.lat, listing.location.lng]}
          icon={getMarkerIcon(listing, listing._id === selectedId)}
          eventHandlers={{
            click: () => onSelect(listing._id === selectedId ? null : listing._id),
          }}
          zIndexOffset={listing._id === selectedId ? 1000 : 0}
        >
          <Popup
            closeButton={false}
            maxWidth={240}
            minWidth={228}
            className="jovac-popup"
          >
            <MapPopup listing={listing} />
          </Popup>
        </Marker>
      ))}

      <MapControls bounds={bounds} />
      <MapLegend />
    </>
  );
}

export default function MapView({ listings = [], isLoading = false, hasFilters = false, onReset }) {
  const [selectedId, setSelectedId] = useState(null);

  const validListings = useMemo(
    () => listings.filter((l) => l.location?.lat != null && l.location?.lng != null),
    [listings]
  );

  const bounds = useMemo(() => {
    if (validListings.length === 0) return null;
    return L.latLngBounds(validListings.map((l) => [l.location.lat, l.location.lng]));
  }, [validListings]);

  const defaultCenter = validListings.length > 0
    ? [validListings[0].location.lat, validListings[0].location.lng]
    : INDIA_CENTER;

  if (isLoading) return <MapSkeleton />;

  if (validListings.length === 0) {
    return <EmptyMapState hasFilters={hasFilters} onReset={onReset} />;
  }

  return (
    <div
      className="relative w-full rounded-[var(--radius)] overflow-hidden border border-border"
      style={{ height: 560 }}
    >
      <MapContainer
        center={defaultCenter}
        zoom={DEFAULT_ZOOM}
        style={{ width: '100%', height: '100%' }}
        scrollWheelZoom
        zoomControl={false}
      >
        <MapInner
          listings={validListings}
          selectedId={selectedId}
          onSelect={setSelectedId}
          bounds={bounds}
        />
      </MapContainer>
    </div>
  );
}
