/** Vitest + jsdom 공통 설정. */
import '@testing-library/jest-dom/vitest';

// jsdom 에 없는 API polyfill
if (typeof globalThis.ResizeObserver === 'undefined') {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (globalThis as any).ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
}
