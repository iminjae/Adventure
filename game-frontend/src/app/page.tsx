"use client";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import SuccessModal from "@/components/ui/SuccessModal";
import ErrorModal from "@/components/ui/ErrorModal";
import CountdownBadge from "@/components/ui/CountdownBadge";

import { useWallet } from "@/hooks/useWallet";
import { useDashboard } from "@/hooks/useDashboard";
import { useDaily } from "@/hooks/useDaily";
import { useTx } from "@/hooks/useTx";
import { Interface, formatUnits } from "ethers";
import { useState } from "react";
import PromoPanel from "@/components/PromoPanel";
import { useAttBalance } from "@/hooks/useAttBalance";
import { useRouter } from "next/navigation";
import DocsPanel from "@/components/docsPanel";

const dailyIface = new Interface([
  "event DailyClaim(address indexed user, uint256 amount, uint64 dayIndexKST)"
]);

export default function Home(){
  const { addr, sc, connect } = useWallet();
  const { formatted: att, refresh: refreshAtt } = useAttBalance(addr);
  const dash = useDashboard(addr);
  const daily = useDaily(addr);
  const { runTx, running } = useTx();

  const [okOpen, setOkOpen] = useState(false);
  const [okMsg, setOkMsg] = useState("");
  const [errOpen, setErrOpen] = useState(false);
  const [errMsg, setErrMsg] = useState("");
  const router = useRouter();

  async function onClaim(){
    if (!sc) return;
    try {
      await runTx({
        label: "출석 받기",
        send: () => sc.CORE.claimDaily(),
        after: async (rc) => {
          // 이벤트 파싱 → 받은 양 표시
          let amount = BigInt(0);
          for (const log of rc.logs) {
            try {
              const parsed = dailyIface.parseLog({ topics: log.topics, data: log.data });
              if (parsed?.name === "DailyClaim") amount = parsed.args.amount as bigint;
            } catch {}
          }
          const human = formatUnits(amount, 18);
          setOkMsg(`${human} ATT를 받았습니다.`);
          setOkOpen(true);

          await Promise.all([dash.refresh(), daily.refresh()]);
        }
      });
    } catch (e:any) {
      const msg = e?.shortMessage || e?.reason || e?.message || "알 수 없는 오류";
      setErrMsg(msg.replace("execution reverted: ", ""));
      setErrOpen(true);
    }
  }

const claimLabel = !addr
 ? "지갑 연결"
 : daily.claimable
   ? `출석 받기 (+${daily.dailyAmt} ATT)`
   : `출석 완료`;

  return (
    <section className="grid grid-cols-12 gap-4">
      <Card className="col-span-12 p-6 flex items-center justify-between">
        <div>
          <div className="text-sm text-muted">Welcome back, Adventurer</div>
          <h1 className="section-title text-2xl mt-1">대시보드</h1>
          <div className="text-sm text-muted mt-1">출석 · 조각 · 합성</div>

             <div className="mt-5 flex flex-wrap items-center gap-10">
      
              <CountdownBadge
                seconds={daily.claimable ? 0 : (daily.remaining | 0)}
                variant="slate"  // "purple" 로 바꾸면 보라톤
              />

              {!addr ? (
                <Button className="btn-primary px-6 h-11 text-[15px]" onClick={connect}>
                  지갑 연결
                </Button>
              ) : (
                <Button
                  className={`btn-primary px-10 h-11 text-[15px] ${
                    daily.claimable ? "" : "opacity-60 cursor-not-allowed"
                  }`}
                  loading={running}
                  onClick={daily.claimable ? onClaim : undefined}
                  aria-disabled={!daily.claimable}
                  title={daily.claimable ? "출석" : "출석 완료"}
                >
                  {claimLabel}
                </Button>
              )}
            </div>
        </div>
        <PromoPanel
          sc={sc}
          onAfterSuccess={async () => {
            await Promise.all([
              refreshAtt(),   // useAttBalance 갱신
              dash.refresh(), // ✅ useDashboard 갱신(= 카드에 보이는 dash.att 업데이트)
            ]);
          }}
        />
      </Card>

      {/* 요약 카드들 */}
      <Card className="col-span-12 md:col-span-4">
        <div className="text-sm text-muted">ATT Balance</div>
        <div className="text-2xl font-semibold mt-1">{dash.loading ? "…" : dash.att}</div>
      </Card>
      <Card className="col-span-12 md:col-span-4">
        <div className="text-sm text-muted">Fragments</div>
        <div className="text-2xl font-semibold mt-1">{dash.loading ? "…" : dash.frg}</div>
      </Card>
      <Card className="col-span-12 md:col-span-4">
        <div className="text-sm text-muted">NFTs</div>
        <div className="text-2xl font-semibold mt-1">{dash.loading ? "…" : dash.nftCount}</div>
      </Card>
      <DocsPanel />
      <SuccessModal open={okOpen} title="출석 성공" subtitle={okMsg} onClose={()=>setOkOpen(false)} />
      <ErrorModal open={errOpen} title="출석 실패" message={errMsg} onClose={()=>setErrOpen(false)} />
    </section>
  );
}