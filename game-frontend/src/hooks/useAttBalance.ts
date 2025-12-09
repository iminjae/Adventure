// src/hooks/useAttBalance.ts
"use client";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Contract, formatUnits, JsonRpcProvider } from "ethers";
import ATTABI from "@/abi/ATT.json";
import { CFG } from "@/config";
import { ro } from "@/lib/contracts";

type RefreshOpts = { provider?: any };

export function useAttBalance(addr?: string) {
  const [raw, setRaw] = useState<bigint>(BigInt(0));
  const [loading, setLoading] = useState(false);
  const formatted = useMemo(() => formatUnits(raw, 18), [raw]);

  const refresh = useCallback(async (opts?: RefreshOpts) => {
    if (!addr) { setRaw(BigInt(0)); return; }
    setLoading(true);
    try {

      const prov = opts?.provider ?? (ro as any).ATT.runner?.provider;
      const c = new Contract(CFG.addresses.ATT, ATTABI, prov);
      const v: bigint = await c.balanceOf(addr);
      setRaw(v);
    } finally {
      setLoading(false);
    }
  }, [addr]);


  const bump = useCallback((delta: bigint) => {
    setRaw((prev) => prev + (delta ?? BigInt(0)));
  }, []);

  // 주소 바뀌면 1회 로드(선택)
  useEffect(() => { void refresh(); }, [refresh]);

  return { raw, formatted, loading, refresh, bump, setRaw };
}