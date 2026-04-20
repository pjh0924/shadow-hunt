/** MockLocationProvider — moveBy / teleport / heading. */
import { describe, expect, it } from 'vitest';
import { MockLocationProvider } from '../../src/services/location/MockLocationProvider';
import { distanceMeters } from '../../src/utils/haversine';

const START = { lat: 37.5665, lng: 126.978 };

describe('MockLocationProvider', () => {
  it('currentPosition 초기값', async () => {
    const p = new MockLocationProvider(START);
    const fix = await p.currentPosition();
    expect(fix.lat).toBeCloseTo(START.lat, 9);
    expect(fix.lng).toBeCloseTo(START.lng, 9);
  });

  it('moveBy 후 새 fix emit', async () => {
    const p = new MockLocationProvider(START);
    const events: { lat: number; lng: number }[] = [];
    p.watch((f) => events.push(f));
    await new Promise((r) => queueMicrotask(() => r(null)));
    p.moveBy(50, 0); // 동쪽 50m
    const latest = events[events.length - 1];
    const moved = distanceMeters(START, latest);
    expect(moved).toBeGreaterThan(45);
    expect(moved).toBeLessThan(55);
  });

  it('teleportTo 즉시 이동', async () => {
    const p = new MockLocationProvider(START);
    const events: { lat: number; lng: number }[] = [];
    p.watch((f) => events.push(f));
    await new Promise((r) => queueMicrotask(() => r(null)));
    p.teleportTo({ lat: 34, lng: 126 });
    const latest = events[events.length - 1];
    expect(latest.lat).toBeCloseTo(34, 6);
  });
});
