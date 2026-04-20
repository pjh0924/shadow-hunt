/**
 * ErrorBoundary.tsx
 * --------------------------------------------------------------
 * 전역 React 에러 경계 + localStorage 에 최근 5개 로그.
 *   - 자식 컴포넌트가 throw 하면 풀스크린 fallback 표시
 *   - 사용자 "다시 시도" 탭 시 상태 리셋 + location.reload()
 *   - 로그는 나중에 조사용으로 localStorage['shadow_hunt.errors']
 */
import { Component, type ErrorInfo, type ReactNode } from 'react';

const STORAGE_KEY = 'shadow_hunt.errors';
const MAX_KEEP = 5;

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  message: string | null;
}

interface LoggedError {
  at: string;
  message: string;
  stack?: string;
  componentStack?: string;
  url: string;
  userAgent: string;
}

function pushLog(entry: LoggedError) {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const list: LoggedError[] = raw ? JSON.parse(raw) : [];
    list.unshift(entry);
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(list.slice(0, MAX_KEEP))
    );
  } catch {
    /* quota / JSON — ignore */
  }
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, message: null };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, message: error.message };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    pushLog({
      at: new Date().toISOString(),
      message: error.message,
      stack: error.stack,
      componentStack: info.componentStack ?? undefined,
      url: window.location.href,
      userAgent: navigator.userAgent,
    });
    // dev 에선 콘솔에도
    if (import.meta.env.DEV) {
      console.error('[ErrorBoundary]', error, info);
    }
  }

  reset = () => {
    this.setState({ hasError: false, message: null });
    window.location.reload();
  };

  render() {
    if (!this.state.hasError) return this.props.children;
    return (
      <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-bg px-8 text-center">
        <div className="mb-6 text-[72px]">💀</div>
        <h1 className="text-xl font-extrabold tracking-wider text-danger text-glow">
          SIGNAL LOST
        </h1>
        <p className="mt-4 max-w-sm text-[13px] text-white/60">
          앱에서 예상치 못한 오류가 발생했습니다.
        </p>
        {this.state.message && (
          <pre className="mt-3 max-w-md overflow-x-auto rounded-md border border-danger/30 bg-black/80 p-2 text-left text-[10px] text-danger/90">
            {this.state.message}
          </pre>
        )}
        <button
          type="button"
          onClick={this.reset}
          className="mt-8 rounded-lg border-2 border-neon bg-neon/20 px-6 py-3
                     text-sm font-extrabold tracking-wider text-neon text-glow
                     active:scale-95"
        >
          ↻ RESTART
        </button>
        <p className="mt-4 text-[10px] text-white/40">
          localStorage['shadow_hunt.errors'] — 최근 {MAX_KEEP}개 기록
        </p>
      </div>
    );
  }
}
