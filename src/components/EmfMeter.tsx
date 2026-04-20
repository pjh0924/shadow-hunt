/**
 * EmfMeter.tsx
 * --------------------------------------------------------------
 * 카메라 HUD 상단에 박히는 EMF 측정기 위젯.
 *  - 5칸 LED bar (level 에 따라 점등)
 *  - 현재 값 텍스트 (0.00 ~ 5.00)
 *
 * 색상: 1 이하 neonDim, 2~3 warn, 4~5 danger
 */
import { EmfSimulator } from '../services/EmfSimulator';

interface Props {
  level: number;
  compact?: boolean;
}

function ledColor(i: number, active: boolean): string {
  if (!active) return 'rgba(255,255,255,0.08)';
  if (i >= 3) return 'var(--color-danger)';
  if (i >= 1) return 'var(--color-warn)';
  return 'var(--color-neon)';
}

export default function EmfMeter({ level, compact = false }: Props) {
  const leds = EmfSimulator.MAX_LEVEL;
  const activeCount = Math.round(Math.max(0, Math.min(leds, level)));

  return (
    <div
      className={[
        'pointer-events-none flex items-center gap-2 rounded-md border border-neon/40 bg-black/60 px-2 py-1',
        compact ? 'text-[10px]' : 'text-xs',
      ].join(' ')}
    >
      <span className="inline-flex items-center gap-1 font-extrabold text-neon text-glow">
        <span className="text-base leading-none">✦</span>
        <span>EMF</span>
      </span>
      <div className="flex gap-0.5">
        {Array.from({ length: leds }).map((_, i) => {
          const active = i < activeCount;
          return (
            <span
              key={i}
              className="h-3 w-4 rounded-sm transition-colors duration-100"
              style={{
                backgroundColor: ledColor(i, active),
                boxShadow: active
                  ? `0 0 6px ${ledColor(i, true)}`
                  : 'inset 0 0 0 1px rgba(255,255,255,0.1)',
              }}
            />
          );
        })}
      </div>
      <span className="font-mono font-bold text-neon tabular-nums">
        {level.toFixed(2)}
      </span>
    </div>
  );
}
