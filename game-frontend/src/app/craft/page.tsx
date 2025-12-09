"use client";

import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import FragmentsPanel from "@/components/FragmentsPanel";
import CraftResultModal from "@/components/ui/CraftResultModal";
import CraftGuide from "@/components/CraftGuide";

import { useWallet } from "@/hooks/useWallet";
import { useAttBalance } from "@/hooks/useAttBalance";
import { useDashboard } from "@/hooks/useDashboard";
import { useState } from "react";

export default function CraftPage(){
  const { addr, sc, connect } = useWallet();

  // 대시보드용 집계 훅 재사용 (ATT/FRG/가격/필요조각)
  const { formatted: att, refresh: refreshAtt } = useAttBalance(addr);
  const dash = useDashboard(addr);

  // 합성 결과 모달
  const [open, setOpen] = useState(false);
  const [ok, setOk] = useState(false);
  const [grade, setGrade] = useState<number | undefined>();
  function handleCraftResult(success: boolean, mintedGrade?: number) {
    setOk(success);
    setGrade(mintedGrade);
    setOpen(true);
    // 합성 직후 잔액/조각 갱신(선택)
    const prov = (sc as any)?.CORE?.runner?.provider;
    void Promise.all([
     refreshAtt({ provider: prov } as any).catch(()=>{}),
     (dash as any).refresh?.({ provider: prov }).catch(()=>{}),
   ]);
 }

  return (
    <section className="grid grid-cols-12 gap-4">
      {/* 헤더 */}
      <Card className="col-span-12 p-6 flex items-center justify-between">
        <div>
          <div className="text-sm text-muted">Forge your gear</div>
          <h1 className="section-title text-2xl mt-1">Craft</h1>
          <div className="text-sm text-muted mt-1">조각 구매 · 합성</div>
        </div>
        {!addr ? (
          <Button className="btn-primary px-6 h-11 text-[15px]" onClick={connect}>
            지갑 연결
          </Button>
        ) : null}
      </Card>

      {/* 본 패널 */}
      <FragmentsPanel
        addr={addr}
        sc={sc}
        frgBalance={dash.frg}
        attBalanceHuman={att}
        fragPrice={dash.fragPrice}
        needForCraft={dash.needForCraft}
        onRefresh={async () => {
          // 지갑 Provider로 강제 리프레시(캐시 지연 최소화)
          const prov = (sc as any)?.CORE?.runner?.provider;
          await Promise.all([
            refreshAtt({ provider: prov }),
            dash.refresh({ provider: prov }),
          ]);
        }}
        onCraftResult={handleCraftResult}
      />
      <CraftResultModal open={open} success={ok} grade={grade} onClose={() => setOpen(false)} />
      <CraftGuide />
    </section>
  );
}