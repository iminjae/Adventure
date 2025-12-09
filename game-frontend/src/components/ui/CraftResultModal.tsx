"use client";
import React, { useEffect } from "react";

type Props = {
  open: boolean;
  success: boolean;
  grade?: number;
  shardsSpent?: number;     // 소모한 조각 수(표시용)
  onClose: () => void;
};

export default function CraftResultModal({ open, success, grade, shardsSpent, onClose }: Props) {
  // 선택: 간단한 반짝 효과(의존성 없이 동작). 성공 때만 1회 실행.
  useEffect(() => {
    if (!open || !success) return;
    const root = document.createElement("div");
    root.style.position = "fixed";
    root.style.inset = "0";
    root.style.pointerEvents = "none";
    root.style.zIndex = "60";

    const burst = document.createElement("div");
    burst.className =
      "absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 " +
      "w-[160px] h-[160px] rounded-full " +
      "bg-gradient-to-tr from-emerald-400/30 via-cyan-300/20 to-transparent " +
      "blur-2xl animate-ping";
    root.appendChild(burst);

    document.body.appendChild(root);
    const t = setTimeout(() => {
      document.body.removeChild(root);
    }, 650);
    return () => clearTimeout(t);
  }, [open, success]);

  if (!open) return null;

  const tone = success
    ? "from-emerald-500/15 via-emerald-400/10 to-transparent border-emerald-400/30"
    : "from-rose-500/15 via-rose-400/10 to-transparent border-rose-400/30";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div
        className={
          "relative w-full max-w-md rounded-2xl border bg-[#0b0f1a] " +
          "shadow-2xl overflow-hidden"
        }
      >
        {/* 헤더 */}
        <div
          className={
            "h-24 bg-gradient-to-br " + tone +
            " border-b"
          }
        />
        {/* 바디 */}
        <div className="p-6">
          <div className="flex items-start gap-4">
            <div
              className={
                "mt-1 inline-flex h-12 w-12 items-center justify-center rounded-full " +
                (success
                  ? "bg-emerald-500/15 text-emerald-300 ring-1 ring-emerald-400/30"
                  : "bg-rose-500/15 text-rose-300 ring-1 ring-rose-400/30")
              }
            >
              {success ? (
                // check
                <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M20 6L9 17l-5-5" />
                </svg>
              ) : (
                // x
                <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
              )}
            </div>

            <div className="flex-1">
              <h3 className="text-xl font-semibold tracking-tight">
                {success ? "합성 성공!" : "합성 실패"}
              </h3>
              <p className="mt-1 text-sm text-white/70">
                {success
                  ? `축하합니다. 신규 등급 ${grade ?? "-"} NFT가 발급되었습니다.`
                  : `아쉽게도 실패했어요. 시도에 사용된 조각${shardsSpent ? ` ${shardsSpent}개` : ""}은 소각됩니다.`}
              </p>
            </div>
          </div>

          <div className="mt-6 flex justify-end gap-2">
            <button
              onClick={onClose}
              className="px-4 h-10 rounded-lg border border-white/15 bg-white/[0.04] hover:bg-white/[0.07] text-sm font-medium"
            >
              확인
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}