/**
 * FaceDetectionService.ts
 * --------------------------------------------------------------
 * MediaPipe Tasks Vision (WASM) 를 사용한 얼굴 검출.
 * 게임 컨셉상 false-positive 가 환영 → minDetectionConfidence 낮게.
 *
 * 책임:
 *   - 모델 + WASM 로드 (init)
 *   - HTMLVideoElement 한 프레임 → DetectionResult
 *   - 간이 IoU 추적기로 "같은 형상" id 유지
 *   - EMA 로 박스 떨림 부드럽게
 *
 * 추적기 한계: 매우 빠른 움직임 / 중복 검출에는 ID 가 새로 부여됨.
 * Step 3 호러 컨셉상 그래도 OK ("새 형상 등장" 처럼 보임).
 */
import type {
  FaceDetector as FaceDetectorType,
} from '@mediapipe/tasks-vision';
import type { DetectionResult, DetectedGhost } from '../models/DetectionResult';
import type { NormalizedBox } from '../models/NormalizedBox';

// WASM 은 public/mediapipe 로 번들 → Capacitor 오프라인에서도 동작.
// Vite base: './' → relative 경로 사용.
const WASM_BASE = `${import.meta.env.BASE_URL}mediapipe`;
const MODEL_URL =
  'https://storage.googleapis.com/mediapipe-models/face_detector/blaze_face_short_range/float16/1/blaze_face_short_range.tflite';

/** 같은 entity 로 매칭 임계 (IoU). */
const TRACK_MATCH_IOU = 0.3;
/** EMA alpha — 새 측정 비중 (0~1). 작을수록 부드러움. */
const SMOOTHING_ALPHA = 0.4;
/** 트랙이 이만큼 프레임 동안 안 보이면 제거. */
const TRACK_TTL_FRAMES = 5;

interface InternalTrack {
  id: number;
  bounds: NormalizedBox;
  age: number; // 마지막 매칭 후 흐른 프레임 수
}

function iou(a: NormalizedBox, b: NormalizedBox): number {
  const ax2 = a.left + a.width;
  const ay2 = a.top + a.height;
  const bx2 = b.left + b.width;
  const by2 = b.top + b.height;
  const x1 = Math.max(a.left, b.left);
  const y1 = Math.max(a.top, b.top);
  const x2 = Math.min(ax2, bx2);
  const y2 = Math.min(ay2, by2);
  if (x2 <= x1 || y2 <= y1) return 0;
  const inter = (x2 - x1) * (y2 - y1);
  const aArea = a.width * a.height;
  const bArea = b.width * b.height;
  return inter / (aArea + bArea - inter);
}

function emaBox(prev: NormalizedBox, next: NormalizedBox, a = SMOOTHING_ALPHA): NormalizedBox {
  return {
    left: prev.left + (next.left - prev.left) * a,
    top: prev.top + (next.top - prev.top) * a,
    width: prev.width + (next.width - prev.width) * a,
    height: prev.height + (next.height - prev.height) * a,
  };
}

export class FaceDetectionService {
  private _detector: FaceDetectorType | null = null;
  private _initPromise: Promise<void> | null = null;
  private _tracks: InternalTrack[] = [];
  private _nextId = 1;

  /**
   * 모델 로드 (idempotent).
   * MediaPipe 패키지는 초기 번들을 무겁게 만들기 때문에 dynamic import 로
   * 카메라 화면 진입 시에만 로드한다.
   */
  init(): Promise<void> {
    if (this._initPromise) return this._initPromise;
    this._initPromise = (async () => {
      const { FaceDetector, FilesetResolver } = await import(
        '@mediapipe/tasks-vision'
      );
      const vision = await FilesetResolver.forVisionTasks(WASM_BASE);
      this._detector = await FaceDetector.createFromOptions(vision, {
        baseOptions: { modelAssetPath: MODEL_URL, delegate: 'GPU' },
        runningMode: 'VIDEO',
        // 호러 컨셉: 낮은 신뢰도까지 잡음. 가짜 검출이 좋다.
        minDetectionConfidence: 0.4,
        minSuppressionThreshold: 0.3,
      });
    })();
    return this._initPromise;
  }

  /** 비디오 한 프레임 검출 + 트래킹. */
  detect(video: HTMLVideoElement, timestampMs: number): DetectionResult {
    if (!this._detector || video.readyState < 2 || video.videoWidth === 0) {
      return { ghosts: [], timestamp: timestampMs };
    }

    const r = this._detector.detectForVideo(video, timestampMs);
    const w = video.videoWidth;
    const h = video.videoHeight;

    // 픽셀 → 정규화
    const newBoxes: { box: NormalizedBox; conf: number }[] = [];
    for (const det of r.detections) {
      const bb = det.boundingBox;
      if (!bb) continue;
      newBoxes.push({
        box: {
          left: bb.originX / w,
          top: bb.originY / h,
          width: bb.width / w,
          height: bb.height / h,
        },
        conf: det.categories?.[0]?.score ?? 0.5,
      });
    }

    return this._track(newBoxes, timestampMs);
  }

  /** 외부에서 가짜 검출 주입 (디버그/시연). */
  injectFake(video: HTMLVideoElement, timestampMs: number): DetectionResult {
    // 화면 가운데 30% 사각형
    const fake = { box: { left: 0.35, top: 0.4, width: 0.3, height: 0.3 }, conf: 0.99 };
    return this._track([fake], timestampMs, video);
  }

  private _track(
    measurements: { box: NormalizedBox; conf: number }[],
    timestamp: number,
    _video?: HTMLVideoElement
  ): DetectionResult {
    // 모든 기존 트랙 age++ — 매칭 후 0 으로 리셋.
    for (const t of this._tracks) t.age++;

    const matched: DetectedGhost[] = [];
    const usedTracks = new Set<number>();
    const usedMeas = new Set<number>();

    // Greedy IoU 매칭 — 측정과 트랙 모든 쌍 중 IoU 큰 순으로 짝짓기.
    type Pair = { mi: number; ti: number; iou: number };
    const pairs: Pair[] = [];
    measurements.forEach((m, mi) => {
      this._tracks.forEach((tr, ti) => {
        const v = iou(m.box, tr.bounds);
        if (v >= TRACK_MATCH_IOU) pairs.push({ mi, ti, iou: v });
      });
    });
    pairs.sort((a, b) => b.iou - a.iou);

    for (const p of pairs) {
      if (usedMeas.has(p.mi) || usedTracks.has(p.ti)) continue;
      usedMeas.add(p.mi);
      usedTracks.add(p.ti);
      const tr = this._tracks[p.ti];
      const m = measurements[p.mi];
      tr.bounds = emaBox(tr.bounds, m.box);
      tr.age = 0;
      matched.push({ id: tr.id, bounds: tr.bounds, confidence: m.conf });
    }

    // 매칭 안 된 측정 → 새 트랙 생성
    measurements.forEach((m, mi) => {
      if (usedMeas.has(mi)) return;
      const id = this._nextId++;
      const tr: InternalTrack = { id, bounds: m.box, age: 0 };
      this._tracks.push(tr);
      matched.push({ id, bounds: tr.bounds, confidence: m.conf });
    });

    // TTL 지난 트랙 제거
    this._tracks = this._tracks.filter((t) => t.age <= TRACK_TTL_FRAMES);

    return { ghosts: matched, timestamp };
  }

  dispose(): void {
    this._detector?.close();
    this._detector = null;
    this._initPromise = null;
    this._tracks = [];
    this._nextId = 1;
  }
}
