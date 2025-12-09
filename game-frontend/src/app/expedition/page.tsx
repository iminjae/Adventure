"use client";

import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import ExpeditionCard from "@/components/ExpeditionCard";
import { useWallet } from "@/hooks/useWallet";
import { useMyNfts } from "@/hooks/useMyNfts";
import { useDashboard } from "@/hooks/useDashboard";
import { useAttBalance } from "@/hooks/useAttBalance";
import ExpeditionDocs from "@/components/ExpeditionDocs";
import ExpeditionResultModal from "@/components/ui/ExpeditionResultModal";
import { useState } from "react";

export default function ExpeditionPage(){
  const { addr, sc, connect } = useWallet();
  const nfts = useMyNfts(addr);
  const dash = useDashboard(addr);
  const att = useAttBalance(addr);
  const [resOpen, setResOpen] = useState(false);
  const [resInfo, setResInfo] = useState<{ tokenId?: string; rewardATT: string; fragDrop: boolean }>({
    tokenId: undefined, rewardATT: "0", fragDrop: false
  });

  // 카드에서 콜백 받으면 모달 오픈
  function handleClaimResult(r: { tokenId: string; rewardATT: string; fragDrop: boolean }) {
    setResInfo(r);
    setResOpen(true);
  }

  return (
    <section className="grid grid-cols-12 gap-4">
      <Card className="col-span-12 p-6 flex items-center justify-between">
        <div>
          <div className="text-sm text-muted">Explore the world</div>
          <h1 className="section-title text-2xl mt-1">Expedition</h1>
          <div className="text-sm text-muted mt-1">보유 NFT로 탐험을 시작하고 보상을 수령하세요</div>
        </div>
        {!addr ? (
          <Button className="btn-primary px-6 h-11 text-[15px]" onClick={connect}>
            지갑 연결
          </Button>
        ) : null}
      </Card>

      {addr ? (
        <>
          {nfts.loading ? (
            <Card className="col-span-12 p-6">로딩 중…</Card>
          ) : nfts.list.length === 0 ? (
            <Card className="col-span-12 p-6">보유한 NFT가 없습니다.</Card>
          ) : (
            nfts.list.map(n => (
              <div key={String(n.id)} className="col-span-12 md:col-span-6 xl:col-span-4">
                <ExpeditionCard
                  addr={addr}
                  sc={sc}
                  tokenId={n.id}
                  grade={n.grade}
                  locked={n.locked}
                  onAfter={async () => {
                    const prov = (sc as any)?.CORE?.runner?.provider;
                    await Promise.all([
                      dash.refresh({ provider: prov }),
                      att.refresh({ provider: prov }),
                      nfts.refresh(),
                    ]);
                  }}
                  onResult={handleClaimResult}
                />
              </div>
            ))
          )}
           <ExpeditionResultModal
            open={resOpen}
            onClose={() => setResOpen(false)}
            rewardATT={resInfo.rewardATT}
            fragDrop={resInfo.fragDrop}
            tokenId={resInfo.tokenId}
          />
        </>
      ) : (
        <Card className="col-span-12 p-6">탐험하려면 먼저 지갑을 연결하세요.</Card>
      )}
      <ExpeditionDocs />
    </section>
  );
}