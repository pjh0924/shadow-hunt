/**
 * useCodexStore.ts
 * --------------------------------------------------------------
 * 도감 영구 저장소의 React 바인딩.
 * 앱 시작 시 한 번 로드, repo 변경 알림에 따라 자동 리렌더.
 */
import { create } from 'zustand';
import { GhostCodexRepo } from '../services/GhostCodexRepository';
import type { GhostCapture } from '../models/GhostCapture';

interface CodexStore {
  items: GhostCapture[];
  loading: boolean;
  loaded: boolean;
  refresh: () => Promise<void>;
  add: (c: GhostCapture) => Promise<void>;
  remove: (id: string) => Promise<void>;
}

export const useCodexStore = create<CodexStore>((set, get) => {
  // repo 변경 → store 동기화
  GhostCodexRepo.subscribe(() => {
    GhostCodexRepo.list().then((items) => set({ items }));
  });

  return {
    items: [],
    loading: false,
    loaded: false,
    async refresh() {
      if (get().loading) return;
      set({ loading: true });
      try {
        const items = await GhostCodexRepo.list();
        set({ items, loaded: true, loading: false });
      } catch {
        set({ loading: false, loaded: true });
      }
    },
    async add(c) {
      await GhostCodexRepo.add(c);
      // subscribe 콜백이 items 갱신 처리
    },
    async remove(id) {
      await GhostCodexRepo.remove(id);
    },
  };
});
