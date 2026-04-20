/**
 * CodexEmptyState.tsx — 도감이 비었을 때 보여주는 안내.
 */
import { useTranslation } from 'react-i18next';

interface Props {
  onGoToMap: () => void;
}

export default function CodexEmptyState({ onGoToMap }: Props) {
  const { t } = useTranslation();
  return (
    <div className="flex flex-1 flex-col items-center justify-center px-6 text-center">
      <div className="mb-4 text-[64px]">👻</div>
      <h2 className="text-lg font-extrabold text-neon text-glow">
        {t('codexEmptyTitle')}
      </h2>
      <p className="mt-3 whitespace-pre-line text-[13px] text-white/60">
        {t('codexEmptyHint')}
      </p>
      <button
        type="button"
        onClick={onGoToMap}
        className="mt-8 rounded-lg border-2 border-neon bg-neon/20 px-6 py-3
                   text-sm font-extrabold tracking-wider text-neon text-glow
                   active:scale-95"
      >
        📍 {t('codexEmptyCta')}
      </button>
    </div>
  );
}
