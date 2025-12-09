"use client";
import { useState } from "react";
import { useApp } from "@/store/useApp";
import toast from "react-hot-toast";
import type { TransactionResponse, TransactionReceipt } from "ethers";

function short(s?: string){ return s ? `${s.slice(0,6)}...${s.slice(-4)}` : ""; }

type RunTxOpts<T> = {
  label: string;                                      // 예: "출석 받기"
  send: () => Promise<TransactionResponse>;           // 메타마스크 서명 → txResp
  after?: (rc: TransactionReceipt) => Promise<T> | T; // 선택: 추가 파싱/처리
  explorerBase?: string;                              // 예: https://explorer.example.com
};

export function useTx(){
  const [running, setRunning] = useState(false);
  const setTxBusy = useApp(s => s.setTxBusy);

  async function runTx<T = TransactionReceipt>({
    label,
    send,
    after,
    explorerBase = process.env.NEXT_PUBLIC_EXPLORER_BASE || "",
  }: RunTxOpts<T>) {
    let toastId: string | undefined;
    try {
      setRunning(true);

      // 1) 지갑 확인 대기
      toastId = toast.loading(`${label}: 지갑 확인 중…`);

      // 2) 트랜잭션 전송(사용자 서명)
      const tx = await send();
      toast.dismiss(toastId);
      toastId = toast.loading(`${label}: 전송됨 • ${short(tx.hash)}`, { duration: 60_000 });

      // 전역 오버레이 on
      setTxBusy(true, `${label} 처리중…`, tx.hash);


    // 3) 컨펌 대기: 0컨펌(블록에 포함되는 즉시)
    let rc = await tx.wait(0);
    // 일부 Provider가 드물게 null 주면 보강
    if (!rc) {
        const p: any = (tx as any).provider ?? (send as any)?.runner?.provider;
        if (p?.waitForTransaction) {
        rc = await p.waitForTransaction(tx.hash, 0);
        }
    }

      // null 가드: 타임아웃/드랍/리오그 등으로 영수증을 못 받았을 수 있음
      if (rc == null) {
        toast.dismiss(toastId);
        toast.error(`${label}: 네트워크에서 영수증을 받지 못했습니다. 잠시 후 다시 확인하세요.`);
        throw new Error("RECEIPT_NULL");
      }

      // 4) 결과 처리 (status: number | null → number 비교)
      const ok = rc.status == null ? true : rc.status === 1;

      toast.dismiss(toastId);
      if (ok) {
        toast.success(`${label}: 완료 • ${short(tx.hash)}`, { duration: 4000 });
      } else {
        toast.error(`${label}: 실패 • ${short(tx.hash)}`, { duration: 6000 });
      }

      const out = after ? await after(rc) : (rc as unknown as T);
      return out;
    } catch (e: any) {
      toast.dismiss(toastId);
      const msg = e?.code === 4001
        ? "사용자가 서명을 취소했습니다."
        : (e?.shortMessage || e?.reason || e?.message || "알 수 없는 오류");
      toast.error(msg, { duration: 5000 });
      throw e;
    } finally {
      setRunning(false);
      setTxBusy(false); // 전역 오버레이 off
    }
  }

  return { runTx, running };
}