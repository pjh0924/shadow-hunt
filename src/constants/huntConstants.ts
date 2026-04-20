/**
 * huntConstants.ts
 * --------------------------------------------------------------
 * 게임 튜닝 상수 모음. 한 곳에서 조절 → 전 화면 영향.
 */

/** 사용자 위치 기준 스폰 반경 (m). */
export const SPAWN_RADIUS_M = 100;

/** 한 웨이브당 마커 개수. */
export const SPAWN_COUNT = 3;

/** 헌트존 반경 (m) — 이 안에 들어가야 카메라 진입 가능. */
export const HUNT_RADIUS_M = 25;

/** 마커가 "식별" 가능한 최대 거리 (m). 그 밖이면 "?" 표시. */
export const VISIBLE_RADIUS_M = 60;

/** 위치 갱신 distanceFilter (m). */
export const POSITION_DISTANCE_FILTER_M = 1;

/** 모든 마커가 잡힌 후 자동 리스폰 까지 대기 (ms). */
export const AUTO_RESPAWN_DELAY_MS = 3000;

/** Mock D-Pad 한 번 누를 때 이동 거리 (m). */
export const MOCK_STEP_M = 5;

/** 안개 동심원 단계 (m). 큰 → 진한 순. */
export const FOG_RINGS_M = [60, 40, 25] as const;
