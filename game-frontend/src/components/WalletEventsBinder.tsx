"use client";
import { useEffect } from "react";
import { BrowserProvider } from "ethers";
import { useApp } from "@/store/useApp";
import { withSigner } from "@/lib/contracts";

export default function WalletEventsBinder(){
  const setAddr     = useApp(s => s.setAddr);
  const setSC       = useApp(s => s.setSC);
  const resetWallet = useApp(s => s.resetWallet);

  useEffect(() => {
    
    const eth = (typeof window !== "undefined" ? (window as any).ethereum : undefined) as {
      request?: (args: any) => Promise<any>;
      on?: (event: string, listener: (...a:any[])=>void) => void;
      removeListener?: (event: string, listener: (...a:any[])=>void) => void;
    } | undefined;
    if (!eth) return;

    const onAccountsChanged = async (accounts: string[]) => {
      const a = accounts?.[0];
      if (!a) { resetWallet(); return; }
      const provider = new BrowserProvider(eth as any);
      const signer = await provider.getSigner();
      setAddr(a);
      setSC(withSigner(signer));
    };

    const onChainChanged = () => window.location.reload();

    eth.on?.("accountsChanged", onAccountsChanged);
    eth.on?.("chainChanged", onChainChanged);

    return () => {
      eth.removeListener?.("accountsChanged", onAccountsChanged);
      eth.removeListener?.("chainChanged", onChainChanged);
    };
  }, [setAddr, setSC, resetWallet]);

  return null;
}