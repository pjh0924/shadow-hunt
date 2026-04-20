/**
 * App.tsx — 라우터 + 전역 셸.
 * --------------------------------------------------------------
 * 화면:
 *   /        지도 (메인)
 *   /camera  카메라 (HUD + ML 검출)
 *   /codex   도감 그리드
 *   /codex/:id 도감 상세
 *   /codex/stats 통계
 *
 * HashRouter 를 쓰는 이유: Capacitor 에선 file:// 로 로드 →
 * BrowserRouter 의 history API 가 안 먹는다.
 */
import { HashRouter, Route, Routes } from 'react-router-dom';
import MapScreen from './screens/MapScreen';
import CameraScreen from './screens/CameraScreen';
import CodexScreen from './screens/CodexScreen';
import CodexDetailScreen from './screens/CodexDetailScreen';
import CodexStatsScreen from './screens/CodexStatsScreen';

export default function App() {
  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<MapScreen />} />
        <Route path="/camera" element={<CameraScreen />} />
        <Route path="/codex" element={<CodexScreen />} />
        <Route path="/codex/stats" element={<CodexStatsScreen />} />
        <Route path="/codex/:id" element={<CodexDetailScreen />} />
      </Routes>
    </HashRouter>
  );
}
