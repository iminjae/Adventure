"use client";
import { Interface } from "ethers";

const iface = new Interface([
  "event DailyClaim(address indexed user, uint256 amount, uint64 dayIndexKST)"
]);

export async function claimDailyAction(CORE:any){
  const tx = await CORE.claimDaily();
  const rc = await tx.wait();

  let amount = BigInt(0);
  for(const log of rc.logs){
    try {
      const parsed = iface.parseLog({ topics: log.topics, data: log.data });
      if(parsed?.name === "DailyClaim"){
        amount = parsed.args.amount as bigint;
      }
    } catch {}
  }
  return { amount }; // 0n이면 이벤트를 못 잡은 경우(비정상)
}