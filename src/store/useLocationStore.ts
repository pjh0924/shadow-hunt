/**
 * useLocationStore.ts
 * --------------------------------------------------------------
 * 현재 위치 + 상태(permission / loading / ready / error).
 *
 * MapScreen 의 useLocationTracker 훅이 LocationProvider 를 구독해
 * 이 스토어에 밀어넣고, 화면 여러 곳(DirectionIndicator, UserMarker,
 * HuntActionPanel …)이 읽는 구조.
 */
import { create } from 'zustand';
import type { PositionFix } from '../models/PositionFix';

export type LocationStatus =
  | 'pending' // 초기 로딩
  | 'ready' // 위치 있음
  | 'denied' // 권한 거부
  | 'error'; // 기타 (GPS off 등)

interface LocationStore {
  status: LocationStatus;
  fix: PositionFix | null;
  errorMessage: string | null;
  setStatus: (s: LocationStatus) => void;
  setFix: (f: PositionFix) => void;
  setError: (msg: string) => void;
  reset: () => void;
}

export const useLocationStore = create<LocationStore>((set) => ({
  status: 'pending',
  fix: null,
  errorMessage: null,
  setStatus: (status) => set({ status }),
  setFix: (fix) => set({ status: 'ready', fix, errorMessage: null }),
  setError: (errorMessage) => set({ status: 'error', errorMessage }),
  reset: () => set({ status: 'pending', fix: null, errorMessage: null }),
}));
