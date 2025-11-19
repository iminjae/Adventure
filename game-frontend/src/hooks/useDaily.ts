"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { ro } from "@/lib/contracts";
import { formatUnits } from "ethers";

// KST(+9) 자정 계산
function kstNextMidnight(nowSec: number) {
  const todayKST = Math.floor((nowSec + 9 * 3600) / 86400);
  return (todayKST + 1) * 86400 - 9 * 3600;
}

type DailyState = {
  loading: boolean;
  claimable: boolean;
  nextAt: number;   // unix
  remaining: number;
  dailyAmt: string; // formatted
};

const empty: DailyState = {
  loading: false,
  claimable: false,
  nextAt: 0,
  remaining: 0,
  dailyAmt: "0",
};

export function useDaily(addr?: string) {
  const [st, setSt] = useState<DailyState>(empty);

  // 🔒 현재 주소 기준으로만 상태 반영하도록 하는 "요청 토큰"
  const reqIdRef = useRef(0);
  // ⏱️ 인터벌 핸들
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // 주소별 새로고침 (이 주소로 시작된 요청만 반영)
  const refresh = useCallback(async () => {
    if (!addr) return;
    const myReq = ++reqIdRef.current; // 새 요청 토큰
    setSt((s) => ({ ...s, loading: true }));

    try {
      // 금액은 지갑에 상관없이 동일(프로토콜 파라미터)
      const amt = await ro.CORE.dailyAmount();

      // 주소별 상태
      const status = await ro.CORE.getDailyStatus(addr);

      // 🧵 주소가 바뀌어 더 최신 요청이 있으면 이 결과는 버림
      if (reqIdRef.current !== myReq) return;

      const dailyAmt = formatUnits(amt, 18);
      const nextAt = Number(status.nextClaimAt);
      const remaining = Number(status.remaining);

      setSt({
        loading: false,
        claimable: Boolean(status.claimable),
        nextAt,
        remaining,
        dailyAmt,
      });
    } catch {
      // 폴백: 뷰 함수가 없거나 실패해도 UI가 막히지 않게
      if (reqIdRef.current !== myReq) return;
      const now = Math.floor(Date.now() / 1000);
      const na = kstNextMidnight(now);
      setSt({
        loading: false,
        claimable: true, // 낙관적으로 눌러보게
        nextAt: na,
        remaining: Math.max(0, na - now),
        dailyAmt: st.dailyAmt || "0",
      });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [addr]);

  // 주소가 바뀌면: (1) 모든 이전 타이머 종료 (2) 상태 초기화 (3) 새로고침 (4) 새 타이머 시작
  useEffect(() => {
    // 이전 인터벌 정리
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    // 이전 요청 무효화
    reqIdRef.current++;

    // 상태 초기화(주소 전환 즉시 과거 값 지우기)
    setSt(empty);

    if (!addr) return;

    // 즉시 한 번 로드
    refresh();

    // 새 인터벌: 현재 상태 기반으로만 남은 시간 갱신
    timerRef.current = setInterval(() => {
      setSt((prev) => {
        if (!prev.nextAt) return prev;
        const now = Math.floor(Date.now() / 1000);
        const rem = Math.max(0, prev.nextAt - now);
        // claimable은 컨트랙트 판단 우선. 단, 자정을 지나면 true로 전환.
        const claimable = prev.claimable || rem === 0;
        return { ...prev, remaining: claimable ? 0 : rem, claimable };
      });
    }, 1000);

    // 언마운트/주소 변경 시 정리
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [addr, refresh]);

  return {
    loading: st.loading,
    claimable: st.claimable,
    nextAt: st.nextAt,
    remaining: st.remaining,
    dailyAmt: st.dailyAmt,
    refresh,
  };
}