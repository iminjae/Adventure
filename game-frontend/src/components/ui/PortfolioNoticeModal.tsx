"use client";

type Props = {
  open: boolean;
  onClose: () => void;
  telegram?: string; // 예: "https://t.me/your_handle" 또는 "@your_handle"
};

export default function PortfolioNoticeModal({ open, onClose, telegram }: Props) {
  if (!open) return null;

  // 링크 문자열 정리
  const tg = telegram || (process.env.NEXT_PUBLIC_TG_CONTACT as string) || "https://t.me/your_handle";
  const tgLabel = tg.startsWith("http") ? tg.replace(/^https?:\/\//, "") : tg;

  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black/60">
      <div role="dialog" aria-modal="true"
           className="w-full max-w-md rounded-2xl border border-white/10 bg-zinc-900 p-6 shadow-2xl">
        <h3 className="text-xl font-semibold">안내: 포트폴리오용 데모</h3>
        <p className="mt-3 text-sm text-white/85 leading-relaxed">
          이 서비스는 개발 포트폴리오용 데모입니다. 발행되는 토큰/NFT는 테스트 성격이며
          금전적 가치나 보상을 보장하지 않습니다. 버그 제보‧문의 그외 궁금하신점은 텔레그램으로 부탁드립니다.
        </p>

        <div className="mt-4 rounded-xl border border-white/10 bg-white/[0.04] p-4 text-sm">
          <div className="text-white/70">문의</div>
          <a className="mt-1 inline-flex items-center gap-2 text-violet-300 hover:underline"
             href={tg.startsWith("http") ? tg : `https://t.me/${tg.replace(/^@/, "")}`}
             target="_blank" rel="noreferrer">
            {tgLabel}
          </a>
        </div>

        <div className="mt-6 flex items-center justify-end gap-2">
          <button
            onClick={() => {
              // 오늘/이후 다시 보지 않기(영구)
              try { localStorage.setItem("portfolio.notice.dismissed.v1", "1"); } catch {}
              onClose();
            }}
            className="px-4 h-10 text-[14px] rounded-lg border border-white/15 bg-white/[0.06] hover:bg-white/[0.1]"
          >
            다시 보지 않기
          </button>
          <button
            onClick={() => {
              try { localStorage.setItem("portfolio.notice.dismissed.v1", "1"); } catch {}
              onClose();
            }}
            className="btn btn-primary px-5 h-10 text-[15px]"
          >
            확인
          </button>
        </div>
      </div>
    </div>
  );
}