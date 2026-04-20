/**
 * BackgroundLocationProvider.ts
 * --------------------------------------------------------------
 * @capacitor-community/background-geolocation 을 감싼 백그라운드
 * 지속 GPS. 앱 백그라운드 / 화면 오프 상태에서도 위치 스트림이
 * 살아있으므로 헌트존 진입 알림이 동작.
 *
 * Android: Foreground Service + 상시 알림 (플러그인 내장)
 * iOS:     Always 권한 필요 (Info.plist / 런타임 프롬프트)
 *
 * 플러그인 권한 요청 다이얼로그 → 거부 시 catch 에서 에러 전파.
 */
import { registerPlugin } from '@capacitor/core';
import type {
  BackgroundGeolocationPlugin,
  Location as BgLocation,
  CallbackError,
} from '@capacitor-community/background-geolocation';
import type {
  LocationProvider,
  LocationListener,
  LocationErrorListener,
} from './LocationProvider';
import type { PositionFix } from '../../models/PositionFix';

/** Capacitor 네이티브 플러그인 핸들. 웹에선 no-op 메서드 자동 제공. */
const BackgroundGeolocation = registerPlugin<BackgroundGeolocationPlugin>(
  'BackgroundGeolocation'
);

export class BackgroundLocationProvider implements LocationProvider {
  private _watcherId: string | null = null;
  private _listeners = new Set<LocationListener>();
  private _errorListeners = new Set<LocationErrorListener>();
  private _lastFix: PositionFix | null = null;

  async currentPosition(): Promise<PositionFix> {
    if (this._lastFix) return this._lastFix;
    // Watcher 가 없으면 하나 잠깐 돌려 첫 값 수집.
    await this._ensureWatcher();
    return new Promise<PositionFix>((resolve, reject) => {
      const t = setTimeout(() => reject(new Error('timeout')), 10_000);
      const off = this.watch((fix) => {
        clearTimeout(t);
        off();
        resolve(fix);
      });
    });
  }

  watch(onFix: LocationListener, onError?: LocationErrorListener): () => void {
    this._listeners.add(onFix);
    if (onError) this._errorListeners.add(onError);
    this._ensureWatcher().catch((e) => onError?.(e as Error));
    // 이미 받은 fix 가 있으면 즉시 첫 emit
    if (this._lastFix) queueMicrotask(() => onFix(this._lastFix!));
    return () => {
      this._listeners.delete(onFix);
      if (onError) this._errorListeners.delete(onError);
    };
  }

  async dispose(): Promise<void> {
    if (this._watcherId) {
      try {
        await BackgroundGeolocation.removeWatcher({ id: this._watcherId });
      } catch {
        /* ignore */
      }
      this._watcherId = null;
    }
    this._listeners.clear();
    this._errorListeners.clear();
  }

  private async _ensureWatcher(): Promise<void> {
    if (this._watcherId) return;
    const id = await BackgroundGeolocation.addWatcher(
      {
        backgroundMessage: '귀신 신호를 추적 중입니다.',
        backgroundTitle: 'Shadow Hunt',
        requestPermissions: true,
        stale: false,
        distanceFilter: 1,
      },
      (position?: BgLocation, error?: CallbackError) => {
        if (error) {
          this._errorListeners.forEach((l) =>
            l(new Error(error.message ?? String(error)))
          );
          return;
        }
        if (!position) return;
        const bearing = (position as { bearing?: number }).bearing;
        const fix: PositionFix = {
          lat: position.latitude,
          lng: position.longitude,
          accuracy: position.accuracy ?? 0,
          heading: typeof bearing === 'number' ? bearing : null,
        };
        this._lastFix = fix;
        this._listeners.forEach((l) => l(fix));
      }
    );
    this._watcherId = id;
  }
}
