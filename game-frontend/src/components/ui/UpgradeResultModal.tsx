"use client";

type Props = {
  open: boolean;
  onClose: () => void;
  fromGrade?: number;
  success: boolean;
  newGrade?: number;
  burnedCount: number;
};

export default function UpgradeResultModal({ open, onClose, fromGrade, success, newGrade, burnedCount}: Props) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black/60">
      <div className="w-full max-w-md rounded-2xl border border-white/10 bg-zinc-900 p-6 shadow-2xl">
        <h3 className="text-xl font-semibold">
          {success ? "업그레이드 성공" : "업그레이드 실패"}
        </h3>

        <div className="mt-3 rounded-xl border border-white/10 bg-white/[0.04] p-4 space-y-2 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-white/70">소각된 동일 등급</span>
            <span className="font-semibold">G{fromGrade ?? "-"}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-white/70">소각 수량</span>
            <span className="font-semibold tabular-nums">{burnedCount}개</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-white/70">결과</span>
            <span className={`font-semibold ${success ? "text-emerald-300" : "text-rose-300"}`}>
              {success ? `G${newGrade} NFT 1개 민팅` : "실패(보상 없음)"}
            </span>
          </div>
        </div>

        <div className="mt-6 flex justify-end">
          <button className="btn btn-primary px-5 h-10 text-[15px]" onClick={onClose}>
            확인
          </button>
        </div>
      </div>
    </div>
  );
}