/** EmfSimulator — bounds + triggerSpike + stop idempotency. */
import { describe, expect, it, vi } from 'vitest';
import { EmfSimulator } from '../../src/services/EmfSimulator';

describe('EmfSimulator', () => {
  it('값이 항상 0~5 범위', () => {
    vi.useFakeTimers();
    const sim = new EmfSimulator();
    const seen: number[] = [];
    const unsub = sim.subscribe((v) => seen.push(v));
    sim.start(50);
    vi.advanceTimersByTime(50 * 20);
    unsub();
    sim.dispose();
    expect(seen.length).toBeGreaterThan(0);
    for (const v of seen) {
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThanOrEqual(5);
    }
    vi.useRealTimers();
  });

  it('triggerSpike 후 다음 tick 에서 4.5 이상', () => {
    vi.useFakeTimers();
    const sim = new EmfSimulator();
    sim.start(50);
    sim.triggerSpike(3);
    vi.advanceTimersByTime(50);
    expect(sim.last).toBeGreaterThanOrEqual(4.5);
    sim.dispose();
    vi.useRealTimers();
  });

  it('start/stop 중복 호출 안전', () => {
    const sim = new EmfSimulator();
    sim.start();
    sim.start();
    sim.stop();
    sim.stop();
    sim.dispose();
  });
});
