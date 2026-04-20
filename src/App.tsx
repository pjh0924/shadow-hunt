/**
 * App.tsx — 라우터 + 전역 셸.
 * --------------------------------------------------------------
 * MapScreen 만 즉시 로드 (첫 진입 경로).
 * 나머지 화면은 React.lazy → 초기 번들 크게 감량.
 */
import { lazy, Suspense } from 'react';
import { HashRouter, Route, Routes } from 'react-router-dom';
import MapScreen from './screens/MapScreen';
import ScanningLoader from './components/ScanningLoader';
import SplashIntro from './components/SplashIntro';
import { OnboardingGate } from './components/OnboardingGate';
import { useApplySettings } from './hooks/useApplySettings';

// 아래 화면은 사용자가 실제로 이동할 때만 로드.
const CameraScreen = lazy(() => import('./screens/CameraScreen'));
const CodexScreen = lazy(() => import('./screens/CodexScreen'));
const CodexDetailScreen = lazy(() => import('./screens/CodexDetailScreen'));
const CodexStatsScreen = lazy(() => import('./screens/CodexStatsScreen'));
const OnboardingScreen = lazy(() => import('./screens/OnboardingScreen'));
const SettingsScreen = lazy(() => import('./screens/SettingsScreen'));

/** Suspense 기다리는 동안 보여줄 공용 로더. */
function Fallback() {
  return <ScanningLoader />;
}

export default function App() {
  useApplySettings();

  return (
    <HashRouter>
      <SplashIntro />
      <Suspense fallback={<Fallback />}>
        <Routes>
          <Route
            path="/"
            element={
              <OnboardingGate>
                <MapScreen />
              </OnboardingGate>
            }
          />
          <Route path="/onboarding" element={<OnboardingScreen />} />
          <Route path="/settings" element={<SettingsScreen />} />
          <Route path="/camera" element={<CameraScreen />} />
          <Route path="/codex" element={<CodexScreen />} />
          <Route path="/codex/stats" element={<CodexStatsScreen />} />
          <Route path="/codex/:id" element={<CodexDetailScreen />} />
        </Routes>
      </Suspense>
    </HashRouter>
  );
}
