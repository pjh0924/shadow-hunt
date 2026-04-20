/**
 * MockLocationProvider.ts
 * --------------------------------------------------------------
 * 개발자가 D-Pad 로 실시간 조작하는 가짜 GPS.
 * 에뮬레이터/브라우저에서 실 GPS 없이도 전 게임 루프 시연 가능.
 */
import type {
  LocationProvider,
  LocationListener,
  LocationErrorListener,
} from './LocationProvider';
import { offsetMeters, type LatLng } from '../../utils/haversine';
import type { PositionFix } from '../../models/PositionFix';

export class MockLocationProvider implements LocationProvider {
  private _pos: PositionFix;
  private _listeners = new Set<LocationListener>();

  constructor(start: LatLng) {
    this._pos = { ...start, accuracy: 5, heading: null };
  }

  currentPosition(): Promise<PositionFix> {
    return Promise.resolve(this._pos);
  }

  watch(onFix: LocationListener, _onError?: LocationErrorListener): () => void {
    this._listeners.add(onFix);
    // 즉시 한 번 emit (새 구독자에게 최신 상태 제공)
    queueMicrotask(() => onFix(this._pos));
    return () => {
      this._listeners.delete(onFix);
    };
  }

  /** 현재 위치에서 동/북 방향으로 m 단위 이동. 음수도 가능. */
  moveBy(eastM: number, northM: number): void {
    const next = offsetMeters(this._pos, eastM, northM);
    // 이동 방향으로 heading 추정 (atan2(east, north))
    let heading: number | null = null;
    if (eastM !== 0 || northM !== 0) {
      heading =
        (Math.atan2(eastM, northM) * 180) / Math.PI; // -180~180
      if (heading < 0) heading += 360; // 0~360
    }
    this._pos = { ...next, accuracy: 5, heading };
    this._emit();
  }

  /** 좌표로 텔레포트. */
  teleportTo(pos: LatLng): void {
    this._pos = { ...pos, accuracy: 5, heading: null };
    this._emit();
  }

  dispose(): void {
    this._listeners.clear();
  }

  private _emit() {
    const p = this._pos;
    this._listeners.forEach((l) => l(p));
  }
}
