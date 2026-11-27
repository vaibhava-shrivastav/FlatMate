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

const GREATER_NOIDA_CENTER = [28.4744, 77.5030];
const DEFAULT_ZOOM = 12;

function BoundsController({ positions }) {
  const map = useMap();

  useEffect(() => {
    if (positions.length === 0) return;
    const bounds = L.latLngBounds(positions);
    map.fitBounds(bounds, { padding: [48, 48], maxZoom: 14 });
  }, [positions, map]);

  return null;
}

function MapInner({ listings, positions, selectedId, onSelect, bounds }) {
  return (
    <>
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      {listings.length > 0 && <BoundsController positions={positions} />}

      {listings.map((listing, index) => (
        <Marker
          key={listing._id}
          position={positions[index]}
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

  // GeoJSON stores coordinates as [longitude, latitude]; Leaflet needs [latitude, longitude].
  const getLatLng = (listing) => {
    const coords = listing.location?.coordinates;
    if (!Array.isArray(coords) || coords.length < 2) return null;
    const [lng, lat] = coords;
    if (typeof lat !== 'number' || typeof lng !== 'number') return null;
    if (lat < -90 || lat > 90 || lng < -180 || lng > 180) return null;
    return [lat, lng];
  };

  const validListings = useMemo(
    () => listings.filter((l) => getLatLng(l) !== null),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [listings]
  );

  const bounds = useMemo(() => {
    if (validListings.length === 0) return null;
    return L.latLngBounds(validListings.map((l) => getLatLng(l)));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [validListings]);

  const defaultCenter = validListings.length > 0
    ? getLatLng(validListings[0])
    : GREATER_NOIDA_CENTER;

  const positions = useMemo(
    () => validListings.map((l) => getLatLng(l)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [validListings]
  );

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
          positions={positions}
          selectedId={selectedId}
          onSelect={setSelectedId}
          bounds={bounds}
        />
      </MapContainer>
    </div>
  );
}
