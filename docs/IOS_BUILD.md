# iOS 빌드 가이드

**현재 상태**: `ios/App/App.xcworkspace` 생성 완료. 네이티브 권한(Info.plist) +
CocoaPods 플러그인 모두 설정됨. Xcode 로 열어서 빌드/실행만 하면 됨.

자동화 불가 — 실제 iOS 빌드엔 **full Xcode** (15GB, App Store) 가 필요하며,
이 환경엔 Xcode Command Line Tools 만 있습니다.

---

## 1. Xcode 설치 (1회)

1. **App Store → Xcode** 다운로드 (~15GB, 30~60분)
2. 설치 후 Xcode 한 번 실행 → "Install additional components" 수락
3. 터미널에서 developer 경로 전환:
   ```bash
   sudo xcode-select -switch /Applications/Xcode.app/Contents/Developer
   sudo xcodebuild -license accept   # 라이선스 동의
   ```
4. 버전 확인:
   ```bash
   xcodebuild -version               # Xcode 15.x 이상 권장
   ```

## 2. 프로젝트 준비 (필요 시 업데이트)

앱 코드에 변경이 있을 때마다 Vite 빌드 + Capacitor sync:

```bash
npm run build
npx cap sync ios
```

`cap sync` 가 **CocoaPods** 로 플러그인 pods 도 자동 설치합니다.

## 3. Xcode 로 열기

```bash
npx cap open ios
# 또는
open ios/App/App.xcworkspace
```

> ⚠️ `.xcodeproj` 대신 반드시 **`.xcworkspace`** 를 열어야 Pods 가 로드됩니다.

## 4. 서명(Signing) 설정

최초 한 번:

1. 왼쪽 네비게이터 최상단 `App` 프로젝트 클릭
2. Targets → `App` 선택 → **Signing & Capabilities** 탭
3. **Team** 드롭다운에서 본인 Apple ID / 개발 팀 선택
   - 없으면 Xcode → Settings → Accounts 에서 Apple ID 추가
   - 무료 개발자 계정도 시뮬레이터 + 7일 제한 실기기 빌드 가능
4. **Bundle Identifier** 가 `com.shadowhunt.app` 인지 확인 (유일해야 함 — 이미 사용 중이면 `com.yourname.shadowhunt` 로 변경)

## 5. 빌드 & 실행

### 시뮬레이터

- 상단 툴바에서 대상 → `iPhone 15` (또는 아무 시뮬레이터)
- ▶︎ (Cmd+R) 버튼 클릭

> 카메라 getUserMedia: 시뮬레이터엔 카메라가 없어 `Requested device not found`
> 가 뜹니다. 지도/GPS/EMF/도감 HUD 는 정상 동작. 🐞 디버그 버튼(dev 모드)
> 으로 ML 검출 시연 가능.

### 실기기

1. iPhone 을 Mac 에 USB 연결
2. 아이폰 잠금 해제 + "이 컴퓨터를 신뢰" 승인
3. iPhone → 설정 → 개인 정보 보호 및 보안 → 개발자 모드 ON (iOS 16+)
4. Xcode 상단 툴바 대상 → iPhone 선택
5. Cmd+R

> 첫 실행 시 iPhone 에서 "Untrusted Developer" → 설정 → 일반 → VPN 및 기기
> 관리 → 본인 Apple ID 를 "신뢰"

## 6. 권한 확인

Info.plist 에 이미 포함됨 (자동으로 OS 권한 다이얼로그 노출):

- `NSLocationWhenInUseUsageDescription` / `NSLocationAlwaysAndWhenInUseUsageDescription`
- `NSCameraUsageDescription`
- `NSMotionUsageDescription` (EMF 자기계)
- `UIBackgroundModes = [location]` (백그라운드 GPS 추적)

## 7. TestFlight / App Store

1. 팀을 **Apple Developer Program** ($99/년) 에 등록
2. Xcode → Product → Archive
3. Organizer → `Distribute App` → App Store Connect → Upload
4. https://appstoreconnect.apple.com 에서 TestFlight 빌드 선택 → 내부 테스터

---

## 트러블슈팅

### `CocoaPods ... not found`

```bash
brew install cocoapods
cd ios/App && pod install
```

### `xcode-select: error: tool 'xcodebuild' requires Xcode...`

Command Line Tools만 설치된 상태. `xcode-select -switch` 로 Xcode.app 을
가리키게 변경 (1 단계 참고).

### 빌드 시 CAPACITOR_DEBUG 관련 오류

`capacitor.config.ts` 변경 후 `npx cap sync ios` 를 다시 실행.
