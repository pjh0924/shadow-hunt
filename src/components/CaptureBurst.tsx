/**
 * CaptureBurst.tsx
 * --------------------------------------------------------------
 * 셔터 누른 직후 화면 중앙에서 네온 그린 원이 퍼지며 사라지는 축하 효과.
 * trigger prop 이 증가할 때마다 한 번 재생.
 */
import { useEffect, useState } from 'react';

interface Props {
  trigger: number;
}

export default function CaptureBurst({ trigger }: Props) {
  const [playing, setPlaying] = useState(false);
  useEffect(() => {
    if (trigger === 0) return;
    setPlaying(true);
    const id = setTimeout(() => setPlaying(false), 900);
    return () => clearTimeout(id);
  }, [trigger]);

  if (!playing) return null;
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0 z-30 flex items-center justify-center"
    >
      {/* 동심원 3개 */}
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="absolute h-40 w-40 rounded-full border-4 border-neon animate-neon-burst"
          style={{ animationDelay: `${i * 0.12}s` }}
        />
      ))}
      {/* 중앙 "CAPTURED" 라벨 */}
      <span
        className="relative text-xs font-black tracking-[0.4em] text-neon text-glow
                   animate-neon-burst"
        style={{ animationDuration: '0.7s' }}
      >
        CAPTURED
      </span>
    </div>
  );
}
