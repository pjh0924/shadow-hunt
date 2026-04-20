/**
 * userMarkerIcon.ts
 * --------------------------------------------------------------
 * 사용자 본인의 위치 마커.
 *  - 중앙 솔리드 점
 *  - 헤딩이 있으면 삼각 화살표를 해당 방향으로 회전
 *
 * (정확도 원은 Leaflet `Circle` 로 별도 렌더 — 반경이 m 단위라
 *  DivIcon 안에 섞으면 zoom 에 따라 맞출 수 없음.)
 */
import L, { type DivIcon } from 'leaflet';
import { COLORS } from '../../theme/colors';

const SIZE = 44;

/** headingDeg: 0~360, null 이면 화살표 숨김. */
export function createUserIcon(headingDeg: number | null): DivIcon {
  const showArrow = headingDeg !== null;
  const rotation = showArrow ? headingDeg : 0;

  const arrow = showArrow
    ? `<polygon points="22,4 28,18 22,14 16,18"
                 fill="${COLORS.neon}"
                 stroke="#052a12" stroke-width="1"/>`
    : '';

  const svg = `
    <svg viewBox="0 0 44 44" width="${SIZE}" height="${SIZE}"
         xmlns="http://www.w3.org/2000/svg">
      <g transform="rotate(${rotation} 22 22)">
        ${arrow}
      </g>
      <!-- solid center dot w/ halo -->
      <circle cx="22" cy="22" r="10" fill="${COLORS.neon}" opacity="0.3"/>
      <circle cx="22" cy="22" r="6" fill="${COLORS.neon}"/>
      <circle cx="22" cy="22" r="6" fill="none"
              stroke="#ffffff" stroke-width="1.5" opacity="0.8"/>
    </svg>`;

  return L.divIcon({
    html: svg,
    className: 'user-marker',
    iconSize: [SIZE, SIZE],
    iconAnchor: [SIZE / 2, SIZE / 2],
  });
}
