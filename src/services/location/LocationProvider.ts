/**
 * LocationProvider.ts
 * --------------------------------------------------------------
 * 위치 스트림 추상 인터페이스.
 *   - RealLocationProvider: @capacitor/geolocation (폰 센서)
 *   - MockLocationProvider: 개발자 도구로 조작
 *
 * 두 구현 모두 동일 모양 stream/current 를 노출 → MapScreen 은 어떤 게 꽂혀도 똑같이 돈다.
 */
import type { PositionFix } from '../../models/PositionFix';

export type LocationListener = (fix: PositionFix) => void;
export type LocationErrorListener = (err: Error) => void;

export interface LocationProvider {
  /** 현재 위치를 한 번 반환 (스트림 시작 전 초기 표시에 사용). */
  currentPosition(): Promise<PositionFix>;

  /**
   * 스트림 구독. distanceFilter 만큼 이동할 때마다 emit.
   * 반환 함수로 구독 해제.
   */
  watch(onFix: LocationListener, onError?: LocationErrorListener): () => void;

  /** 정리. */
  dispose(): void;
}
