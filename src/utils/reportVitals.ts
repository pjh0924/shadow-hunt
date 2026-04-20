/**
 * reportVitals.ts
 * --------------------------------------------------------------
 * web-vitals (LCP / CLS / FID / FCP / TTFB / INP) 측정 후 콘솔 로깅.
 *
 * 프로덕션에선 analytics endpoint 로 POST 할 수 있도록 `reportTo` 를
 * navigator.sendBeacon 훅으로 교체하면 됨.
 */
import { onCLS, onFCP, onINP, onLCP, onTTFB } from 'web-vitals';

type VitalName = 'CLS' | 'FCP' | 'INP' | 'LCP' | 'TTFB';

function log(name: VitalName, value: number) {
  // dev 콘솔 강조용 styling. 프로덕션에선 조용하길 원하면 import.meta.env.DEV 로 게이트.
  const color =
    value < 1000 ? 'color: #21f56e' : value < 3000 ? 'color: #ffb020' : 'color: #ff3a55';
  console.log(`%c[web-vital] ${name} = ${value.toFixed(2)}`, `${color}; font-weight: 900`);
}

export function reportVitals(): void {
  onLCP((m) => log('LCP', m.value));
  onCLS((m) => log('CLS', m.value));
  onINP((m) => log('INP', m.value));
  onFCP((m) => log('FCP', m.value));
  onTTFB((m) => log('TTFB', m.value));
}
