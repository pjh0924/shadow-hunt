/**
 * HuntActionPanel.tsx
 * --------------------------------------------------------------
 * 화면 하단 CTA.
 *   - 헌트존 안: "⚠ {label} 감지됨" + "카메라 모드 진입" (네온 활성)
 *   - 밖:        "귀신을 찾아 이동하세요" (비활성)
 */
import { useTranslation } from 'react-i18next';

interface Props {
  detectedLabel: string | null;
  onEnterCamera?: () => void;
}

export default function HuntActionPanel({ detectedLabel, onEnterCamera }: Props) {
  const { t } = useTranslation();
  const enabled = detectedLabel !== null;

  return (
    <div
      role="region"
      aria-label="hunt actions"
      className="pointer-events-none absolute inset-x-0 bottom-0 z-10 flex flex-col items-center pb-6"
    >
      {enabled && (
        <div
          role="status"
          aria-live="polite"
          className="pointer-events-auto mb-3 rounded-md border border-warn/60 bg-black/70
                     px-5 py-2 text-sm font-bold text-warn shadow-[0_0_12px_rgba(255,176,32,0.45)]"
        >
          {t('huntActionDetected', { label: detectedLabel })}
        </div>
      )}

      <button
        type="button"
        disabled={!enabled}
        onClick={onEnterCamera}
        aria-label={
          enabled
            ? t('huntActionEnterCamera')
            : t('huntActionSearchGhost')
        }
        className={[
          'pointer-events-auto w-[72%] max-w-sm rounded-xl border-2 py-3 text-base font-extrabold tracking-wider',
          'transition-all focus:outline-none focus:ring-2 focus:ring-neon focus:ring-offset-2 focus:ring-offset-bg',
          enabled
            ? 'border-neon bg-neon/20 text-neon text-glow shadow-[0_0_14px_rgba(33,245,110,0.5)] hover:bg-neon/30 active:scale-[0.98]'
            : 'border-white/15 bg-black/60 text-white/40 cursor-not-allowed',
        ].join(' ')}
      >
        <span className="inline-flex items-center gap-2">
          <span aria-hidden="true">📷</span>
          {enabled ? t('huntActionEnterCamera') : t('huntActionSearchGhost')}
        </span>
      </button>
    </div>
  );
}
