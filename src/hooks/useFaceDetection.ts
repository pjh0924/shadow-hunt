/**
 * useFaceDetection.ts
 * --------------------------------------------------------------
 * 비디오 요소를 받아 FaceDetectionService 를 매 프레임(throttled) 돌리고
 * 최신 DetectionResult 를 반환.
 *
 *  - 250ms 마다 detect (4Hz) — CPU/배터리 절약.
 *  - 결과가 비어도 직전 결과를 holdMs(=500ms) 동안 유지 → 깜빡임 방지.
 *  - service ref 도 노출 → 외부에서 injectFake 호출 가능.
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import { FaceDetectionService } from '../services/FaceDetectionService';
import type { DetectionResult } from '../models/DetectionResult';

const DETECT_INTERVAL_MS = 250;
const HOLD_MS = 500;

export function useFaceDetection(video: HTMLVideoElement | null) {
  const serviceRef = useRef<FaceDetectionService | null>(null);
  const [result, setResult] = useState<DetectionResult | null>(null);
  const [ready, setReady] = useState(false);

  // 서비스 init — 한 번만
  useEffect(() => {
    const svc = new FaceDetectionService();
    serviceRef.current = svc;
    svc
      .init()
      .then(() => setReady(true))
      .catch((e) => {
        console.warn('FaceDetectionService init failed:', e);
        setReady(false);
      });
    return () => {
      svc.dispose();
      serviceRef.current = null;
    };
  }, []);

  // 검출 루프
  //   - requestAnimationFrame 기반 (브라우저 스케줄러 싱크 → 부드러움)
  //   - 250ms throttle (4Hz 유지)
  //   - Page Visibility API: 탭 숨겨지면 pause (배터리/CPU 절약)
  useEffect(() => {
    if (!video || !ready) return;
    let cancelled = false;
    let lastNonEmpty: DetectionResult | null = null;
    let lastNonEmptyAt = 0;
    let lastRunAt = 0;
    let rafId = 0;

    const tick = () => {
      if (cancelled) return;
      // 탭 숨김: rAF 자체가 일시정지. visibilitychange 에서 재시작.
      if (document.hidden) {
        return;
      }
      const ts = performance.now();
      if (ts - lastRunAt >= DETECT_INTERVAL_MS) {
        lastRunAt = ts;
        try {
          const r = serviceRef.current?.detect(video, ts);
          if (r) {
            if (r.ghosts.length > 0) {
              lastNonEmpty = r;
              lastNonEmptyAt = ts;
              setResult(r);
            } else if (lastNonEmpty && ts - lastNonEmptyAt < HOLD_MS) {
              setResult(lastNonEmpty);
            } else {
              setResult(r);
            }
          }
        } catch (e) {
          console.warn('detect failed:', e);
        }
      }
      rafId = window.requestAnimationFrame(tick);
    };

    rafId = window.requestAnimationFrame(tick);

    const onVis = () => {
      if (!document.hidden && !cancelled) {
        cancelAnimationFrame(rafId);
        rafId = window.requestAnimationFrame(tick);
      }
    };
    document.addEventListener('visibilitychange', onVis);

    return () => {
      cancelled = true;
      cancelAnimationFrame(rafId);
      document.removeEventListener('visibilitychange', onVis);
    };
  }, [video, ready]);

  // 외부에서 가짜 검출 트리거 — Preview/카메라 없는 환경 시연용.
  // hook 의 result state 까지 즉시 갱신.
  // (useEffect 뒤에 배치하여 HMR 시 hook order 변동 최소화.)
  const triggerFake = useCallback(() => {
    const svc = serviceRef.current;
    if (!svc) return;
    const dummy = (video ?? document.createElement('video')) as HTMLVideoElement;
    const r = svc.injectFake(dummy, performance.now());
    setResult(r);
  }, [video]);

  return { result, ready, serviceRef, triggerFake };
}
