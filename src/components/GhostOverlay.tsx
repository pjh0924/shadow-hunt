/**
 * GhostOverlay.tsx
 * --------------------------------------------------------------
 * 카메라 프리뷰 위에 검출된 박스를 호러 톤으로 그린다.
 *   - 4코너 L 브래킷 (Predator-style 타겟팅)
 *   - 맥박치는 붉은 글로우
 *   - 위쪽에 "ENTITY-XXX" 라벨
 *   - (선택) 박스 가로지르는 스캔라인
 *
 * 입력은 정규화 좌표 (0~1). 부모가 sized container (비디오와 같은 박스) 안에
 * 이 컴포넌트를 absolute-inset 으로 넣으면 자동으로 올바르게 렌더.
 */
import { useEffect, useRef } from 'react';
import type { DetectedGhost } from '../models/DetectionResult';

interface Props {
  ghosts: DetectedGhost[];
}

export default function GhostOverlay({ ghosts }: Props) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const ghostsRef = useRef<DetectedGhost[]>(ghosts);
  ghostsRef.current = ghosts;

  useEffect(() => {
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext('2d')!;
    let rafId = 0;

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    const loop = () => {
      const list = ghostsRef.current;
      const rect = canvas.getBoundingClientRect();
      const W = rect.width;
      const H = rect.height;
      const t = performance.now() / 1000;

      ctx.clearRect(0, 0, W, H);

      for (const g of list) {
        const x = g.bounds.left * W;
        const y = g.bounds.top * H;
        const w = g.bounds.width * W;
        const h = g.bounds.height * H;
        const bracketLen = Math.max(14, Math.min(w, h) * 0.22);
        const alpha = 0.65 + Math.sin(t * 6) * 0.25; // pulse

        // ---- 브래킷 (4코너) ----
        ctx.strokeStyle = `rgba(255,58,85,${alpha})`;
        ctx.lineWidth = 3;
        ctx.lineCap = 'square';
        const corners: [number, number, number, number, number, number][] = [
          // 좌상 — 수평 + 수직
          [x, y, x + bracketLen, y, x, y + bracketLen],
          [x + w, y, x + w - bracketLen, y, x + w, y + bracketLen],
          [x, y + h, x + bracketLen, y + h, x, y + h - bracketLen],
          [x + w, y + h, x + w - bracketLen, y + h, x + w, y + h - bracketLen],
        ];
        for (const [x1, y1, hx, hy, vx, vy] of corners) {
          ctx.beginPath();
          ctx.moveTo(hx, hy);
          ctx.lineTo(x1, y1);
          ctx.lineTo(vx, vy);
          ctx.stroke();
        }

        // ---- 글로우 (박스 가장자리 흐림) ----
        ctx.strokeStyle = `rgba(255,58,85,${0.25 * alpha})`;
        ctx.lineWidth = 10;
        ctx.strokeRect(x, y, w, h);

        // ---- 스캔라인 — 박스 안을 위아래로 가로지름 ----
        const scanY = y + ((Math.sin(t * 2) + 1) / 2) * h;
        ctx.strokeStyle = `rgba(255,58,85,${0.4 * alpha})`;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(x, scanY);
        ctx.lineTo(x + w, scanY);
        ctx.stroke();

        // ---- 라벨 ----
        const label = `ENTITY-${String(g.id).padStart(3, '0')}`;
        ctx.font = 'bold 12px ui-monospace, Menlo, monospace';
        const tw = ctx.measureText(label).width;
        const labelY = Math.max(14, y - 6);
        ctx.fillStyle = 'rgba(0,0,0,0.7)';
        ctx.fillRect(x, labelY - 12, tw + 10, 16);
        ctx.fillStyle = `rgba(255,58,85,${alpha})`;
        ctx.fillText(label, x + 5, labelY);
      }

      rafId = requestAnimationFrame(loop);
    };
    rafId = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(rafId);
      ro.disconnect();
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="pointer-events-none absolute inset-0 z-15 h-full w-full"
    />
  );
}
