/**
 * RecenterFAB.tsx
 * --------------------------------------------------------------
 * 우하단 플로팅 버튼: 지도 중심을 현재 위치로 재설정.
 * 길게 누르면 follow mode 토글 (선택 기능).
 */
interface Props {
  onRecenter: () => void;
  following: boolean;
  onToggleFollow: () => void;
}

export default function RecenterFAB({
  onRecenter,
  following,
  onToggleFollow,
}: Props) {
  return (
    <button
      type="button"
      onClick={onRecenter}
      onContextMenu={(e) => {
        e.preventDefault();
        onToggleFollow();
      }}
      className={[
        'absolute bottom-28 right-3 z-10 h-12 w-12 rounded-full',
        'border-2 bg-black/70 shadow-[0_0_10px_rgba(33,245,110,0.25)]',
        'flex items-center justify-center active:scale-95',
        following ? 'border-neon text-neon' : 'border-white/60 text-white/80',
      ].join(' ')}
      aria-label="recenter"
    >
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
        <circle
          cx="12"
          cy="12"
          r="4"
          fill={following ? 'currentColor' : 'none'}
          stroke="currentColor"
          strokeWidth="2"
        />
        <path
          d="M12 2v3M12 19v3M2 12h3M19 12h3"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        />
      </svg>
    </button>
  );
}
