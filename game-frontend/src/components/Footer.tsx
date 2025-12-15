// src/components/Footer.tsx
import Link from "next/link";

const BRAND = "Adventure";
const TG_URL = "https://t.me/mantaminjae";

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="mt-12 border-t border-white/10 bg-gradient-to-b from-zinc-950 to-zinc-900">
      <div className="mx-auto max-w-7xl px-5 py-10 grid grid-cols-12 gap-6">
        <div className="col-span-12 md:col-span-12 space-y-3">
          <div className="flex items-center gap-2">
            <span className="text-lg font-semibold">{BRAND}</span>
            <span className="text-[11px] px-2 py-1 rounded-full border border-white/15 bg-white/[0.06] text-white/80">
              Portfolio Demo
            </span>
          </div>
          <p className="text-sm text-white/70 leading-relaxed">
            본 서비스는 <b>포트폴리오 데모</b>입니다. 표시되는 토큰·NFT는 <b>금전적 가치가 없습니다</b>.
            테스트/시연 목적으로만 사용해 주세요.
          </p> 

          <div className="flex items-center gap-2">
            <a
              href={TG_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-lg border border-sky-400/30 bg-sky-500/10 px-3 py-2 text-sm text-sky-100 hover:bg-sky-500/15"
              aria-label="Telegram 문의하기"
            >
                문의 :
              <svg width="16" height="16" viewBox="0 0 24 24" className="opacity-90" fill="currentColor" aria-hidden="true">
                <path d="M9.036 15.804 8.87 19.5a.75.75 0 0 0 1.23.58l2.94-2.44 4.9 3.53a1 1 0 0 0 1.56-.64l2.48-13.2a1 1 0 0 0-1.35-1.13L3.3 10.06a.75.75 0 0 0 .02 1.41l4.73 1.66 8.77-5.46-7.78 8.13Z"/>
              </svg>
              Telegram @mantaminjae
            </a>
          </div>
        </div>
      </div>

      <div className="border-t border-white/10">
        <div className="mx-auto max-w-7xl px-5 py-4 text-xs text-white/55 flex items-center justify-between">
          <span>© {year} {BRAND}. All rights reserved.</span>
        </div>
      </div>
    </footer>
  );
}