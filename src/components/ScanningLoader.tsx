/**
 * ScanningLoader.tsx
 * --------------------------------------------------------------
 * 초기 위치 기다리는 동안 / 리로드 시 풀스크린 로더.
 *
 * onSkipToMock 이 주어지면 N 초 후 "Mock 모드로 시작" 폴백 노출.
 * (브라우저 dev / iframe / GPS 미지원 환경에서 막히지 않도록.)
 */
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

interface Props {
  message?: string;
  onSkipToMock?: () => void;
  /** 폴백 버튼 표시 지연. 기본 3초. */
  skipDelayMs?: number;
}

export default function ScanningLoader({
  message,
  onSkipToMock,
  skipDelayMs = 3000,
}: Props) {
  const { t } = useTranslation();
  const text = message ?? t('scanningLoaderDefault');
  const [showSkip, setShowSkip] = useState(false);

  useEffect(() => {
    if (!onSkipToMock) return;
    const id = setTimeout(() => setShowSkip(true), skipDelayMs);
    return () => clearTimeout(id);
  }, [onSkipToMock, skipDelayMs]);

  return (
    <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-bg text-neon">
      <div className="relative h-40 w-40">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="absolute inset-0 rounded-full border border-neon/60 animate-ghost-pulse"
            style={{ animationDelay: `${i * 0.6}s` }}
          />
        ))}
        <span className="absolute inset-14 rounded-full bg-neon/40 animate-ghost-pulse" />
      </div>
      <p className="mt-6 text-sm font-bold tracking-widest text-glow">{text}</p>

      {onSkipToMock && showSkip && (
        <button
          type="button"
          onClick={onSkipToMock}
          className="mt-8 rounded-md border border-warn/60 bg-black/60 px-4 py-2
                     text-xs font-bold text-warn active:bg-warn/20"
        >
          ⚠ DEV — Mock 모드로 시작
        </button>
      )}
    </div>
  );
}
