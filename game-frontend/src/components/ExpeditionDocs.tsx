"use client";

import Card from "@/components/ui/Card";
import { useEffect, useState } from "react";
import { ro } from "@/lib/contracts";
import { formatUnits } from "ethers";

// 초 → 사람이 읽기 쉬운 문자열
function secToHuman(sec: number){
  if (!sec || sec <= 0) return "—";
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = Math.floor(sec % 60);
  const parts: string[] = [];
  if (h) parts.push(`${h}시간`);
  if (m) parts.push(`${m}분`);
  if (s && !h) parts.push(`${s}초`); // 시:분이면 초는 생략
  return parts.join(" ");
}

type GradeRow = {
  grade: number;
  secondsNeeded: number;
  rewardMin: string;    // human(ATT)
  rewardMax: string;    // human(ATT)
  dropPct: string;      // "x.xx%"
};

export default function ExpeditionGuide() {
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<GradeRow[]>([]);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        // 기본 등급 후보(컨트랙트에 설정되어 있지 않으면 secondsNeeded=0일 수 있음 → 스킵)
        const grades = [1,2,3,4];
        const out: GradeRow[] = [];
        for (const g of grades) {
          const c = await ro.CORE.expeditionOf(g);
          // ethers v6: struct 필드가 bigint로 옴
          const sec  = Number(c.secondsNeeded ?? BigInt(0));
          const rmin = c.rewardMin != null ? String(Number(c.rewardMin)) : "0";
          const rmax = c.rewardMax != null ? String(Number(c.rewardMax)) : "0";
          const pct  = c.fragmentDropBps ? (Number(c.fragmentDropBps)/100).toFixed(2) : "0.00";
          if (sec > 0) {
            out.push({
              grade: g,
              secondsNeeded: sec,
              rewardMin: rmin,
              rewardMax: rmax,
              dropPct: `${pct}%`,
            });
          }
        }
        if (!alive) return;
        setRows(out);
      } catch {
        // 실패 시 기본 안내만 노출
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, []);

  return (
    <Card className="col-span-12 p-6 space-y-6">
      <header>
        <h2 className="text-xl font-semibold">탐험 가이드</h2>
        <p className="text-sm text-white/70 mt-1">
          NFT를 탐험에 보내 보상을 획득하는 전체 흐름과 등급별 설정을 한눈에 정리했습니다.
        </p>
      </header>

      {/* 등급별 현재 설정 요약 */}
      <section className="rounded-xl border border-white/10 bg-white/[0.04] p-4">
        <div className="grid grid-cols-12 gap-4 text-sm">
          {loading ? (
            <>
              <div className="col-span-12 h-16 rounded-lg bg-white/10 animate-pulse" />
              <div className="col-span-12 h-16 rounded-lg bg-white/10 animate-pulse" />
            </>
          ) : rows.length ? (
            rows.map(r => (
              <div key={r.grade} className="col-span-12 md:col-span-6 xl:col-span-3">
                <div className="rounded-lg border border-white/10 bg-white/[0.03] p-3">
                  <div className="text-white/60 text-xs">Grade</div>
                  <div className="text-base font-semibold">G{r.grade}</div>
                  <div className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1">
                    <div className="text-white/60 text-xs">소요 시간</div>
                    <div className="text-white/90 text-xs">{secToHuman(r.secondsNeeded)}</div>
                    <div className="text-white/60 text-xs">ATT 보상</div>
                    <div className="text-white/90 text-xs tabular-nums">
                      {r.rewardMin} ~ {r.rewardMax}
                    </div>
                    <div className="text-white/60 text-xs">조각 드랍</div>
                    <div className="text-white/90 text-xs">{r.dropPct}</div>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-12 text-sm text-white/70">
              설정된 탐험 등급이 없습니다. 운영(ADMIN)에서 <code className="px-1 py-0.5 bg-white/10 rounded">setExpeditionConf</code>로 등록해주세요.
            </div>
          )}
        </div>
      </section>

      {/* 빠른 시작 */}
      <section>
        <h3 className="text-lg font-semibold">빠른 시작</h3>
        <ol className="mt-3 space-y-2 text-sm leading-relaxed list-decimal list-inside">
          <li>
            <b>NFT 선택</b>: 내 보유 NFT 목록에서 탐험에 보낼 토큰을 선택합니다.
          </li>
          <li>
            <b>탐험 시작</b>: <span className="px-1 py-0.5 bg-white/10 rounded">탐험 시작</span> 버튼을 누르면 NFT가 잠기고 카운트다운이 시작됩니다.
          </li>
          <li>
            <b>보상 수령</b>: 시간이 0초가 되면 <span className="px-1 py-0.5 bg-white/10 rounded">보상 수령</span> 버튼이 활성화됩니다.
            수령 시 <b>ATT</b>와 낮은 확률의 <b>조각 1개</b>를 받습니다.
          </li>
        </ol>
      </section>

      {/* 상세 설명 */}
      <section className="grid grid-cols-12 gap-4">
        <div className="col-span-12 lg:col-span-6">
          <h4 className="font-semibold">진행</h4>
          <ul className="mt-2 space-y-1 text-sm text-white/80">
            <li>• 탐험 중에는 해당 NFT가 <b>잠금</b> 상태가 되며 전송이 불가합니다.</li>
            <li>• 남은 시간은 실시간으로 감소하며, 0초 도달 시 <b>즉시 수령 가능</b> 상태로 전환됩니다.</li>
            <li>• 수령 시 잠금이 해제되며, 다음 탐험을 다시 시작할 수 있습니다.</li>
          </ul>
        </div>
        <div className="col-span-12 lg:col-span-6">
          <h4 className="font-semibold">보상 산정</h4>
          <ul className="mt-2 space-y-1 text-sm text-white/80">
            <li>• 등급별 <code className="px-1 py-0.5 bg-white/10 rounded">rewardMin~rewardMax</code> 범위에서 의사난수로 ATT가 결정됩니다.</li>
            <li>• <code className="px-1 py-0.5 bg-white/10 rounded">fragmentDropBps</code>에 따라 조각이 드랍될 수 있습니다.</li>
            <li>• 모든 값은 온체인 설정이며, 운영(ADMIN)이 변경할 수 있습니다.</li>
          </ul>
        </div>
      </section>

      {/* 자주 묻는 오류 */}
      <section>
        <h4 className="font-semibold">자주 묻는 오류 & 해결</h4>
        <ul className="mt-2 space-y-2 text-sm text-white/80">
          <li>
            <b>“already active”</b> → 해당 NFT는 이미 탐험 중입니다. 종료(보상 수령) 후 다시 시작하세요.
          </li>
          <li>
            <b>“not ended”</b> → 아직 종료 시간이 되지 않았습니다. 카운트다운이 0이 될 때까지 기다리세요.
          </li>
          <li>
            <b>“not owner”</b> → 현재 지갑이 NFT 소유자가 아닙니다. 소유 지갑으로 전환하세요.
          </li>
          <li>
            <b>“exp off”</b> → 탐험 기능이 일시 중지되었습니다. 운영에서 다시 켜야 합니다.
          </li>
        </ul>
      </section>

      {/* 주의 */}
      <section className="rounded-xl border border-amber-400/30 bg-amber-500/10 p-4 text-sm">
        <b className="text-amber-300">주의</b>
        <div className="text-white/85 mt-1">
          탐험 중에는 NFT가 잠기며, 보상 수령 전까지 다른 용도로 사용할 수 없습니다.
        </div>
      </section>
    </Card>
  );
}