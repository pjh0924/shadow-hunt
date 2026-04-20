/**
 * DetectionCountChip.tsx
 * --------------------------------------------------------------
 * 상단 HUD 아래에 얹히는 작은 배지.
 *   count > 0 일 때만 보임. 숫자가 커질수록 더 붉어짐 (다중 검출).
 */

interface Props {
  count: number;
}

export default function DetectionCountChip({ count }: Props) {
  if (count <= 0) return null;
  const multi = count > 1;
  return (
    <div
      className={[
        'pointer-events-none absolute left-1/2 top-16 z-20 -translate-x-1/2',
        'rounded-full border bg-black/80 px-3 py-1 text-[10px] font-black tracking-widest',
        multi
          ? 'border-danger text-danger shadow-[0_0_10px_rgba(255,58,85,0.5)] animate-pulse'
          : 'border-warn text-warn shadow-[0_0_8px_rgba(255,176,32,0.4)]',
      ].join(' ')}
    >
      {multi ? `MULTI · ENTITIES ${count}` : `ENTITY DETECTED`}
    </div>
  );
}
