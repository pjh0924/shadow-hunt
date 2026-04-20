/**
 * CodexDetailScreen.tsx — Step 4.
 * --------------------------------------------------------------
 * 한 캡처 크게 보기.
 *   - AspectRatio 유지 사진 (박스는 이미 합성돼 있음)
 *   - 메타데이터: 라벨, 시각, EMF, 검출수, lat/lng
 *   - 미니맵 (lat/lng 있을 때만)
 *   - 공유 / 삭제
 */
import { useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useCodexStore } from '../store/useCodexStore';
import StaticMinimap from '../components/StaticMinimap';
import { shareCapture } from '../services/CodexShare';
import { FeedbackService } from '../services/FeedbackService';

function formatDateTime(iso: string): string {
  const d = new Date(iso);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  const HH = String(d.getHours()).padStart(2, '0');
  const MM = String(d.getMinutes()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd} ${HH}:${MM}`;
}

export default function CodexDetailScreen() {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const items = useCodexStore((s) => s.items);
  const remove = useCodexStore((s) => s.remove);

  const item = useMemo(() => items.find((c) => c.id === id), [items, id]);

  if (!item) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-bg">
        <p className="text-sm text-white/60">{t('codexDetailFileNotFound')}</p>
      </div>
    );
  }

  const danger = item.emfLevel >= 4;
  const aspect = item.photoWidth / item.photoHeight;

  const onShare = async () => {
    FeedbackService.onConfirm();
    await shareCapture(item);
  };

  const onDelete = async () => {
    const ok = window.confirm(t('codexDetailDeleteMessage'));
    if (!ok) return;
    await remove(item.id);
    navigate(-1);
  };

  return (
    <div className="flex h-full w-full flex-col bg-bg">
      {/* AppBar */}
      <header className="flex items-center justify-between border-b border-neon/20 bg-bg/80 px-3 py-3">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="rounded-md border border-neon/40 px-3 py-1 text-xs font-bold text-neon active:bg-neon/20"
        >
          ←
        </button>
        <div className="truncate px-2 text-sm font-bold tracking-wider text-neon text-glow">
          {item.ghostLabel}
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={onShare}
            aria-label={t('codexDetailShareTooltip')}
            className="rounded-md border border-neon/40 px-2 py-1 text-xs font-bold text-neon active:bg-neon/20"
          >
            ↗
          </button>
          <button
            type="button"
            onClick={onDelete}
            aria-label={t('codexDetailDeleteTooltip')}
            className="rounded-md border border-danger/60 px-2 py-1 text-xs font-bold text-danger active:bg-danger/20"
          >
            🗑
          </button>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* 사진 */}
        <div
          className="relative overflow-hidden rounded-lg border border-neon/30 bg-black"
          style={{ aspectRatio: `${aspect}` }}
        >
          <img
            src={item.photoDataUrl}
            alt={item.ghostLabel}
            className="absolute inset-0 h-full w-full object-contain"
          />
        </div>

        {/* 메타 정보 */}
        <div className="grid grid-cols-2 gap-2 text-[12px]">
          <div className="rounded-md border border-neon/20 bg-surface p-3">
            <div className="text-[9px] uppercase tracking-widest text-white/40">
              {t('codexDetailEmf', { value: item.emfLevel.toFixed(2) })}
            </div>
            <div
              className={[
                'mt-1 text-lg font-extrabold',
                danger ? 'text-danger' : 'text-neon',
              ].join(' ')}
            >
              {item.emfLevel.toFixed(2)}
              {danger && <span className="ml-2 text-[10px]">· DANGER</span>}
            </div>
          </div>

          <div className="rounded-md border border-neon/20 bg-surface p-3">
            <div className="text-[9px] uppercase tracking-widest text-white/40">
              DETECTED
            </div>
            <div className="mt-1 text-lg font-extrabold text-neon">
              {t('codexDetailDetection', { count: item.detectionCount })}
            </div>
          </div>

          <div className="col-span-2 rounded-md border border-neon/20 bg-surface p-3">
            <div className="text-[9px] uppercase tracking-widest text-white/40">
              CAPTURED
            </div>
            <div className="mt-1 font-mono text-[13px] text-white/80">
              {formatDateTime(item.capturedAt)}
            </div>
          </div>
        </div>

        {/* 미니맵 */}
        {item.lat !== undefined && item.lng !== undefined && (
          <div>
            <div className="mb-1 text-[9px] uppercase tracking-widest text-white/40">
              LOCATION · {item.lat.toFixed(5)}, {item.lng.toFixed(5)}
            </div>
            <StaticMinimap lat={item.lat} lng={item.lng} />
          </div>
        )}
      </div>
    </div>
  );
}
