export const CFG = {
  rpcUrl: process.env.NEXT_PUBLIC_RPC_URL!,
  chainId: Number(process.env.NEXT_PUBLIC_CHAIN_ID!),
  addresses: {
    ATT: process.env.NEXT_PUBLIC_ATT!,
    FRG: process.env.NEXT_PUBLIC_FRG!,
    ADV: process.env.NEXT_PUBLIC_ADV!,
    CORE: process.env.NEXT_PUBLIC_CORE!,
  },
};