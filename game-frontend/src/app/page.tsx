"use client";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import CountdownBadge from "@/components/ui/CountdownBadge";

import { useWallet } from "@/hooks/useWallet";
import { useDashboard } from "@/hooks/useDashboard";
import { useDaily } from "@/hooks/useDaily";
import { useTx } from "@/hooks/useTx";
import { Interface, formatUnits } from "ethers";
import PromoPanel from "@/components/PromoPanel";
import { useAttBalance } from "@/hooks/useAttBalance";
import { useRouter } from "next/navigation";
import DocsPanel from "@/components/docsPanel";

const dailyIface = new Interface([
  "event DailyClaim(address indexed user, uint256 amount, uint64 dayIndexKST)"
]);

export default function Home(){
  const { addr, sc, connect } = useWallet();
  const { formatted: att, refresh: refreshAtt, bump } = useAttBalance(addr);
  const dash = useDashboard(addr);
  const daily = useDaily(addr);
  const { runTx, running } = useTx();

  // const [okOpen, setOkOpen] = useState(false);
  // const [okMsg, setOkMsg] = useState("");
  // const [errOpen, setErrOpen] = useState(false);
  // const [errMsg, setErrMsg] = useState("");
  const router = useRouter();

  async function onClaim(){
    if (!sc) return;
    try {
      await runTx({
        label: "출석 받기",
        send: () => sc.CORE.claimDaily(),
        after: async (rc) => {
          // 1) 받은 양 파싱 + 모달
          let amount = BigInt(0);
          for (const log of rc.logs) {
            try {
              const parsed = dailyIface.parseLog({ topics: log.topics, data: log.data });
              if (parsed?.name === "DailyClaim") amount = parsed.args.amount as bigint;
            } catch {}
          }
          const human = formatUnits(amount, 18);
          // setOkMsg(`${human} ATT를 받았습니다.`);
          // setOkOpen(true);

          // 2) 낙관적 UI: 카드 숫자 즉시 올리기
          bump(amount);

          // 3) 같은 provider로 강제 재조회(캐시/지연 우회)
          const prov = (sc as any).CORE?.runner?.provider;
                   void Promise.allSettled([
            refreshAtt({ provider: prov }),
            dash.refresh({ provider: prov }),
            daily.refresh({ provider: prov, soft: true }), // 깜빡임 없는 소프트 갱신
          ]);
         // a) 잔액 변화 or 다음 블록을 최대 ~5초까지 기다림(프로모와 동일)
          const prevBal: bigint = await sc.ATT.balanceOf(addr!);
          await Promise.race([
            (async () => {
              for (let i = 0; i < 10; i++) {
                await new Promise(r => setTimeout(r, 500));
                const cur = await sc.ATT.balanceOf(addr!);
                if (cur !== prevBal) break;
              }
            })(),
            new Promise<void>(resolve => {
              const p: any = prov;
              if (p?.once) p.once("block", () => resolve());
              else resolve();
            })
          ]);

          // b) 최종 리프레시(모두 지갑 provider 주입!)
          await Promise.all([
            refreshAtt({ provider: prov }),
            dash.refresh({ provider: prov }),
            daily.refresh({ provider: prov, soft: true }),          // daily는 view라 그냥 두면 됨(이미 최신 provider로 묶였으면 OK)
          ]);
        }
      });
    } catch (e:any) {
      const msg = e?.shortMessage || e?.reason || e?.message || "알 수 없는 오류";
      // setErrMsg(msg.replace("execution reverted: ", ""));
      // setErrOpen(true);
    }
  }

const claimLabel =
  !addr ? "지갑 연결" :
  !daily.hydrated ? "확인 중…" :
  daily.claimable ? `출석 받기 (+${daily.dailyAmt} ATT)` : "대기 중";


  return (
    <section className="grid grid-cols-12 gap-4">
      <Card className="col-span-12 p-6 flex items-center justify-between">
        <div>
          <div className="text-sm text-muted">Welcome back, Adventurer</div>
          <h1 className="section-title text-2xl mt-1">DASHBOADR</h1>
          <div className="text-sm text-muted mt-1">출석</div>
          <div className="mt-5 flex flex-wrap items-center gap-10">
          {(!addr || !daily.hydrated || !daily.nextAt) ? (
               <span className="inline-block h-10 w-40 rounded-full bg-white/10 animate-pulse" />
             ) : (
               <CountdownBadge
                reserve="88h 88m 88s"                                  
                loading={!addr || !daily.hydrated || daily.loading}
                seconds={daily.claimable ? 0 : Math.max(0, Math.floor(daily.remaining))}
                 variant="slate"
               />
             )}

              {!addr ? (
                <Button className="btn-primary px-6 h-11 text-[15px]" onClick={connect}>
                  지갑 연결
                </Button>
              ) : (
                <Button
                  
                  className={`btn-primary px-10 h-11 text-[15px] ${
                    (!daily.hydrated || !daily.claimable) ? "opacity-60 cursor-not-allowed" : ""
                  }`}
                  loading={running}  // ✅ 트랜잭션 진행 중에만 스피너
                  onClick={daily.hydrated && daily.claimable ? onClaim : undefined}
                  aria-disabled={!daily.hydrated || !daily.claimable}
                  title={
                    daily.loading
                      ? "상태 확인 중…"
                      : daily.claimable
                        ? "지금 출석 가능"
                        : "출석 대기 중"
                  }
                >
                  {claimLabel}
                </Button>
              )}
            </div>
             
        </div>
        <PromoPanel
          sc={sc}
          onAfterSuccess={async () => {
              const prov = (sc as any).CORE?.runner?.provider;
                await Promise.all([
                   refreshAtt({ provider: prov }),
                  dash.refresh({ provider: prov }),
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
      {/* <SuccessModal open={okOpen} title="출석 성공" subtitle={okMsg} onClose={()=>setOkOpen(false)} />
      <ErrorModal open={errOpen} title="출석 실패" message={errMsg} onClose={()=>setErrOpen(false)} /> */}
    </section>
  );
}