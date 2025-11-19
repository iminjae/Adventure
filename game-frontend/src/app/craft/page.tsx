"use client";
import { useState } from "react";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import SuccessModal from "@/components/ui/SuccessModal";

export default function CraftPage(){
  const [open, setOpen] = useState(false);

  return (
    <section className="grid grid-cols-12 gap-4">
      <Card className="col-span-12 p-6">
        <h1 className="section-title text-2xl">합성</h1>
        <div className="text-sm text-muted mt-1">조각을 소모해 새로운 NFT를 뽑습니다.</div>

        <div className="mt-4 flex gap-2">
          {/* 임시: 성공 시뮬레이터 */}
          <Button variant="primary" onClick={()=> setOpen(true)}>합성 성공 시뮬레이트</Button>
          {/* 나중에 실제 호출로 교체:
              await CORE.craftFromFragments(); → receipt 로그 파싱 후 success면 setOpen(true)
          */}
        </div>
      </Card>

      <SuccessModal
        open={open}
        title="합성 성공!"
        subtitle="새로운 등급의 NFT를 획득했습니다."
        onClose={()=> setOpen(false)}
      />
    </section>
  );
}