"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import UpgradeResultModal from "@/components/ui/UpgradeResultModal";

import { useTx } from "@/hooks/useTx";
import { useOwnedAdv } from "@/hooks/useOwnedAdv";
import type { withSigner } from "@/lib/contracts";
import { ro } from "@/lib/contracts";
import { CFG } from "@/config";
import { Interface } from "ethers";

const upgIface = new Interface([
  "event UpgradeAttempt(address indexed user, uint8 fromGrade, bool success, uint8 newGrade)"
]);

type Props = {
  addr?: string;
  sc?: ReturnType<typeof withSigner>;
  onAfter?: () => Promise<void> | void; // 업그레이드 후 상위에서 대시보드/잔액 리프레시 등
};

type NeedMap = Record<number, number>;
type BpsMap  = Record<number, number>;

export default function UpgradePanel({ addr, sc, onAfter }: Props) {
  const { runTx, running } = useTx();
  const { loading, byGrade, refresh } = useOwnedAdv(addr);

  // 온체인 업그레이드 요구치/확률(등급별)
  const [needMap, setNeedMap] = useState<NeedMap>({});
  const [bpsMap,  setBpsMap]  = useState<BpsMap>({});

  // 선택 상태: grade -> 선택 tokenIds
  const [picked, setPicked] = useState<Record<number, bigint[]>>({});

  // 결과 모달
  const [resOpen, setResOpen]     = useState(false);
  const [resFrom, setResFrom]     = useState<number | undefined>();
  const [resSuccess, setResSuccess]= useState(false);
  const [resNew, setResNew]       = useState<number | undefined>();
  const [resBurned, setResBurned] = useState(0);

  // 등급 목록(보유 기준 + 소수 등급 대응)
  const grades = useMemo(() => {
    const gs = Object.keys(byGrade).map(Number).filter(g => g > 0);
    gs.sort((a, b) => a - b);
    return gs;
  }, [byGrade]);

  // 온체인 설정 로드(보유한 등급에 대해서만 조회)
  useEffect(() => {
    (async () => {
      if (!grades.length) { setNeedMap({}); setBpsMap({}); return; }
      const needEntries: [number, number][] = [];
      const bpsEntries:  [number, number][] = [];
      for (const g of grades) {
        try {
          const need = await ro.CORE.upgradeNeedCount(g);
          const bps  = await ro.CORE.upgradeSuccessBps(g);
          needEntries.push([g, Number(need)]);
          bpsEntries.push([g, Number(bps)]);
        } catch { /* 무시 */ }
      }
      setNeedMap(Object.fromEntries(needEntries));
      setBpsMap(Object.fromEntries(bpsEntries));
    })();
  }, [grades]);

  // 선택 토글
  const togglePick = useCallback((grade: number, tokenId: bigint) => {
    setPicked(prev => {
      const cur = prev[grade] ?? [];
      const has = cur.includes(tokenId);
      const next = has ? cur.filter(id => id !== tokenId) : [...cur, tokenId];
      return { ...prev, [grade]: next };
    });
  }, []);

  // 자동 선택(요구 수량만큼 가장 작은 id부터)
  const autoPick = useCallback((grade: number) => {
    const need = needMap[grade] ?? 0;
    const owned = (byGrade[grade] ?? []).slice().sort((a, b) => (a < b ? -1 : 1));
    const next = owned.slice(0, need);
    setPicked(prev => ({ ...prev, [grade]: next }));
  }, [byGrade, needMap]);

  // 선택 초기화
  const clearPick = useCallback((grade: number) => {
    setPicked(prev => ({ ...prev, [grade]: [] }));
  }, []);

  // 업그레이드 가능 여부
  const canUpgrade = useCallback((grade: number) => {
    const need = needMap[grade] ?? 0;
    const list = picked[grade] ?? [];
    return !!addr && !!sc && need > 0 && list.length === need;
  }, [addr, sc, picked, needMap]);

  // 업그레이드 실행
  const onUpgrade = useCallback(async (grade: number) => {
    if (!sc || !addr) return;
    const need = needMap[grade] ?? 0;
    const ids  = (picked[grade] ?? []).slice();
    if (!need || ids.length !== need) return;

    await runTx({
      label: `업그레이드 (G${grade} × ${need})`,
      send: () => sc.CORE.upgradeGrade(ids),
      after: async (rc) => {
        // CORE 로그만 파싱
        const coreAddr = CFG.addresses.CORE.toLowerCase();
        let success = false, newGrade = 0;
        for (const log of rc.logs) {
          if ((log as any).address?.toLowerCase?.() !== coreAddr) continue;
          try {
            const p = upgIface.parseLog({ topics: log.topics, data: log.data });
            if (p?.name === "UpgradeAttempt") {
              success  = Boolean(p.args.success);
              newGrade = Number(p.args.newGrade ?? 0);
              break;
            }
          } catch { /* skip */ }
        }
        // 결과 모달
        setResFrom(grade);
        setResBurned(need);
        setResSuccess(success);
        setResNew(success ? newGrade : undefined);
        setResOpen(true);

        // 새로고침
        await refresh();   // 보유 목록 갱신
        setPicked(prev => ({ ...prev, [grade]: [] }));
        await onAfter?.();
      }
    });
  }, [addr, sc, picked, needMap, runTx, refresh, onAfter]);

  return (
    <>
      <Card className="col-span-12 p-6 space-y-5">
        <header className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold">동일 등급 업그레이드</h2>
            <p className="text-sm text-white/70 mt-1">
              같은 등급 NFT를 <b>정해진 개수</b>만큼 선택해 소각하고, 확률에 따라 상위 등급 1장을 민팅합니다.
            </p>
          </div>
          <div className="text-right">
            <div className="text-xs text-white/50">지갑</div>
            <div className="text-sm break-all">{addr ?? "—"}</div>
          </div>
        </header>

        {/* 등급별 섹션 */}
        {!addr ? (
          <div className="mt-2 text-sm text-white/70">지갑을 연결해 주세요.</div>
        ) : loading ? (
          <div className="grid grid-cols-12 gap-3">
            <div className="col-span-12 h-14 rounded-lg bg-white/10 animate-pulse" />
            <div className="col-span-12 h-14 rounded-lg bg-white/10 animate-pulse" />
          </div>
        ) : grades.length === 0 ? (
          <div className="text-sm text-white/70">보유한 NFT가 없습니다.</div>
        ) : (
          <div className="space-y-6">
            {grades.map((g) => {
              const owned = byGrade[g] ?? [];
              const need  = needMap[g] ?? 0;
              const bps   = bpsMap[g] ?? 0;
              const sel   = picked[g] ?? [];

              return (
                <div key={g} className="rounded-xl border border-white/10 bg-white/[0.04] p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="text-sm">
                      <span className="text-white/60 mr-2">Grade</span>
                      <span className="font-semibold">G{g}</span>
                    </div>
                    <div className="text-right text-xs text-white/60">
                      필요 수량: <b className="text-white/90">{need || "-"}</b> ·
                      성공 확률: <b className="text-white/90">{(bps/100).toFixed(2)}%</b>
                    </div>
                  </div>

                  {/* 내 보유 토큰 목록 */}
                  <div className="flex flex-wrap gap-2">
                    {owned.length === 0 ? (
                      <span className="text-xs text-white/60">보유 없음</span>
                    ) : owned
                        .slice()
                        .sort((a, b) => (a < b ? -1 : 1))
                        .map((id) => {
                          const on = sel.includes(id);
                          return (
                            <button
                              key={String(id)}
                              onClick={() => togglePick(g, id)}
                              className={[
                                "px-3 py-1 rounded-full border text-sm tabular-nums transition",
                                on
                                  ? "border-violet-400/40 bg-violet-500/20 text-violet-50"
                                  : "border-white/12 bg-white/[0.06] text-white/90 hover:bg-white/[0.1]"
                              ].join(" ")}
                            >
                              #{String(id)}
                            </button>
                          );
                        })}
                  </div>

                  {/* 액션 라인 */}
                  <div className="flex items-center justify-between">
                    <div className="text-xs text-white/70">
                      선택: <b className="text-white/90">{sel.length}</b> /{" "}
                      <b className="text-white/90">{need || "-"}</b>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        className="btn-secondary px-4"
                        disabled={!owned.length || !need}
                        onClick={() => autoPick(g)}
                      >
                        자동 선택
                      </Button>
                      <Button
                        className="btn-secondary px-4"
                        disabled={!sel.length}
                        onClick={() => clearPick(g)}
                      >
                        선택 해제
                      </Button>
                      <Button
                        className={canUpgrade(g) ? "btn-primary px-6" : "btn-primary px-6 opacity-60 cursor-not-allowed"}
                        loading={running}
                        disabled={!canUpgrade(g)}
                        onClick={() => onUpgrade(g)}
                      >
                        업그레이드
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>

      {/* 결과 모달 */}
      <UpgradeResultModal
        open={resOpen}
        onClose={() => setResOpen(false)}
        fromGrade={resFrom}
        success={resSuccess}
        newGrade={resNew}
        burnedCount={resBurned}
      />
    </>
  );
}