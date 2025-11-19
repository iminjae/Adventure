import { BrowserProvider, Eip1193Provider } from "ethers";
import { CFG } from "@/config";

declare global { interface Window { ethereum?: Eip1193Provider } }

export async function getProvider() {
  if (!window.ethereum) throw new Error("지갑이 없습니다 (MetaMask 등)");
  return new BrowserProvider(window.ethereum);
}

export async function ensureNetwork() {
  const hex = "0x" + CFG.chainId.toString(16);
  try {
    await window.ethereum?.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: hex }],
    });
  } catch {
    await window.ethereum?.request({
      method: "wallet_addEthereumChain",
      params: [{
        chainId: hex,
        chainName: "Portfolio Chain",
        nativeCurrency: { name: "NIM", symbol: "NIM", decimals: 18 },
        rpcUrls: [CFG.rpcUrl],
      }],
    });
  }
}

export async function connectWallet() {  
  const provider = await getProvider();
  await provider.send("eth_requestAccounts", []);
  const signer = await provider.getSigner();
  const addr = await signer.getAddress();
  return { provider, signer, addr };
}