/**
 * useApplySettings.ts
 * --------------------------------------------------------------
 * 설정 스토어 변경을 전역 side effects 에 실시간 반영:
 *   - document.documentElement 의 data-theme / data-reduce-motion / lang
 *   - i18n.changeLanguage
 *   - SoundService.setMasterGain
 *
 * 컴포넌트가 아니라 hook 형태 — App 루트에서 1회 호출.
 */
import { useEffect } from 'react';
import i18n from '../i18n/config';
import { useSettingsStore } from '../store/useSettingsStore';
import { SoundService } from '../services/SoundService';

export function useApplySettings() {
  useEffect(() => {
    const apply = () => {
      const s = useSettingsStore.getState();
      const root = document.documentElement;
      root.dataset.theme = s.theme;
      root.dataset.reduceMotion = String(s.reduceMotion);
      root.lang = s.locale;
      if (i18n.language !== s.locale) {
        i18n.changeLanguage(s.locale);
      }
      SoundService.setMasterGain(s.soundVolume);
    };
    apply();
    // 스토어 변경 구독 (언어/테마 토글 즉시 반영)
    return useSettingsStore.subscribe(apply);
  }, []);
}
