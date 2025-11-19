"use client";
import { withSigner } from "@/lib/contracts";
import { connectWallet, ensureNetwork } from "@/lib/wallet";
import { useApp } from "@/store/useApp";

export function useWallet() {
  const addr   = useApp((s) => s.addr);
  const sc     = useApp((s) => s.sc);
  const setAddr= useApp((s) => s.setAddr);
  const setSC  = useApp((s) => s.setSC);

  async function connect() {
    await ensureNetwork();
    const { signer, addr } = await connectWallet();
    setSC(withSigner(signer));   
    setAddr(addr);               
  }

  return { addr, sc, connect };
}