/**
 * CameraHudTop.tsx
 * --------------------------------------------------------------
 * 상단 HUD: 좌측 X 닫기 + 가운데 REC/TARGET + 우측 EMF 미터.
 * 모든 라벨은 영어 고정 (게임 아이덴티티).
 */
import EmfMeter from './EmfMeter';

interface Props {
  ghostLabel: string;
  emfLevel: number;
  onClose: () => void;
}

export default function CameraHudTop({ ghostLabel, emfLevel, onClose }: Props) {
  return (
    <div className="pointer-events-none absolute inset-x-0 top-0 z-20 flex items-start justify-between gap-2 p-3">
      {/* Close */}
      <button
        type="button"
        onClick={onClose}
        aria-label="카메라 모드 나가기"
        className="pointer-events-auto flex h-9 w-9 items-center justify-center
                   rounded-full border border-white/30 bg-black/60 text-white/90
                   focus:outline-none focus:ring-2 focus:ring-neon
                   active:scale-95"
      >
        <svg width="16" height="16" viewBox="0 0 20 20" aria-hidden="true">
          <path d="M4 4L16 16M16 4L4 16" stroke="currentColor" strokeWidth="2" />
        </svg>
      </button>

      {/* 가운데: REC + TARGET */}
      <div className="min-w-0 flex-1 px-2 text-center">
        <div className="flex items-center justify-center gap-1.5 text-[10px] font-extrabold tracking-[0.3em] text-danger">
          <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-danger" />
          REC
        </div>
        <div className="mt-0.5 truncate text-[11px] font-bold tracking-wider text-neon text-glow">
          TARGET · {ghostLabel}
        </div>
      </div>

      {/* EMF Meter */}
      <div className="pointer-events-none">
        <EmfMeter level={emfLevel} />
      </div>
    </div>
  );
}
