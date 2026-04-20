/**
 * OnboardingGate.tsx
 * --------------------------------------------------------------
 * 첫 실행이면 `/onboarding` 으로 리다이렉트, 아니면 자식을 렌더.
 * MapScreen 전용 — 다른 화면(/settings, /codex ...)에는 적용 X.
 */
import { Navigate, useLocation } from 'react-router-dom';
import type { ReactNode } from 'react';
import { useSettingsStore } from '../store/useSettingsStore';

export function OnboardingGate({ children }: { children: ReactNode }) {
  const onboarded = useSettingsStore((s) => s.onboarded);
  const location = useLocation();
  if (!onboarded && location.pathname === '/') {
    return <Navigate to="/onboarding" replace />;
  }
  return <>{children}</>;
}
