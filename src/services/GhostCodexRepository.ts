/**
 * GhostCodexRepository.ts
 * --------------------------------------------------------------
 * 도감 영구 저장소 — @capacitor/preferences 기반.
 *   - index 에 GhostCapture[] 배열 JSON 저장
 *   - 사진은 photoDataUrl 필드에 base64 로 인라인 (Cap 8 Preferences 용량
 *     제약이 플랫폼별로 다르나 수MB 단위 사진이면 대개 OK. 수백 MB 축적
 *     되면 Step 4 폴리시에서 Filesystem 으로 분리)
 *
 * 메모리 캐시 + 변경 알림 (간단 listener 패턴).
 */
import { Preferences } from '@capacitor/preferences';
import type { GhostCapture } from '../models/GhostCapture';

const KEY = 'shadow_hunt.codex.v1';
type Listener = () => void;

class CodexRepository {
  private _cache: GhostCapture[] | null = null;
  private _listeners = new Set<Listener>();
  private _loading: Promise<GhostCapture[]> | null = null;

  subscribe(listener: Listener): () => void {
    this._listeners.add(listener);
    return () => this._listeners.delete(listener);
  }

  private _notify() {
    this._listeners.forEach((l) => l());
  }

  /** 전체 목록 (최신 먼저). */
  async list(): Promise<GhostCapture[]> {
    if (this._cache) return this._cache;
    if (this._loading) return this._loading;
    this._loading = (async () => {
      try {
        const { value } = await Preferences.get({ key: KEY });
        const parsed: GhostCapture[] = value ? JSON.parse(value) : [];
        // 최신순 정렬
        parsed.sort((a, b) => b.capturedAt.localeCompare(a.capturedAt));
        this._cache = parsed;
        return parsed;
      } catch (e) {
        console.warn('codex load failed:', e);
        this._cache = [];
        return [];
      } finally {
        this._loading = null;
      }
    })();
    return this._loading;
  }

  async add(capture: GhostCapture): Promise<void> {
    const cur = await this.list();
    const next = [capture, ...cur];
    await this._persist(next);
  }

  async remove(id: string): Promise<void> {
    const cur = await this.list();
    const next = cur.filter((c) => c.id !== id);
    await this._persist(next);
  }

  async clear(): Promise<void> {
    await this._persist([]);
  }

  private async _persist(next: GhostCapture[]): Promise<void> {
    this._cache = next;
    try {
      await Preferences.set({ key: KEY, value: JSON.stringify(next) });
    } catch (e) {
      console.warn('codex persist failed:', e);
    }
    this._notify();
  }
}

/** 단일 인스턴스 — 모듈 레벨 싱글턴. */
export const GhostCodexRepo = new CodexRepository();
