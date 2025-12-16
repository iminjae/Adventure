// src/hooks/useTx.ts
"use client";

import { useState } from "react";
import { useApp } from "@/store/useApp";
import toast from "react-hot-toast";
import {
  BrowserProvider,
  JsonRpcProvider,
  type TransactionResponse,
  type TransactionReceipt,
} from "ethers";

function short(s?: string) {
  return s ? `${s.slice(0, 6)}...${s.slice(-4)}` : "";
}

type RunTxOpts<T> = {
  label: string;                                      // 예: "출석 받기"
  send: () => Promise<TransactionResponse>;           // 메타마스크 서명 → txResp
  after?: (rc: TransactionReceipt) => Promise<T> | T; // 선택: 추가 파싱/처리(영수증 필요할 때)
  explorerBase?: string;                              // 예: https://explorer.example.com
  onSubmitted?: (hash: string) => void;               // 전송 직후 콜백(해시 기반 UI)
  waitConfirmations?: number;                         // 기본 0 (즉시)
  receiptTimeoutMs?: number;                          // 폴백 폴링 총 시간(기본 12s)
  receiptIntervalMs?: number;                         // 폴백 폴링 주기(기본 1s)
};

// 중복 제거용
function uniq<T>(arr: (T | undefined | null)[]) {
  const out: T[] = [];
  for (const v of arr) {
    if (!v) continue;
    if (!out.includes(v)) out.push(v);
  }
  return out;
}

// 환경에서 추가 RPC를 만들어 후보에 넣음
function buildProviderCandidates(tx: TransactionResponse) {
  const list: any[] = [];

  // 1) 트랜잭션이 사용한 프로바이더(가장 신선)
  const signerProv = (tx as any).provider;
  if (signerProv) list.push(signerProv);

  // 2) 브라우저 지갑 프로바이더(있다면)
  if (typeof window !== "undefined" && (window as any).ethereum) {
    try {
      const bp = new BrowserProvider((window as any).ethereum);
      list.push(bp);
    } catch {}
  }

  // 3) 환경변수 RPC
  const url = process.env.NEXT_PUBLIC_RPC_URL || process.env.NEXT_PUBLIC_RPC_HTTP || "";
  if (url) {
    try {
      list.push(new JsonRpcProvider(url));
    } catch {}
  }

  return uniq(list);
}

async function pollReceipts(
  hash: string,
  providers: any[],
  timeoutMs = 12_000,
  intervalMs = 1_000
): Promise<TransactionReceipt | null> {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    for (const p of providers) {
      try {
        const rc = await p?.getTransactionReceipt?.(hash);
        if (rc) return rc as TransactionReceipt;
      } catch {}
    }
    await new Promise((r) => setTimeout(r, intervalMs));
  }
  return null;
}

export function useTx() {
  const [running, setRunning] = useState(false);
  const setTxBusy = useApp((s) => s.setTxBusy);

  async function runTx<T = TransactionReceipt>({
    label,
    send,
    after,
    explorerBase = process.env.NEXT_PUBLIC_EXPLORER_BASE || "",
    onSubmitted,
    waitConfirmations = 0,
    receiptTimeoutMs = 45_000,
    receiptIntervalMs = 1_500,
  }: RunTxOpts<T>): Promise<T> {
    let toastId: string | undefined;
    try {
      setRunning(true);

      // 1) 지갑 확인
      toastId = toast.loading(`${label}: 지갑 확인 중…`);

      // 2) 전송
      const tx = await send();

      toast.dismiss(toastId);
      toastId = toast.loading(`${label}: 전송됨 • ${short(tx.hash)}`, { duration: 60_000 });

      onSubmitted?.(tx.hash);
      setTxBusy(true, `${label} 처리중…`, tx.hash);

      // 3) 컨펌 대기 (즉시 포함 기준: 0컨펌)
      let rc: TransactionReceipt | null = null;
      try {
        rc = await tx.wait(waitConfirmations);
      } catch {
        // 무시하고 폴백 수행
      }

      // 4) 폴백: 영수증 직접 폴링 (사이너/지갑/RPC 후보 모두 시도)
      if (!rc) {
        const candidates = buildProviderCandidates(tx);
        rc = await pollReceipts(tx.hash, candidates, receiptTimeoutMs, receiptIntervalMs);
      }

      // 5) 영수증 없으면 “전송됨 · 곧 반영”으로 종료(에러 아님)
      if (!rc) {
        toast.dismiss(toastId);
        toast.success(`${label}: 전송됨 · 곧 반영됩니다.`, { duration: 4000 });
        // after는 영수증이 필요하므로 호출하지 않음
        // 타입 유지 위해 undefined를 강제 캐스팅
        return undefined as unknown as T;
      }

      // 6) 결과 처리
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
      const msg =
        e?.code === 4001
          ? "사용자가 서명을 취소했습니다."
          : e?.shortMessage || e?.reason || e?.message || "알 수 없는 오류";
      toast.error(msg, { duration: 5000 });
      throw e;
    } finally {
      setRunning(false);
      setTxBusy(false);
    }
  }

  return { runTx, running };
}