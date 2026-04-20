/**
 * OnboardingScreen.tsx — 첫 실행 4슬라이드 튜토리얼.
 * --------------------------------------------------------------
 *  - 각 슬라이드: 거대 이모지 + 제목 + 본문 + 네온 하이라이트
 *  - 하단: 진행 dot, 건너뛰기, 다음/시작
 *  - 완료 시 settingsStore.onboarded=true → 다시 안 나타남
 */
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useSettingsStore } from '../store/useSettingsStore';

interface Slide {
  icon: string;
  titleKey: string;
  bodyKey: string;
}

const SLIDES: Slide[] = [
  { icon: '🗺️', titleKey: 'onboardingSlide1Title', bodyKey: 'onboardingSlide1Body' },
  { icon: '🎯', titleKey: 'onboardingSlide2Title', bodyKey: 'onboardingSlide2Body' },
  { icon: '👁️', titleKey: 'onboardingSlide3Title', bodyKey: 'onboardingSlide3Body' },
  { icon: '📓', titleKey: 'onboardingSlide4Title', bodyKey: 'onboardingSlide4Body' },
];

export default function OnboardingScreen() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const markOnboarded = useSettingsStore((s) => s.markOnboarded);
  const [idx, setIdx] = useState(0);

  const last = idx === SLIDES.length - 1;
  const finish = () => {
    markOnboarded();
    navigate('/', { replace: true });
  };

  const s = SLIDES[idx];

  return (
    <div className="relative flex h-full w-full flex-col bg-bg text-neon">
      {/* Skip */}
      <div className="absolute right-3 top-3 z-10">
        <button
          type="button"
          onClick={finish}
          className="rounded-md border border-white/20 px-3 py-1 text-[11px] font-bold text-white/60
                     focus:outline-none focus:ring-2 focus:ring-neon active:bg-white/10"
        >
          {t('onboardingSkip')}
        </button>
      </div>

      {/* 메인 슬라이드 */}
      <div
        key={idx}
        className="flex flex-1 flex-col items-center justify-center px-8 text-center animate-ghost-pulse"
        style={{ animationIterationCount: '1', animationDuration: '0.5s' }}
      >
        <div aria-hidden className="mb-8 text-[84px] text-glow">
          {s.icon}
        </div>
        <h2 className="text-xl font-extrabold tracking-wider text-neon text-glow">
          {t(s.titleKey)}
        </h2>
        <p className="mt-4 max-w-sm whitespace-pre-line text-sm text-white/75">{t(s.bodyKey)}</p>
      </div>

      {/* 하단: dots + 액션 */}
      <div className="px-8 pb-10">
        <div className="mb-6 flex items-center justify-center gap-2">
          {SLIDES.map((_, i) => (
            <button
              key={i}
              type="button"
              aria-label={t('onboardingDot', { n: i + 1 })}
              onClick={() => setIdx(i)}
              className={[
                'h-2 rounded-full transition-all',
                i === idx ? 'w-6 bg-neon shadow-[0_0_8px_rgba(33,245,110,0.7)]' : 'w-2 bg-white/25',
              ].join(' ')}
            />
          ))}
        </div>

        <button
          type="button"
          onClick={() => (last ? finish() : setIdx((i) => i + 1))}
          className="w-full rounded-xl border-2 border-neon bg-neon/20 py-3 text-base
                     font-extrabold tracking-wider text-neon text-glow
                     shadow-[0_0_14px_rgba(33,245,110,0.5)]
                     focus:outline-none focus:ring-2 focus:ring-neon focus:ring-offset-2 focus:ring-offset-bg
                     active:scale-[0.98]"
        >
          {last ? t('onboardingStart') : t('onboardingNext')}
        </button>
      </div>
    </div>
  );
}
