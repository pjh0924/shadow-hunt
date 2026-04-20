// @refresh reset
/**
 * MapScreen.tsx — Step 1 메인 지도 화면.
 * --------------------------------------------------------------
 * 책임:
 *   1. 위치 추적 (Real / Mock 토글) → useLocationTracker
 *   2. GhostWorld 첫 스폰 / 헌트존 진입 감지
 *   3. 지도 + 타일 + 안개 + 마커 + 사용자 위치 렌더 (Leaflet)
 *   4. 상단 AppBar / 좌상단 DirectionIndicator / 하단 HuntActionPanel
 *   5. 우하단 RecenterFAB (지도 follow)
 *   6. AppBar 타이틀 600ms long-press → Mock 모드 토글
 */
import { useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { MapContainer, TileLayer, Marker, Circle, useMap } from 'react-leaflet';

import { useLocationStore } from '../store/useLocationStore';
import { useGhostWorldStore } from '../store/useGhostWorldStore';
import { useLocationTracker } from '../hooks/useLocationTracker';
import { useCompass } from '../hooks/useCompass';
import { MockLocationProvider } from '../services/location/MockLocationProvider';

import FogCircles from '../components/FogCircles';
import HuntActionPanel from '../components/HuntActionPanel';
import DirectionIndicator from '../components/DirectionIndicator';
import ScanningLoader from '../components/ScanningLoader';
import PermissionDeniedScreen from '../components/PermissionDeniedScreen';
import MockControlPanel from '../components/MockControlPanel';
import RecenterFAB from '../components/RecenterFAB';
import { createGhostIconHidden, createGhostIconVisible } from '../components/icons/ghostMarkerIcon';
import { createUserIcon } from '../components/icons/userMarkerIcon';

import { distanceMeters } from '../utils/haversine';
import { HUNT_RADIUS_M, VISIBLE_RADIUS_M } from '../constants/huntConstants';
import { FeedbackService } from '../services/FeedbackService';
import { NotificationService } from '../services/NotificationService';
import { SoundService } from '../services/SoundService';

const TILE_URL = 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png';
const TILE_ATTR =
  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/">CARTO</a>';

/** 지도 컨트롤러 — useMap 훅을 부분 컴포넌트로 빼서 부모에 callback 노출. */
function MapController({ onReady }: { onReady: (map: L.Map) => void }) {
  const map = useMap();
  useEffect(() => {
    onReady(map);
  }, [map, onReady]);
  return null;
}

interface MapRouteState {
  capturedGhostId?: string;
  capturedLabel?: string;
}

export default function MapScreen() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const routerLocation = useLocation();

  const fix = useLocationStore((s) => s.fix);
  const status = useLocationStore((s) => s.status);

  const ghosts = useGhostWorldStore((s) => s.ghosts);
  const world = useGhostWorldStore((s) => s.world);

  const { providerRef, mockMode, setMockMode } = useLocationTracker();
  // 나침반 헤딩 — 있으면 GPS heading 보다 우선 사용 (실시간 회전).
  const { heading: compassHeading } = useCompass();

  // 첫 fix 받으면 자동으로 한 웨이브 스폰
  const spawnedRef = useRef(false);
  useEffect(() => {
    if (fix && !spawnedRef.current && ghosts.length === 0) {
      spawnedRef.current = true;
      world.respawnAround(fix);
    }
  }, [fix, ghosts.length, world]);

  // 카메라에서 복귀 시 capturedGhostId 처리 → 캡처 + 자동 리스폰
  const consumedCaptureRef = useRef<string | null>(null);
  useEffect(() => {
    const state = (routerLocation.state ?? {}) as MapRouteState;
    const id = state.capturedGhostId;
    if (!id || !fix) return;
    if (consumedCaptureRef.current === id) return;
    consumedCaptureRef.current = id;
    world.capture(id, fix);
    // snackbar 대체: 간단 alert 대신 콘솔. Step 5+ 에서 Toast 위젯화 가능.
    // react-router 의 state 는 replaceState 로 비워둬서 재방문 시 중복 실행 방지.
    window.history.replaceState({}, '');
  }, [routerLocation.state, fix, world]);

  // 사용자 첫 제스처 시 사운드/알림 프라임 — 브라우저 자동재생 정책 해제.
  useEffect(() => {
    const handler = () => {
      SoundService.unlock();
      NotificationService.prime();
      window.removeEventListener('pointerdown', handler, true);
    };
    window.addEventListener('pointerdown', handler, true);
    return () => window.removeEventListener('pointerdown', handler, true);
  }, []);

  // 헌트존 안에 있는 가장 가까운 마커 (식별 가능 = visible) 식별
  const detected = useMemo(() => {
    if (!fix) return null;
    let best: { id: string; label: string; dist: number } | null = null;
    for (const g of ghosts) {
      const d = distanceMeters(fix, g.position);
      if (d > HUNT_RADIUS_M) continue;
      if (d > VISIBLE_RADIUS_M) continue;
      if (!best || d < best.dist) {
        best = { id: g.id, label: g.label, dist: d };
      }
    }
    return best;
  }, [fix, ghosts]);

  // 헌트존 진입/이탈 이벤트 — 햅틱 + 사운드 + 시스템 알림
  const prevDetectedIdRef = useRef<string | null>(null);
  useEffect(() => {
    const prev = prevDetectedIdRef.current;
    const cur = detected?.id ?? null;
    if (cur && !prev) {
      FeedbackService.onEnterHuntZone();
      NotificationService.zoneEntered(
        t('notifZoneTitle'),
        t('notifZoneBody', { label: detected!.label }),
      );
    } else if (!cur && prev) {
      FeedbackService.onExitHuntZone();
    }
    prevDetectedIdRef.current = cur;
  }, [detected, t]);

  // ----- 지도 인스턴스 / follow / recenter -----
  const mapRef = useRef<L.Map | null>(null);
  const [following, setFollowing] = useState(true);
  useEffect(() => {
    if (following && fix && mapRef.current) {
      mapRef.current.setView([fix.lat, fix.lng], mapRef.current.getZoom() ?? 17);
    }
  }, [following, fix]);

  // ----- AppBar 타이틀 long-press → Mock 토글 -----
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const startLongPress = () => {
    longPressTimer.current = setTimeout(() => {
      setMockMode((v) => !v);
      // 햅틱은 Step 5+ FeedbackService 에서. 여기선 비주얼 토글만.
    }, 600);
  };
  const cancelLongPress = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  };

  // ----- 카메라 모드 진입 -----
  const onEnterCamera = () => {
    if (!detected) return;
    navigate('/camera', {
      state: {
        ghostId: detected.id,
        ghostLabel: detected.label,
        userLat: fix?.lat,
        userLng: fix?.lng,
      },
    });
  };

  // ----- Mock D-Pad 조작 -----
  const mockMove = (e: number, n: number) => {
    const p = providerRef.current;
    if (p instanceof MockLocationProvider) p.moveBy(e, n);
  };
  const mockTeleportNearest = () => {
    const p = providerRef.current;
    if (!(p instanceof MockLocationProvider) || !fix || ghosts.length === 0) return;
    let nearest = ghosts[0];
    let nDist = distanceMeters(fix, nearest.position);
    for (const g of ghosts.slice(1)) {
      const d = distanceMeters(fix, g.position);
      if (d < nDist) {
        nDist = d;
        nearest = g;
      }
    }
    p.teleportTo(nearest.position);
  };
  const mockRespawn = () => {
    if (!fix) return;
    world.respawnAround(fix);
  };

  // ----- 권한/로딩 게이트 -----
  if (status === 'denied') {
    return (
      <PermissionDeniedScreen
        onRetry={() => useLocationStore.getState().reset()}
        onUseMock={() => setMockMode(true)}
      />
    );
  }
  if (status === 'pending' || !fix) {
    return <ScanningLoader onSkipToMock={() => setMockMode(true)} />;
  }

  return (
    <div className="relative h-full w-full overflow-hidden">
      {/* 지도 */}
      <MapContainer
        center={[fix.lat, fix.lng]}
        zoom={17}
        zoomControl={false}
        attributionControl={true}
        className="absolute inset-0 z-0"
      >
        <MapController onReady={(m) => (mapRef.current = m)} />
        <TileLayer url={TILE_URL} attribution={TILE_ATTR} maxZoom={19} />

        {/* 사용자 정확도 원 */}
        <Circle
          center={[fix.lat, fix.lng]}
          radius={Math.max(8, fix.accuracy)}
          pathOptions={{
            color: 'var(--color-neon)',
            weight: 1,
            opacity: 0.5,
            fillColor: 'var(--color-neon)',
            fillOpacity: 0.08,
          }}
        />

        {/* 안개 + 헌트존 ring */}
        <FogCircles ghosts={ghosts} userFix={fix} />

        {/* 귀신 마커 */}
        {ghosts.map((g) => {
          const dist = distanceMeters(fix, g.position);
          const visible = dist <= VISIBLE_RADIUS_M;
          return (
            <Marker
              key={g.id}
              position={[g.position.lat, g.position.lng]}
              icon={visible ? createGhostIconVisible() : createGhostIconHidden()}
            />
          );
        })}

        {/* 사용자 마커 — compass 있으면 compass, 없으면 GPS heading */}
        <Marker
          position={[fix.lat, fix.lng]}
          icon={createUserIcon(compassHeading ?? fix.heading)}
          interactive={false}
        />
      </MapContainer>

      {/* 상단 AppBar */}
      <header
        role="banner"
        className="pointer-events-auto absolute inset-x-0 top-0 z-10 flex items-center
                   justify-between border-b border-neon/20 bg-bg/80 px-4 pt-3 pb-2 backdrop-blur"
      >
        <h1
          role="button"
          tabIndex={0}
          aria-label={`${t('appTitle')} — 길게 눌러 Mock 모드 토글`}
          onPointerDown={startLongPress}
          onPointerUp={cancelLongPress}
          onPointerLeave={cancelLongPress}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              setMockMode((v) => !v);
            }
          }}
          className="select-none text-sm font-extrabold tracking-[0.3em] text-neon text-glow
                     focus:outline-none focus:ring-2 focus:ring-neon focus:ring-offset-2 focus:ring-offset-bg rounded"
        >
          {t('appTitle')}
          {mockMode && <span className="text-warn"> · {t('mock')}</span>}
        </h1>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => navigate('/settings')}
            aria-label={t('settingsTooltip')}
            className="rounded-md border border-neon/40 px-3 py-1 text-xs font-bold text-neon
                       focus:outline-none focus:ring-2 focus:ring-neon active:bg-neon/20"
          >
            <span aria-hidden="true">⚙</span>
          </button>
          <button
            type="button"
            onClick={() => navigate('/codex')}
            aria-label={t('mapCodexTooltip')}
            className="rounded-md border border-neon/40 px-3 py-1 text-xs font-bold text-neon
                       focus:outline-none focus:ring-2 focus:ring-neon active:bg-neon/20"
          >
            <span aria-hidden="true">📓</span>
          </button>
        </div>
      </header>

      {/* 좌상단 방향 인디케이터 */}
      <DirectionIndicator ghosts={ghosts} userFix={fix} />

      {/* 하단 카메라 버튼 패널 */}
      <HuntActionPanel detectedLabel={detected?.label ?? null} onEnterCamera={onEnterCamera} />

      {/* 우하단 recenter */}
      <RecenterFAB
        onRecenter={() => {
          setFollowing(true);
          if (fix && mapRef.current) {
            mapRef.current.setView([fix.lat, fix.lng], 17);
          }
        }}
        following={following}
        onToggleFollow={() => setFollowing((v) => !v)}
      />

      {/* Mock D-Pad */}
      {mockMode && (
        <MockControlPanel
          onMove={mockMove}
          onTeleportNearest={mockTeleportNearest}
          onRespawn={mockRespawn}
        />
      )}
    </div>
  );
}
