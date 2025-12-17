"use client";
import Card from "@/components/ui/Card";

const ADDR_ATT  = process.env.NEXT_PUBLIC_ATT  || "미설정";
const ADDR_FRG  = process.env.NEXT_PUBLIC_FRG  || "미설정";
const ADDR_ADV  = process.env.NEXT_PUBLIC_ADV  || "미설정";
const ADDR_CORE = process.env.NEXT_PUBLIC_CORE || "미설정";
const EXPLORER  = process.env.NEXT_PUBLIC_EXPLORER_BASE || "";

function Tag({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center rounded-full border border-white/15 bg-white/5 px-2.5 py-1 text-[12px] leading-none text-white/80">
      {children}
    </span>
  );
}

function K({ children }: { children: React.ReactNode }) {
  return (
    <code className="rounded-md bg-white/5 px-1.5 py-0.5 font-mono text-[12px] text-white/90">
      {children}
    </code>
  );
}

export default function DocsPanel() {
  return (
    <Card className="col-span-12 p-0 overflow-hidden">
      {/* 헤더 */}
      <div className="border-b border-white/10 bg-gradient-to-br from-indigo-500/15 via-sky-500/10 to-transparent px-6 py-7 md:px-8 md:py-9">
        <div className="flex flex-wrap items-center gap-2 mb-3">
          <Tag>⚙️ EVM</Tag>
          <Tag>ERC-20 / 1155 / 721</Tag>
          <Tag>⏰ KST 09:00 리셋</Tag>
          <Tag>🎲 Pseudo RNG</Tag>
        </div>
        <h2 className="text-2xl md:text-3xl font-semibold tracking-tight">
          Adventure Game — 사용 설명서
        </h2>
        <p className="mt-2 text-sm md:text-[15px] text-white/75 leading-relaxed">
          출석으로 ATT를 모으고, 조각을 구매/합성해 NFT를 만들고, 탐험으로 보상을 획득합니다.
          등급이 같은 NFT를 모아 업그레이드에 도전할 수 있으며, 면접자 코드로 보상을 추가로 받을 수 있습니다.
        </p>
      </div>

      {/* 본문 */}
      <div className="px-6 py-6 md:px-8 md:py-8">
        {/* 빠른 시작 */}
       <section className="mb-8 grid grid-cols-1 lg:grid-cols-2 gap-4 items-start">
        {/* ← 기존 빠른 시작 내용 (왼쪽) */}
        <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
          <h3 className="text-lg font-semibold mb-3">🚀 빠른 시작 (30초 요약)</h3>
          <ol className="grid gap-2 text-[15px] text-white/85">
            <li><span className="font-semibold">1.</span> 지갑 연결 → 네트워크 승인</li>
            <li><span className="font-semibold">2.</span> <K>출석 받기</K> (KST 09:00 기준 하루 1회)</li>
            <li><span className="font-semibold">3.</span> ATT가 모이면 <K>조각 구매</K> → <K>합성</K> 시도</li>
            <li><span className="font-semibold">4.</span> NFT로 <K>탐험 시작</K> → 종료 후 <K>보상 수령</K></li>
            <li><span className="font-semibold">5.</span> 같은 등급 NFT N장으로 <K>업그레이드</K> 도전</li>
            <li><span className="font-semibold">6.</span> 면접자 코드가 있으면 입력해 <K>추가 보상</K> 받기</li>
          </ol>
        </div>

        {/* 지갑 연결 */}
        <div
          id="quickstart-side"
          className="rounded-xl border border-white/10 bg-white/[0.03] p-4 min-h-[220px] lg:sticky lg:top-6"
        >
          <h3 className="text-lg font-semibold mb-3"> 🦊 메타마스크 지갑 & 네트워크 연결 TIP</h3>
          <ol className="grid gap-2 text-[15px] text-white/85">
            <li><span className="font-semibold">1.</span> PC(Chrome)에서 MetaMask 확장 프로그램에 로그인합니다.</li>
            <li>
              <span className="font-semibold">2.</span> MetaMask → 네트워크 → <b>네트워크 추가</b> → <b>수동 추가</b>에서 아래 값 입력:
              <ul className="mt-2 grid gap-1 text-[13px] text-white/75">
                <li>• 네트워크 이름: <K>Mintaray</K></li>
                <li>• 새 RPC URL: <K>https://rpc.mintaray.xyz</K></li>
                <li>• 체인 ID: <K>6158</K></li>
              </ul>
            </li>
            <li><span className="font-semibold">3.</span> 저장 후, 상단 네트워크 선택을 <K>Mintaray</K>로 변경합니다.</li>
            <li><span className="font-semibold">4.</span> 이 사이트에서 <K>지갑 연결</K> 버튼을 눌러 연결을 승인합니다.</li>
            <li><span className="font-semibold">5.</span> 우측 상단에 내 지갑 주소(예: 0xABCD…EF)가 보이면 연결 완료입니다.</li>
            <li><span className="font-semibold">6.</span> 연결 문제 시: 네트워크를 다시 선택하거나, MetaMask 설정 → 고급 → <b>계정 상태 재설정</b>을 시도합니다.</li>
          </ol>
        </div>
      </section>

        {/* 코어 메커닉 4분할 */}
        <section className="mb-8 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
            <div className="mb-1 text-white/80 font-medium">🗓️ 출석 (Daily)</div>
            <p className="text-sm text-white/70 leading-6">
              KST 09:00(=UTC 00:00) 기준으로 리셋. 금일 슬롯에서 1회만 가능.
              성공 시 <K>DailyClaim(user, amount, slotIndex)</K> 이벤트가 발생합니다.
            </p>
          </div>
          <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
            <div className="mb-1 text-white/80 font-medium">🧩 조각 & 합성</div>
            <p className="text-sm text-white/70 leading-6">
              ATT로 조각(ERC-1155)을 구매하고, <K>fragmentsToCraft</K> 개를 소각해
              확률적으로 등급 1 NFT를 획득합니다(실패 시 조각은 소각 유지).
            </p>
          </div>
          <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
            <div className="mb-1 text-white/80 font-medium">🗺️ 탐험 (Expedition)</div>
            <p className="text-sm text-white/70 leading-6">
              NFT 1개만 탐험 가능. 시작 시 전송 <b>잠금</b>. 종료 후 랜덤 ATT와 낮은 확률로
              조각 1개 드랍. <K>expeditionOf[grade]</K>로 시간/보상/드랍률 설정.
            </p>
          </div>
          <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
            <div className="mb-1 text-white/80 font-medium">🔺 업그레이드</div>
            <p className="text-sm text-white/70 leading-6">
              같은 등급 <K>upgradeNeedCount[g]</K> 장 소각 → <K>upgradeSuccessBps[g]</K> 확률로
              상위 등급 NFT 1개 민트(실패 시 소각 유지).
            </p>
          </div>
        </section>

        {/* 주소 & 탐색기 */}
        <section className="mb-8">
          <h3 className="text-lg font-semibold mb-3">📦 컨트랙트</h3>
          <div className="grid md:grid-cols-2 gap-3">
            <div className="rounded-lg border border-white/10 bg-white/[0.03] p-3">
              <div className="text-sm text-white/60">ATT (ERC-20)</div>
              <div className="mt-1 font-mono text-[13px]">{ADDR_ATT}</div>
            </div>
            <div className="rounded-lg border border-white/10 bg-white/[0.03] p-3">
              <div className="text-sm text-white/60">FRG (ERC-1155)</div>
              <div className="mt-1 font-mono text-[13px]">{ADDR_FRG}</div>
            </div>
            <div className="rounded-lg border border-white/10 bg-white/[0.03] p-3">
              <div className="text-sm text-white/60">ADV (ERC-721)</div>
              <div className="mt-1 font-mono text-[13px]">{ADDR_ADV}</div>
            </div>
            <div className="rounded-lg border border-white/10 bg-white/[0.03] p-3">
              <div className="text-sm text-white/60">GameCore</div>
              <div className="mt-1 font-mono text-[13px]">{ADDR_CORE}</div>
            </div>
          </div>
          {EXPLORER && (
            <div className="mt-2 text-sm">
              🔗 Explorer:{" "}
              <a href={EXPLORER} target="_blank" className="underline text-sky-300 hover:text-sky-200">
                {EXPLORER}
              </a>
            </div>
          )}
        </section>

        {/* 운영 포인트 */}
        <section className="mb-8">
          <h3 className="text-lg font-semibold mb-3">🛠 운영 포인트</h3>
          <ul className="grid gap-2 text-[15px] text-white/80">
            <li>출석 보상: <K>dailyAmount</K> (기본 10&nbsp;ATT)</li>
            <li>조각 가격: <K>fragmentPriceATT</K> &nbsp;/&nbsp; 합성 소모: <K>fragmentsToCraft</K> &nbsp;/&nbsp; 성공률: <K>craftSuccessBps</K></li>
            <li>탐험 설정: <K>setExpeditionConf(grade, {`{secondsNeeded, rewardMin, rewardMax, fragmentDropBps}`})</K></li>
            <li>업그레이드 설정: <K>setUpgradeConf(grade, needCount, successBps)</K></li>
            <li>면접자 코드: <K>setPromoConfig(codeHash, rewardATT, enabled)</K> → <K>redeemPromo(code)</K></li>
          </ul>
        </section>

        {/* FAQ + 주의 */}
        <section className="grid gap-3">
          <details className="rounded-lg border border-white/10 bg-white/[0.03] px-4 py-3">
            <summary className="cursor-pointer text-[15px] text-white/85 font-medium">자주 묻는 질문</summary>
            <ul className="mt-3 grid gap-2 text-sm text-white/70">
              <li><b>출석 비활성?</b> 오늘 이미 수령했거나 리셋 전입니다. 남은 시간이 표시됩니다.</li>
              <li><b>조각 구매 실패?</b> 먼저 <K>ATT.approve(GameCore, 금액)</K> 서명이 필요합니다.</li>
              <li><b>탐험 시작 불가?</b> 이미 탐험 중이거나 해당 등급 설정이 비어 있을 수 있습니다.</li>
              <li><b>잔액이 늦게 갱신?</b> RPC 반영 지연으로 수 초 후 반영될 수 있습니다.</li>
            </ul>
          </details>

          <div className="rounded-lg border border-white/10 bg-amber-500/10 px-4 py-3 text-[13px] leading-6 text-amber-200">
            ⚠️ 포트폴리오/데모 용도입니다. 실서비스 전 보안 감사가 필요하며,
            확률·보상·가격 등 파라미터는 운영 판단에 따라 변경될 수 있습니다.
          </div>
        </section>
      </div>
    </Card>
  );
}