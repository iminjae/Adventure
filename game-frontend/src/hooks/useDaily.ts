"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { Contract, formatUnits } from "ethers";
import { CFG } from "@/config";
import COREABI from "@/abi/CORE.json";
import { ro } from "@/lib/contracts";

// (폴백 계산은 남겨둠 — 실패 시 '버튼이 아예 막히는' 일을 피함)
function kstNextMidnight(nowSec: number) {
  const todayKST = Math.floor((nowSec + 9 * 3600) / 86400);
  return (todayKST + 1) * 86400 - 9 * 3600;
}

type DailyState = {
  loading: boolean;   // 첫 로딩에만 true로 쓰고, 이후엔 soft refresh로 깜빡임 방지
  hydrated: boolean;  // 최소 1회 온체인 값을 받았는지
  claimable: boolean;
  nextAt: number;
  remaining: number;
  dailyAmt: string;
};

const init: DailyState = {
  loading: true,
  hydrated: false,
  claimable: false,
  nextAt: 0,
  remaining: 0,
  dailyAmt: "0",
};

export function useDaily(addr?: string) {
  const [st, setSt] = useState<DailyState>(init);
  const reqIdRef = useRef(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ✅ provider와 soft 옵션 지원: soft=true면 loading 토글 안 함(깜빡임 제거)
  const refresh = useCallback(
    async (opts?: { provider?: any; soft?: boolean }) => {
      if (!addr) { setSt(init); return; }
      const myReq = ++reqIdRef.current;

      setSt(s => (opts?.soft || s.hydrated) ? s : { ...s, loading: true });

      try {
        const prov =
          opts?.provider ??
          (ro as any).CORE?.runner?.provider ??
          (ro as any).ATT?.runner?.provider;

        const CORE = new Contract(CFG.addresses.CORE, COREABI, prov);
        const [amt, status] = await Promise.all([
          CORE.dailyAmount(),
          CORE.getDailyStatus(addr),
        ]);
        if (reqIdRef.current !== myReq) return;

        setSt({
          loading: false,
          hydrated: true,
          claimable: Boolean(status.claimable),
          nextAt: Number(status.nextClaimAt),
          remaining: Math.max(0, Number(status.remaining)),
          dailyAmt: formatUnits(amt, 18),
        });
      } catch {
        if (reqIdRef.current !== myReq) return;
        // 실패해도 첫 페인트를 막진 않음
        const now = Math.floor(Date.now() / 1000);
        const na = kstNextMidnight(now);
        setSt({
          loading: false,
          hydrated: true,
          claimable: true,
          nextAt: na,
          remaining: Math.max(0, na - now),
          dailyAmt: st.dailyAmt || "0",
        });
      }
    },
    [addr]
  );

  // 주소 바뀔 때: 타이머 정리 → 상태 초기화 → 1회 강제 로드 → 초당 남은시간 갱신
  useEffect(() => {
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
    reqIdRef.current++;
    setSt(init);

    if (!addr) return;

    void refresh();

    timerRef.current = setInterval(() => {
      setSt(prev => {
        if (!prev.hydrated || !prev.nextAt) return prev;
        const now = Math.floor(Date.now() / 1000);
        const rem = Math.max(0, prev.nextAt - now);
        // 0 도달 시 깜빡임 없이 soft refresh
        if (rem === 0) { void refresh({ soft: true }); }
        return { ...prev, remaining: rem };
      });
    }, 1000);

    return () => {
      if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
    };
  }, [addr]);

  return {
    loading: st.loading,
    hydrated: st.hydrated,
    claimable: st.claimable,
    nextAt: st.nextAt,
    remaining: st.remaining,
    dailyAmt: st.dailyAmt,
    refresh, // provider/soft 주입 가능
  };
}