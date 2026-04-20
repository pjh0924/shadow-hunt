# 백그라운드 GPS / 앱 지속성 가이드

Capacitor WebView 가 백그라운드로 가면 기본적으로 위치 스트림이 멈춥니다.
실제 디바이스에서 "앱이 꺼져 있어도 헌트존 진입 알림을 받으려면" 플랫폼별
추가 설정이 필요합니다.

## 현재 상태

- `RealLocationProvider` 는 `@capacitor/geolocation` 의 `watchPosition` 을
  사용합니다. 포그라운드에선 정상, 화면이 꺼지거나 앱이 백그라운드면 OS
  정책에 따라 스로틀/중지됩니다.
- `NotificationService.zoneEntered()` 는 포그라운드에서만 트리거됩니다
  (MapScreen 이 활성 상태여야 detected 가 갱신되므로).

## Android — Foreground Service

1. `@capacitor-community/background-geolocation` 또는
   `capacitor-background-geolocation` 플러그인 추가.
2. `AndroidManifest.xml` 에 `FOREGROUND_SERVICE`, `ACCESS_BACKGROUND_LOCATION`
   권한 추가 (이미 선언됨).
3. Foreground Service 알림 채널 생성 (권장: "Shadow Hunt Tracking").
4. 배터리 최적화 예외 요청 (Android 설정 → 배터리 → 제외 앱).

```ts
// 예시 — background-geolocation 플러그인 기준
import { BackgroundGeolocation } from '@capacitor-community/background-geolocation';

await BackgroundGeolocation.addWatcher(
  { stale: false, distanceFilter: 1, requestPermissions: true },
  (position) => {
    // useLocationStore 로 반영
  }
);
```

## iOS — Always 권한 + Background Modes

1. Xcode → Capabilities → **Background Modes**: "Location updates" 체크.
2. `Info.plist` 추가:
   - `NSLocationAlwaysAndWhenInUseUsageDescription`
   - `NSLocationWhenInUseUsageDescription`
3. Capacitor Geolocation 의 `watchPosition` 은 iOS 에선 ~10분 이후 스로틀됨.
   정확한 백그라운드 운용은 `background-geolocation` 플러그인 + Always 권한 필요.

## 비고

- 백그라운드 서비스를 켜면 배터리 소모 증가. 기본은 OFF 로 두고 사용자 옵션.
- iOS 심사에서 "항상 위치" 사용은 정당화 필요 — 게임 디자인 문서에
  "헌트존 알림" 용도를 명시할 것.
