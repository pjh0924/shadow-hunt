/**
 * DetectionResult.ts
 * --------------------------------------------------------------
 * 한 프레임에서 검출된 "형상" 목록. id 는 간단한 IoU 추적기로
 * 인접 프레임 간 같은 entity 를 잇기 위해 부여.
 */
import type { NormalizedBox } from './NormalizedBox';

export interface DetectedGhost {
  id: number;
  bounds: NormalizedBox;
  confidence: number;
}

export interface DetectionResult {
  ghosts: DetectedGhost[];
  /** 비디오 프레임 시각 (ms). */
  timestamp: number;
}
