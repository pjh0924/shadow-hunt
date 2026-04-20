/**
 * haversine.ts
 * --------------------------------------------------------------
 * 두 lat/lng 사이 지표면 거리 (m), 그리고 한 점에서 다른 점까지의
 * compass bearing(0~360°, 북쪽=0).
 *
 * 호러게임 핵심:
 *   - GhostWorld 가 헌트존 진입을 판단할 때 거리 계산
 *   - DirectionIndicator 가 어느 방향에 귀신이 있는지 알릴 때 bearing
 */

const R_EARTH = 6378137; // m, WGS84

const toRad = (d: number) => (d * Math.PI) / 180;
const toDeg = (r: number) => (r * 180) / Math.PI;

export interface LatLng {
  lat: number;
  lng: number;
}

/** 두 점 사이 거리 (m). */
export function distanceMeters(a: LatLng, b: LatLng): number {
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const sinDLat = Math.sin(dLat / 2);
  const sinDLng = Math.sin(dLng / 2);
  const h =
    sinDLat * sinDLat +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * sinDLng * sinDLng;
  const c = 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
  return R_EARTH * c;
}

/** a 에서 b 로의 bearing(0~360°). 0=북, 90=동, 180=남, 270=서. */
export function bearingDegrees(a: LatLng, b: LatLng): number {
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const dLng = toRad(b.lng - a.lng);
  const y = Math.sin(dLng) * Math.cos(lat2);
  const x =
    Math.cos(lat1) * Math.sin(lat2) -
    Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLng);
  return (toDeg(Math.atan2(y, x)) + 360) % 360;
}

/**
 * `from` 에서 동쪽 `eastM` m, 북쪽 `northM` m 떨어진 점 반환.
 * Mock 이동 / 스폰 좌표 변환에 사용.
 */
export function offsetMeters(
  from: LatLng,
  eastM: number,
  northM: number
): LatLng {
  const dLat = northM / R_EARTH;
  const dLng = eastM / (R_EARTH * Math.cos(toRad(from.lat)));
  return {
    lat: from.lat + toDeg(dLat),
    lng: from.lng + toDeg(dLng),
  };
}
