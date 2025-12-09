"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { ro } from "@/lib/contracts";

export type ExpStatus = {
  active: boolean;
  owner: string;
  grade: number;
  secondsNeeded: number;
  endTime: number;
  remaining: number;
  claimable: boolean;
};

const empty: ExpStatus = {
  active: false, owner: "0x", grade: 0, secondsNeeded: 0, endTime: 0, remaining: 0, claimable: false,
};

export function useExpedition(tokenId?: bigint) {
  const [st, setSt] = useState<ExpStatus>(empty);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const refresh = useCallback(async () => {
    if (!tokenId) { setSt(empty); return; }
    const r = await ro.CORE.getExpeditionStatus(tokenId);
    setSt({
      active: Boolean(r[0]),
      owner: String(r[1]),
      grade: Number(r[2]),
      secondsNeeded: Number(r[3]),
      endTime: Number(r[4]),
      remaining: Number(r[6]),
      claimable: Boolean(r[7]),
    });
  }, [tokenId]);

  useEffect(() => {
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
    void refresh();
    timerRef.current = setInterval(() => {
      setSt(prev => {
        if (!prev.active || !prev.endTime) return prev;
        const now = Math.floor(Date.now()/1000);
        const rem = Math.max(0, prev.endTime - now);
        return { ...prev, remaining: rem, claimable: prev.active && rem === 0 };
      });
    }, 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [refresh]);

  return { ...st, refresh };
}