/**
 * CodexStatsScreen.tsx — Step 4 통계.
 *   - 총 캡처
 *   - 검출된 총 형상 + 평균
 *   - 평균/최고 EMF
 *   - 최다 라벨
 *   - 첫/최근 캡처 시각
 */
import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useCodexStore } from '../store/useCodexStore';

interface Stats {
  total: number;
  detected: number;
  avgPerShot: number;
  avgEmf: number;
  maxEmf: number;
  topLabel: { label: string; count: number } | null;
  first: string | null;
  last: string | null;
}

function computeStats(items: ReturnType<typeof useCodexStore.getState>['items']): Stats {
  if (items.length === 0) {
    return {
      total: 0,
      detected: 0,
      avgPerShot: 0,
      avgEmf: 0,
      maxEmf: 0,
      topLabel: null,
      first: null,
      last: null,
    };
  }
  const total = items.length;
  const detected = items.reduce((s, c) => s + c.detectionCount, 0);
  const avgEmf = items.reduce((s, c) => s + c.emfLevel, 0) / total;
  const maxEmf = items.reduce((m, c) => Math.max(m, c.emfLevel), 0);

  const labelCount = new Map<string, number>();
  for (const c of items) {
    labelCount.set(c.ghostLabel, (labelCount.get(c.ghostLabel) ?? 0) + 1);
  }
  let topLabel: Stats['topLabel'] = null;
  for (const [label, count] of labelCount) {
    if (!topLabel || count > topLabel.count) topLabel = { label, count };
  }

  const sortedByTime = [...items].sort((a, b) =>
    a.capturedAt.localeCompare(b.capturedAt)
  );
  return {
    total,
    detected,
    avgPerShot: detected / total,
    avgEmf,
    maxEmf,
    topLabel,
    first: sortedByTime[0].capturedAt,
    last: sortedByTime[sortedByTime.length - 1].capturedAt,
  };
}

function fmtTime(iso: string): string {
  const d = new Date(iso);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export default function CodexStatsScreen() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const items = useCodexStore((s) => s.items);
  const stats = useMemo(() => computeStats(items), [items]);

  return (
    <div className="flex h-full w-full flex-col bg-bg">
      <header className="flex items-center justify-between border-b border-neon/20 bg-bg/80 px-3 py-3">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="rounded-md border border-neon/40 px-3 py-1 text-xs font-bold text-neon active:bg-neon/20"
        >
          ←
        </button>
        <h1 className="text-sm font-extrabold tracking-[0.3em] text-neon text-glow">
          {t('codexStatsTitle')}
        </h1>
        <div className="w-8" />
      </header>

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        <StatCard label={t('codexStatsTotal')} value={String(stats.total)} />
        <StatCard
          label={t('codexStatsDetected')}
          value={String(stats.detected)}
          sub={t('codexStatsAvgPerCapture', {
            avg: stats.avgPerShot.toFixed(2),
          })}
        />
        <StatCard
          label={t('codexStatsAvgEmf')}
          value={stats.avgEmf.toFixed(2)}
          sub={t('codexStatsRange')}
        />
        <StatCard
          label={t('codexStatsMaxEmf')}
          value={stats.maxEmf.toFixed(2)}
          danger={stats.maxEmf >= 4}
        />
        {stats.topLabel && (
          <StatCard
            label={t('codexStatsTopLabel')}
            value={stats.topLabel.label}
            sub={t('codexStatsTopLabelCount', { count: stats.topLabel.count })}
          />
        )}
        {stats.first && (
          <StatCard label={t('codexStatsFirst')} value={fmtTime(stats.first)} />
        )}
        {stats.last && (
          <StatCard label={t('codexStatsLast')} value={fmtTime(stats.last)} />
        )}
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  sub,
  danger = false,
}: {
  label: string;
  value: string;
  sub?: string;
  danger?: boolean;
}) {
  return (
    <div className="rounded-lg border border-neon/20 bg-surface p-4">
      <div className="text-[10px] uppercase tracking-widest text-white/40">
        {label}
      </div>
      <div
        className={[
          'mt-1 text-2xl font-extrabold',
          danger ? 'text-danger' : 'text-neon text-glow',
        ].join(' ')}
      >
        {value}
      </div>
      {sub && <div className="mt-1 text-[11px] text-white/50">{sub}</div>}
    </div>
  );
}
