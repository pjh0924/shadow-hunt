/**
 * CodexScreen.tsx — Step 4.
 * --------------------------------------------------------------
 * 도감 메인.
 *   - AppBar: 뒤로 / 제목 / 통계 / 정렬
 *   - 빈 상태 → CodexEmptyState
 *   - 3열 그리드 → CodexGridTile → 탭 시 /codex/:id
 */
import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useCodexStore } from '../store/useCodexStore';
import CodexEmptyState from '../components/CodexEmptyState';
import CodexGridTile from '../components/CodexGridTile';
import type { GhostCapture } from '../models/GhostCapture';

type SortKey = 'newest' | 'oldest' | 'emfDesc' | 'emfAsc' | 'label';

const SORT_ORDER: SortKey[] = ['newest', 'oldest', 'emfDesc', 'emfAsc', 'label'];

function applySort(items: GhostCapture[], s: SortKey): GhostCapture[] {
  const copy = [...items];
  switch (s) {
    case 'newest':
      return copy.sort((a, b) => b.capturedAt.localeCompare(a.capturedAt));
    case 'oldest':
      return copy.sort((a, b) => a.capturedAt.localeCompare(b.capturedAt));
    case 'emfDesc':
      return copy.sort((a, b) => b.emfLevel - a.emfLevel);
    case 'emfAsc':
      return copy.sort((a, b) => a.emfLevel - b.emfLevel);
    case 'label':
      return copy.sort((a, b) => a.ghostLabel.localeCompare(b.ghostLabel));
  }
}

export default function CodexScreen() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const items = useCodexStore((s) => s.items);
  const loaded = useCodexStore((s) => s.loaded);
  const refresh = useCodexStore((s) => s.refresh);
  const [sort, setSort] = useState<SortKey>('newest');

  useEffect(() => {
    refresh();
  }, [refresh]);

  const sorted = useMemo(() => applySort(items, sort), [items, sort]);

  const sortLabel = (s: SortKey): string =>
    ({
      newest: t('codexSortNewest'),
      oldest: t('codexSortOldest'),
      emfDesc: t('codexSortEmfDesc'),
      emfAsc: t('codexSortEmfAsc'),
      label: t('codexSortLabel'),
    }[s]);

  const cycleSort = () => {
    const i = SORT_ORDER.indexOf(sort);
    setSort(SORT_ORDER[(i + 1) % SORT_ORDER.length]);
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
        <h1 className="text-sm font-extrabold tracking-[0.3em] text-neon text-glow">
          CODEX
        </h1>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => navigate('/codex/stats')}
            aria-label={t('codexStatsTooltip')}
            className="rounded-md border border-neon/40 px-2 py-1 text-xs font-bold text-neon active:bg-neon/20"
          >
            📊
          </button>
          <button
            type="button"
            onClick={cycleSort}
            aria-label={t('codexSortTooltip')}
            className="rounded-md border border-warn/60 px-2 py-1 text-[10px] font-bold text-warn active:bg-warn/20"
          >
            ↕ {sortLabel(sort)}
          </button>
        </div>
      </header>

      {/* 본문 */}
      {!loaded ? (
        <div className="flex flex-1 items-center justify-center text-neon-dim text-xs">
          ...
        </div>
      ) : sorted.length === 0 ? (
        <CodexEmptyState onGoToMap={() => navigate('/')} />
      ) : (
        <div className="grid grid-cols-3 gap-2 overflow-y-auto p-2">
          {sorted.map((it) => (
            <CodexGridTile
              key={it.id}
              item={it}
              onClick={() => navigate(`/codex/${it.id}`)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
