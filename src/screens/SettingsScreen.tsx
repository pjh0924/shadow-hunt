/**
 * SettingsScreen.tsx — 사용자 개인화 화면.
 * --------------------------------------------------------------
 * 각 행은 라벨 + 힌트 + 컨트롤(토글/라디오/슬라이더) 구조.
 * 설정 변경은 Zustand persist → 이후 세션에도 반영.
 */
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import {
  useSettingsStore,
  type Locale,
  type DistanceUnit,
  type Theme,
} from '../store/useSettingsStore';
import { useCodexStore } from '../store/useCodexStore';
import { NotificationService } from '../services/NotificationService';
import { useState } from 'react';

const APP_VERSION = '0.1.0';

export default function SettingsScreen() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const s = useSettingsStore();
  const [notifStatus, setNotifStatus] = useState<'unknown' | 'granted' | 'denied'>('unknown');

  const requestNotif = async () => {
    const ok = await NotificationService.prime();
    setNotifStatus(ok ? 'granted' : 'denied');
  };

  const resetAll = async () => {
    const ok = window.confirm(t('settingsDataResetConfirm'));
    if (!ok) return;
    // codex store 의 모든 항목 삭제 (selector 대신 store 를 getState 로 직접 사용)
    const codex = useCodexStore.getState();
    for (const it of codex.items) await codex.remove(it.id);
    s.resetAll();
    navigate('/onboarding', { replace: true });
  };

  return (
    <div className="flex h-full w-full flex-col bg-bg">
      {/* AppBar */}
      <header className="flex items-center justify-between border-b border-neon/20 bg-bg/80 px-3 py-3">
        <button
          type="button"
          onClick={() => navigate(-1)}
          aria-label="back"
          className="rounded-md border border-neon/40 px-3 py-1 text-xs font-bold text-neon
                     focus:outline-none focus:ring-2 focus:ring-neon active:bg-neon/20"
        >
          ←
        </button>
        <h1 className="text-sm font-extrabold tracking-[0.3em] text-neon text-glow">
          {t('settingsTitle').toUpperCase()}
        </h1>
        <div className="w-10" />
      </header>

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {/* 언어 */}
        <Row label={t('settingsLanguage')}>
          <SegmentedControl<Locale>
            value={s.locale}
            options={[
              { value: 'ko', label: t('settingsLanguageKo') },
              { value: 'en', label: t('settingsLanguageEn') },
            ]}
            onChange={s.setLocale}
          />
        </Row>

        {/* 테마 */}
        <Row label={t('settingsTheme')}>
          <SegmentedControl<Theme>
            value={s.theme}
            options={[
              { value: 'dark', label: t('settingsThemeDark') },
              { value: 'light', label: t('settingsThemeLight') },
            ]}
            onChange={s.setTheme}
          />
        </Row>

        {/* 거리 단위 */}
        <Row label={t('settingsDistanceUnit')}>
          <SegmentedControl<DistanceUnit>
            value={s.distanceUnit}
            options={[
              { value: 'metric', label: t('settingsUnitMetric') },
              { value: 'imperial', label: t('settingsUnitImperial') },
            ]}
            onChange={s.setDistanceUnit}
          />
        </Row>

        {/* 사운드 볼륨 */}
        <Row label={t('settingsSoundVolume')}>
          <div className="flex items-center gap-3">
            <input
              type="range"
              min={0}
              max={100}
              value={Math.round(s.soundVolume * 100)}
              onChange={(e) => s.setSoundVolume(Number(e.target.value) / 100)}
              aria-label={t('settingsSoundVolume')}
              className="flex-1 accent-[var(--color-neon)]"
            />
            <span className="w-10 text-right font-mono text-xs text-neon tabular-nums">
              {Math.round(s.soundVolume * 100)}
            </span>
          </div>
        </Row>

        {/* 햅틱 */}
        <Row label={t('settingsHaptic')} hint={t('settingsHapticHint')}>
          <Toggle value={s.haptic} onChange={s.setHaptic} />
        </Row>

        {/* 모션 줄이기 */}
        <Row label={t('settingsReduceMotion')} hint={t('settingsReduceMotionHint')}>
          <Toggle value={s.reduceMotion} onChange={s.setReduceMotion} />
        </Row>

        {/* 알림 */}
        <Row label={t('settingsNotifEnable')}>
          <button
            type="button"
            onClick={requestNotif}
            disabled={notifStatus === 'granted'}
            className={[
              'rounded-md border px-3 py-1.5 text-xs font-bold',
              notifStatus === 'granted'
                ? 'border-neon/60 bg-neon/20 text-neon cursor-not-allowed'
                : 'border-white/30 text-white/80 active:bg-white/10',
            ].join(' ')}
          >
            {notifStatus === 'granted' ? t('settingsNotifGranted') : t('settingsNotifEnable')}
          </button>
        </Row>

        {/* 데이터 초기화 */}
        <div className="mt-6 rounded-lg border border-danger/30 bg-danger/5 p-4">
          <div className="text-xs font-bold text-danger">{t('settingsDataReset')}</div>
          <p className="mt-1 text-[11px] text-white/55">{t('settingsDataResetHint')}</p>
          <button
            type="button"
            onClick={resetAll}
            className="mt-3 rounded-md border border-danger/60 bg-danger/10 px-4 py-2
                       text-xs font-bold text-danger active:bg-danger/20"
          >
            🗑 {t('settingsDataReset')}
          </button>
        </div>

        {/* 버전 */}
        <div className="pt-6 text-center text-[10px] text-white/40">
          {t('settingsVersion')} {APP_VERSION}
        </div>
      </div>
    </div>
  );
}

// ---------------- 재사용 컴포넌트 ----------------

function Row({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-lg border border-neon/20 bg-surface p-3">
      <div className="mb-2 flex items-baseline justify-between gap-2">
        <div>
          <div className="text-sm font-bold text-neon">{label}</div>
          {hint && <div className="mt-0.5 text-[10px] text-white/45">{hint}</div>}
        </div>
      </div>
      {children}
    </div>
  );
}

function Toggle({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={value}
      onClick={() => onChange(!value)}
      className={[
        'relative h-7 w-12 rounded-full transition-colors',
        value ? 'bg-neon/70' : 'bg-white/15',
        'focus:outline-none focus:ring-2 focus:ring-neon focus:ring-offset-2 focus:ring-offset-bg',
      ].join(' ')}
    >
      <span
        className={[
          'absolute top-0.5 h-6 w-6 rounded-full bg-white shadow-md transition-all',
          value ? 'left-5' : 'left-0.5',
        ].join(' ')}
      />
    </button>
  );
}

interface SegmentedOption<T extends string> {
  value: T;
  label: string;
}

function SegmentedControl<T extends string>({
  value,
  options,
  onChange,
}: {
  value: T;
  options: SegmentedOption<T>[];
  onChange: (v: T) => void;
}) {
  return (
    <div className="flex overflow-hidden rounded-md border border-neon/30">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          onClick={() => onChange(o.value)}
          aria-pressed={o.value === value}
          className={[
            'flex-1 px-3 py-2 text-[11px] font-bold transition-colors',
            'focus:outline-none focus:ring-2 focus:ring-neon focus:ring-inset',
            o.value === value
              ? 'bg-neon/20 text-neon text-glow'
              : 'bg-surface2 text-white/55 hover:text-white/80',
          ].join(' ')}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
