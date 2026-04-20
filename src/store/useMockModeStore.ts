/**
 * useMockModeStore.ts
 * --------------------------------------------------------------
 * Mock GPS 토글을 전역 상태로 보존. MapScreen 이 라우팅으로
 * 재마운트되어도 유지.
 */
import { create } from 'zustand';

interface MockModeStore {
  mockMode: boolean;
  /** 백그라운드 GPS 플러그인 사용 여부. 기본 false. */
  backgroundMode: boolean;
  setMockMode: (v: boolean | ((prev: boolean) => boolean)) => void;
  setBackgroundMode: (v: boolean) => void;
}

export const useMockModeStore = create<MockModeStore>((set, get) => ({
  mockMode: false,
  backgroundMode: false,
  setMockMode: (v) => {
    const next = typeof v === 'function' ? v(get().mockMode) : v;
    set({ mockMode: next });
  },
  setBackgroundMode: (v) => set({ backgroundMode: v }),
}));
