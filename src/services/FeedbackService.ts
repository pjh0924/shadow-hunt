/**
 * FeedbackService.ts
 * --------------------------------------------------------------
 * 햅틱 + (추후) 사운드 중앙 허브.
 * - Capacitor 의 @capacitor/haptics 를 사용 (web / android / ios 자동 폴백)
 * - 각 "이벤트 타입"마다 다른 패턴
 *
 * 사운드는 Round 5+ 에서 HTMLAudioElement 로 연결. 지금은 no-op 슬롯.
 */
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { SoundService } from './SoundService';

// 안전하게 감싸기 — haptics 호출이 web 에서 실패해도 silent.
async function safeImpact(style: ImpactStyle) {
  try {
    await Haptics.impact({ style });
  } catch {
    /* web dev 에서 silent */
  }
}

export const FeedbackService = {
  /** 가벼운 확인 (버튼 탭, UI 전환). */
  async onConfirm() {
    await safeImpact(ImpactStyle.Light);
  },

  /** 헌트존 진입. */
  async onEnterHuntZone() {
    await safeImpact(ImpactStyle.Medium);
    SoundService.play('enter');
  },

  /** 헌트존 이탈. */
  async onExitHuntZone() {
    await safeImpact(ImpactStyle.Light);
    SoundService.play('exit');
  },

  /** EMF 임계치 초과 (4.0+). */
  async onEmfDanger() {
    await safeImpact(ImpactStyle.Heavy);
    SoundService.play('emf_spike');
  },

  /** 최초 형상 검출 — "발견!" 두근두근 + 사운드. */
  async onFirstSighting() {
    SoundService.play('first_sighting');
    await safeImpact(ImpactStyle.Heavy);
    await new Promise((r) => setTimeout(r, 100));
    await safeImpact(ImpactStyle.Heavy);
    await new Promise((r) => setTimeout(r, 80));
    await safeImpact(ImpactStyle.Medium);
  },

  /** 셔터. */
  async onShutter() {
    await safeImpact(ImpactStyle.Medium);
    SoundService.play('shutter');
  },
};
