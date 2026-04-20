/**
 * PhotoCompositor.ts
 * --------------------------------------------------------------
 * 원본 사진 + 검출 박스 정규화 좌표 → 박스/브래킷이 합성된 새 JPEG dataURL.
 * Canvas API 만 사용 (순수 브라우저, 플러그인 없음).
 *
 * 용도:
 *   1. 셔터 누를 때 영구 보존용 "증거 사진" 제작 — 공유해도 박스가 남음
 *   2. 도감 디테일에서 필요 시 재생성 (원본 + boxes 만 있으면 언제든)
 */
import type { NormalizedBox } from '../models/NormalizedBox';

export async function composeWithBoxes(
  sourceDataUrl: string,
  boxes: NormalizedBox[],
  options: { mime?: 'image/jpeg' | 'image/png'; quality?: number } = {}
): Promise<{ dataUrl: string; width: number; height: number }> {
  const mime = options.mime ?? 'image/jpeg';
  const quality = options.quality ?? 0.9;

  const img = await loadImage(sourceDataUrl);
  const W = img.naturalWidth;
  const H = img.naturalHeight;

  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d')!;
  ctx.drawImage(img, 0, 0, W, H);

  // 박스가 없으면 원본 그대로 재인코딩
  if (boxes.length > 0) {
    const stroke = Math.max(2, W * 0.004);
    const bracketLen = Math.max(16, Math.min(W, H) * 0.03);

    boxes.forEach((b, idx) => {
      const x = b.left * W;
      const y = b.top * H;
      const w = b.width * W;
      const h = b.height * H;

      // 글로우
      ctx.strokeStyle = 'rgba(255,58,85,0.35)';
      ctx.lineWidth = stroke * 3;
      ctx.strokeRect(x, y, w, h);

      // 브래킷
      ctx.strokeStyle = 'rgba(255,58,85,0.95)';
      ctx.lineWidth = stroke;
      const corners: [number, number, number, number, number, number][] = [
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

      // 라벨
      const label = `ENTITY-${String(idx + 1).padStart(3, '0')}`;
      const fontSize = Math.max(12, W * 0.022);
      ctx.font = `900 ${fontSize}px ui-monospace, Menlo, monospace`;
      const tw = ctx.measureText(label).width;
      const pad = fontSize * 0.4;
      const labelH = fontSize + pad * 2;
      const labelY = Math.max(labelH, y - 4);
      ctx.fillStyle = 'rgba(0,0,0,0.75)';
      ctx.fillRect(x, labelY - labelH + pad, tw + pad * 2, labelH);
      ctx.fillStyle = '#ff3a55';
      ctx.fillText(label, x + pad, labelY);
    });
  }

  const dataUrl = canvas.toDataURL(mime, quality);
  return { dataUrl, width: W, height: H };
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = (e) => reject(e);
    img.src = src;
  });
}
