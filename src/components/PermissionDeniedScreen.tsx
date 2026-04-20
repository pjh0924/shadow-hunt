/**
 * PermissionDeniedScreen.tsx
 * --------------------------------------------------------------
 * 위치 권한 거부/꺼짐 상태일 때 전체 화면 대체.
 *  - 헤드라인 + 안내 문구
 *  - "다시 시도" 버튼 → 상위가 재시도 로직 실행
 */
import { useTranslation } from 'react-i18next';

interface Props {
  onRetry: () => void;
  onUseMock?: () => void;
  message?: string;
}

export default function PermissionDeniedScreen({ onRetry, onUseMock, message }: Props) {
  const { t } = useTranslation();
  return (
    <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-bg px-8 text-center">
      <div className="mb-6 text-[72px]">📡</div>
      <h1 className="text-xl font-extrabold tracking-wider text-danger text-glow">
        {t('permissionDeniedHeadline')}
      </h1>
      <p className="mt-4 whitespace-pre-line text-sm text-white/70">
        {message ?? t('permissionDeniedLocationMessage')}
      </p>
      <button
        type="button"
        onClick={onRetry}
        className="mt-8 rounded-lg border-2 border-neon bg-neon/20 px-6 py-3
                   text-sm font-extrabold tracking-wider text-neon text-glow
                   shadow-[0_0_12px_rgba(33,245,110,0.5)] active:scale-95"
      >
        {t('permissionDeniedRetry')}
      </button>

      {onUseMock && (
        <button
          type="button"
          onClick={onUseMock}
          className="mt-3 rounded-md border border-warn/60 bg-black/60 px-4 py-2
                     text-xs font-bold text-warn active:bg-warn/20"
        >
          ⚠ DEV — Mock 모드로 시작
        </button>
      )}
    </div>
  );
}
