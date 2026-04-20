/**
 * RealLocationProvider.ts
 * --------------------------------------------------------------
 * @capacitor/geolocation 을 감싼 실제 구현.
 *
 *  - 브라우저(dev server): 자동으로 navigator.geolocation 폴백
 *  - Android / iOS: 네이티브 Fused location / Core Location
 *
 * 정확도 / distanceFilter 설정은 enableHighAccuracy + timeout 만 조절 가능.
 * (Flutter 의 distanceFilter 같은 세밀 튜닝은 없음 → 클라이언트에서
 *  EMA / 움직임 임계 체크로 보완해도 되지만, 일단 원시 스트림 그대로)
 */
import { Geolocation, type Position } from '@capacitor/geolocation';
import type { LocationProvider, LocationListener, LocationErrorListener } from './LocationProvider';
import type { PositionFix } from '../../models/PositionFix';

function toFix(pos: Position): PositionFix {
  const c = pos.coords;
  return {
    lat: c.latitude,
    lng: c.longitude,
    accuracy: c.accuracy ?? 0,
    heading: c.heading ?? null,
  };
}

export class RealLocationProvider implements LocationProvider {
  private _watchId: string | null = null;

  async currentPosition(): Promise<PositionFix> {
    const pos = await Geolocation.getCurrentPosition({
      enableHighAccuracy: true,
      timeout: 10_000,
    });
    return toFix(pos);
  }

  watch(onFix: LocationListener, onError?: LocationErrorListener): () => void {
    // watchPosition 은 비동기로 watchId 를 반환 → cleanup 시점 가변
    let cancelled = false;
    let localId: string | null = null;

    Geolocation.watchPosition(
      { enableHighAccuracy: true, timeout: 10_000 },
      (pos, err) => {
        if (cancelled) return;
        if (err) {
          onError?.(new Error(err.message ?? String(err)));
          return;
        }
        if (pos) onFix(toFix(pos));
      }
    )
      .then((id) => {
        localId = id;
        this._watchId = id;
        if (cancelled && localId) {
          Geolocation.clearWatch({ id: localId }).catch(() => {});
        }
      })
      .catch((e) => onError?.(e as Error));

    return () => {
      cancelled = true;
      if (localId) {
        Geolocation.clearWatch({ id: localId }).catch(() => {});
      }
      this._watchId = null;
    };
  }

  dispose(): void {
    if (this._watchId) {
      Geolocation.clearWatch({ id: this._watchId }).catch(() => {});
      this._watchId = null;
    }
  }
}
