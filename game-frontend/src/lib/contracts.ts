// src/lib/contracts.ts
import { BrowserProvider, JsonRpcProvider, Contract } from "ethers";
import { CFG } from "@/config";
import ATTABI from "@/abi/ATT.json";
import FRGABI from "@/abi/FRG.json";
import ADVABI from "@/abi/ADV.json";
import COREABI from "@/abi/CORE.json";

// ✅ 싱글톤 Provider. 지갑 있으면 지갑 Provider(=MetaMask)로 읽기까지 통일.
//    지갑이 없거나 SSR일 땐 환경변수 RPC로 폴백.
let roProv: BrowserProvider | JsonRpcProvider | null = null;

function getRoProvider() {
  // 브라우저 + 지갑 존재 → BrowserProvider 사용 (가장 신선함)
  if (typeof window !== "undefined" && (window as any).ethereum) {
    if (!(roProv instanceof BrowserProvider)) {
      roProv = new BrowserProvider((window as any).ethereum);
      (roProv as any).pollingInterval = 1000;
      // 체인/계정 변경 시 다시 만들도록 무효화
      (window as any).ethereum.on?.("chainChanged", () => { roProv = null; });
      (window as any).ethereum.on?.("accountsChanged", () => { roProv = null; });
    }
    return roProv;
  }
  // 서버/지갑 없음 → 고정 RPC로 폴백
  if (!roProv) {
    roProv = new JsonRpcProvider(CFG.rpcUrl);
    (roProv as any).pollingInterval = 1000;
  }
  return roProv;
}

// ✅ 게터(get)로 계약을 만들면, 호출 시점의 최신 Provider가 항상 바인딩됨
export const ro = {
  get ATT() { return new Contract(CFG.addresses.ATT, ATTABI, getRoProvider()); },
  get FRG() { return new Contract(CFG.addresses.FRG, FRGABI, getRoProvider()); },
  get ADV() { return new Contract(CFG.addresses.ADV, ADVABI, getRoProvider()); },
  get CORE(){ return new Contract(CFG.addresses.CORE, COREABI, getRoProvider()); },
};

// ✍️ 쓰기용(사이너 바운드)은 그대로 사용
export function withSigner(signer: any) {
  return {
    ATT: new Contract(CFG.addresses.ATT, ATTABI, signer),
    FRG: new Contract(CFG.addresses.FRG, FRGABI, signer),
    ADV: new Contract(CFG.addresses.ADV, ADVABI, signer),
    CORE: new Contract(CFG.addresses.CORE, COREABI, signer),
  };
}