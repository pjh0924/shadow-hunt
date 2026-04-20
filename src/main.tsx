/**
 * main.tsx — 엔트리.
 * --------------------------------------------------------------
 * - i18n 부트스트랩 (import 만으로 init 됨)
 * - StrictMode 끔: dev 에서 useEffect 가 두 번 호출되어
 *   카메라/GPS 구독이 꼬일 수 있음. Capacitor + 미디어 API 친화 위해 비활성화.
 */
import { createRoot } from 'react-dom/client';
import './index.css';
import './i18n/config';
import App from './App';
import { ErrorBoundary } from './components/ErrorBoundary';
import { reportVitals } from './utils/reportVitals';

// 전역 unhandled 에러/reject → localStorage 에 기록 (Boundary 외부에서도)
window.addEventListener('unhandledrejection', (e) => {
  console.warn('[unhandled rejection]', e.reason);
});

createRoot(document.getElementById('root')!).render(
  <ErrorBoundary>
    <App />
  </ErrorBoundary>,
);

// web-vitals — idle 시점에 등록 (LCP/FCP/CLS/INP/TTFB 콘솔 로깅)
if (typeof requestIdleCallback === 'function') {
  requestIdleCallback(reportVitals);
} else {
  setTimeout(reportVitals, 1000);
}
