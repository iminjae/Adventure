"use client";

import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import SuccessModal from "@/components/ui/SuccessModal";
import CountdownBadge from "@/components/ui/CountdownBadge";
import ExpeditionResultModal from "@/components/ui/ExpeditionResultModal";
import { CFG } from "@/config";

import { useExpedition } from "@/hooks/useExpedition";
import { useTx } from "@/hooks/useTx";
import type { withSigner } from "@/lib/contracts";
import { ro } from "@/lib/contracts";
import { Interface, formatUnits } from "ethers";
import { useEffect, useMemo, useState } from "react";

const expIface = new Interface([
  "event ExpeditionClaimed(address indexed user, uint256 indexed tokenId, uint256 attReward, bool fragDrop)"
]);

type Props = {
  addr?: string;
  sc?: ReturnType<typeof withSigner>;
  tokenId: bigint;
  grade: number;
  locked: boolean;
  onAfter?: () => Promise<void> | void; // 상위 리프레시(dash/att 등)
  onResult?: (r: { tokenId: string; rewardATT: string; fragDrop: boolean }) => void;
};

function fmtKST(tsSec: number) {
  if (!tsSec) return "";
  const d = new Date((tsSec + 9 * 3600) * 1000); // KST(+9) 보정
  // YYYY-MM-DD HH:mm 기준
  const yyyy = d.getUTCFullYear();
  const mm = String(d.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(d.getUTCDate()).padStart(2, "0");
  const HH = String(d.getUTCHours()).padStart(2, "0");
  const MM = String(d.getUTCMinutes()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd} ${HH}:${MM} (KST)`;
}

export default function ExpeditionCard({ addr, sc, tokenId, grade, locked, onAfter, onResult }: Props) {
  const { runTx, running } = useTx();
  const st = useExpedition(tokenId);

  // 탐험 시작/보상 수령 모달
  const [startOpen, setStartOpen]   = useState(false);
  const [startMsg, setStartMsg]     = useState("");

  // 등급별 탐험 설정
  const [conf, setConf] = useState<{sec:number; min:number; max:number; bps:number}>({sec:0,min:0,max:0,bps:0});
  useEffect(() => {
    (async () => {
      try {
        const c = await ro.CORE.expeditionOf(grade);
        setConf({ sec: Number(c[0]), min: Number(c[1]), max: Number(c[2]), bps: Number(c[3]) });
      } catch {}
    })();
  }, [grade]);

  const canStart  = useMemo(() => !!addr && !!sc && !st.active && !locked && grade > 0, [addr, sc, st.active, locked, grade]);
  const canClaim  = useMemo(() => !!addr && !!sc && st.active && st.claimable, [addr, sc, st.active, st.claimable]);
  const showClock = st.active && st.remaining >= 0;

  async function onStart() {
    if (!sc || !addr) return;
    await runTx({
      label: `탐험 시작 #${tokenId}`,
      send: () => sc.CORE.startExpedition(tokenId),
      after: async () => {
        // 최신 상태 재조회 후 종료 예정 시각 문구
        const r = await ro.CORE.getExpeditionStatus(tokenId);
        const endAt = Number(r[4]);
        setStartMsg(`탐험을 시작했습니다. 종료 예정: ${fmtKST(endAt)}`);
        setStartOpen(true);
        await st.refresh();
        await onAfter?.();
      }
    });
  }

  async function onClaim() {
    if (!sc || !addr) return;
    await runTx({
        label: `보상 수령 #${tokenId}`,
        send: () => sc.CORE.claimExpedition(tokenId),
        after: async (rc) => {
        // CORE 주소 로그만 파싱
        const coreAddr = CFG.addresses.CORE.toLowerCase();
        let reward = BigInt(0), drop = false;

        for (const log of rc.logs) {
            if ((log as any).address?.toLowerCase?.() !== coreAddr) continue;
            try {
            const p = expIface.parseLog({ topics: log.topics, data: log.data });
            if (p?.name === "ExpeditionClaimed") {
                reward = p.args.attReward as bigint;
                drop   = Boolean(p.args.fragDrop);
                break;
            }
            } catch {}
        }

        // 1) 부모 모달 먼저 오픈
        onResult?.({
            tokenId: String(tokenId),
            rewardATT: formatUnits(reward, 18),
            fragDrop: drop,
        });

        // 2) 그 다음 데이터 갱신(언마운트돼도 모달은 부모에 있어 안전)
        void st.refresh();
        void onAfter?.();
        }
    });
    }

  return (
    <>
      <Card className="p-5 space-y-4">
        {/* 헤더 */}
        <div className="flex items-center justify-between">
          <div className="text-sm text-white/70">Token #{String(tokenId)}</div>
          <div className="flex items-center gap-2">
            <span className="text-xs rounded-full px-2 py-1 border border-white/12 bg-white/[0.06]">
              Grade {grade}
            </span>
            {locked && (
              <span className="text-xs rounded-full px-2 py-1 border border-amber-400/30 text-amber-200 bg-amber-500/10">
                Locked
              </span>
            )}
            {st.active && !st.claimable && (
              <span className="text-xs rounded-full px-2 py-1 border border-sky-400/25 text-sky-100 bg-sky-500/15">
                탐험 중
              </span>
            )}
            {st.claimable && (
              <span className="text-xs rounded-full px-2 py-1 border border-emerald-400/25 text-emerald-100 bg-emerald-500/15">
                완료됨
              </span>
            )}
          </div>
        </div>

        {/* 설정 설명 */}
        <div className="text-sm text-white/75">
          {conf.sec > 0
            ? <>소요 {Math.round(conf.sec/60)}분 · 보상 {conf.min}~{conf.max} ATT · 조각 드랍 {(conf.bps/100).toFixed(2)}%</>
            : <>탐험 설정을 불러오는 중…</>}
        </div>

        {/* 남은 시간 + 배지 */}
        <div className="rounded-xl border border-white/10 bg-white/[0.04] p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-white/70">남은 시간</span>
            {/* st.active가 아닐 땐 Ready로, 액자 흔들림 없게 고정폭 배지 */}
            <div className="min-w-[152px] flex justify-end">
              <CountdownBadge
                seconds={st.active ? Math.max(0, Math.floor(st.remaining)) : 0}
                variant={st.claimable ? "purple" : "slate"}
                readyText={st.active ? "0h 0m 0s" : "Ready"}
              />
            </div>
          </div>

          {/* 종료 예정 시각 */}
          {showClock && (
            <div className="mt-2 text-xs text-white/55 text-right">
              종료 예정: {fmtKST(st.endTime)}
            </div>
          )}
        </div>

        {/* 액션 버튼 */}
        <div className="flex items-center gap-2">
          {/* 상태별 버튼 톤 변경 */}
          <Button
            className={
              canStart
                ? "btn-primary px-5"
                : st.active && !st.claimable
                  ? "px-5 border border-white/15 bg-white/[0.05] text-white/80 cursor-not-allowed"
                  : "px-5 border border-white/12 bg-white/[0.04] text-white/70 cursor-not-allowed"
            }
            loading={running}
            disabled={!canStart}
            onClick={onStart}
            title={canStart ? "탐험 시작" : (st.active ? "탐험 진행 중" : (locked ? "잠금 해제 필요" : "시작 불가"))}
          >
            {st.active
              ? (st.claimable ? "완료됨" : "탐험 중")
              : "탐험 시작"}
          </Button>

          <Button
            className={canClaim ? "btn-secondary px-5 ring-1 ring-emerald-400/30" : "btn-secondary px-5 opacity-60"}
            loading={running}
            disabled={!canClaim}
            onClick={onClaim}
            title={canClaim ? "보상 수령" : "완료 후 수령 가능"}
          >
            보상 수령
          </Button>
        </div>
      </Card>

      {/* 모달: 시작 알림 */}
      <SuccessModal
        open={startOpen}
        title="탐험 시작"
        subtitle={startMsg}
        onClose={() => setStartOpen(false)}
      />
    </>
  );
}