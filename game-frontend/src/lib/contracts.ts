import { Contract, JsonRpcProvider } from "ethers";
import { CFG } from "@/config";
import ATTABI from "@/abi/ATT.json";
import FRGABI from "@/abi/FRG.json";
import ADVABI from "@/abi/ADV.json";
import COREABI from "@/abi/CORE.json";

const rp = new JsonRpcProvider(CFG.rpcUrl);

export const ro = {
  ATT: new Contract(CFG.addresses.ATT, ATTABI, rp),
  FRG: new Contract(CFG.addresses.FRG, FRGABI, rp),
  ADV: new Contract(CFG.addresses.ADV, ADVABI, rp),
  CORE: new Contract(CFG.addresses.CORE, COREABI, rp),
};

export function withSigner(signer: any) {
  return {
    ATT: new Contract(CFG.addresses.ATT, ATTABI, signer),
    FRG: new Contract(CFG.addresses.FRG, FRGABI, signer),
    ADV: new Contract(CFG.addresses.ADV, ADVABI, signer),
    CORE: new Contract(CFG.addresses.CORE, COREABI, signer),
  };
}