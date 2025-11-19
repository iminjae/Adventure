"use client";
import { useEffect, useMemo, useState } from "react";

type Props = {
  seconds: number;              // 남은 초 (0 이하면 Ready)
  className?: string;
  readyText?: string;           // 기본: "Ready"
  variant?: "purple" | "slate"; // 배경 톤
};

function fmt(sec: number) {
  if (sec <= 0) return "Ready";
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = Math.floor(sec % 60);
  return `${h}h ${m}m ${s}s`;
}

export default function CountdownBadge({
  seconds,
  className = "",
  readyText = "Ready",
  variant = "slate",
}: Props) {
  // 내부 타이머로 1초마다 업데이트(UX용)
  const [left, setLeft] = useState<number>(Math.max(0, seconds|0));
  useEffect(() => { setLeft(Math.max(0, seconds|0)); }, [seconds]);

  useEffect(() => {
    if (left <= 0) return;
    const t = setInterval(() => setLeft(v => (v > 0 ? v - 1 : 0)), 1000);
    return () => clearInterval(t);
  }, [left]);

  const show = useMemo(() => (left <= 0 ? readyText : fmt(left)), [left, readyText]);

  const base =
    "inline-flex items-center gap-2 rounded-full border backdrop-blur " +
    "px-4 py-2 text-[15px] font-semibold tracking-wide tabular-nums";
  const tone =
    variant === "purple"
      ? "border-violet-400/25 bg-violet-500/15 text-violet-100 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.06)]"
      : "border-white/15 bg-white/[0.06] text-white/95 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.06)]";

  return (
    <span className={`${base} ${tone} ${className}`} aria-live="polite">
      {/* 아이콘 */}
      <svg width="16" height="16" viewBox="0 0 24 24"
        className={left>0 ? "text-rose-400" : "text-emerald-400"}
        fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
        aria-hidden="true">
        <circle cx="12" cy="13" r="7" />
        <path d="M12 10v4l2.5 1.5" />
        <path d="M9 2h6" />
      </svg>
      {show}
    </span>
  );
}