/**
 * useLocationTracker.ts
 * --------------------------------------------------------------
 * Mock / Real LocationProvider 를 관리하고
 * useLocationStore 에 자동으로 밀어넣는 훅.
 *
 * 반환값:
 *   - providerRef: 항상 최신 provider 참조 (Mock 조작용)
 *   - mockMode / setMockMode
 *
 * 동작:
 *   1. mockMode=false 면 RealLocationProvider 구독 (권한 요청 포함)
 *   2. mockMode=true 로 토글되면 실 공급자 dispose 후
 *      마지막 위치에서 MockLocationProvider 시작
 *   3. 위치 업데이트 / 에러를 locationStore 에 반영
 */
import { useEffect, useRef } from 'react';
import { Capacitor } from '@capacitor/core';
import { useLocationStore } from '../store/useLocationStore';
import { useMockModeStore } from '../store/useMockModeStore';
import type { LocationProvider } from '../services/location/LocationProvider';
import { RealLocationProvider } from '../services/location/RealLocationProvider';
import { MockLocationProvider } from '../services/location/MockLocationProvider';
import { BackgroundLocationProvider } from '../services/location/BackgroundLocationProvider';
import { ensureLocationPermission } from '../services/location/LocationPermissionHelper';

export function useLocationTracker() {
  const mockMode = useMockModeStore((s) => s.mockMode);
  const backgroundMode = useMockModeStore((s) => s.backgroundMode);
  const setMockMode = useMockModeStore((s) => s.setMockMode);
  const providerRef = useRef<LocationProvider | null>(null);
  // mockMode ON 전환을 위한 stable 참조 (closure 안에 바로 쓰기 위함).
  const lastFixRef = useRef(useLocationStore.getState().fix);

  useEffect(() => {
    // Store fix 업데이트를 refs 로 추적 — mockMode 토글 시 그 위치에서 이어 시작.
    const unsub = useLocationStore.subscribe((s) => {
      lastFixRef.current = s.fix;
    });
    return unsub;
  }, []);

  useEffect(() => {
    const { setFix, setError, setStatus, reset } = useLocationStore.getState();
    let cancelled = false;

    (async () => {
      // 기존 provider 정리
      providerRef.current?.dispose();
      providerRef.current = null;

      if (mockMode) {
        // Mock 시작점: 마지막 실 위치, 없으면 서울 중심
        const seed = lastFixRef.current ?? { lat: 37.5665, lng: 126.978 };
        const mock = new MockLocationProvider(seed);
        providerRef.current = mock;
        setFix(await mock.currentPosition());
        mock.watch(setFix);
        return;
      }

      // Real / Background
      reset();

      // 백그라운드 모드 + 네이티브 환경에선 BackgroundLocationProvider 사용.
      // 웹에선 플러그인 노옵 → RealLocationProvider 로 폴백.
      if (backgroundMode && Capacitor.isNativePlatform()) {
        try {
          const bg = new BackgroundLocationProvider();
          providerRef.current = bg;
          bg.watch(setFix, (e) => setError(e.message));
          return;
        } catch (e) {
          if (cancelled) return;
          setError((e as Error).message);
          return;
        }
      }

      const perm = await ensureLocationPermission();
      if (cancelled) return;
      if (perm === 'denied') {
        setStatus('denied');
        return;
      }

      try {
        const real = new RealLocationProvider();
        providerRef.current = real;
        const first = await real.currentPosition();
        if (cancelled) return;
        setFix(first);
        real.watch(setFix, (e) => setError(e.message));
      } catch (e) {
        if (!cancelled) setError((e as Error).message);
      }
    })();

    return () => {
      cancelled = true;
      providerRef.current?.dispose();
      providerRef.current = null;
    };
  }, [mockMode, backgroundMode]);

  return { providerRef, mockMode, setMockMode };
}
