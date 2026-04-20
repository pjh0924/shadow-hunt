/**
 * FirestoreRemoteGhostSource.ts
 * --------------------------------------------------------------
 * `RemoteGhostSource` 구현 — Firestore `shared_ghosts` 컬렉션.
 *
 * firebaseEnabled=false 면 그냥 빈 결과 반환 → Noop 과 동일하게 동작.
 * 즉 이 클래스를 써도 config 가 없으면 앱은 깨지지 않음.
 */
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
import { distanceMeters, type LatLng } from '../utils/haversine';
import type {
  CapturePublication,
  RemoteGhostSource,
} from './RemoteGhostSource';

const COLL = 'shared_ghosts';

export class FirestoreRemoteGhostSource implements RemoteGhostSource {
  async nearbyShared(
    center: LatLng,
    radiusMeters = 500
  ): Promise<GhostMarker[]> {
    if (!db) return [];
    const dLat = radiusMeters / 111_320;
    try {
      const q = query(
        collection(db, COLL),
        where('captured', '==', false),
        where('lat', '>', center.lat - dLat),
        where('lat', '<', center.lat + dLat)
      );
      const snap = await getDocs(q);
      const out: GhostMarker[] = [];
      snap.forEach((d) => {
        const data = d.data() as { lat: number; lng: number; label: string };
        const pos = { lat: data.lat, lng: data.lng };
        if (distanceMeters(center, pos) > radiusMeters) return;
        out.push({ id: d.id, position: pos, label: data.label });
      });
      return out;
    } catch (e) {
      console.warn('[firestore] nearbyShared failed:', e);
      return [];
    }
  }

  async publishCapture(pub: CapturePublication): Promise<void> {
    if (!db) return;
    try {
      await setDoc(
        doc(db, COLL, pub.ghostId),
        {
          captured: true,
          capturedAt: serverTimestamp(),
        },
        { merge: true }
      );
    } catch (e) {
      console.warn('[firestore] publishCapture failed:', e);
    }
  }
}
