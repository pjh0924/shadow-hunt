/**
 * format.ts — 지표 포맷 유틸.
 */
import type { DistanceUnit } from '../store/useSettingsStore';

/** 거리 (m 단위 입력) → 사람 친화 문자열 */
export function formatDistance(meters: number, unit: DistanceUnit): string {
  if (unit === 'imperial') {
    const ft = meters * 3.28084;
    return ft < 1000 ? `${Math.round(ft)}ft` : `${(ft / 5280).toFixed(2)}mi`;
  }
  return meters < 1000 ? `${Math.round(meters)}m` : `${(meters / 1000).toFixed(2)}km`;
}
