/**
 * NoiseFilter.tsx
 * --------------------------------------------------------------
 * 카메라 프리뷰 위에 깔리는 호러 오버레이.
 *  - CRT 스캔라인 (CSS, 계속 흐름)
 *  - 비네팅 (CSS radial)
 *  - 프레임마다 글리치 블록 (Canvas) — intensity 에 따라 강도 조절
 *
 * intensity (0~1):  0=거의 없음, 1=심함.
 * EMF 값 / 첫 발견 부스트 등을 MapScreen 에서 계산해 전달.
 */
import { useEffect, useRef } from 'react';

interface Props {
  intensity: number;
}

export default function NoiseFilter({ intensity }: Props) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const rafRef = useRef<number | null>(null);
  const intensityRef = useRef(intensity);
  intensityRef.current = intensity;

  useEffect(() => {
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext('2d')!;

    const resize = () => {
      // 해상도 낮춰서 렌더 (CSS로 업스케일링 → 픽셀 노이즈 느낌)
      const w = (canvas.width = Math.floor(window.innerWidth / 4));
      const h = (canvas.height = Math.floor(window.innerHeight / 4));
      return { w, h };
    };
    let { w, h } = resize();
    const onResize = () => ({ w, h } = resize());
    window.addEventListener('resize', onResize);

    const start = performance.now();
    const loop = () => {
      const inten = intensityRef.current;
      const t = (performance.now() - start) / 1000;

      ctx.clearRect(0, 0, w, h);

      // 1) 미세 노이즈
      const noiseAlpha = 0.04 + inten * 0.12;
      const img = ctx.createImageData(w, h);
      const data = img.data;
      for (let i = 0; i < data.length; i += 4) {
        const n = Math.random() * 255;
        data[i] = n;
        data[i + 1] = n;
        data[i + 2] = n;
        data[i + 3] = Math.random() * 255 * noiseAlpha;
      }
      ctx.putImageData(img, 0, 0);

      // 2) 글리치 블록
      const glitchCount = Math.floor(1 + inten * 6);
      for (let g = 0; g < glitchCount; g++) {
        const bx = Math.random() * w;
        const by = ((Math.random() + t) % 1) * h;
        const bw = 12 + Math.random() * 60;
        const bh = 2 + Math.random() * 6;
        ctx.fillStyle = `rgba(33,245,110,${0.15 + inten * 0.4})`;
        ctx.fillRect(bx, by, bw, bh);
      }

      // 3) 적색 흐름 (intensity 높을 때)
      if (inten > 0.5) {
        const bw = w;
        const bh = 4 + Math.random() * 10;
        const by = ((Math.random() + t * 0.5) % 1) * h;
        ctx.fillStyle = `rgba(255,58,85,${(inten - 0.5) * 0.6})`;
        ctx.fillRect(0, by, bw, bh);
      }

      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      window.removeEventListener('resize', onResize);
    };
  }, []);

  return (
    <>
      {/* Canvas 노이즈 (저해상도 → CSS로 확대) */}
      <canvas
        ref={canvasRef}
        className="pointer-events-none absolute inset-0 z-10 h-full w-full mix-blend-screen"
        style={{ imageRendering: 'pixelated' }}
      />

      {/* 스캔라인 (CSS 반복 배경 + 위아래 이동) */}
      <div
        className="pointer-events-none absolute inset-0 z-10 animate-scanline"
        style={{
          background:
            'repeating-linear-gradient(to bottom, rgba(33,245,110,0.05) 0 2px, transparent 2px 4px)',
          mixBlendMode: 'screen',
        }}
      />

      {/* 비네팅 */}
      <div
        className="pointer-events-none absolute inset-0 z-10"
        style={{
          background: 'radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.85) 100%)',
        }}
      />
    </>
  );
}
