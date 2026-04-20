# Shadow Hunt 👻

**호러 테마 포켓몬-GO 스타일 모바일 앱.**
지도 위 고스트 스팟으로 이동 → 헌트존 진입 → 카메라 → AI 얼굴 검출이
"허공에서 귀신 형상"을 탐지하는 컨셉 (False-positive 기반 긴장감).

- **Live (웹 PWA)**: https://pjh0924.github.io/shadow-hunt/
- **Repo**: https://github.com/pjh0924/shadow-hunt

| | |
|---|---|
| 플랫폼 | Capacitor 8 (Android + iOS + Web PWA) |
| 프론트엔드 | React 19 + TypeScript + Vite + Tailwind v4 |
| 지도 | React Leaflet + CartoDB Dark Matter 타일 (API 키 불필요) |
| ML | MediaPipe Tasks Vision (WASM, 번들) |
| 저장소 | @capacitor/preferences |
| 상태 | Zustand |
| 센서 | Web Magnetometer (EMF) + DeviceOrientation (compass) |
| 알림 | @capacitor/local-notifications |
| 테스트 | Vitest + React Testing Library |

## 게임 루프

1. **지도** — 실 GPS 위치 주변 100m 반경에 귀신 3마리 랜덤 스폰
2. **헌트존** — 25m 안 진입 시 "🎯 감지됨" + 시스템 알림 + 햅틱
3. **카메라 모드** — `getUserMedia` 라이브 프리뷰 + EMF 미터 + 노이즈 오버레이
4. **ML 검출** — MediaPipe Face Detector 250ms 간격 → 코너 브래킷 + EMF 스파이크
5. **캡처** — Canvas 합성(박스 굽기) → Preferences 영구 저장 → 자동 리스폰
6. **도감** — 썸네일 그리드 / 디테일 (미니맵 + 메타) / 통계 / 공유

## 개발 시작

```bash
npm install
npm run dev     # → http://localhost:5173
```

### Android 빌드

```bash
# 필수: JDK 21 + Android SDK (API 34+)
export JAVA_HOME=/opt/homebrew/opt/openjdk@21/libexec/openjdk.jdk/Contents/Home
export ANDROID_HOME=/opt/homebrew/share/android-commandlinetools

npm run build
npx cap sync android
cd android && ./gradlew assembleDebug
adb install -r app/build/outputs/apk/debug/app-debug.apk
```

### 테스트

```bash
npm test            # vitest run
npm run typecheck   # tsc -b
npm run lint        # eslint
```

## 구조

```
src/
├── screens/              # MapScreen, CameraScreen, CodexScreen, ...
├── components/           # HuntActionPanel, EmfMeter, GhostOverlay, ...
│   └── icons/            # divIcon 팩토리 (SVG 인라인)
├── services/             # 도메인 로직 (GhostWorld, EmfSimulator, ...)
│   └── location/         # LocationProvider interface + Real/Mock
├── hooks/                # useLocationTracker, useEmf, useFaceDetection, ...
├── store/                # Zustand (Location / GhostWorld / Codex / MockMode)
├── models/               # GhostMarker, PositionFix, GhostCapture, ...
├── utils/                # haversine, offsets
├── i18n/                 # en.json / ko.json + config
├── constants/            # huntConstants
├── theme/                # colors 토큰
└── main.tsx / App.tsx

public/
└── mediapipe/            # MediaPipe Tasks Vision WASM (번들됨)

docs/
├── BACKGROUND_GPS.md     # 백그라운드 위치 플러그인 통합 가이드
└── DEMO_SCRIPT.md        # 데모 영상 촬영용 시나리오

test/                     # Vitest — 서비스 단위 테스트
```

## 개발 팁

### Mock GPS (브라우저 / 에뮬 검증용)

앱바 타이틀을 **600ms 길게 누르면** Mock 모드 토글.
화면 좌하단 D-Pad 로 동서남북 이동 + 가운데 ✦ 로 가장 가까운 귀신 텔레포트.

브라우저 dev 에선 위치 권한이 거부/시간초과되면 로더 화면에
**"⚠ DEV — Mock 모드로 시작"** 버튼이 3초 뒤 뜸.

### 🐞 디버그 가짜 검출

카메라 화면 우하단 🐞 버튼 (`import.meta.env.DEV` 만 노출).
ML 모델 없이도 검출 이벤트를 시뮬레이션 → EMF 스파이크 + GhostOverlay.

### 사운드 자산

`public/sfx/` 에 다음 파일을 두면 자동 연결:
- `enter.mp3` — 헌트존 진입
- `exit.mp3` — 헌트존 이탈
- `first_sighting.mp3` — 첫 형상 발견
- `shutter.mp3` — 촬영

이미 `scripts/generate-sfx.mjs` 로 ffmpeg 합성 프로시저럴 mp3 가 들어있음
(덮어쓰기 자유). 자산 없으면 자동으로 Web Audio 프로시저럴 재생.

### 웹 PWA 배포

```bash
./scripts/deploy.sh
```

`npm run build` → `dist/` → orphan `gh-pages` 브랜치로 push.
GitHub Pages 가 ~1분 내 반영.

자동 CI/CD 원하면 `.gh-workflows-pending/*.yml` 을 `.github/workflows/` 로
옮긴 후 `gh auth refresh -s workflow` 로 토큰 확장 후 push.

## 라이선스

MIT (또는 사용자가 선택). 지도 타일은 OpenStreetMap + CARTO (Dark Matter)
의 ODbL / CC BY 조건을 따름 — 앱 내 attribution 표시 필수.
