"use client";
import { useEffect, useState, useCallback } from "react";
import { ro } from "@/lib/contracts";   // read-only 컨트랙트 (ATT 연결돼 있어야 함)
import { formatUnits } from "ethers";

export function useAttBalance(addr?: string) {
  const [raw, setRaw] = useState<bigint>(BigInt(0));
  const [fmt, setFmt] = useState<string>("0");

  const refresh = useCallback(async () => {
    if (!addr) { setRaw(BigInt(0)); setFmt("0"); return; }
    const v: bigint = await ro.ATT.balanceOf(addr);
    setRaw(v);
    setFmt(formatUnits(v, 18)); // 18dec 기준
  }, [addr]);

  useEffect(() => { void refresh(); }, [refresh]);

  return { raw, formatted: fmt, refresh };
}