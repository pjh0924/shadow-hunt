/**
 * useSettingsStore.ts
 * --------------------------------------------------------------
 * 사용자 개인화 설정 — zustand persist middleware 로 localStorage 저장.
 *  - 언어 / 사운드 볼륨 / 햅틱 / 거리 단위 / reduce-motion / 테마
 *  - onboarded: 첫 실행 시 Onboarding 화면 1회 노출
 */
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type Locale = 'ko' | 'en';
export type DistanceUnit = 'metric' | 'imperial';
export type Theme = 'dark' | 'light';

interface SettingsStore {
  locale: Locale;
  soundVolume: number; // 0~1
  haptic: boolean;
  distanceUnit: DistanceUnit;
  reduceMotion: boolean;
  theme: Theme;
  onboarded: boolean;

  setLocale: (v: Locale) => void;
  setSoundVolume: (v: number) => void;
  setHaptic: (v: boolean) => void;
  setDistanceUnit: (v: DistanceUnit) => void;
  setReduceMotion: (v: boolean) => void;
  setTheme: (v: Theme) => void;
  markOnboarded: () => void;

  /** 설정 공장초기화 + onboarded 해제. */
  resetAll: () => void;
}

const defaults = {
  locale: (navigator.language?.startsWith('ko') ? 'ko' : 'en') as Locale,
  soundVolume: 0.6,
  haptic: true,
  distanceUnit: 'metric' as DistanceUnit,
  reduceMotion:
    typeof matchMedia === 'function'
      ? matchMedia('(prefers-reduced-motion: reduce)').matches
      : false,
  theme: 'dark' as Theme,
  onboarded: false,
};

export const useSettingsStore = create<SettingsStore>()(
  persist(
    (set) => ({
      ...defaults,
      setLocale: (v) => set({ locale: v }),
      setSoundVolume: (v) => set({ soundVolume: Math.max(0, Math.min(1, v)) }),
      setHaptic: (v) => set({ haptic: v }),
      setDistanceUnit: (v) => set({ distanceUnit: v }),
      setReduceMotion: (v) => set({ reduceMotion: v }),
      setTheme: (v) => set({ theme: v }),
      markOnboarded: () => set({ onboarded: true }),
      resetAll: () => set({ ...defaults }),
    }),
    {
      name: 'shadow_hunt.settings',
      version: 1,
    },
  ),
);
