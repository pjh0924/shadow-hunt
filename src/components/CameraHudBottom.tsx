/**
 * CameraHudBottom.tsx
 * --------------------------------------------------------------
 * 하단 HUD: 좌측 상태 라벨 + 가운데 셔터 + 우측 디버그(dev 전용).
 * 상태 라벨: EMF 기준
 *   - 0~1.5  CLEAR   (네온)
 *   - 1.5~3  WARN    (warn)
 *   - 3+     DANGER  (danger, 펄스)
 */

interface Props {
  emfLevel: number;
  onShutter: () => void;
  onDebugDetect?: () => void; // dev 전용: 가짜 검출 트리거
  capturing?: boolean;
}

function statusFor(level: number): { text: string; color: string; pulse: boolean } {
  if (level >= 3) return { text: 'DANGER', color: 'text-danger', pulse: true };
  if (level >= 1.5) return { text: 'WARN', color: 'text-warn', pulse: false };
  return { text: 'CLEAR', color: 'text-neon', pulse: false };
}

export default function CameraHudBottom({
  emfLevel,
  onShutter,
  onDebugDetect,
  capturing = false,
}: Props) {
  const s = statusFor(emfLevel);
  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-0 z-20 flex items-end justify-between gap-2 p-5">
      {/* 상태 텍스트 */}
      <div className={`w-20 text-left ${s.color} ${s.pulse ? 'animate-pulse' : ''}`}>
        <div className="text-[10px] font-black tracking-[0.3em] text-glow">{s.text}</div>
      </div>

      {/* 셔터 */}
      <button
        type="button"
        onClick={onShutter}
        disabled={capturing}
        aria-label={capturing ? '촬영 중' : '촬영하기'}
        className={[
          'pointer-events-auto relative h-20 w-20 rounded-full border-4 border-white/90 bg-neon/80',
          'shadow-[0_0_20px_rgba(33,245,110,0.5)] transition-transform active:scale-90',
          'focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-black',
          capturing ? 'opacity-40' : '',
        ].join(' ')}
      >
        <span aria-hidden="true" className="absolute inset-2 rounded-full bg-neon" />
      </button>

      {/* 우측: dev 디버그 또는 placeholder */}
      <div className="w-20 text-right">
        {onDebugDetect && (
          <button
            type="button"
            onClick={onDebugDetect}
            aria-label="debug detect"
            className="pointer-events-auto inline-flex h-10 w-10 items-center justify-center
                       rounded-full border border-warn/60 bg-black/60 text-warn active:bg-warn/20"
          >
            🐞
          </button>
        )}
      </div>
    </div>
  );
}
