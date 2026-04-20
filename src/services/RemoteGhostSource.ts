/**
 * RemoteGhostSource.ts
 * --------------------------------------------------------------
 * 멀티플레이어 / 서버 기반 고스트 공유 인터페이스.
 * 기본 구현은 NoopRemoteGhostSource — 아무것도 안 함.
 *
 * 실제 Firebase 연동은 `docs/FIREBASE.md` 레시피 참고.
 *   - firebase_options.ts 를 추가
 *   - FirestoreRemoteGhostSource 를 복사
 *   - GhostWorld 생성 시 주입
 */
import type { GhostMarker } from '../models/GhostMarker';
import type { LatLng } from '../utils/haversine';

export interface CapturePublication {
  ghostId: string;
  ghostLabel: string;
  position: LatLng;
  capturedAt: Date;
}

export interface RemoteGhostSource {
  /**
   * center 주변 radiusMeters 안에서 "남이 올린" 귀신 마커 받아옴.
   * 구현체는 IoU / 중복 제거 등 자체 처리.
   */
  nearbyShared(center: LatLng, radiusMeters?: number): Promise<GhostMarker[]>;

  /** 캡처 이벤트 게시 (선택). */
  publishCapture(pub: CapturePublication): Promise<void>;
}

/** 기본 — 아무것도 안 함. Firebase 미설정 시. */
export class NoopRemoteGhostSource implements RemoteGhostSource {
  async nearbyShared(): Promise<GhostMarker[]> {
    return [];
  }
  async publishCapture(): Promise<void> {
    /* no-op */
  }
}
