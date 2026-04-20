/**
 * MockControlPanel.tsx
 * --------------------------------------------------------------
 * 개발자 전용 D-Pad:
 *   - 8방위 + 가운데 (가장 가까운 귀신으로 워프)
 *   - 새 웨이브 (리스폰)
 *
 * mockMode=true 일 때만 MapScreen 이 렌더.
 */
import type { JSX } from 'react';

interface Props {
  onMove: (eastM: number, northM: number) => void;
  onTeleportNearest: () => void;
  onRespawn: () => void;
  stepMeters?: number;
}

export default function MockControlPanel({
  onMove,
  onTeleportNearest,
  onRespawn,
  stepMeters = 5,
}: Props) {
  const dirs: [string, number, number][] = [
    ['↖', -1, 1],
    ['↑', 0, 1],
    ['↗', 1, 1],
    ['←', -1, 0],
    ['✦', 0, 0], // center = teleport
    ['→', 1, 0],
    ['↙', -1, -1],
    ['↓', 0, -1],
    ['↘', 1, -1],
  ];

  const handle = (dx: number, dy: number) => {
    if (dx === 0 && dy === 0) onTeleportNearest();
    else onMove(dx * stepMeters, dy * stepMeters);
  };

  const cells: JSX.Element[] = dirs.map(([label, dx, dy]) => (
    <button
      key={label}
      type="button"
      onClick={() => handle(dx, dy)}
      className="aspect-square rounded-md border border-neon/60 bg-black/60
                 text-neon text-lg font-bold active:bg-neon/20"
    >
      {label}
    </button>
  ));

  return (
    <div
      className="pointer-events-auto absolute left-3 bottom-28 z-10 w-[38%] max-w-[200px]
                 rounded-xl border border-neon/50 bg-black/70 p-2
                 shadow-[0_0_12px_rgba(33,245,110,0.25)]"
    >
      <header className="mb-1 flex items-center justify-between px-1">
        <span className="text-[10px] font-black tracking-widest text-neon">
          DEV MOCK MODE
        </span>
      </header>
      <div className="grid grid-cols-3 gap-1">{cells}</div>
      <button
        type="button"
        onClick={onRespawn}
        className="mt-2 w-full rounded-md border border-neon/60 bg-black/60 py-1.5
                   text-[11px] font-bold text-neon active:bg-neon/20"
      >
        ↻ 새 웨이브
      </button>
    </div>
  );
}
