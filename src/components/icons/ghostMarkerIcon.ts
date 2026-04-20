/**
 * ghostMarkerIcon.ts
 * --------------------------------------------------------------
 * Leaflet DivIcon 팩토리.
 *   - visible: 흰 본체 + 네온 그린 외곽 + 검은 두 눈
 *   - hidden:  ? 표시만 (원거리/정체 불명)
 *
 * SVG 를 HTML 문자열로 박아 divIcon 에 넘김 → React 외부지만 styling 자유.
 */
import L, { type DivIcon } from 'leaflet';
import { COLORS } from '../../theme/colors';

const VISIBLE_SIZE = 54;
const HIDDEN_SIZE = 44;

/** 식별 가능 상태 아이콘 (근거리). */
export function createGhostIconVisible(): DivIcon {
  const size = VISIBLE_SIZE;
  // 2개 겹쳐서 외곽 글로우 구현: 큰 dimGreen blurry + 선명한 흰 몸체
  const svg = `
    <svg viewBox="0 0 54 54" width="${size}" height="${size}"
         xmlns="http://www.w3.org/2000/svg">
      <!-- glow -->
      <circle cx="27" cy="27" r="22" fill="${COLORS.neon}" opacity="0.18"/>
      <!-- body -->
      <path
        d="M27 5
           C16 5 8 13 8 24
           L8 44
           L13 40 L18 44 L23 40 L27 44 L31 40 L36 44 L41 40 L46 44
           L46 24
           C46 13 38 5 27 5Z"
        fill="#ffffff"
        stroke="${COLORS.neon}"
        stroke-width="2.5"
        stroke-linejoin="round"/>
      <!-- eyes -->
      <ellipse cx="21" cy="24" rx="2.8" ry="4" fill="#0a0d0a"/>
      <ellipse cx="33" cy="24" rx="2.8" ry="4" fill="#0a0d0a"/>
    </svg>`;
  return L.divIcon({
    html: svg,
    className: 'ghost-icon-visible',
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
}

/** 정체 불명 원거리 아이콘. */
export function createGhostIconHidden(): DivIcon {
  const size = HIDDEN_SIZE;
  const svg = `
    <svg viewBox="0 0 44 44" width="${size}" height="${size}"
         xmlns="http://www.w3.org/2000/svg">
      <circle cx="22" cy="22" r="18" fill="${COLORS.surface}" opacity="0.7"
              stroke="${COLORS.danger}" stroke-width="2" stroke-dasharray="4 3"/>
      <text x="22" y="28" text-anchor="middle"
            font-family="ui-monospace, monospace" font-size="20"
            font-weight="900" fill="${COLORS.neon}">?</text>
    </svg>`;
  return L.divIcon({
    html: svg,
    className: 'ghost-icon-hidden',
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
}
