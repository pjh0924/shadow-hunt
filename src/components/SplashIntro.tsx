/**
 * SplashIntro.tsx
 * --------------------------------------------------------------
 * 앱 첫 로드 시 1.2초 동안 풀스크린 고스트 로고가 글리치하며 나타났다 사라짐.
 * localStorage 로 "이번 세션에 이미 봤는지" 추적 — 화면 전환마다 재생 안 되게.
 */
import { useEffect, useState } from 'react';

const SESSION_KEY = 'shadow_hunt.splash_shown';

export default function SplashIntro() {
  const [show, setShow] = useState(() => {
    try {
      return !sessionStorage.getItem(SESSION_KEY);
    } catch {
      return true;
    }
  });

  useEffect(() => {
    if (!show) return;
    try {
      sessionStorage.setItem(SESSION_KEY, '1');
    } catch {
      /* private mode 등 */
    }
    const id = setTimeout(() => setShow(false), 1200);
    return () => clearTimeout(id);
  }, [show]);

  if (!show) return null;

  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 z-[60] flex flex-col items-center justify-center bg-bg"
    >
      {/* 고스트 — 글리치 */}
      <div
        className="animate-glitch-once text-[96px] leading-none text-glow"
        style={{ color: 'var(--color-neon)' }}
      >
        👻
      </div>
      {/* 타이틀 */}
      <div
        className="mt-6 text-xs font-black tracking-[0.5em] text-neon text-glow animate-glitch-once"
        style={{ animationDelay: '0.15s' }}
      >
        SHADOW HUNT
      </div>
      {/* 하단 스캔라인 느낌의 프로그레스 */}
      <div className="mt-6 h-[2px] w-40 overflow-hidden bg-neon/15">
        <span className="block h-full animate-scanline bg-neon" />
      </div>
    </div>
  );
}
