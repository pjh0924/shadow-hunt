// @refresh reset
/**
 * CameraScreen.tsx — Step 2 + 3 + 4.
 * --------------------------------------------------------------
 * Step 2 기능:
 *   - getUserMedia 라이브 프리뷰 / EMF 미터 / NoiseFilter / HUD / 셔터 / 플래시
 *
 * Step 3 추가:
 *   - MediaPipe Face Detection (useFaceDetection 훅)
 *   - 검출 박스 위에 GhostOverlay (코너 브래킷 + 라벨 + 스캔라인)
 *   - 검출 발생 시 EmfSimulator.triggerSpike() → EMF 치솟음 + 햅틱
 *   - 첫 발견 → FeedbackService.onFirstSighting() + FirstSightingPulse
 *   - DetectionCountChip (검출 수 배지)
 *   - 🐞 디버그: FaceDetectionService.injectFake() 로 가짜 검출
 */
import { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

import CameraPreview, { type CameraPreviewHandle } from '../components/CameraPreview';
import NoiseFilter from '../components/NoiseFilter';
import CameraHudTop from '../components/CameraHudTop';
import CameraHudBottom from '../components/CameraHudBottom';
import GhostOverlay from '../components/GhostOverlay';
import DetectionCountChip from '../components/DetectionCountChip';
import FirstSightingPulse from '../components/FirstSightingPulse';
import CaptureBurst from '../components/CaptureBurst';
import PermissionDeniedScreen from '../components/PermissionDeniedScreen';
import ScanningLoader from '../components/ScanningLoader';

import { useEmf } from '../hooks/useEmf';
import { useFaceDetection } from '../hooks/useFaceDetection';
import { FeedbackService } from '../services/FeedbackService';
import { useCodexStore } from '../store/useCodexStore';
import { composeWithBoxes } from '../services/PhotoCompositor';
import { makeCaptureId } from '../models/GhostCapture';

interface CameraRouteState {
  ghostId?: string;
  ghostLabel?: string;
  userLat?: number;
  userLng?: number;
}

/** 카메라가 없는 환경 (Preview/에뮬) 에서도 도감 저장을 시연하기 위한 폴백 이미지. */
function emptyPlaceholderPng(w: number, h: number): string {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  const ctx = c.getContext('2d')!;
  ctx.fillStyle = '#0a0d0a';
  ctx.fillRect(0, 0, w, h);
  ctx.fillStyle = '#21f56e';
  ctx.font = 'bold 48px ui-monospace, monospace';
  ctx.textAlign = 'center';
  ctx.fillText('NO SIGNAL', w / 2, h / 2);
  return c.toDataURL('image/png');
}

type Phase = 'loading' | 'ready' | 'permission-denied';

export default function CameraScreen() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const state = (location.state ?? {}) as CameraRouteState;
  const ghostLabel = state.ghostLabel ?? t('directionUnknownSignal');

  const [phase, setPhase] = useState<Phase>('loading');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [capturing, setCapturing] = useState(false);
  const [flash, setFlash] = useState(false);
  const [firstSightingTick, setFirstSightingTick] = useState(0);
  const [captureBurst, setCaptureBurst] = useState(0);

  const { level, sim } = useEmf();

  const previewRef = useRef<CameraPreviewHandle | null>(null);
  const [videoEl, setVideoEl] = useState<HTMLVideoElement | null>(null);

  // ML 검출 훅 — video 준비되면 자동 구독
  const { result, ready: mlReady, triggerFake } = useFaceDetection(videoEl);

  const detections = result?.ghosts ?? [];
  const detectedCount = detections.length;

  // 검출 발생 시 EMF 스파이크 + 첫 발견 햅틱
  const prevCountRef = useRef(0);
  useEffect(() => {
    const prev = prevCountRef.current;
    if (detectedCount > 0) {
      // 다중 검출일수록 더 길게 고정
      sim.current?.triggerSpike(6 + detectedCount * 3);
    }
    if (detectedCount > 0 && prev === 0) {
      FeedbackService.onFirstSighting();
      setFirstSightingTick((n) => n + 1);
    }
    prevCountRef.current = detectedCount;
  }, [detectedCount, sim]);

  const onClose = () => navigate(-1);

  const onShutter = async () => {
    if (capturing) return;
    setCapturing(true);
    FeedbackService.onShutter();
    setFlash(true);
    setTimeout(() => setFlash(false), 90);
    setCaptureBurst((n) => n + 1); // 네온 버스트 트리거

    try {
      // 1. 비디오 프레임 → JPEG dataURL
      const rawDataUrl = previewRef.current?.takeFrame() ?? null;

      // 2. 현재 검출 박스 + 원본 사진 → 합성 사진 (브래킷 박힘)
      const boxes = detections.map((d) => d.bounds);
      let finalDataUrl = rawDataUrl ?? emptyPlaceholderPng(640, 480);
      let dims = { width: 640, height: 480 };
      if (rawDataUrl) {
        const composed = await composeWithBoxes(rawDataUrl, boxes);
        finalDataUrl = composed.dataUrl;
        dims = { width: composed.width, height: composed.height };
      }

      // 3. 도감 저장
      await useCodexStore.getState().add({
        id: makeCaptureId(),
        photoDataUrl: finalDataUrl,
        photoWidth: dims.width,
        photoHeight: dims.height,
        capturedAt: new Date().toISOString(),
        ghostLabel,
        emfLevel: level,
        detectionCount: detectedCount,
        normalizedBoxes: boxes,
        lat: state.userLat,
        lng: state.userLng,
      });

      // 4. 상위 Map 에 "캡처됨" 시그널 전달 → 자동 리스폰 트리거
      navigate('/', { state: { capturedGhostId: state.ghostId, capturedLabel: ghostLabel } });
    } catch (e) {
      console.warn('capture failed:', e);
      setErrorMsg((e as Error).message);
      setCapturing(false);
    }
  };

  const onDebugDetect = () => {
    triggerFake();
    sim.current?.triggerSpike(10);
  };

  // Preview 환경에서 카메라 없을 때도 HUD 확인 가능하도록 폴백
  useEffect(() => {
    if (phase === 'loading') {
      const id = setTimeout(() => {
        setPhase((p) => (p === 'loading' ? 'ready' : p));
      }, 3000);
      return () => clearTimeout(id);
    }
  }, [phase]);

  // 노이즈 intensity: EMF + 첫 발견 부스트는 FirstSightingPulse 가 별도 담당
  const intensity = Math.max(0, Math.min(1, level / 5));

  if (phase === 'permission-denied') {
    return (
      <PermissionDeniedScreen
        onRetry={() => setPhase('loading')}
        message={t('cameraPermissionMessage')}
      />
    );
  }

  return (
    <div className="relative h-full w-full overflow-hidden bg-black">
      {/* 카메라 프리뷰 */}
      <CameraPreview
        ref={previewRef}
        onReady={(v) => {
          setVideoEl(v);
          setPhase('ready');
        }}
        onError={(e) => {
          setErrorMsg(e.message);
          if (e.name === 'NotAllowedError' || e.name === 'PermissionDeniedError') {
            setPhase('permission-denied');
          } else {
            setPhase('ready');
          }
        }}
      />

      {/* 검출 박스 오버레이 (video 와 같은 박스 안에 배치 필요 → 동일 inset) */}
      <GhostOverlay ghosts={detections} />

      {/* 노이즈 오버레이 */}
      <NoiseFilter intensity={intensity} />

      {/* 첫 발견 붉은 펄스 */}
      <FirstSightingPulse trigger={firstSightingTick} />

      {/* 캡처 축하 네온 버스트 */}
      <CaptureBurst trigger={captureBurst} />

      {/* 검출 카운트 배지 */}
      <DetectionCountChip count={detectedCount} />

      {/* 상단 HUD */}
      <CameraHudTop ghostLabel={ghostLabel} emfLevel={level} onClose={onClose} />

      {/* 하단 HUD */}
      <CameraHudBottom
        emfLevel={level}
        onShutter={onShutter}
        onDebugDetect={import.meta.env.DEV ? onDebugDetect : undefined}
        capturing={capturing}
      />

      {/* 셔터 플래시 */}
      {flash && (
        <div className="pointer-events-none absolute inset-0 z-30 bg-white/90 transition-opacity duration-75" />
      )}

      {/* 로딩 — ML 모델 로드 상태도 겸함 */}
      {phase === 'loading' && (
        <ScanningLoader message={mlReady ? t('scanningLoaderDefault') : 'Loading detector…'} />
      )}

      {errorMsg && (
        <div
          className="pointer-events-none absolute inset-x-4 top-20 z-30
                        rounded-md border border-warn/60 bg-black/80 p-2
                        text-[11px] font-bold text-warn text-glow"
        >
          ⚠ {t('cameraInitFailed', { error: errorMsg })}
        </div>
      )}
    </div>
  );
}
