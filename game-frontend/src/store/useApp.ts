import { create } from "zustand";
import { withSigner } from "@/lib/contracts";

type State = {
  addr?: string;
  sc?: ReturnType<typeof withSigner>;
  setAddr: (a?: string) => void;
  setSC: (sc?: ReturnType<typeof withSigner>) => void;
  resetWallet: () => void;

  //전역 TX 상태
  txBusy: boolean;
  txLabel?: string;
  txHash?: string;
  setTxBusy: (b: boolean, label?: string, hash?: string) => void;
};

export const useApp = create<State>((set) => ({
  addr: undefined,
  sc: undefined,
  setAddr: (addr) => set({ addr }),
  setSC: (sc) => set({ sc }),
  resetWallet: () => set({ addr: undefined, sc: undefined }),

  txBusy: false,
  txLabel: undefined,
  txHash: undefined,
  setTxBusy: (b, label, hash) => set({ txBusy: b, txLabel: label, txHash: hash }),
}));