/**
 * colors.ts
 * --------------------------------------------------------------
 * Tailwind 의 @theme 토큰과 일치하는 JS 상수.
 * 캔버스/Leaflet 처럼 className 못 쓰는 곳에서 사용.
 */
export const COLORS = {
  bg: '#0a0d0a',
  surface: '#11161b',
  surface2: '#1a2128',
  neon: '#21f56e',
  neonDim: '#15a749',
  warn: '#ffb020',
  danger: '#ff3a55',
  fog: 'rgba(33, 245, 110, 0.10)',
} as const;
