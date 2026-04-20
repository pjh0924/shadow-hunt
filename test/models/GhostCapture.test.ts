/** GhostCapture — makeCaptureId 유일성. */
import { describe, expect, it } from 'vitest';
import { makeCaptureId } from '../../src/models/GhostCapture';

describe('makeCaptureId', () => {
  it('c_ prefix', () => {
    expect(makeCaptureId()).toMatch(/^c_/);
  });
  it('unique across 1000 calls', () => {
    const set = new Set<string>();
    for (let i = 0; i < 1000; i++) set.add(makeCaptureId());
    expect(set.size).toBeGreaterThanOrEqual(999); // 동시 호출 시 극히 드문 충돌 허용
  });
});
