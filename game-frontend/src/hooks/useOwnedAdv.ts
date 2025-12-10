// src/hooks/useOwnedAdv.ts
"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import { fetchOwnedByEnumerable, fetchGradesFor } from "@/lib/fetchOwned";

type ByGrade = Record<number, bigint[]>;

export function useOwnedAdv(addr?: string) {
  const [loading, setLoading] = useState(false);
  const [ids, setIds] = useState<bigint[]>([]);
  const [grades, setGrades] = useState<Map<bigint, number>>(new Map());

  const refresh = useCallback(async () => {
    if (!addr) {
      setIds([]);
      setGrades(new Map());
      return;
    }
    setLoading(true);
    try {
      // 1) 보유 토큰 나열
      const owned = await fetchOwnedByEnumerable(addr);
      setIds(owned);

      // 2) 등급 조회
      const m = await fetchGradesFor(owned);
      setGrades(m);
    } finally {
      setLoading(false);
    }
  }, [addr]);

  useEffect(() => { void refresh(); }, [refresh]);

  // grade 기준 그룹핑 (UI에서 바로 쓰기 좋게)
  const byGrade: ByGrade = useMemo(() => {
    const g: ByGrade = {};
    for (const id of ids) {
      const gr = grades.get(id) ?? 0;
      if (!g[gr]) g[gr] = [];
      g[gr].push(id);
    }
    return g;
  }, [ids, grades]);

  return { loading, ids, grades, byGrade, refresh };
}