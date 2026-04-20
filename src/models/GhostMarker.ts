/**
 * GhostMarker.ts
 * --------------------------------------------------------------
 * 지도 위 한 마리 귀신.
 *  - id: GhostWorld 내 unique
 *  - position: 지도상 좌표
 *  - label: 도감/HUD 표시용 이름 (i18n 미적용 — 게임 내 고유명사 취급)
 */
import type { LatLng } from '../utils/haversine';

export interface GhostMarker {
  id: string;
  position: LatLng;
  label: string;
}
