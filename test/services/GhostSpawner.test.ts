/** GhostSpawner — 시드 재현성 + 반경 + 개수. */
import { describe, expect, it } from 'vitest';
import { spawnAround } from '../../src/services/GhostSpawner';
import { distanceMeters } from '../../src/utils/haversine';

const CENTER = { lat: 37.5665, lng: 126.978 };

describe('spawnAround', () => {
  it('생성 개수가 count 와 일치', () => {
    const marks = spawnAround(CENTER, { count: 5, seed: 42 });
    expect(marks).toHaveLength(5);
  });

  it('모든 마커가 minRadius ~ radius 범위 안', () => {
    const marks = spawnAround(CENTER, {
      count: 20,
      radiusMeters: 100,
      minRadiusMeters: 20,
      seed: 7,
    });
    for (const m of marks) {
      const d = distanceMeters(CENTER, m.position);
      expect(d).toBeGreaterThanOrEqual(19); // float 오차 여유
      expect(d).toBeLessThanOrEqual(101);
    }
  });

  it('같은 시드면 결정적 — 좌표 동일', () => {
    const a = spawnAround(CENTER, { count: 3, seed: 123 });
    const b = spawnAround(CENTER, { count: 3, seed: 123 });
    for (let i = 0; i < 3; i++) {
      expect(a[i].position.lat).toBeCloseTo(b[i].position.lat, 9);
      expect(a[i].position.lng).toBeCloseTo(b[i].position.lng, 9);
    }
  });

  it('startIndex 가 라벨 번호에 반영', () => {
    const marks = spawnAround(CENTER, { count: 2, startIndex: 10, seed: 1 });
    expect(marks[0].label).toContain('#11');
    expect(marks[1].label).toContain('#12');
  });
});
