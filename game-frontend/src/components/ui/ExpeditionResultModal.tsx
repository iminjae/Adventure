"use client";

type Props = {
  open: boolean;
  onClose: () => void;
  rewardATT: string;   // 예: "7"
  fragDrop: boolean;   // 조각 드랍 여부
  tokenId?: string;    // 선택
};

export default function ExpeditionResultModal({ open, onClose, rewardATT, fragDrop, tokenId }: Props) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black/60">
      <div className="w-full max-w-md rounded-2xl border border-white/10 bg-zinc-900 p-6 shadow-2xl">
        <h3 className="text-xl font-semibold">탐험 보상 수령</h3>
        <p className="mt-2 text-white/80 text-sm">
          {tokenId ? <>NFT #{tokenId}의 탐험이 종료되었습니다.</> : <>탐험이 종료되었습니다.</>}
        </p>

        <div className="mt-4 rounded-xl border border-white/10 bg-white/[0.04] p-4">
          <div className="flex items-center justify-between text-sm">
            <span className="text-white/70">ATT 보상</span>
            <span className="font-semibold tabular-nums">{rewardATT} ATT</span>
          </div>
          <div className="mt-2 flex items-center justify-between text-sm">
            <span className="text-white/70">조각 드랍</span>
            <span className={`font-semibold ${fragDrop ? "text-emerald-300" : "text-white/80"}`}>
              {fragDrop ? "1개 드랍" : "없음"}
            </span>
          </div>
        </div>

        <div className="mt-6 flex justify-end">
          <button
            onClick={onClose}
            className="btn btn-primary px-5 h-10 text-[15px]"
          >
            확인
          </button>
        </div>
      </div>
    </div>
  );
}