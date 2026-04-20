/**
 * FirstSightingPulse.tsx
 * --------------------------------------------------------------
 * 첫 형상 검출 순간 화면 전체에 붉은 비네팅을 0.6초 간 점멸.
 * 트리거: `trigger` prop 가 증가할 때마다 한 번 재생.
 */
import { useEffect, useState } from 'react';

interface Props {
  trigger: number;
}

export default function FirstSightingPulse({ trigger }: Props) {
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    if (trigger === 0) return;
    setPlaying(true);
    const id = setTimeout(() => setPlaying(false), 600);
    return () => clearTimeout(id);
  }, [trigger]);

  if (!playing) return null;
  return (
    <div
      className="pointer-events-none absolute inset-0 z-20"
      style={{
        background:
          'radial-gradient(ellipse at center, transparent 40%, rgba(255,58,85,0.55) 100%)',
        animation: 'ghostPulse 0.6s ease-out',
      }}
    />
  );
}
