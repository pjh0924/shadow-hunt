/**
 * FogCircles.tsx
 * --------------------------------------------------------------
 * 각 귀신 마커 주변에 여러 겹 안개 원. 큰 → 연함, 작을수록 짙음.
 * RadialGradient 는 Leaflet 에서 불가능해서 Circle 겹으로 유사 효과.
 *
 * 가시 거리 밖(거리 > VISIBLE_RADIUS_M) 마커에는 안개 대신
 * 붉은 "?" 경고 링(danger 색) 으로 다르게.
 */
import { Circle } from 'react-leaflet';
import type { GhostMarker } from '../models/GhostMarker';
import type { PositionFix } from '../models/PositionFix';
import { distanceMeters } from '../utils/haversine';
import {
  FOG_RINGS_M,
  VISIBLE_RADIUS_M,
  HUNT_RADIUS_M,
} from '../constants/huntConstants';
import { COLORS } from '../theme/colors';

interface FogCirclesProps {
  ghosts: readonly GhostMarker[];
  userFix: PositionFix | null;
}

export default function FogCircles({ ghosts, userFix }: FogCirclesProps) {
  return (
    <>
      {ghosts.map((g) => {
        const dist = userFix
          ? distanceMeters(userFix, g.position)
          : Number.POSITIVE_INFINITY;
        const visible = dist <= VISIBLE_RADIUS_M;

        if (!visible) {
          return (
            <Circle
              key={`${g.id}-fog-hidden`}
              center={[g.position.lat, g.position.lng]}
              radius={32}
              pathOptions={{
                color: COLORS.danger,
                weight: 1.5,
                dashArray: '5 4',
                fillColor: COLORS.danger,
                fillOpacity: 0.06,
              }}
            />
          );
        }

        return FOG_RINGS_M.map((r, i) => (
          <Circle
            key={`${g.id}-fog-${r}`}
            center={[g.position.lat, g.position.lng]}
            radius={r}
            pathOptions={{
              // 가장 안쪽(=HUNT_RADIUS_M) 만 네온 선명하게
              color: r === HUNT_RADIUS_M ? COLORS.neon : COLORS.neonDim,
              weight: r === HUNT_RADIUS_M ? 2 : 0.8,
              opacity: r === HUNT_RADIUS_M ? 0.8 : 0.35,
              fillColor: COLORS.neon,
              // 큰 반경 → 투명, 작은 반경 → 짙음
              fillOpacity: 0.05 + i * 0.05,
            }}
          />
        ));
      })}
    </>
  );
}
