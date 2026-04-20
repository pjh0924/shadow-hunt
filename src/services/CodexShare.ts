/**
 * CodexShare.ts
 * --------------------------------------------------------------
 * @capacitor/share 로 도감 항목 공유.
 *   - 이미지 공유 (네이티브) + 텍스트 캡션
 *   - 웹 dev 환경에선 다운로드 폴백
 *
 * Capacitor Share API v8 에선 dataURL 직접 공유가 제한 → Filesystem 에 임시
 * 파일 쓴 뒤 그 URI 를 files 인자로 넘김 (네이티브 한정). 여기선 MVP 로:
 *   - 네이티브: text + url 기반 (사진 자체는 OS 갤러리에 저장되어 있지 않음)
 *   - 웹: <a download> 트릭으로 이미지 다운로드
 */
import { Share } from '@capacitor/share';
import { Capacitor } from '@capacitor/core';
import type { GhostCapture } from '../models/GhostCapture';

export async function shareCapture(c: GhostCapture): Promise<void> {
  const caption = `SHADOW HUNT — ${c.ghostLabel}\nEMF ${c.emfLevel.toFixed(2)}${c.emfLevel >= 4 ? '  · DANGER' : ''} · 검출 ${c.detectionCount}건`;

  if (Capacitor.getPlatform() === 'web') {
    // 웹: 이미지 다운로드 + 복사 가능한 텍스트 alert
    const a = document.createElement('a');
    a.href = c.photoDataUrl;
    a.download = `shadow_hunt_${c.id}.jpg`;
    a.click();
    // Web Share API 시도
    if (navigator.share) {
      try {
        await navigator.share({ title: 'Shadow Hunt', text: caption });
      } catch {
        /* user cancelled */
      }
    }
    return;
  }

  // 네이티브: 텍스트 기반 — 파일 공유는 Filesystem 통합 후 Round 5+.
  try {
    await Share.share({ title: 'Shadow Hunt', text: caption });
  } catch (e) {
    console.warn('share failed', e);
  }
}
