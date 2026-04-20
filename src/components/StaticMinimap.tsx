/**
 * StaticMinimap.tsx
 * --------------------------------------------------------------
 * 도감 디테일에 붙는 작은 지도 — 캡처 장소 시각화.
 *   - lat/lng 없으면 null 반환
 *   - 제스처 비활성 (탭해도 이동 안 함)
 */
import { MapContainer, TileLayer, Marker } from 'react-leaflet';
import L from 'leaflet';
import { COLORS } from '../theme/colors';

const TILE_URL = 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png';
const TILE_ATTR = '&copy; OSM &copy; CARTO';

const pinIcon = L.divIcon({
  html: `<svg viewBox="0 0 20 20" width="24" height="24" xmlns="http://www.w3.org/2000/svg">
    <circle cx="10" cy="10" r="6" fill="${COLORS.neon}" opacity="0.4"/>
    <circle cx="10" cy="10" r="3.5" fill="${COLORS.neon}"/>
  </svg>`,
  iconSize: [24, 24],
  iconAnchor: [12, 12],
  className: 'codex-minimap-pin',
});

interface Props {
  lat: number;
  lng: number;
}

export default function StaticMinimap({ lat, lng }: Props) {
  return (
    <div className="overflow-hidden rounded-lg border border-neon/30" style={{ height: 140 }}>
      <MapContainer
        center={[lat, lng]}
        zoom={16}
        zoomControl={false}
        attributionControl={false}
        dragging={false}
        scrollWheelZoom={false}
        doubleClickZoom={false}
        touchZoom={false}
        keyboard={false}
        style={{ height: '100%', width: '100%' }}
      >
        <TileLayer url={TILE_URL} attribution={TILE_ATTR} maxZoom={19} />
        <Marker position={[lat, lng]} icon={pinIcon} />
      </MapContainer>
    </div>
  );
}
