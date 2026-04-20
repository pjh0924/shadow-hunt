/** haversine — 거리 + bearing + offset. */
import { describe, expect, it } from 'vitest';
import {
  bearingDegrees,
  distanceMeters,
  offsetMeters,
} from '../../src/utils/haversine';

describe('distanceMeters', () => {
  it('같은 점 → 0', () => {
    const p = { lat: 37.5, lng: 127 };
    expect(distanceMeters(p, p)).toBeCloseTo(0, 6);
  });

  it('위도 1분(1/60°) ≈ 1852m (1 nautical mile)', () => {
    const a = { lat: 37.5, lng: 127 };
    const b = { lat: 37.5 + 1 / 60, lng: 127 };
    const d = distanceMeters(a, b);
    expect(d).toBeGreaterThan(1830);
    expect(d).toBeLessThan(1870);
  });
});

describe('bearingDegrees', () => {
  it('북쪽으로 가면 ~0°', () => {
    const b = bearingDegrees({ lat: 37, lng: 127 }, { lat: 37.1, lng: 127 });
    expect(b).toBeLessThan(1);
  });
  it('동쪽으로 가면 ~90°', () => {
    const b = bearingDegrees({ lat: 37, lng: 127 }, { lat: 37, lng: 127.1 });
    expect(b).toBeGreaterThan(89);
    expect(b).toBeLessThan(91);
  });
});

describe('offsetMeters', () => {
  it('동쪽 100m + 북쪽 100m 이동 거리가 √2 * 100 ≈ 141.4', () => {
    const a = { lat: 37.5, lng: 127 };
    const b = offsetMeters(a, 100, 100);
    expect(distanceMeters(a, b)).toBeCloseTo(141.42, 0);
  });
});
