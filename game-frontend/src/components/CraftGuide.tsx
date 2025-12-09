"use client";

import Card from "@/components/ui/Card";
import { useEffect, useState } from "react";
import { ro } from "@/lib/contracts";
import { formatUnits } from "ethers";

export default function CraftGuide() {
  const [loading, setLoading] = useState(true);
  const [priceATT, setPriceATT] = useState<string>("0");
  const [needCnt, setNeedCnt] = useState<number>(0);
  const [successPct, setSuccessPct] = useState<string>("0");

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const [p, n, bps] = await Promise.all([
          ro.CORE.fragmentPriceATT(),
          ro.CORE.fragmentsToCraft(),
          ro.CORE.craftSuccessBps(),
        ]);
        if (!alive) return;
        setPriceATT(formatUnits(p, 18));
        setNeedCnt(Number(n));
        setSuccessPct((Number(bps) / 100).toFixed(2));
      } catch {
        // 로딩 실패 시 기본 안내만 노출
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, []);

  return (
    <Card className="col-span-12 p-6 space-y-6">
      <header>
        <h2 className="text-xl font-semibold">조각 구매 & 합성 가이드</h2>
        <p className="text-sm text-white/70 mt-1">
          포트폴리오 체인에서 조각을 구매하고 1등급 NFT로 합성하는 전체 흐름을 설명합니다.
        </p>
      </header>

      {/* 요약(현재 설정) */}
      <section className="rounded-xl border border-white/10 bg-white/[0.04] p-4">
        <div className="grid grid-cols-12 gap-4 text-sm">
          <div className="col-span-12 md:col-span-4">
            <div className="text-white/60">조각 단가</div>
            <div className="mt-1 text-base font-semibold tabular-nums">
              {loading ? "—" : `${priceATT} ATT`}
            </div>
          </div>
          <div className="col-span-12 md:col-span-4">
            <div className="text-white/60">합성 필요 조각 수</div>
            <div className="mt-1 text-base font-semibold tabular-nums">
              {loading ? "—" : needCnt}
            </div>
          </div>
          <div className="col-span-12 md:col-span-4">
            <div className="text-white/60">합성 성공 확률</div>
            <div className="mt-1 text-base font-semibold tabular-nums">
              {loading ? "—" : `${successPct}%`}
            </div>
          </div>
        </div>
      </section>

      {/* 빠른 시작 */}
      <section>
        <h3 className="text-lg font-semibold">빠른 시작</h3>
        <ol className="mt-3 space-y-2 text-sm leading-relaxed list-decimal list-inside">
          <li>
            <b>ATT 보유</b>: 지갑에 충분한 ATT가 있는지 확인합니다.
          </li>
          <li>
            <b>조각 구매</b>: 원하는 수량 입력 → 필요 시 <code className="px-1 py-0.5 bg-white/10 rounded">ATT 승인</code> →
            <span className="px-1 py-0.5 bg-white/10 rounded ml-1">구매</span>.
          </li>
          <li>
            <b>조각 사용 승인(최초 1회)</b>: 합성 전 <code className="px-1 py-0.5 bg-white/10 rounded">조각 사용 승인</code>
            으로 ERC-1155 전송 권한을 CORE에 부여합니다.
          </li>
          <li>
            <b>합성 시도</b>: 조각 {loading ? "N" : needCnt}개 소각 → 성공 시 1등급 NFT 1개 발행.
          </li>
        </ol>
      </section>

      {/* 상세 설명 */}
      <section className="grid grid-cols-12 gap-4">
        <div className="col-span-12 lg:col-span-6">
          <h4 className="font-semibold">조각 구매</h4>
          <ul className="mt-2 space-y-1 text-sm text-white/80">
            <li>• 총액 = 단가 × 수량. 최초 구매 시 ATT <i>approve</i>가 한 번 필요할 수 있습니다.</li>
            <li>• 구매 대금은 트레저리로 전송되며, 조각(Frag, id:1)이 즉시 발행됩니다.</li>
            <li>• 잔액이 바로 안 바뀌면 1개 블록 정도 대기 후 다시 조회됩니다.</li>
          </ul>
        </div>
        <div className="col-span-12 lg:col-span-6">
          <h4 className="font-semibold">합성</h4>
          <ul className="mt-2 space-y-1 text-sm text-white/80">
            <li>• 합성은 확률형입니다. 실패해도 조각은 소각됩니다.</li>
            <li>• <code className="px-1 py-0.5 bg-white/10 rounded">조각 사용 승인</code>은 최초 1회만 필요합니다.</li>
            <li>• 성공 시 1등급 NFT가 발행되며, 결과는 모달로 즉시 표시됩니다.</li>
          </ul>
        </div>
      </section>

      {/* 자주 묻는 오류 */}
      <section>
        <h4 className="font-semibold">자주 묻는 오류 & 해결</h4>
        <ul className="mt-2 space-y-2 text-sm text-white/80">
          <li>
            <b>“approve ATT” / “allowance 부족”</b> → 구매 전에 ATT 승인을 먼저 실행하세요.
          </li>
          <li>
            <b>“조각 부족”</b> → 조각 보유 수량이 합성 필요 수량보다 적습니다. 조각을 더 구매하세요.
          </li>
          <li>
            <b>“합성 기능 비활성화”</b> → 운영에서 기능을 일시 중지한 상태입니다(관리자 토글).
          </li>
          <li>
            <b>“잔액/카운트 즉시 반영 안 됨”</b> → 다음 블록에서 갱신됩니다. 잠시 후 다시 조회됩니다.
          </li>
        </ul>
      </section>

      {/* 주의 */}
      <section className="rounded-xl border border-amber-400/30 bg-amber-500/10 p-4 text-sm">
        <b className="text-amber-300">주의</b>
        <div className="text-white/85 mt-1">
          합성은 <b>확률형</b>이며 실패 시 조각이 소각되므로, 충분히 이해한 후 진행하세요.
        </div>
      </section>
    </Card>
  );
}