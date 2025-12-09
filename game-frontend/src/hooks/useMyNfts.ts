"use client";
import { useEffect, useState } from "react";
import { ro } from "@/lib/contracts";

export type MyNft = {
  id: bigint;
  grade: number;
  locked: boolean;
};

export function useMyNfts(addr?: string) {
  const [loading, setLoading] = useState(false);
  const [list, setList] = useState<MyNft[]>([]);

  async function refresh() {
    if (!addr) { setList([]); return; }
    setLoading(true);
    try {
      const n = await ro.ADV.balanceOf(addr);
      const count = Number(n);
      const ids: Promise<bigint>[] = [];
      for (let i = 0; i < count; i++) ids.push(ro.ADV.tokenOfOwnerByIndex(addr, i));
      const tokenIds = await Promise.all(ids);

      const metas = await Promise.all(tokenIds.map(async (id) => {
        const [g, l] = await Promise.all([
          ro.ADV.gradeOf(id),
          ro.ADV.locked(id),
        ]);
        return { id, grade: Number(g), locked: Boolean(l) };
      }));

      setList(metas);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { void refresh(); }, [addr]);

  return { loading, list, refresh };
}