/**
 * DirectionIndicator.tsx
 * --------------------------------------------------------------
 * 화면 좌상단의 "가장 가까운 귀신" 방향 화살표 + 거리.
 * 지도는 north-up 이라 북쪽 기준 bearing 으로 회전.
 * 거리 > VISIBLE_RADIUS_M 이면 라벨을 "미식별 신호"로 대체.
 */
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import type { GhostMarker } from '../models/GhostMarker';
import type { PositionFix } from '../models/PositionFix';
import { bearingDegrees, distanceMeters } from '../utils/haversine';
import { VISIBLE_RADIUS_M } from '../constants/huntConstants';

interface Props {
  ghosts: readonly GhostMarker[];
  userFix: PositionFix | null;
}

export default function DirectionIndicator({ ghosts, userFix }: Props) {
  const { t } = useTranslation();

  const nearest = useMemo(() => {
    if (!userFix || ghosts.length === 0) return null;
    let best: { g: GhostMarker; dist: number } | null = null;
    for (const g of ghosts) {
      const d = distanceMeters(userFix, g.position);
      if (!best || d < best.dist) best = { g, dist: d };
    }
    return best;
  }, [ghosts, userFix]);

  if (!nearest || !userFix) return null;
  const bearing = bearingDegrees(userFix, nearest.g.position);
  const visible = nearest.dist <= VISIBLE_RADIUS_M;
  const label = visible ? nearest.g.label : t('directionUnknownSignal');

  return (
    <div
      className="pointer-events-none absolute left-3 top-14 z-10
                 flex items-center gap-2 rounded-full border border-neon/50
                 bg-black/70 px-3 py-1.5 shadow-[0_0_10px_rgba(33,245,110,0.25)]"
      aria-label={`${Math.round(nearest.dist)}m ${label}`}
    >
      <div
        className="inline-block"
        style={{ transform: `rotate(${bearing}deg)` }}
      >
        <svg viewBox="0 0 20 20" width="18" height="18">
          <polygon
            points="10,2 16,16 10,12 4,16"
            fill="var(--color-neon)"
            stroke="#052a12"
            strokeWidth="0.8"
          />
        </svg>
      </div>
      <div className="flex flex-col leading-none">
        <span className="text-[11px] font-extrabold tracking-wider text-neon text-glow">
          {Math.round(nearest.dist)}m
        </span>
        <span className="mt-0.5 text-[10px] text-neon-dim truncate max-w-[180px]">
          {label}
        </span>
      </div>
    </div>
  );
}
