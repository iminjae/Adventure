"use client";
import { useEffect, useState } from "react";
import { ro } from "@/lib/contracts";
import { formatUnits } from "ethers";

export function useDashboard(addr?: string) {
  const [loading, setLoading] = useState(false);
  const [att, setAtt] = useState<string>("0");
  const [frg, setFrg] = useState<string>("0");
  const [nftCount, setNftCount] = useState<number>(0);
  const [dailyAmt, setDailyAmt] = useState<string>("0");
  const [fragPrice, setFragPrice] = useState<string>("0");
  const [needForCraft, setNeedForCraft] = useState<string>("0");

  async function refresh() {
    if (!addr) return;
    setLoading(true);
    try {
      const [attBal, frgBal, advCnt, d, p, need] = await Promise.all([
        ro.ATT.balanceOf(addr),
        ro.FRG.balanceOf(addr, 1),
        ro.ADV.balanceOf(addr),
        ro.CORE.dailyAmount(),
        ro.CORE.fragmentPriceATT(),
        ro.CORE.fragmentsToCraft(),
      ]);
      setAtt(formatUnits(attBal, 18));
      setFrg(frgBal.toString());
      setNftCount(Number(advCnt));
      setDailyAmt(formatUnits(d, 18));
      setFragPrice(formatUnits(p, 18));
      setNeedForCraft(need.toString());
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { refresh(); }, [addr]);

  return { loading, att, frg, nftCount, dailyAmt, fragPrice, needForCraft, refresh };
}