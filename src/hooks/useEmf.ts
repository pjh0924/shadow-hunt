/**
 * useEmf.ts
 * --------------------------------------------------------------
 * EmfSimulator 인스턴스를 만들어 구독 + 값 상태로 반환.
 * 긴장도 자동 상승 (카메라 화면 오래 켜둘수록 ↑).
 *
 * 반환: { level, sim }  — level 은 리액티브 숫자, sim 은 triggerSpike 용
 */
import { useEffect, useRef, useState } from 'react';
import { EmfSimulator } from '../services/EmfSimulator';
import { FeedbackService } from '../services/FeedbackService';

export function useEmf() {
  const simRef = useRef<EmfSimulator | null>(null);
  const [level, setLevel] = useState(0);

  useEffect(() => {
    const sim = new EmfSimulator();
    simRef.current = sim;

    let wasHigh = false;
    const unsub = sim.subscribe((v) => {
      setLevel(v);
      // EMF 4.0 임계치 상향 돌파 → 햅틱
      if (v >= 4.0 && !wasHigh) {
        FeedbackService.onEmfDanger();
      }
      wasHigh = v >= 4.0;
    });
    sim.start();

    // 긴장도 누적: 0 → 1 약 25초 동안
    const openedAt = Date.now();
    const tensionTicker = window.setInterval(() => {
      const elapsed = (Date.now() - openedAt) / 1000;
      sim.setTension(Math.min(1, elapsed / 25));
    }, 500);

    return () => {
      unsub();
      window.clearInterval(tensionTicker);
      sim.dispose();
      simRef.current = null;
    };
  }, []);

  return { level, sim: simRef };
}
