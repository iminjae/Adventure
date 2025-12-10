"use client";

import Card from "@/components/ui/Card";
import { useUpgradeMeta } from "@/hooks/useUpgradeMeta";

export default function UpgradeGuide() {
  const meta = useUpgradeMeta();

  return (
    <Card className="col-span-12 p-6 space-y-6">
      <header>
        <h2 className="text-xl font-semibold">업그레이드 가이드</h2>
        <p className="text-sm text-white/70 mt-1">
          동일 등급 NFT를 소각하여 상위 등급으로 승급을 시도합니다.
        </p>
      </header>

      <section className="rounded-xl border border-white/10 bg-white/[0.04] p-4">
        <div className="grid grid-cols-12 gap-4 text-sm">
          {Object.keys(meta.needByGrade).length === 0 ? (
            <div className="col-span-12 text-white/70 text-sm">설정된 업그레이드 규칙이 없습니다.</div>
          ) : (
            Object.keys(meta.needByGrade).map(k => {
              const g = Number(k);
              const need = meta.needByGrade[g];
              const bps  = meta.bpsByGrade[g] ?? 0;
              return (
                <div key={g} className="col-span-12 md:col-span-6 xl:col-span-3">
                  <div className="rounded-lg border border-white/10 bg-white/[0.03] p-3">
                    <div className="text-white/60 text-xs">From Grade</div>
                    <div className="text-base font-semibold">G{g}</div>
                    <div className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1">
                      <div className="text-white/60 text-xs">필요 수량</div>
                      <div className="text-white/90 text-xs">{need}개</div>
                      <div className="text-white/60 text-xs">성공 확률</div>
                      <div className="text-white/90 text-xs">{(bps/100).toFixed(2)}%</div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </section>

      <section>
        <h3 className="text-lg font-semibold">빠른 시작</h3>
        <ol className="mt-3 space-y-2 text-sm leading-relaxed list-decimal list-inside">
          <li>동일 등급 NFT를 규칙의 “필요 수량”만큼 선택합니다.</li>
          <li>처음 1회 <code className="px-1 py-0.5 bg-white/10 rounded">NFT 사용 승인</code>을 눌러 CORE에 권한을 부여합니다.</li>
          <li><span className="px-1 py-0.5 bg-white/10 rounded">업그레이드 시도</span>를 누릅니다.</li>
        </ol>
      </section>

      <section className="grid grid-cols-12 gap-4">
        <div className="col-span-12 lg:col-span-6">
          <h4 className="font-semibold">동작</h4>
          <ul className="mt-2 space-y-1 text-sm text-white/80">
            <li>• 선택한 NFT는 <b>소각</b>됩니다.</li>
            <li>• 성공 시 상위 등급 1장이 민트됩니다.</li>
            <li>• 실패 시 보상은 없고, 선택한 NFT만 소각됩니다.</li>
          </ul>
        </div>
        <div className="col-span-12 lg:col-span-6">
          <h4 className="font-semibold">오류 & 해결</h4>
          <ul className="mt-2 space-y-1 text-sm text-white/80">
            <li>• “mixed grade” → 서로 다른 등급이 섞였습니다. 같은 등급만 선택하세요.</li>
            <li>• “not owner” → 현재 지갑이 소유자가 아닙니다. 소유 지갑으로 전환하세요.</li>
            <li>• “up off” → 업그레이드 기능이 운영에서 비활성화되었습니다.</li>
          </ul>
        </div>
      </section>
    </Card>
  );
}