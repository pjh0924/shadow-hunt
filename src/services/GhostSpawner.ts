/**
 * GhostSpawner.ts
 * --------------------------------------------------------------
 * 사용자 중심 반경 안에 랜덤 귀신 마커를 뿌리는 순수 함수.
 * 시드 가능 → 테스트 결정적 재현 가능.
 */
import type { GhostMarker } from '../models/GhostMarker';
import { offsetMeters, type LatLng } from '../utils/haversine';
import { SPAWN_COUNT, SPAWN_RADIUS_M } from '../constants/huntConstants';

/** 시드 지원 의사난수 (Mulberry32). */
function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export interface SpawnOptions {
  count?: number;
  radiusMeters?: number;
  /** 최소 반경 (너무 가까이 안 나오게). */
  minRadiusMeters?: number;
  /** 라벨 prefix index 시작값. Wave 가 거듭되어도 번호가 이어지게. */
  startIndex?: number;
  /** 테스트용 시드. */
  seed?: number;
}

/**
 * 사용자 위치 `center` 주변에 `count` 개의 마커를 뿌린다.
 * 각 마커는 [minRadius, radiusMeters] 사이의 랜덤 거리, 0~360° 방위.
 */
export function spawnAround(
  center: LatLng,
  options: SpawnOptions = {}
): GhostMarker[] {
  const count = options.count ?? SPAWN_COUNT;
  const radius = options.radiusMeters ?? SPAWN_RADIUS_M;
  const minRadius = options.minRadiusMeters ?? 15;
  const startIndex = options.startIndex ?? 0;
  const rand =
    options.seed !== undefined ? mulberry32(options.seed) : Math.random;

  const markers: GhostMarker[] = [];
  for (let i = 0; i < count; i++) {
    const theta = rand() * 2 * Math.PI;
    const r = minRadius + rand() * Math.max(0, radius - minRadius);
    const eastM = Math.cos(theta) * r;
    const northM = Math.sin(theta) * r;
    const pos = offsetMeters(center, eastM, northM);
    const idx = startIndex + i + 1;
    markers.push({
      id: `g_${Date.now()}_${idx}_${Math.floor(rand() * 1e6)}`,
      position: pos,
      label: `미지의 형상 #${idx}`,
    });
  }
  return markers;
}
