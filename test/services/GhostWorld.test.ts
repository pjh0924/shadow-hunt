/** GhostWorld — capture + respawn + listener. */
import { describe, expect, it, vi } from 'vitest';
import { GhostWorld } from '../../src/services/GhostWorld';
import { SPAWN_COUNT } from '../../src/constants/huntConstants';

const POS = { lat: 37.5665, lng: 126.978 };

describe('GhostWorld', () => {
  it('respawnAround 이후 SPAWN_COUNT 개 만들어짐', () => {
    const w = new GhostWorld();
    w.respawnAround(POS);
    expect(w.ghosts).toHaveLength(SPAWN_COUNT);
  });

  it('capture 는 해당 id 만 제거 + capturedIds 누적', () => {
    const w = new GhostWorld();
    w.respawnAround(POS);
    const first = w.ghosts[0];
    const before = w.ghosts.length;
    w.capture(first.id, POS);
    expect(w.ghosts.find((g) => g.id === first.id)).toBeUndefined();
    expect(w.ghosts.length).toBe(before - 1);
    expect(w.capturedIds).toContain(first.id);
  });

  it('모든 마커 캡처 시 자동 리스폰 타이머 스케줄', async () => {
    vi.useFakeTimers();
    const w = new GhostWorld();
    w.respawnAround(POS);
    const allIds = w.ghosts.map((g) => g.id);
    for (const id of allIds) w.capture(id, POS);
    expect(w.ghosts).toHaveLength(0);
    // AUTO_RESPAWN_DELAY_MS (3s) 경과 → 다시 스폰됨
    await vi.advanceTimersByTimeAsync(3001);
    expect(w.ghosts.length).toBeGreaterThan(0);
    vi.useRealTimers();
  });

  it('subscribe 는 변경 시 listener 호출', () => {
    const w = new GhostWorld();
    const listener = vi.fn();
    const unsub = w.subscribe(listener);
    w.respawnAround(POS);
    expect(listener).toHaveBeenCalled();
    unsub();
    listener.mockClear();
    w.respawnAround(POS);
    expect(listener).not.toHaveBeenCalled();
  });
});
