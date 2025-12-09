"use client";
import { useEffect, useMemo, useState } from "react";

type Props = {
  seconds: number;
  loading?: boolean;             // ✅ 연결 전/수화 전 로딩 표시
  className?: string;
  readyText?: string;
  variant?: "purple" | "slate";
  reserve?: string;              // ✅ 폭 예약 문자열(가장 넓게: 88h 88m 88s)
};

function fmt(sec: number) {
  if (sec <= 0) return "Ready";
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = Math.floor(sec % 60);
  const z = (n: number) => String(n).padStart(2, "0"); // 두 자리 고정 → 폭 출렁임 방지
  return `${z(h)}h ${z(m)}m ${z(s)}s`;
}

export default function CountdownBadge({
  seconds,
  loading = false,
  className = "",
  readyText = "Ready",
  variant = "slate",
  reserve = "88h 88m 88s",       // Inter 기준 가장 넓은 폭
}: Props) {
  const [left, setLeft] = useState<number>(Math.max(0, Math.floor(seconds)));

  useEffect(() => { setLeft(Math.max(0, Math.floor(seconds))); }, [seconds]);
  useEffect(() => {
    if (loading || left <= 0) return;            // 로딩 시 내부 타이머 정지
    const id = setInterval(() => setLeft(v => (v > 0 ? v - 1 : 0)), 1000);
    return () => clearInterval(id);
  }, [left, loading]);

  const show = useMemo(
    () => (left <= 0 ? readyText : fmt(left)),
    [left, readyText]
  );

  const base =
    "relative inline-flex items-center rounded-full border backdrop-blur tabular-nums " +
    "px-4 py-2 text-[15px] font-semibold tracking-wide";
  const tone =
    variant === "purple"
      ? "border-violet-400/25 bg-violet-500/15 text-violet-100 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.06)]"
      : "border-white/15 bg-white/[0.06] text-white/95 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.06)]";

  return (
    <span className={`${base} ${tone} ${className}`} aria-live="polite">
      {/* 1) 폭 예약: 항상 같은 너비 유지 */}
      <span className="invisible select-none">{reserve}</span>

      {/* 2) 내용 레이어(폭 고정 영역의 중앙에 겹침) */}
      <span className="absolute inset-0 flex items-center justify-center gap-2">
        <svg
          width="16" height="16" viewBox="0 0 24 24"
          className={loading || left > 0 ? "text-rose-400" : "text-emerald-400"}
          fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
          aria-hidden="true"
        >
          <circle cx="12" cy="13" r="7" />
          <path d="M12 10v4l2.5 1.5" />
          <path d="M9 2h6" />
        </svg>

        {/* 로딩일 때는 같은 크기의 스켈레톤 바를 보여줌(크기 완전 동일) */}
        {loading ? (
          <span className="relative">
            {/* 동일 폭 확보(보이지 않지만 자리 차지) */}
            <span className="opacity-0">{reserve}</span>
            {/* 위에 얇은 스켈레톤 바 */}
            <span className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-[0.9em] rounded-md bg-white/15 animate-pulse" />
          </span>
        ) : (
          <span>{show}</span>
        )}
      </span>
    </span>
  );
}