/**
 * useGhostWorldStore.ts
 * --------------------------------------------------------------
 * GhostWorld 를 Zustand 로 감싸서 React 에 바인딩.
 * GhostWorld 자체는 DOM 밖의 순수 객체이므로,
 * 이 스토어가 `subscribe` 로 외부 변경을 받아 리덕스 스타일 상태로 미러링.
 *
 * 사용 패턴:
 *   const ghosts = useGhostWorldStore(s => s.ghosts);
 *   useGhostWorldStore.getState().world.respawnAround(pos);
 */
import { create } from 'zustand';
import { GhostWorld } from '../services/GhostWorld';
import type { GhostMarker } from '../models/GhostMarker';

interface GhostWorldStore {
  world: GhostWorld;
  ghosts: readonly GhostMarker[];
  capturedIds: readonly string[];
}

const world = new GhostWorld();

export const useGhostWorldStore = create<GhostWorldStore>((set) => {
  // GhostWorld 의 변경을 스토어로 전파
  world.subscribe(() => {
    set({
      ghosts: world.ghosts,
      capturedIds: world.capturedIds,
    });
  });
  return {
    world,
    ghosts: world.ghosts,
    capturedIds: world.capturedIds,
  };
});
