"use client";
import { useEffect, useState } from "react";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import ProgressRing from "@/components/ui/ProgressRing";

export default function Expedition(){
  const [total] = useState(120); // 2분 (후에 CORE.expd 연동)
  const [end, setEnd] = useState(Math.floor(Date.now()/1000)+120);
  const [now, setNow] = useState(Math.floor(Date.now()/1000));
  useEffect(()=>{ const t=setInterval(()=>setNow(Math.floor(Date.now()/1000)),1000); return ()=>clearInterval(t);},[]);
  const remain=Math.max(0,end-now), progress=Math.min(1,(total-remain)/total);

  return (
    <section className="grid grid-cols-12 gap-4">
      <Card className="col-span-12 p-6 flex items-center justify-between">
        <div>
          <h1 className="section-title text-2xl">탐험</h1>
          <div className="text-sm text-muted mt-1">선택한 NFT를 탐험에 보내면 전송이 잠겨요.</div>
          <div className="mt-4 flex gap-2">
            <Button className="btn-primary">탐험 시작</Button>
            <Button disabled={remain>0}>보상 청구</Button>
          </div>
        </div>
        <ProgressRing progress={progress} label={`${remain}s`} />
      </Card>
      <Card className="col-span-12">
        <div className="text-sm text-muted">NFT 리스트(후속 단계에서 실제 데이터 연동)</div>
        <div className="mt-3 h-24 rounded-xl bg-white/5" />
      </Card>
    </section>
  );
}