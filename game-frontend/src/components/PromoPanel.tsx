"use client";
import { useState, useMemo } from "react";
import { useApp } from "@/store/useApp";
import { useTx } from "@/hooks/useTx";
import type { withSigner } from "@/lib/contracts";
import toast from "react-hot-toast";

type Props = {
  sc?: ReturnType<typeof withSigner>; // signer 바운드된 컨트랙트 모음 (useWallet에서 넘겨줌)
  onAfterSuccess?: () => Promise<void> | void;
  bare?: boolean;
};

export default function PromoPanel({ sc, onAfterSuccess, bare = false }: Props) {
  const addr = useApp((s) => s.addr);
  const { runTx, running } = useTx();
  const [code, setCode] = useState("");

  const canSubmit = useMemo(() => {
    return Boolean(addr && sc && code.trim().length > 0 && !running);
  }, [addr, sc, code, running]);

  async function onRedeem() {
    const c = code.trim();
    if (!c) return;
    if (!sc) {
        toast.error("지갑을 먼저 연결해 주세요");
        return;
    }

    const addrNow = addr!;
    // 0) 현재 잔액 스냅샷
    const prev: bigint = await sc.ATT.balanceOf(addrNow);

    await runTx({
        label: "프로모 보상 받기",
        send: () => sc.CORE.redeemPromo(c),
        after: async () => {
        setCode("");

        // 1) 즉시 재조회
        let cur: bigint = await sc.ATT.balanceOf(addrNow);

        // 2) 반영 지연 대비 짧은 폴링(최대 6번, 총 ~3초)
        for (let i = 0; i < 6 && cur === prev; i++) {
            await new Promise((r) => setTimeout(r, 500));
            cur = await sc.ATT.balanceOf(addrNow);
        }

        // 3) 부모 훅/스토어 갱신(있다면)
        await onAfterSuccess?.();

        // 4) 그래도 안 바뀌면 강제 새로고침(완전 보증)
        if (cur === prev) {
            // Next.js라면 router.refresh()를 우선, 실패시 하드 리로드
            try {
            const { useRouter } = await import("next/navigation");
            // useRouter는 컴포넌트 훅이라 여기선 직접 못 씀 → 부모에서 내려받아도 됨
            // 간단히 하드 리로드로 마무리:
            // eslint-disable-next-line no-restricted-globals
            location.reload();
            } catch {
            // eslint-disable-next-line no-restricted-globals
            location.reload();
            }
        }
        },
    });
    }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" && canSubmit) {
      e.preventDefault();
      void onRedeem();
    }
  }

  const inner = (
    <>
      <h3 className="text-xl font-semibold mb-3">면접자 코드 보상</h3>
      <p className="text-sm text-white/70 mb-3 leading-relaxed">
        면접자가 제공한 코드를 입력하면 보상 토큰을 받을 수 있어요.
        <br />
        <span className="text-xs">
          ⚠️ 입력한 코드는 대소문자/공백까지 정확히 입력하세요.
        </span>
      </p>
      {/* 입력 + 버튼 ... 그대로 */}
      {/* 푸터 라인 ... 그대로 */}
    </>
  );

  return (
    <section className="card p-5 mt-5">
      <h3 className="text-lg font-semibold mb-2">면접자 코드 보상</h3>

      <p className="text-sm text-white/70 mb-3 leading-relaxed">
        면접자가 제공한 코드를 입력하면 보상 토큰을 받을 수 있어요.
        <br />
        <span className="text-xs">
          ⚠️ 대소문자/공백까지 정확히 입력하세요.
        </span>
      </p>

      <div className="flex gap-2">
        <input
          type="text"
          placeholder="이력서에 첨부된 면접자 코드 입력"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          onKeyDown={onKeyDown}
          className="input flex-1"
          autoCapitalize="off"
          spellCheck={false}
        />
        <button
          onClick={onRedeem}
          disabled={!canSubmit}
          className={`btn btn-primary ${!canSubmit ? "opacity-50 cursor-not-allowed" : ""}`}
          aria-disabled={!canSubmit}
        >
          ATT 받기
        </button>
      </div>

      <div className="mt-2 text-xs text-white/60">
        • 기본 보상: 운영 설정값(50&nbsp;ATT).&nbsp;
        • 제한 없음(운영에서 변경 시 달라질 수 있음).
      </div>
    </section>
  );
}