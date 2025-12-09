"use client";
import { useEffect, useState } from "react";
import { ro } from "@/lib/contracts";
import { formatUnits } from "ethers";
import { Contract } from "ethers";
import { CFG } from "@/config";
import ATTABI from "@/abi/ATT.json";
import FRGABI from "@/abi/FRG.json";
import ADVABI from "@/abi/ADV.json";
import COREABI from "@/abi/CORE.json";

export function useDashboard(addr?: string) {
  const [loading, setLoading] = useState(false);
  const [att, setAtt] = useState<string>("0");
  const [frg, setFrg] = useState<string>("0");
  const [nftCount, setNftCount] = useState<number>(0);
  const [dailyAmt, setDailyAmt] = useState<string>("0");
  const [fragPrice, setFragPrice] = useState<string>("0");
  const [needForCraft, setNeedForCraft] = useState<string>("0");

  async function refresh(opts?: { provider?: any }) {
    if (!addr) return;
    setLoading(true);
    try {
      
        const prov =
          opts?.provider
          ?? (ro as any).CORE?.runner?.provider
          ?? (ro as any).ATT?.runner?.provider;

      // ✅ 같은 Provider로 직접 컨트랙트 인스턴스 구성(캐시/지연 우회)
      const cATT  = new Contract(CFG.addresses.ATT,  ATTABI,  prov);
      const cFRG  = new Contract(CFG.addresses.FRG,  FRGABI,  prov);
      const cADV  = new Contract(CFG.addresses.ADV,  ADVABI,  prov);
      const cCORE = new Contract(CFG.addresses.CORE, COREABI, prov);

      const [attBal, frgBal, advCnt, d, p, need] = await Promise.all([
        cATT.balanceOf(addr),
        cFRG.balanceOf(addr, 1),
        cADV.balanceOf(addr),
        cCORE.dailyAmount(),
        cCORE.fragmentPriceATT(),
        cCORE.fragmentsToCraft(),
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