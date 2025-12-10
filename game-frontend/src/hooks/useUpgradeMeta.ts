"use client";
import { useCallback, useEffect, useState } from "react";
import { ro } from "@/lib/contracts";

export type UpgradeMeta = {
  loading: boolean;
  needByGrade: Record<number, number>;  // g -> 필요 수량
  bpsByGrade: Record<number, number>;   // g -> 성공확률 bps
  maxGrade: number;                     // 가이드/라벨 표시에 사용
};

const empty: UpgradeMeta = { loading: true, needByGrade: {}, bpsByGrade: {}, maxGrade: 5 };

export function useUpgradeMeta() {
  const [st, setSt] = useState<UpgradeMeta>(empty);

  const refresh = useCallback(async () => {
    setSt((s) => ({ ...s, loading: true }));
    try {
      // 일반적으로 1~4 또는 1~5 범위. 필요 범위는 운영 상수에 맞게 넉넉히 조회.
      const grades = [1,2,3,4,5];
      const needByGrade: Record<number, number> = {};
      const bpsByGrade : Record<number, number> = {};
      for (const g of grades) {
        try {
          const need = await ro.CORE.upgradeNeedCount(g);
          const bps  = await ro.CORE.upgradeSuccessBps(g);
          if (Number(need) > 0 || Number(bps) > 0) {
            needByGrade[g] = Number(need);
            bpsByGrade[g]  = Number(bps);
          }
        } catch {}
      }
      const maxGrade = Math.max(0, ...Object.keys(needByGrade).map(Number)) + 1 || 5;
      setSt({ loading: false, needByGrade, bpsByGrade, maxGrade });
    } catch {
      setSt(empty);
    }
  }, []);

  useEffect(() => { void refresh(); }, [refresh]);

  return { ...st, refresh };
}