/**
 * PositionFix.ts
 * --------------------------------------------------------------
 * "정밀한" 위치 한 점.
 *  - lat / lng
 *  - accuracy (m, ±) — Geolocation 정확도 원 시각화에 사용
 *  - heading (deg, 0~360 또는 null) — GPS 진행 방향. 정지/미지원 시 null.
 *
 * 디바이스 자기계 기반 헤딩은 별도 CompassService 가 제공.
 */
import type { LatLng } from '../utils/haversine';

export interface PositionFix extends LatLng {
  accuracy: number;
  heading: number | null;
}
