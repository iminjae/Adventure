"use client";
import Button from "@/components/ui/Button";
import { useWallet } from "@/hooks/useWallet";
import { useState } from "react";

function shortAddr(a?: string) {
  return a ? `${a.slice(0,4)}...${a.slice(-4)}` : "";
}

export default function WalletButton() {
  const { addr, connect } = useWallet();
  const [copied, setCopied] = useState(false);

  async function onClick() {
    if (!addr) {
      await connect();               // ensureNetwork()는 useWallet 내부에서 이미 호출
    } else {
      try {
        await navigator.clipboard.writeText(addr);
        setCopied(true);
        setTimeout(() => setCopied(false), 1200);
      } catch {}
    }
  }

  return (
    <Button
      className="btn-primary"
      onClick={onClick}
      title={addr ? "주소 복사" : "지갑 연결"}
    >
      {addr ? shortAddr(addr) : "지갑 연결"}
      {addr && <span className="text-xs opacity-80 ml-2">{copied ? "복사됨" : "복사"}</span>}
    </Button>
  );
}