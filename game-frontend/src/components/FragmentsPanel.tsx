// src/components/FragmentsPanel.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import { useTx } from "@/hooks/useTx";
import { CFG } from "@/config";
import { ro } from "@/lib/contracts";
import type { withSigner } from "@/lib/contracts";
import { Interface, MaxUint256, formatUnits, parseUnits, id } from "ethers";
import SuccessModal from "@/components/ui/SuccessModal";
import ErrorModal from "@/components/ui/ErrorModal";

type Props = {
  addr?: string;
  sc?: ReturnType<typeof withSigner>;
  // 대시보드에서 내려주면 그대로 활용, 없으면 컨트랙트에서 읽음
  frgBalance?: string;
  attBalanceHuman?: string;
  fragPrice?: string;     // human (18dec) e.g. "5.0"
  needForCraft?: string;  // e.g. "5"
  onRefresh?: () => Promise<void> | void;
  onCraftResult?: (ok: boolean, mintedGrade?: number) => void;
};

const craftIface = new Interface([
  "event CraftAttempt(address indexed user, bool success, uint8 mintedGrade)"
]);
const CRAFT_TOPIC = id("CraftAttempt(address,bool,uint8)");

const buyIface = new Interface([
  "event FragmentsBought(address indexed user, uint256 count, uint256 paidATT)"
]);
const FRAG_BOUGHT_TOPIC = id("FragmentsBought(address,uint256,uint256)");

