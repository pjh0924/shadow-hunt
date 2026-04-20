/**
 * GhostCapture.ts
 * --------------------------------------------------------------
 * 도감 한 항목.
 *   - photoDataUrl: JPEG dataURL (base64) — @capacitor/preferences 에 그대로 저장.
 *     용량 이슈 있으나 Preferences 가 가장 크로스플랫폼 단순 (Cap 8).
 *     Step 4 폴리시에서 @capacitor/filesystem 으로 옮기는 것도 가능.
 *   - photoWidth/Height: 비율/오버레이 매핑용.
 *   - normalizedBoxes: 검출 박스 (정규화 좌표 0~1). 디테일에서 재오버레이.
 *   - capturedAt: ISO 문자열 (JSON 직렬화 친화).
 */
import type { NormalizedBox } from './NormalizedBox';

export interface GhostCapture {
  id: string;
  photoDataUrl: string;
  photoWidth: number;
  photoHeight: number;
  capturedAt: string;
  ghostLabel: string;
  emfLevel: number;
  detectionCount: number;
  normalizedBoxes: NormalizedBox[];
  lat?: number;
  lng?: number;
}

/** 고유 ID 생성 — 타임스탬프 + 랜덤 suffix. */
export function makeCaptureId(): string {
  return `c_${Date.now()}_${Math.floor(Math.random() * 1e6)}`;
}
