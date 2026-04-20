/**
 * CodexGridTile.tsx — 도감 그리드의 한 칸.
 *   - 썸네일 (정사각 crop)
 *   - 라벨 + 날짜 + EMF
 */
import type { GhostCapture } from '../models/GhostCapture';

interface Props {
  item: GhostCapture;
  onClick: () => void;
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${mm}/${dd}`;
}

export default function CodexGridTile({ item, onClick }: Props) {
  const danger = item.emfLevel >= 4;
  return (
    <button
      type="button"
      onClick={onClick}
      className="group relative aspect-square overflow-hidden rounded-lg border border-neon/30 bg-surface"
    >
      <img
        src={item.photoDataUrl}
        alt={item.ghostLabel}
        className="absolute inset-0 h-full w-full object-cover"
      />
      {/* 상단: EMF 라벨 */}
      <div
        className={[
          'absolute left-1 top-1 rounded-sm px-1.5 py-0.5 text-[9px] font-black tracking-widest',
          danger ? 'bg-danger/80 text-white' : 'bg-black/70 text-neon',
        ].join(' ')}
      >
        EMF {item.emfLevel.toFixed(1)}
      </div>
      {/* 하단 그라디언트 + 라벨/일자 */}
      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 to-transparent p-1.5">
        <div className="truncate text-[11px] font-bold text-neon text-glow">
          {item.ghostLabel}
        </div>
        <div className="text-[9px] text-white/50">{formatDate(item.capturedAt)}</div>
      </div>
    </button>
  );
}
