/**
 * NormalizedBox.ts
 * --------------------------------------------------------------
 * 0~1 정규화 박스 — 비디오/이미지의 가로/세로 비율과 무관하게 보존.
 * 도감 저장 시에도 이 형태로 보관되어 어떤 해상도 사진에도 매핑 가능.
 */
export interface NormalizedBox {
  left: number; // 0~1 (좌)
  top: number; // 0~1
  width: number; // 0~1
  height: number; // 0~1
}
