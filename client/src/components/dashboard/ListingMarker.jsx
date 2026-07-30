import L from 'leaflet';

const BASE_STYLES = `
  width: 32px;
  height: 32px;
  border-radius: 50% 50% 50% 0;
  transform: rotate(-45deg);
  border: 2px solid rgba(255,255,255,0.9);
  box-shadow: 0 2px 8px rgba(0,0,0,0.45);
  transition: transform 150ms ease, box-shadow 150ms ease;
`;

function buildIcon(bg, scale = 1) {
  const size = Math.round(32 * scale);
  return new L.DivIcon({
    className: '',
    html: `<div style="${BASE_STYLES} width:${size}px; height:${size}px; background:${bg};"></div>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size],
    popupAnchor: [0, -(size + 4)],
  });
}

export const defaultMarkerIcon = buildIcon('#2563EB');
export const selectedMarkerIcon = buildIcon('#3B82F6', 1.2);
export const highMatchMarkerIcon = buildIcon('#22C55E');

export function getMarkerIcon(listing, isSelected) {
  if (isSelected) return selectedMarkerIcon;
  if ((listing.compatibility ?? 0) >= 80) return highMatchMarkerIcon;
  return defaultMarkerIcon;
}
