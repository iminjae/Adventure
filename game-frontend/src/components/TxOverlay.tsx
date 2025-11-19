"use client";
import Link from "next/link";
import Spinner from "@/components/ui/Spinner";
import { useApp } from "@/store/useApp";

export default function TxOverlay(){
  const txBusy = useApp(s => s.txBusy);
  const txLabel = useApp(s => s.txLabel);
  const txHash = useApp(s => s.txHash);

  if (!txBusy) return null;

  const base = process.env.NEXT_PUBLIC_EXPLORER_BASE;
  const href = base && txHash ? `${base}/tx/${txHash}` : undefined;

  return (
    <>
      <div className="fixed top-0 left-0 right-0 z-[70] h-1 overflow-hidden bg-black/20">
        <div
          className="h-full w-1/3 bg-gradient-to-r from-primary to-primary-600"
          style={{ animation: "txbar 1.4s linear infinite" }}
        />
      </div>
      <div className="fixed inset-0 z-[69] flex items-center justify-center pointer-events-none">
        <div className="pointer-events-auto card p-4 backdrop-blur-md bg-black/60 border border-white/10">
          <div className="flex items-center gap-3">
            <Spinner />
            <div className="text-sm">
              <div className="font-medium">{txLabel || "트랜잭션 처리중…"}</div>
              {href ? (
                <Link href={href} target="_blank" className="text-xs text-primary-300 underline">
                  탐색기에서 보기
                </Link>
              ) : (
                <div className="text-xs text-white/70">메타마스크/네트워크 확인중</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}