"use client";

import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import UpgradePanel from "@/components/UpgradePanel";
import { useWallet } from "@/hooks/useWallet";
import { useAttBalance } from "@/hooks/useAttBalance";
import { useDashboard } from "@/hooks/useDashboard";
import { useOwnedAdv } from "@/hooks/useOwnedAdv";
import UpgradeGuide from "@/components/UpgradeGuide";

export default function UpgradePage() {
  const { addr, sc, connect } = useWallet();
  const { refresh: refreshAtt } = useAttBalance(addr);
  const dash = useDashboard(addr);
  const { loading, byGrade, refresh } = useOwnedAdv(addr);

  return (
    <section className="grid grid-cols-12 gap-4">
      <Card className="col-span-12 p-6 flex items-center justify-between">
        <div>
          <div className="text-sm text-muted">Fuse and rise</div>
          <h1 className="section-title text-2xl mt-1">Upgrade</h1>
          <div className="text-sm text-muted mt-1">동일 등급 N장 → 상위 1장</div>
        </div>
        {!addr ? (
          <Button className="btn-primary px-6 h-11 text-[15px]" onClick={connect}>
            지갑 연결
          </Button>
        ) : null}
      </Card>

      <UpgradePanel
        addr={addr}
        sc={sc}
        onAfter={async () => {
          // 업그레이드 후 대시보드/잔액 등 갱신
          await Promise.all([refreshAtt(), dash.refresh()]);
        }}
      />
      <UpgradeGuide />
    </section>
  );
}