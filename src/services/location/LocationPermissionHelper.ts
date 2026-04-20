/**
 * LocationPermissionHelper.ts
 * --------------------------------------------------------------
 * Capacitor Geolocation 의 권한 flow 단순화.
 *   - checkPermissions() 로 현 상태 확인
 *   - 필요하면 requestPermissions() 로 다이얼로그
 *   - 결과를 "granted | denied | unknown" 으로 정규화
 */
import { Geolocation } from '@capacitor/geolocation';

export type LocationPermissionState = 'granted' | 'denied' | 'unknown';

/** 현재 권한 상태만 조회 (다이얼로그 X). */
export async function checkLocationPermission(): Promise<LocationPermissionState> {
  try {
    const r = await Geolocation.checkPermissions();
    if (r.location === 'granted') return 'granted';
    if (r.location === 'denied') return 'denied';
    return 'unknown';
  } catch {
    return 'unknown';
  }
}

/** 권한 요청 (다이얼로그 뜸). 이미 허용/거부된 상태면 그대로 반환. */
export async function ensureLocationPermission(): Promise<LocationPermissionState> {
  const cur = await checkLocationPermission();
  if (cur === 'granted') return 'granted';

  try {
    const r = await Geolocation.requestPermissions();
    if (r.location === 'granted') return 'granted';
    if (r.location === 'denied') return 'denied';
    return 'unknown';
  } catch {
    return 'unknown';
  }
}