export default function FragmentsPanel({
  addr,
  sc,
  frgBalance,
  attBalanceHuman,
  fragPrice,
  needForCraft,
  onRefresh,
  onCraftResult
}: Props) {
  const { runTx, running } = useTx();

  // ----- 서버/대시보드 값 폴백 -----
  const [priceWei, setPriceWei]   = useState<bigint>(BigInt(0));
  const [needCnt, setNeedCnt]     = useState<number>(Number(needForCraft ?? 0));
  const [attHuman, setAttHuman]   = useState<string>(attBalanceHuman ?? "0");
  const [frgOwned, setFrgOwned]   = useState<number>(Number(frgBalance ?? 0));
  const [craftBps, setCraftBps]   = useState<number>(6000); // 60% 기본 표시

  const [okOpen, setOkOpen]   = useState(false);
  const [okMsg, setOkMsg]     = useState("");
  const [errOpen, setErrOpen] = useState(false);
  const [errMsg, setErrMsg]   = useState("");

  // 입력 수량
  const [qty, setQty] = useState<number>(1);
  const totalWei = useMemo(() => priceWei * BigInt(qty || 0), [priceWei, qty]);

  // allowance / ERC1155 approve 상태
  const [allowWei, setAllowWei] = useState<bigint>(BigInt(0));
  const [isFRGApproved, setFRGApproved] = useState<boolean>(false);

  // 읽기 새로고침
  async function refreshRO() {
    if (!addr) return;

    // 컨트랙트에서 최신 값
    const [p, need, bps, attBal, frgBal, allowance, frgAppr] = await Promise.all([
      ro.CORE.fragmentPriceATT(),
      ro.CORE.fragmentsToCraft(),
      ro.CORE.craftSuccessBps(),
      ro.ATT.balanceOf(addr),
      ro.FRG.balanceOf(addr, 1),
      ro.ATT.allowance(addr, CFG.addresses.CORE),
      ro.FRG.isApprovedForAll(addr, CFG.addresses.CORE),
    ]);

    setPriceWei(p);
    setNeedCnt(Number(need));
    setCraftBps(Number(bps));
    setAttHuman(formatUnits(attBal, 18));
    setFrgOwned(Number(frgBal));
    setAllowWei(allowance);
    setFRGApproved(Boolean(frgAppr));
  }

  // 초기/주소 변경 시 읽기
  useEffect(() => {
    // 대시보드 전달값을 우선 적용
    if (fragPrice) setPriceWei(parseUnits(fragPrice, 18));
    if (needForCraft) setNeedCnt(Number(needForCraft));
    if (attBalanceHuman) setAttHuman(attBalanceHuman);
    if (frgBalance) setFrgOwned(Number(frgBalance));
    // 주소 있으면 최신값으로 동기화
    if (addr) void refreshRO();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [addr]);

  // 구매 가능 여부
  const canBuy = useMemo(() => {
    if (!addr || !sc) return false;
    if (qty <= 0) return false;
    return true;
  }, [addr, sc, qty]);

  const needApproveATT = useMemo(() => {
    if (!addr || !sc) return false;
    return allowWei < totalWei;
  }, [allowWei, totalWei, addr, sc]);

  const notEnoughATT = useMemo(() => {
    try {
      return BigInt(parseUnits(attHuman || "0", 18)) < totalWei;
    } catch { return true; }
  }, [attHuman, totalWei]);

  const canCraft = useMemo(() => {
    if (!addr || !sc) return false;
    return frgOwned >= needCnt && isFRGApproved;
  }, [addr, sc, frgOwned, needCnt, isFRGApproved]);

  // ----- 액션: 조각 구매 -----
  async function onBuy() {
    if (!addr || !sc) return;
    try {
        // 1) 필요하면 ATT approve 먼저
        if (needApproveATT) {
        await runTx({
            label: "ATT 승인",
            send: () => sc.ATT.approve(CFG.addresses.CORE, MaxUint256),
        });
        }
        // 2) 구매 트랜잭션
        await runTx({
        label: "조각 구매",
        send: () => sc.CORE.buyFragments(qty),
        after: async (rc) => {
            // CORE가 낸 FragmentsBought 이벤트만 파싱
            const coreAddr = CFG.addresses.CORE.toLowerCase();
            let count = qty;
            let paid  = totalWei;

            for (const log of rc.logs) {
            if ((log as any).address?.toLowerCase?.() !== coreAddr) continue;
            if (!log.topics?.length || log.topics[0] !== FRAG_BOUGHT_TOPIC) continue;
            try {
                const p = buyIface.parseLog({ topics: log.topics, data: log.data });
                count = Number(p?.args.count ?? count);
                paid  = BigInt(p?.args.paidATT ?? paid);
                break;
            } catch {}
            }

            setOkMsg(`조각 ${count}개를 구매했습니다 (총 ${formatUnits(paid, 18)} ATT).`);
            setOkOpen(true);

            await (onRefresh?.());
            await refreshRO();
        }
        });
    } catch (e: any) {
        const msg = e?.shortMessage || e?.reason || e?.message || "알 수 없는 오류";
        setErrMsg(String(msg).replace("execution reverted: ", ""));
        setErrOpen(true);
    }
    }

  // ----- 액션: ERC1155 setApprovalForAll -----
  async function onApproveFRG() {
    if (!sc) return;
    await runTx({
      label: "조각 사용 승인",
      send: () => sc.FRG.setApprovalForAll(CFG.addresses.CORE, true),
      after: async () => {
        await refreshRO();
      }
    });
  }

  // ----- 액션: 합성 -----
  async function onCraft() {
    if (!sc) return;
    await runTx({
      label: "합성",
      send: () => sc.CORE.craftFromFragments(),
      after: async (rc) => {
        // 이벤트 파싱 → 성공/실패, 민팅 등급 확인
        try {
          let ok = false;
          let minted = 0;
          for (const log of rc.logs) {
            // CORE 컨트랙트에서 발생한 CraftAttempt만 필터
            if ((log as any).address?.toLowerCase() !== CFG.addresses.CORE.toLowerCase()) continue;
            if (!log.topics?.length || log.topics[0] !== CRAFT_TOPIC) continue;
            const parsed = craftIface.parseLog({ topics: log.topics, data: log.data });
            ok = Boolean(parsed?.args.success);
            minted = Number(parsed?.args.mintedGrade ?? 0);
            break;
          }
          onCraftResult?.(ok, ok ? minted : undefined);
        } catch {
          onCraftResult?.(false, undefined);
        }
        await (onRefresh?.());
        await refreshRO();
      }
    });
  }

  const missing = useMemo(() => Math.max(0, needCnt - frgOwned), [needCnt, frgOwned]);

  // ----- UI -----
  return (
    <div className="col-span-12 grid grid-cols-12 gap-4">
      {/* 좌: 조각 구매 */}
      <Card id="buy-card" className="col-span-12 xl:col-span-6 p-6 space-y-5">
        <header className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold">조각 구매</h2>
            <p className="text-sm text-white/70 mt-1">
              ATT로 조각(Frag, id:1)을 구매합니다. 합성을 위한 기본 재료입니다.
            </p>
          </div>
          <div className="text-right">
            <div className="text-xs text-white/50">ATT Balance</div>
            <div className="text-base font-medium">{attHuman}</div>
          </div>
        </header>

        <div className="grid grid-cols-12 gap-4">
          <div className="col-span-7">
            <label className="text-sm text-white/70">수량</label>
            <div className="mt-2 flex items-center gap-2">
              <input
                type="number"
                min={1}
                step={1}
                value={qty}
                onChange={(e) => setQty(Math.max(1, parseInt(e.target.value || "1", 10)))}
                className="input w-28 text-center"
              />
              <span className="text-sm text-white/60">개</span>
            </div>
          </div>

          <div className="col-span-5">
            <div className="text-sm text-white/70">가격</div>
            <div className="mt-2 text-lg font-semibold tabular-nums">
              {formatUnits(priceWei, 18)} ATT
            </div>
            <div className="text-xs text-white/50 mt-1">단가 × 수량 = 총액</div>
          </div>

          <div className="col-span-12">
            <div className="flex items-center justify-between rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3">
              <div className="text-sm text-white/70">총액</div>
              <div className="text-lg font-semibold tabular-nums">
                {formatUnits(totalWei, 18)} ATT
              </div>
            </div>
            {notEnoughATT && (
              <div className="mt-2 text-xs text-rose-300/80">보유 ATT가 부족합니다.</div>
            )}
            {needApproveATT && !notEnoughATT && (
              <div className="mt-2 text-xs text-amber-300/80">
                최초 1회 ATT 승인(allowance 설정)이 필요합니다.
              </div>
            )}
          </div>
        </div>

        <div className="flex gap-2">
          <Button
            className="btn-primary px-6"
            loading={running}
            disabled={!canBuy || notEnoughATT}
            onClick={onBuy}
          >
            {needApproveATT ? "승인 후 구매" : "구매"}
          </Button>
          <div className="text-xs text-white/60 self-center">
            구매 대금은 트레저리로 전송되며, 조각이 즉시 발행됩니다.
          </div>
        </div>
      </Card>

      {/* 우: 조각 합성 */}
      <Card className="col-span-12 xl:col-span-6 p-6 space-y-5">
        <header className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold">조각 합성</h2>
            <p className="text-sm text-white/70 mt-1">
              조각 <b>{needCnt}</b>개를 소각하여 <b>1등급 NFT</b>로 합성을 시도합니다.
            </p>
          </div>
          <div className="text-right">
            <div className="text-xs text-white/50">보유 조각</div>
            <div className="text-base font-medium">{frgOwned}</div>
          </div>
        </header>

        {/* 진행도 바 */}
        <div className="rounded-xl border border-white/10 bg-white/[0.04] p-4">
          <div className="flex items-center justify-between text-sm">
            <span className="text-white/70">조각</span>
            <span className="tabular-nums">
              {Math.min(frgOwned, needCnt)} / {needCnt}
            </span>
          </div>
          <div className="mt-2 h-2 w-full rounded-full bg-white/10 overflow-hidden">
            <div
              className="h-full bg-violet-500/80 transition-[width] duration-500"
              style={{ width: `${Math.min(100, (frgOwned / Math.max(1, needCnt)) * 100)}%` }}
            />
          </div>
          <div className="mt-2 text-xs text-white/60">
            성공 확률: <b>{(craftBps / 100).toFixed(2)}%</b> · 실패 시 조각은 소각됩니다.
          </div>
        </div>

        {/* 승인/합성 버튼 */}
        {!isFRGApproved ? (
            // 승인 전: 합성 버튼 숨김 + 안내
            <div className="flex items-center gap-3">
                <Button
                className="btn-secondary px-5"
                loading={running}
                disabled={!addr || !sc}
                onClick={onApproveFRG}
                >
                조각 사용 승인
                </Button>
                <div className="text-xs text-amber-200/90 rounded-lg border border-amber-400/30 bg-amber-500/10 px-3 py-2">
                합성을 하려면 먼저 <b>조각 사용 승인</b>이 필요합니다. 최초 1회만 진행하면 됩니다.
                </div>
            </div>
            ) : (
            // 승인 후
            <>
                {missing > 0 ? (
                // 조각 부족: 합성 버튼은 비활성, 부족분 구매 보조 CTA 표시
                <div className="flex items-center gap-3">
                    <Button
                    className="px-6 border border-white/15 bg-white/[0.05] text-white/70 cursor-not-allowed"
                    disabled
                    title={`조각이 부족합니다 (${frgOwned} / ${needCnt})`}
                    >
                    합성 시도
                    </Button>

                    <Button
                    className="btn-secondary px-5"
                    onClick={() => {
                        setQty(missing); // 부족분을 구매 수량에 자동 입력
                        document.getElementById('buy-card')
                        ?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    }}
                    >
                    부족분 입력 (+{missing})
                    </Button>

                    <div className="text-xs text-amber-200/90">
                    합성에는 조각 <b>{needCnt}</b>개가 필요합니다. 현재 <b>{frgOwned}</b>개 보유.
                    </div>
                </div>
                ) : (
                // 조각 충분: 정상 합성 버튼
                <div className="flex items-center gap-3">
                    <Button
                    className="btn-primary px-6"
                    loading={running}
                    disabled={!(addr && sc)}
                    onClick={onCraft}
                    title="합성 시도"
                    >
                    합성 시도
                    </Button>
                    <div className="text-xs text-white/60">
                    성공 확률은 설정값에 따릅니다. 실패 시 조각은 소각됩니다.
                    </div>
                </div>
                )}
            </>
            )}
      </Card>
      <SuccessModal
        open={okOpen}
        title="구매 성공"
        subtitle={okMsg}
        onClose={() => setOkOpen(false)}
        />
        <ErrorModal
        open={errOpen}
        title="구매 실패"
        message={errMsg}
        onClose={() => setErrOpen(false)}
        />
    </div>
  );
}