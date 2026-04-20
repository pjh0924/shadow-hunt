# Firebase 멀티플레이어 통합 레시피

**상태**: 구현 스텁 제공, 실 Firebase 연결은 사용자 직접. 콘솔 계정 + 프로젝트 설정 + `firebaseConfig` 주입 필요.

## 0. 전제

`RemoteGhostSource` 인터페이스는 이미 정의됨 (`src/services/RemoteGhostSource.ts`).
기본 구현은 `NoopRemoteGhostSource` — 아무것도 안 함. Firebase 기반 구현으로 교체만 하면 됨.

## 1. Firebase 프로젝트 생성

1. [Firebase Console](https://console.firebase.google.com) → 새 프로젝트.
2. Build → Firestore Database → "Start in production mode" → 서울(asia-northeast3) 리전.
3. 프로젝트 설정 → 일반 → "웹 앱 추가" → `firebaseConfig` 복사.

## 2. 패키지 설치

```bash
npm install firebase
```

## 3. config 파일 작성

`src/firebase/config.ts`:

```ts
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

export const firebaseApp = initializeApp({
  apiKey: 'AIza...',
  authDomain: 'YOUR.firebaseapp.com',
  projectId: 'YOUR',
  storageBucket: 'YOUR.appspot.com',
  messagingSenderId: '...',
  appId: '...',
});

export const db = getFirestore(firebaseApp);
```

## 4. FirestoreRemoteGhostSource 복사

`src/services/FirestoreRemoteGhostSource.ts`:

```ts
import {
  collection,
  doc,
  getDocs,
  query,
  serverTimestamp,
  setDoc,
  where,
} from 'firebase/firestore';
import { db } from '../firebase/config';
import type { GhostMarker } from '../models/GhostMarker';
import type { LatLng } from '../utils/haversine';
import { distanceMeters } from '../utils/haversine';
import type {
  CapturePublication,
  RemoteGhostSource,
} from './RemoteGhostSource';

/**
 * Firestore 컬렉션 `shared_ghosts`:
 *   { id, lat, lng, label, createdAt, captured, capturedAt, capturedBy }
 *
 * Firestore 에 geo 인덱스 기본 지원 없음 → 위도 bbox 쿼리만 하고
 * 경도/반경 필터는 클라이언트에서.
 */
const COLL = 'shared_ghosts';

export class FirestoreRemoteGhostSource implements RemoteGhostSource {
  async nearbyShared(center: LatLng, radiusMeters = 500): Promise<GhostMarker[]> {
    const dLat = radiusMeters / 111_320;
    const q = query(
      collection(db, COLL),
      where('captured', '==', false),
      where('lat', '>', center.lat - dLat),
      where('lat', '<', center.lat + dLat)
    );
    const snap = await getDocs(q);
    return snap.docs
      .map((d) => {
        const data = d.data();
        const pos = { lat: data.lat, lng: data.lng };
        if (distanceMeters(center, pos) > radiusMeters) return null;
        return {
          id: d.id,
          position: pos,
          label: data.label as string,
        } satisfies GhostMarker;
      })
      .filter((x): x is GhostMarker => x !== null);
  }

  async publishCapture(pub: CapturePublication): Promise<void> {
    await setDoc(
      doc(db, COLL, pub.ghostId),
      {
        captured: true,
        capturedAt: serverTimestamp(),
      },
      { merge: true }
    );
  }
}
```

## 5. GhostWorld 에 주입

`GhostWorld` 생성자에 `RemoteGhostSource` 파라미터가 이미 있거나 추가:

```ts
const remote =
  Capacitor.getPlatform() === 'web' || !FIREBASE_ENABLED
    ? new NoopRemoteGhostSource()
    : new FirestoreRemoteGhostSource();

const world = new GhostWorld(remote);
```

그리고 `respawnAround` 에서 `remote.nearbyShared()` 를 섞어주거나
`capture()` 에서 `remote.publishCapture()` 를 호출.

## 6. 보안 규칙

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /shared_ghosts/{ghostId} {
      allow read: if true;  // 공개
      allow create: if request.auth != null;
      allow update: if request.auth != null
                    && (!resource.data.captured || request.auth.uid == resource.data.capturedBy);
    }
  }
}
```

## 주의

- 프로덕션에선 Anonymous Auth 최소 적용 → 무분별한 publish 차단.
- Firestore 쿼리에 동시에 두 범위(lat, lng) 조건을 걸 수 없음 → 이 구현은 lat 만 서버 필터, lng/radius 는 클라이언트.
- 더 많은 사용자/마커 규모가 커지면 GeoHash 컬렉션으로 변경.
