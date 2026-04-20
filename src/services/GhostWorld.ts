/**
 * GhostWorld.ts
 * --------------------------------------------------------------
 * 게임 내 귀신 상태의 "source of truth".
 *   - 현재 살아있는 마커
 *   - 잡힌 id 목록
 *   - 리스폰 / 캡처 게임 루프
 *
 * 간단한 pub/sub 리스너 패턴 — Zustand 스토어가 이걸 감싸서 React 에 연결.
 */
import type { GhostMarker } from '../models/GhostMarker';
import type { LatLng } from '../utils/haversine';
import { spawnAround } from './GhostSpawner';
import { AUTO_RESPAWN_DELAY_MS } from '../constants/huntConstants';

type Listener = () => void;

export class GhostWorld {
  private _ghosts: GhostMarker[] = [];
  private _capturedIds: string[] = [];
  private _labelCursor = 0;
  private _listeners = new Set<Listener>();
  private _respawnTimer: ReturnType<typeof setTimeout> | null = null;

  get ghosts(): readonly GhostMarker[] {
    return this._ghosts;
  }

  get capturedIds(): readonly string[] {
    return this._capturedIds;
  }

  subscribe(listener: Listener): () => void {
    this._listeners.add(listener);
    return () => this._listeners.delete(listener);
  }

  private _notify() {
    this._listeners.forEach((l) => l());
  }

  /** 사용자 위치 중심으로 새 웨이브 스폰 (기존 살아있는 마커는 그대로). */
  addWaveAround(center: LatLng): void {
    const wave = spawnAround(center, { startIndex: this._labelCursor });
    this._labelCursor += wave.length;
    this._ghosts = [...this._ghosts, ...wave];
    this._notify();
  }

  /**
   * 사용자 위치 중심으로 기존 마커 싹 지우고 새 웨이브.
   * 예: Mock "새 웨이브" 버튼, 모두 잡은 후 자동 리스폰.
   */
  respawnAround(center: LatLng): void {
    this._ghosts = [];
    this.addWaveAround(center);
  }

  /** 마커 하나 제거. 모두 비면 AUTO_RESPAWN_DELAY_MS 뒤 자동 리스폰. */
  capture(id: string, userPosition: LatLng): void {
    const before = this._ghosts.length;
    this._ghosts = this._ghosts.filter((g) => g.id !== id);
    if (this._ghosts.length === before) return; // 존재 안 했음 — no-op

    this._capturedIds = [...this._capturedIds, id];

    if (this._ghosts.length === 0) {
      this._respawnTimer && clearTimeout(this._respawnTimer);
      this._respawnTimer = setTimeout(() => {
        this._respawnTimer = null;
        this.respawnAround(userPosition);
      }, AUTO_RESPAWN_DELAY_MS);
    }

    this._notify();
  }

  dispose(): void {
    if (this._respawnTimer) clearTimeout(this._respawnTimer);
    this._respawnTimer = null;
    this._listeners.clear();
  }
}
