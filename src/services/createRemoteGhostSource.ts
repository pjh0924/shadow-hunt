/**
 * createRemoteGhostSource.ts
 * --------------------------------------------------------------
 * 앱 부팅 시 Firebase 가 활성인지 보고 적절한 구현을 돌려줌.
 *
 *   firebaseEnabled  → FirestoreRemoteGhostSource
 *   그 외            → NoopRemoteGhostSource
 *
 * 나중에 GhostWorld 에 주입해 멀티플레이어 공유를 자동으로 섞거나 끌 수 있음.
 */
import { firebaseEnabled } from '../firebase/config';
import type { RemoteGhostSource } from './RemoteGhostSource';
import { NoopRemoteGhostSource } from './RemoteGhostSource';
import { FirestoreRemoteGhostSource } from './FirestoreRemoteGhostSource';

export function createRemoteGhostSource(): RemoteGhostSource {
  if (firebaseEnabled) {
    return new FirestoreRemoteGhostSource();
  }
  return new NoopRemoteGhostSource();
}
